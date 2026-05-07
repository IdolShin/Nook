const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

// All card routes require auth
router.use(authMiddleware)

// âââ GET /api/cards ââââââââââââââââââââââââââââââââââââââââââ
// ë´ ê°ê² ì¹´ë ëª©ë¡ (superadminì ?bizId= ë¡ ë¤ë¥¸ ê°ê² ì¡°í ê°ë¥)
router.get('/', async (req, res) => {
  try {
    const bizId = (req.business.is_superadmin && req.query.bizId) ? req.query.bizId : req.business.id

    const { data, error } = await supabase
      .from('loyalty_cards')
      .select(`*, customers ( count )`)
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ cards: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' })
  }
})

// âââ POST /api/cards âââââââââââââââââââââââââââââââââââââââââ
// ì ì¹´ë ë§ë¤ê¸° (superadminì body.bizId ë¡ ë¤ë¥¸ ê°ê²ì ì¹´ë ìì± ê°ë¥)
router.post('/', async (req, res) => {
  try {
    const { name, card_type, color, goal_stamps, reward_desc, bizId: bodyBizId } = req.body

    if (!name || !card_type) {
      return res.status(400).json({ error: 'name and card_type required' })
    }

    const validTypes = ['stamp', 'cashback', 'coupon', 'membership']
    if (!validTypes.includes(card_type)) {
      return res.status(400).json({ error: 'Invalid card_type' })
    }

    const bizId = (req.business.is_superadmin && bodyBizId) ? bodyBizId : req.business.id

    const { data, error } = await supabase
      .from('loyalty_cards')
      .insert({
        business_id: bizId,
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

// âââ PATCH /api/cards/:id ââââââââââââââââââââââââââââââââââââ
// ì¹´ë ìì  (superadminì body.bizId ë¡ ìì ê¶ ê²ì¦ ì°í ê°ë¥)
router.patch('/:id', async (req, res) => {
  try {
    const { name, color, goal_stamps, reward_desc, is_active, bizId: bodyBizId } = req.body
    const bizId = (req.business.is_superadmin && bodyBizId) ? bodyBizId : req.business.id

    const { data, error } = await supabase
      .from('loyalty_cards')
      .update({ name, color, goal_stamps, reward_desc, is_active })
      .eq('id', req.params.id)
      .eq('business_id', bizId)
      .select()
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Card not found' })
    res.json({ card: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' })
  }
})

// âââ GET /api/cards/:id/stats ââââââââââââââââââââââââââââââââ
// ì¹´ëë³ íµê³
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
