require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')
const path       = require('path')

const authRoutes     = require('./routes/auth')
const cardRoutes     = require('./routes/cards')
const customerRoutes = require('./routes/customers')
const scanRoutes     = require('./routes/scan')
const couponRoutes   = require('./routes/coupons')
const { router: pushRoutes } = require('./services/push')
const walletRoutes   = require('./routes/wallet')
const schedule       = require('node-schedule')

const app = express()

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /\.vercel\.app$/,
    /\.nookapp\.com$/,
    /\.railway\.app$/
  ],
  credentials: true
}))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting — prevent spam scanning
const scanLimiter = rateLimit({
  windowMs: 60 * 1000,     // 1 minute
  max: 60,                  // 60 scans/min per IP (1/sec)
  message: { error: 'Too many requests, slow down' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 min
  max: 20,
  message: { error: 'Too many auth attempts' }
})

// ─── Static (dashboard) ──────────────────────────────────
app.use('/dashboard', express.static(path.join(__dirname, 'public')))

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes)
app.use('/api/cards',     cardRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/scan',      scanLimiter, scanRoutes)
app.use('/api/coupons',   couponRoutes)
app.use('/api/push',      pushRoutes)
app.use('/api/wallet',    walletRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nook-backend',
    time: new Date().toISOString()
  })
})

// ─── Apple Wallet web service endpoints (Step 5) ──────────────
// /api/wallet/v1/devices/:deviceId/registrations/:passTypeId/:serialNumber
// /api/wallet/v1/passes/:passTypeId/:serialNumber
// → Loaded in Step 5 when pkpass is implemented

// ─── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Auto-trigger scheduler (daily 9am) ──────────────────────
schedule.scheduleJob('0 9 * * *', async () => {
  const supabase = require('./db/supabase')
  console.log('[Scheduler] Running daily coupon auto-triggers')

  try {
    // Winback: find coupons with trigger_type = 'winback'
    const { data: winbackCoupons } = await supabase
      .from('coupons')
      .select('id, business_id, valid_days, total_issued')
      .eq('trigger_type', 'winback')
      .eq('is_active', true)

    for (const coupon of (winbackCoupons || [])) {
      // Find customers with no stamp in 30+ days who don't already have an active pass
      const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString()
      const { data: lapsedCustomers } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', coupon.business_id)
        .lt('updated_at', cutoff)
        .limit(200)

      if (!lapsedCustomers || lapsedCustomers.length === 0) continue

      const { data: alreadyHave } = await supabase
        .from('coupon_passes')
        .select('customer_id')
        .eq('coupon_id', coupon.id)
        .eq('status', 'active')

      const alreadySet = new Set((alreadyHave || []).map(p => p.customer_id))
      const targets = lapsedCustomers.filter(c => !alreadySet.has(c.id))

      if (targets.length === 0) continue

      const now = new Date()
      const expiresAt = new Date(now.getTime() + (coupon.valid_days || 7) * 86_400_000)

      const passes = targets.map(() => ({
        coupon_id:   coupon.id,
        business_id: coupon.business_id,
        customer_id: targets.shift().id,
        barcode:     String(Math.floor(100000000000 + Math.random() * 900000000000)),
        status:      'active',
        issued_at:   now.toISOString(),
        expires_at:  expiresAt.toISOString()
      }))

      await supabase.from('coupon_passes').insert(passes)
      console.log(`[Scheduler] Winback: issued ${passes.length} passes for coupon ${coupon.id}`)
    }
  } catch (err) {
    console.error('[Scheduler] Daily trigger error:', err.message)
  }
})

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🟢 Nook backend running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Mode:   ${process.env.NODE_ENV || 'development'}\n`)
})

module.exports = app
