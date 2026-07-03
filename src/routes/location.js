const express = require('express')
const https = require('https')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

// Simple HTTPS GET returning parsed JSON (no extra deps)
function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'NookWallet/1.0 (loyalty platform; woosang930414@gmail.com)',
        'Accept': 'application/json'
      }
    }, (res) => {
      let body = ''
      res.on('data', (d) => { body += d })
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

// ─── GET /api/location ───────────────────────────────────────
// Current business address + coordinates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('address, lat, lng')
      .eq('id', req.business.id)
      .single()
    if (error) throw error
    res.json({ address: data.address || '', lat: data.lat ?? null, lng: data.lng ?? null })
  } catch (err) {
    console.error('Location get error:', err)
    res.status(500).json({ error: 'Failed to load location' })
  }
})

// ─── POST /api/location/geocode ──────────────────────────────
// Body: { address } → top matches from OpenStreetMap Nominatim
router.post('/geocode', authMiddleware, async (req, res) => {
  try {
    const { address } = req.body || {}
    if (!address || String(address).trim().length < 3) {
      return res.status(400).json({ error: 'address required' })
    }
    const q = encodeURIComponent(String(address).trim())
    const results = await getJson(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=3&addressdetails=0`)

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(404).json({ error: 'No matches found for this address', results: [] })
    }
    res.json({
      results: results.map(r => ({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        display_name: r.display_name
      }))
    })
  } catch (err) {
    console.error('Geocode error:', err)
    res.status(500).json({ error: 'Geocoding failed. Try "현재 위치로 설정" instead.' })
  }
})

// ─── PATCH /api/location ─────────────────────────────────────
// Body: { lat, lng, address? } → save store coordinates
router.patch('/', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, address } = req.body || {}
    const nLat = Number(lat), nLng = Number(lng)
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng) || Math.abs(nLat) > 90 || Math.abs(nLng) > 180) {
      return res.status(400).json({ error: 'Valid lat and lng required' })
    }
    const updates = { lat: nLat, lng: nLng }
    if (address !== undefined) updates.address = String(address).trim()

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', req.business.id)
      .select('id, name, address, lat, lng')
      .single()
    if (error) throw error
    res.json({ business: data })
  } catch (err) {
    console.error('Location save error:', err)
    res.status(500).json({ error: 'Failed to save location' })
  }
})

module.exports = router
