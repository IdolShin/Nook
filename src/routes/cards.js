const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

// All card routes require auth
router.use(authMiddleware)

// ─── GET /api/cards ──────────────────────────────────────────
// 내 가게 카드 목록
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('loyalty_cards')
      .select(`
        *,
        customers ( count )
      `)
      .eq('business_id', req.business.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ cards: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' })
  }
})

// ─── POST /api/cards ─────────────────────────────────────────
// 새 카드 만들기
router.post('/', async (req, res) => {
  try {
    const { name, card_type, color, goal_stamps, reward_desc } = req.body

    if (!name || !card_type) {
      return res.status(400).json({ error: 'name and card_type required' })
    }

    const validTypes = ['stamp', 'cashback', 'coupon', 'membership']
    if (!validTypes.includes(card_type)) {
      return res.status(400).json({ error: 'Invalid card_type' })
    }

    const { data, error } = await supabase
      .from('loyalty_cards')
      .insert({
        business_id: req.business.id,
        name,
        card_type,
        color: color || '#1D9E75',
        goal_stamps: goal_stamps || 10,
        reward_desc
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ card: data })
  } catch (err) {
    console.error('Create card error:', err)
    res.status(500).json({ error: 'Failed to create card' })
  }
})

// ─── PATCH /api/cards/:id ────────────────────────────────────
// 카드 수정
router.patch('/:id', async (req, res) => {
  try {
    const { name, color, goal_stamps, reward_desc, is_active } = req.body

    const { data, error } = await supabase
      .from('loyalty_cards')
      .update({ name, color, goal_stamps, reward_desc, is_active })
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)   // ownership check
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Card not found' })
    res.json({ card: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' })
  }
})

// ─── GET /api/cards/:id/stats ────────────────────────────────
// 카드별 통계
router.get('/:id/stats', async (req, res) => {
  try {
    const cardId = req.params.id

    const [customersRes, stampsRes, redemptionsRes] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact' }).eq('card_id', cardId),
      supabase.from('stamps').select('id', { count: 'exact' }).eq('card_id', cardId),
      supabase.from('redemptions').select('id', { count: 'exact' }).eq('card_id', cardId),
    ])

    res.json({
      total_customers: customersRes.count || 0,
      total_stamps:    stampsRes.count || 0,
      total_redeems:   redemptionsRes.count || 0,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

module.exports = router
