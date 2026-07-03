const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

const HEX32 = /^[0-9A-Fa-f]{32}$/
const UID_RE = /^[0-9A-Fa-f]{14}$/

// GET /api/tags — list this business's NFC stamp tags
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: tags, error } = await supabase
      .from('nfc_tags')
      .select('id, name, uid, last_ctr, is_active, created_at')
      .eq('business_id', req.business.id)
      .order('created_at', { ascending: false })
    if (error) throw error

    // Recent tap counts (last 30 days)
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    const { data: events } = await supabase
      .from('tap_events')
      .select('tag_id')
      .eq('business_id', req.business.id)
      .eq('result', 'credited')
      .gte('created_at', since)

    const counts = {}
    for (const e of (events || [])) counts[e.tag_id] = (counts[e.tag_id] || 0) + 1

    res.json({ tags: (tags || []).map(t => ({ ...t, taps_30d: counts[t.id] || 0 })) })
  } catch (err) {
    console.error('Tags list error:', err)
    res.status(500).json({ error: 'Failed to list tags' })
  }
})

// POST /api/tags — register a physical NFC stamp
// Body: { name, uid, meta_key?, file_key? }  (keys default to factory zeros)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, uid, meta_key, file_key } = req.body || {}
    if (!uid || !UID_RE.test(String(uid).trim())) {
      return res.status(400).json({ error: 'uid must be 14 hex characters (7-byte tag UID, e.g. 04AABBCCDDEE80)' })
    }
    if (meta_key && !HEX32.test(meta_key)) return res.status(400).json({ error: 'meta_key must be 32 hex chars' })
    if (file_key && !HEX32.test(file_key)) return res.status(400).json({ error: 'file_key must be 32 hex chars' })

    const row = {
      business_id: req.business.id,
      name:        (name || '').trim() || 'NFC Stamp',
      uid:         String(uid).trim().toUpperCase(),
      ...(meta_key ? { meta_key: meta_key.toUpperCase() } : {}),
      ...(file_key ? { file_key: file_key.toUpperCase() } : {})
    }

    const { data: tag, error } = await supabase
      .from('nfc_tags')
      .insert(row)
      .select('id, name, uid, last_ctr, is_active, created_at')
      .single()

    if (error) {
      if (String(error.message || '').includes('duplicate')) {
        return res.status(409).json({ error: 'This tag UID is already registered' })
      }
      throw error
    }

    res.json({ tag })
  } catch (err) {
    console.error('Tag create error:', err)
    res.status(500).json({ error: 'Failed to register tag' })
  }
})

// PATCH /api/tags/:id — rename / activate / deactivate
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, is_active } = req.body || {}
    const updates = {}
    if (name !== undefined) updates.name = String(name).trim()
    if (is_active !== undefined) updates.is_active = !!is_active
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' })

    const { data: tag, error } = await supabase
      .from('nfc_tags')
      .update(updates)
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
      .select('id, name, uid, last_ctr, is_active, created_at')
      .single()

    if (error || !tag) return res.status(404).json({ error: 'Tag not found' })
    res.json({ tag })
  } catch (err) {
    console.error('Tag update error:', err)
    res.status(500).json({ error: 'Failed to update tag' })
  }
})

// DELETE /api/tags/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('nfc_tags')
      .delete()
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('Tag delete error:', err)
    res.status(500).json({ error: 'Failed to delete tag' })
  }
})

module.exports = router
