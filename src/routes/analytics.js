const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

// âââ GET /api/analytics âââââââââââââââââââââââââââââââââââââââ
// Superadmin: pass ?bizId=xxx to query any business
// Regular owner: returns own business stats
router.get('/', async (req, res) => {
  try {
    let bizId = req.business.id

    // Superadmin can query any business
    if (req.business.is_superadmin && req.query.bizId) {
      bizId = req.query.bizId
    }

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()

    // ââ 1. Customer count ââââââââââââââââââââââââââââââââââââââ
    const { count: customerCount } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)

    // New customers last 30 days
    const { count: newCustomers30 } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
      .gte('created_at', thirtyDaysAgo)

    // New customers 30â60 days ago (for delta)
    const { count: newCustomersPrev } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
      .gte('created_at', sixtyDaysAgo)
      .lt('created_at', thirtyDaysAgo)

    // ââ 2. Active cards ââââââââââââââââââââââââââââââââââââââââ
    const { count: cardCount } = await supabase
      .from('loyalty_cards')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
      .eq('is_active', true)

    // Card IDs for stamp/redemption queries
    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('id')
      .eq('business_id', bizId)

    const cardIds = (cards || []).map(c => c.id)

    let stampCount = 0
    let stampsLast30 = 0
    let stampsPrev30 = 0
    let redeemCount = 0
    let redeemsLast30 = 0

    if (cardIds.length > 0) {
      // Total stamps
      const { count: sc } = await supabase
        .from('stamps')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
      stampCount = sc || 0

      // Stamps last 30 days
      const { count: s30 } = await supabase
        .from('stamps')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
        .gte('created_at', thirtyDaysAgo)
      stampsLast30 = s30 || 0

      // Stamps 30â60 days ago (for delta)
      const { count: sPrev } = await supabase
        .from('stamps')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', thirtyDaysAgo)
      stampsPrev30 = sPrev || 0

      // Total redemptions
      const { count: rc } = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
      redeemCount = rc || 0

      // Redemptions last 30 days
      const { count: r30 } = await supabase
        .from('redemptions')
        .select('id', { count: 'exact', head: true })
        .in('card_id', cardIds)
        .gte('created_at', thirtyDaysAgo)
      redeemsLast30 = r30 || 0
    }

    // ââ 3. Coupons issued / redeemed âââââââââââââââââââââââââââ
    const { data: bizCoupons } = await supabase
      .from('coupons')
      .select('id')
      .eq('business_id', bizId)

    const couponIds = (bizCoupons || []).map(c => c.id)
    let couponsIssued = 0
    let couponsRedeemed = 0

    if (couponIds.length > 0) {
      const { count: ci } = await supabase
        .from('coupon_passes')
        .select('id', { count: 'exact', head: true })
        .in('coupon_id', couponIds)
      couponsIssued = ci || 0

      const { count: cr } = await supabase
        .from('coupon_passes')
        .select('id', { count: 'exact', head: true })
        .in('coupon_id', couponIds)
        .eq('status', 'redeemed')
      couponsRedeemed = cr || 0
    }

    // ââ 4. Stamps by day of week + daily trend (last 30 days) ââââ
    let stampsByDay   = [0, 0, 0, 0, 0, 0, 0] // Mon-Sun
    let stampsDailyArr = new Array(30).fill(0)  // index 0=30d ago, index 29=today
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
          // day-of-week bucket (Mon-Sun)
          stampsByDay[(d.getDay() + 6) % 7]++
          // daily trend bucket
          const daysAgo = Math.floor((todayStart - d) / DAY_MS)
          const idx = 29 - daysAgo
          if (idx >= 0 && idx < 30) stampsDailyArr[idx]++
        })
      }

      const { data: recentRedemptions } = await supabase
        .from('redemptions')
        .select('created_at')
        .in('card_id', cardIds)
        .gte('created_at', thirtyDaysAgo)
        .limit(5000)

      if (recentRedemptions) {
        recentRedemptions.forEach(r => {
          const d = new Date(r.created_at)
          const daysAgo = Math.floor((todayStart - d) / DAY_MS)
          const idx = 29 - daysAgo
 
