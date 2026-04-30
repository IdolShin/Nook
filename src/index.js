require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const rateLimit  = require('express-rate-limit')
const path       = require('path')

const authRoutes     = require('./routes/auth')
const cardRoutes     = require('./routes/cards')
const customerRoutes = require('./routes/customers')
const scanRoutes     = require('./routes/scan')
const { router: pushRoutes } = require('./services/push')
const walletRoutes   = require('./routes/wallet')

const app = express()

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /\.vercel\.app$/,
    /\.nookapp\.com$/
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

// ─── Start server ────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`\n🟢 Nook backend running on port ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Mode:   ${process.env.NODE_ENV || 'development'}\n`)
})

module.exports = app
