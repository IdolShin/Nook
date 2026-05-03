const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// ─── GET /api/stats ──────────────────────────────────────────
// 대시보드용 실시간 통계
router.get('/', async (req, res) => {
  try {
    const bizId = req.business.id

    // 고객 수
    const { count: customerCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)

    // 활성 카드 수
    const { count: cardCount } = await supabase
      .from('loyalty_cards')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
      .eq('is_active', true)

    // 이 비즈니스의 카드 ID 목록 → 스탬프 집계용
    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('id')
      .eq('business_id', bizId)

    const cardIds = (cards || []).map(c => c.id)

    let stampCount = 0
    let redeemCount = 0

    if (cardIds.length > 0) {
      const { count: sc } = await supabase
        .from('stamps')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
      stampCount = sc || 0

      const { count: rc } = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
      redeemCount = rc || 0
    }

    res.json({
      total_customers: customerCount || 0,
      active_cards: cardCount || 0,
      total_stamps: stampCount,
      total_redemptions: redeemCount,
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

module.exports = router
