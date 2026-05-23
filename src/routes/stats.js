const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// ─── GET /api/stats ──────────────────────────────────────────
// 대시보드용 실시간 통계
// Superadmin can pass ?biz_id=<id> or ?biz_id=all
router.get('/', async (req, res) => {
  try {
    const isSuperadmin = req.business.is_superadmin ?? false
    const requestedBizId = req.query.biz_id

    // ── Helper: get stats for one business ──────────────────
    async function statsForBiz(bizId) {
      const { count: customerCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)

      const { count: cardCount } = await supabase
        .from('loyalty_cards')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)
        .eq('is_active', true)

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

      return {
        total_customers: customerCount || 0,
        active_cards: cardCount || 0,
        total_stamps: stampCount,
        total_redemptions: redeemCount,
      }
    }

    // ── Superadmin: aggregate ALL businesses ─────────────────
    if (isSuperadmin && requestedBizId === 'all') {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('is_superadmin', false)

      const all = await Promise.all((businesses || []).map(b => statsForBiz(b.id)))
      const totals = all.reduce(
        (acc, s) => ({
          total_customers:  acc.total_customers  + s.total_customers,
          active_cards:     acc.active_cards     + s.active_cards,
          total_stamps:     acc.total_stamps     + s.total_stamps,
          total_redemptions: acc.total_redemptions + s.total_redemptions,
        }),
        { total_customers: 0, active_cards: 0, total_stamps: 0, total_redemptions: 0 }
      )
      return res.json(totals)
    }

    // ── Superadmin: specific business ────────────────────────
    if (isSuperadmin && requestedBizId) {
      return res.json(await statsForBiz(requestedBizId))
    }

    // ── Normal business (or superadmin without param) ────────
    return res.json(await statsForBiz(req.business.id))

  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

module.exports = router
