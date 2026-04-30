const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const QRCode = require('qrcode')
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

// ─── POST /api/customers/register ────────────────────────────
// 고객 카드 등록 (Step 2 랜딩페이지에서 호출)
// Public endpoint — no auth needed (customer fills in their info)
router.post('/register', async (req, res) => {
  try {
    const { card_id, name, phone, wallet_type, consent_push, consent_points } = req.body

    if (!card_id || !name || !phone) {
      return res.status(400).json({ error: 'card_id, name, phone required' })
    }
    if (!consent_push || !consent_points) {
      return res.status(400).json({ error: 'Both consents required' })
    }

    // Check card exists and is active
    const { data: card, error: cardErr } = await supabase
      .from('loyalty_cards')
      .select('id, business_id, name, is_active')
      .eq('id', card_id)
      .single()

    if (cardErr || !card) return res.status(404).json({ error: 'Card not found' })
    if (!card.is_active) return res.status(400).json({ error: 'Card is no longer active' })

    // Check duplicate phone for same card
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('card_id', card_id)
      .eq('phone', phone)
      .single()

    if (existing) return res.status(409).json({ error: 'Already registered with this phone number' })

    // Generate unique QR code and 8-digit barcode
    const qr_code = uuidv4()
    const barcode  = String(Math.floor(10000000 + Math.random() * 90000000))

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        business_id: card.business_id,
        card_id,
        name,
        phone,
        wallet_type: wallet_type || 'unknown',
        qr_code,
        barcode,
        consent_push,
        consent_points
      })
      .select()
      .single()

    if (error) throw error

    // Generate QR code image (base64 PNG)
    const qrImageBase64 = await QRCode.toDataURL(qr_code, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })

    res.status(201).json({
      customer: {
        id:       customer.id,
        name:     customer.name,
        qr_code:  customer.qr_code,
        barcode:  customer.barcode,
        card_id:  customer.card_id
      },
      qr_image: qrImageBase64,   // shown on customer's screen / sent to wallet
      message: 'Registration successful! Check your wallet.'
    })
  } catch (err) {
    console.error('Register customer error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// ─── GET /api/customers ──────────────────────────────────────
// 내 가게 전체 고객 목록 (dashboard)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customer_stamp_counts')     // uses the DB view
      .select('*')
      .eq('business_id', req.business.id)   // view doesn't expose this — use subquery

    if (error) throw error
    res.json({ customers: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// ─── GET /api/customers/lookup ───────────────────────────────
// QR 또는 바코드로 고객 조회 (스캐너 앱에서 호출)
router.get('/lookup', authMiddleware, async (req, res) => {
  try {
    const { code, type } = req.query
    // type: 'qr' | 'barcode' | 'manual'

    if (!code) return res.status(400).json({ error: 'code required' })

    const field = type === 'barcode' ? 'barcode' : 'qr_code'

    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        id, name, phone, wallet_type, qr_code, barcode, card_id,
        loyalty_cards ( name, card_type, goal_stamps, reward_desc, color )
      `)
      .eq(field, code)
      .eq('business_id', req.business.id)
      .single()

    if (error || !customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Get current stamp count
    const { count: stampCount } = await supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)

    const goal = customer.loyalty_cards?.goal_stamps || 10
    const current = (stampCount || 0) % goal
    const rewardsEarned = Math.floor((stampCount || 0) / goal)

    res.json({
      customer: {
        id:            customer.id,
        name:          customer.name,
        wallet_type:   customer.wallet_type,
        card:          customer.loyalty_cards,
        current_stamps: current,
        goal_stamps:   goal,
        rewards_earned: rewardsEarned,
        scan_type:     type || 'qr'
      }
    })
  } catch (err) {
    console.error('Lookup error:', err)
    res.status(500).json({ error: 'Lookup failed' })
  }
})

module.exports = router
