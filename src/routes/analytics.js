const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// GET /api/analytics
router.get('/', async (req, res) => {
  try {
    let bizId = req.business.id

    if (req.business.is_superadmin && req.query.bizId) {
      bizId = req.query.bizId
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    const { count: customerCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)

    const { count: newCustomers30 } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
      .gte('created_at', thirtyDaysAgo)

    const { count: newCustomersPrev } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo)

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

    let stampCount = 0, stampsLast30 = 0, stampsPrev30 = 0
    let redeemCount = 0, redeemsLast30 = 0

    if (cardIds.length > 0) {
      const { count: sc } = await supabase.from('stamps').select('id', { count: 'exact', head: true }).in('card_id', cardIds)
      stampCount = sc || 0

      const { count: s30 } = await supabase.from('stamps').select('id', { count: 'exact', head: true }).in('card_id', cardIds).gte('created_at', thirtyDaysAgo)
      stampsLast30 = s30 || 0

      const { count: sPrev } = await supabase.from('stamps').select('id', { count: 'exact', head: true }).in('card_id', cardIds).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo)
      stampsPrev30 = sPrev || 0

      const { count: rc } = await supabase.from('redemptions').select('id', { count: 'exact', head: true }).in('card_id', cardIds)
      redeemCount = rc || 0

      const { count: r30 } = await supabase.from('redemptions').select('id', { count: 'exact', head: true }).in('card_id', cardIds).gte('redeemed_at', thirtyDaysAgo)
      redeemsLast30 = r30 || 0
    }

    const { data: bizCoupons } = await supabase.from('coupons').select('id').eq('business_id', bizId)
    const couponIds = (bizCoupons || []).map(c => c.id)
    let couponsIssued = 0, couponsRedeemed = 0

    if (couponIds.length > 0) {
      const { count: ci } = await supabase.from('coupon_passes').select('id', { count: 'exact', head: true }).in('coupon_id', couponIds)
      couponsIssued = ci || 0
      const { count: cr } = await supabase.from('coupon_passes').select('id', { count: 'exact', head: true }).in('coupon_id', couponIds).eq('status', 'redeemed')
      couponsRedeemed = cr || 0
    }

    let stampsByDay = [0, 0, 0, 0, 0, 0, 0]
    let stampsDailyArr = new Array(30).fill(0)
    let redemptionsDailyArr = new Array(30).fill(0)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const DAY_MS = 24 * 60 * 60 * 1000

    if (cardIds.length > 0) {
      const { data: recentStamps } = await supabase
        .from('stamps')
        .select('created_at')
        .in('card_id', cardIds)
        .gte('created_at', thirtyDaysAgo)
        .limit(5000)

      if (recentStamps) {
        recentStamps.forEach(s => {
          const d = new Date(s.created_at)
          stampsByDay[(d.getDay() + 6) % 7]++
          const daysAgo = Math.floor((todayStart - d) / DAY_MS)
          const idx = 29 - daysAgo
          if (idx >= 0 && idx < 30) stampsDailyArr[idx]++
        })
      }

      const { data: recentRedemptions } = await supabase
        .from('redemptions')
        .select('redeemed_at')
        .in('card_id', cardIds)
        .gte('redeemed_at', thirtyDaysAgo)
        .limit(5000)

      if (recentRedemptions) {
        recentRedemptions.forEach(r => {
          const d = new Date(r.redeemed_at)
          const daysAgo = Math.floor((todayStart - d) / DAY_MS)
          const idx = 29 - daysAgo
          if (idx >= 0 && idx < 30) redemptionsDailyArr[idx]++
        })
      }
    }

    res.json({
      total_customers:      customerCount || 0,
      new_customers_30d:    newCustomers30 || 0,
      new_customers_prev:   newCustomersPrev || 0,
      active_cards:         cardCount || 0,
      total_stamps:         stampCount,
      stamps_last_30d:      stampsLast30,
      stamps_prev_30d:      stampsPrev30,
      total_redemptions:    redeemCount,
      redemptions_30d:      redeemsLast30,
      coupons_issued:       couponsIssued,
      coupons_redeemed:     couponsRedeemed,
      stamps_by_day:        stampsByDay,
      stamps_daily_30d:     stampsDailyArr,
      redemptions_daily_30d: redemptionsDailyArr,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

module.exports = rou