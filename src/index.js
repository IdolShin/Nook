require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')
const path       = require('path')

const authRoutes        = require('./routes/auth')
const cardRoutes        = require('./routes/cards')
const customerRoutes    = require('./routes/customers')
const scanRoutes        = require('./routes/scan')
const couponRoutes      = require('./routes/coupons')
const { router: pushRoutes } = require('./services/push')
const walletRoutes      = require('./routes/wallet')
const statsRoutes       = require('./routes/stats')
const permissionsRoutes = require('./routes/permissions')
const analyticsRoutes   = require('./routes/analytics')
const reviewRoutes      = require('./routes/reviews')
const contactRoutes     = require('./routes/contact')
const businessRoutes    = require('./routes/businesses')
const tapRoutes         = require('./routes/tap')
const tagRoutes         = require('./routes/tags')
const locationRoutes    = require('./routes/location')
const schedule          = require('node-schedule')

const app = express()

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /\.vercel\.app$/,
    /\.nookapp\.com$/,
    /\.railway\.app$/,
    'https://nook-wallet.com',
    'https://www.nook-wallet.com'
  ],
  credentials: true
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

const scanLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, message: { error: 'Too many requests, slow down' } })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many auth attempts' } })

app.use('/dashboard', express.static(path.join(__dirname, 'public')))

app.use('/api/auth',        authLimiter, authRoutes)
app.use('/api/cards',       cardRoutes)
app.use('/api/customers',   customerRoutes)
app.use('/api/scan',        scanLimiter, scanRoutes)
app.use('/api/coupons',     couponRoutes)
app.use('/api/push',        pushRoutes)
app.use('/api/wallet',      walletRoutes)
app.use('/api/stats',       statsRoutes)
app.use('/api/analytics',   analyticsRoutes)
app.use('/api/permissions', permissionsRoutes)
app.use('/api/reviews',     reviewRoutes)
app.use('/api/contact',     contactRoutes)
app.use('/api/businesses',  businessRoutes)
app.use('/api/tap',         scanLimiter, tapRoutes)
app.use('/api/tags',        tagRoutes)
app.use('/api/location',    locationRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'nook-backend', time: new Date().toISOString() })
})

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Daily 9am scheduler
schedule.scheduleJob('0 9 * * *', async () => {
  const supabase = require('./db/supabase')
  console.log('[Scheduler] Running daily auto-triggers')

  // Winback coupons
  try {
    const { data: winbackCoupons } = await supabase
      .from('coupons').select('id, business_id, valid_days, total_issued')
      .eq('trigger_type', 'winback').eq('is_active', true)

    for (const coupon of (winbackCoupons || [])) {
      const cutoff = new Date(Date.now() - 30 * 86400000).toISOString()
      const { data: lapsedCustomers } = await supabase
        .from('customers').select('id').eq('business_id', coupon.business_id).lt('updated_at', cutoff).limit(200)
      if (!lapsedCustomers || lapsedCustomers.length === 0) continue

      const { data: alreadyHave } = await supabase
        .from('coupon_passes').select('customer_id').eq('coupon_id', coupon.id).eq('status', 'active')
      const alreadySet = new Set((alreadyHave || []).map(p => p.customer_id))
      const targets = lapsedCustomers.filter(c => !alreadySet.has(c.id))
      if (targets.length === 0) continue

      const now = new Date()
      const expiresAt = new Date(now.getTime() + (coupon.valid_days || 7) * 86400000)
      const passes = targets.map(() => ({
        coupon_id: coupon.id, business_id: coupon.business_id,
        customer_id: targets.shift().id,
        barcode: String(Math.floor(100000000000 + Math.random() * 900000000000)),
        status: 'active', issued_at: now.toISOString(), expires_at: expiresAt.toISOString()
      }))
      await supabase.from('coupon_passes').insert(passes)
      console.log(`[Scheduler] Winback: issued ${passes.length} passes for coupon ${coupon.id}`)
    }
  } catch (err) {
    console.error('[Scheduler] Winback error:', err.message)
  }

  // Review rewards
  try {
    const now = new Date().toISOString()
    const { data: pendingRewards } = await supabase
      .from('review_rewards')
      .select('id, customer_id, business_id, reward_type, reward_value')
      .eq('status', 'pending').lte('reward_at', now)

    for (const reward of (pendingRewards || [])) {
      try {
        const { data: customer } = await supabase
          .from('customers').select('id, name, device_token, consent_push, card_id')
          .eq('id', reward.customer_id).single()
        if (!customer) continue

        const { data: biz } = await supabase
          .from('businesses').select('name').eq('id', reward.business_id).single()

        let pushMsg = ''

        if (reward.reward_type === 'stamp') {
          const stampCount = reward.reward_value && reward.reward_value.stamp_count ? reward.reward_value.stamp_count : 1
          const stamps = Array.from({ length: stampCount }, () => ({
            customer_id: reward.customer_id, card_id: customer.card_id || null,
            scan_type: 'review_reward', scanned_by: reward.business_id
          }))
          await supabase.from('stamps').insert(stamps)
          pushMsg = `Thank you for your Google review! ${stampCount} stamp${stampCount > 1 ? 's have' : ' has'} been added to your card!`
          console.log(`[Scheduler] Review reward: ${stampCount} stamp(s) to customer ${reward.customer_id}`)
        } else if (reward.reward_type === 'coupon') {
          const couponId = reward.reward_value && reward.reward_value.coupon_id ? reward.reward_value.coupon_id : null
          if (couponId) {
            const { data: coupon } = await supabase
              .from('coupons').select('id, title, valid_days, total_issued').eq('id', couponId).single()
            if (coupon) {
              const barcode = String(Math.floor(100000000000 + Math.random() * 900000000000))
              const expiresAt = new Date(Date.now() + (coupon.valid_days || 30) * 86400000)
              await supabase.from('coupon_passes').insert({
                coupon_id: couponId, customer_id: reward.customer_id, business_id: reward.business_id,
                barcode, status: 'active', issued_at: new Date().toISOString(), expires_at: expiresAt.toISOString()
              })
              await supabase.from('coupons').update({ total_issued: (coupon.total_issued || 0) + 1 }).eq('id', couponId)
              pushMsg = `Thank you for your Google review! Your coupon "${coupon.title}" is ready to use!`
              console.log(`[Scheduler] Review reward: coupon "${coupon.title}" to customer ${reward.customer_id}`)
            }
          }
        }

        await supabase.from('review_rewards')
          .update({ status: 'issued', issued_at: new Date().toISOString() }).eq('id', reward.id)

        if (pushMsg && customer.consent_push && customer.device_token) {
          const { pushService } = require('./services/push')
          pushService.sendToCustomer(customer, pushMsg, (biz && biz.name) ? biz.name : 'Nook').catch(() => {})
        }
      } catch (rewardErr) {
        console.error(`[Scheduler] Review reward error (id: ${reward.id}):`, rewardErr.message)
      }
    }
    if ((pendingRewards || []).length > 0)
      console.log(`[Scheduler] Review rewards: processed ${pendingRewards.length} reward(s)`)
  } catch (err) {
    console.error('[Scheduler] Review rewards error:', err.message)
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n Nook backend running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
})
