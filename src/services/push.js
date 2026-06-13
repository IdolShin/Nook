const webpush = require('web-push')
const supabase = require('../db/supabase')
const schedule = require('node-schedule')

// ─── ET business-hours helpers ────────────────────────────────
function getEtHour(date = new Date()) {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      hour12: false,
    }).format(date),
    10
  )
}

function isWithinEtHours() {
  const h = getEtHour()
  return h >= 8 && h < 20
}

// ⏰ Set to true to restrict pushes to ET 8am–8pm. Temporarily disabled
//    for testing (2026-06-11) — pushes go out at any hour. Flip back to true
//    to re-enable the business-hours window.
const ENFORCE_ET_HOURS = false

// Returns the next UTC Date when ET will be exactly 8:00 AM
function getNextEt8amUTC() {
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const etDateStr = (d) =>
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d)

  const toISO = (str) => { const [m, d, y] = str.split('/'); return `${y}-${m}-${d}` }

  const candidates = []
  for (const d of [now, tomorrow]) {
    const iso = toISO(etDateStr(d))
    for (const utcH of [12, 13]) { // 12 UTC = 8am EDT, 13 UTC = 8am EST
      const candidate = new Date(`${iso}T${String(utcH).padStart(2, '0')}:00:00.000Z`)
      if (candidate > now && getEtHour(candidate) === 8) candidates.push(candidate)
    }
  }

  candidates.sort((a, b) => a - b)
  return candidates[0] || new Date(now.getTime() + 12 * 60 * 60 * 1000)
}
// ─────────────────────────────────────────────────────────────

// Initialize VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

const pushService = {

  // Send push to a single customer
  async sendToCustomer(customer, message, businessName) {
    try {
      if (!customer.device_token) return { skipped: true, reason: 'no device_token' }

      // device_token is a JSON string with { endpoint, keys: { p256dh, auth } }
      let subscription
      try {
        subscription = JSON.parse(customer.device_token)
      } catch {
        return { skipped: true, reason: 'invalid device_token format' }
      }

      // Where the notification should take the customer when tapped:
      // their own Google Wallet loyalty pass (not the Nook homepage).
      let landingUrl = 'https://nook-wallet.com/'
      try {
        const { generateWalletLink } = require('./googleWallet')
        landingUrl = generateWalletLink(customer.id)
      } catch (_) { /* fall back to homepage */ }

      const payload = JSON.stringify({
        title:   businessName || 'Nook',
        body:    message,
        icon:    '/icons/icon-192.png',
        badge:   '/icons/badge-72.png',
        tag:     'nook-stamp',
        url:     landingUrl,
        renotify: true
      })

      await webpush.sendNotification(subscription, payload)

      // Log it
      await supabase.from('push_logs').insert({
        business_id: customer.business_id,
        customer_id: customer.id,
        message,
        status: 'sent'
      })

      return { sent: true }
    } catch (err) {
      console.error('Push failed for customer', customer.id, err.message)

      await supabase.from('push_logs').insert({
        customer_id: customer.id,
        message,
        status: 'failed'
      })

      return { sent: false, error: err.message }
    }
  },

  // Broadcast to all (or specific) customers of a business
  // Sends web push + updates Google Wallet pass with the message
  async broadcastToBusiness(businessId, message, businessName, customerIds = null) {
    const { updateWithMessage } = require('./googleWallet')

    let query = supabase
      .from('customers')
      .select('id, name, device_token, business_id, wallet_type, consent_push')
      .eq('business_id', businessId)

    if (customerIds && customerIds.length > 0) {
      query = query.in('id', customerIds)
    }

    const { data: customers, error } = await query
    if (error) throw error

    let webPushSent = 0
    let walletUpdated = 0
    let failed = 0

    await Promise.allSettled(customers.map(async (customer) => {
      try {
        const tasks = []

        if (customer.consent_push && customer.device_token) {
          tasks.push(
            pushService.sendToCustomer(customer, message, businessName)
              .then(r => { if (r.sent) webPushSent++ })
          )
        }

        if (customer.wallet_type === 'google') {
          tasks.push(
            updateWithMessage(customer.id, businessName, message)
              .then(r => { if (r.updated) walletUpdated++ })
          )
        }

        await Promise.allSettled(tasks)
      } catch {
        failed++
      }
    }))

    return {
      total_customers: customers.length,
      web_push_sent:   webPushSent,
      wallet_updated:  walletUpdated,
      failed
    }
  },

  // Apple Wallet pass push update (separate from web push)
  // Tells Apple servers to fetch updated pass from /api/wallet/v1/passes/...
  async updateApplePass(passTypeId, serialNumber) {
    // Apple push is handled by passkit / node-passkit-generator in Step 5
    // Placeholder here
    console.log(`[Apple Wallet] update push → ${passTypeId}:${serialNumber}`)
    return { queued: true }
  }
}

// ─── POST /api/push/broadcast ────────────────────────────────
// Dashboard에서 전체 고객에게 메시지 발송
const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../middleware/auth')

router.post('/broadcast', authMiddleware, async (req, res) => {
  try {
    const { message, customer_ids } = req.body
    if (!message) return res.status(400).json({ error: 'message required' })
    if (message.length > 140) return res.status(400).json({ error: 'Message max 140 chars' })

    // ─── ET business-hours gate (8am–8pm Eastern) ────────────
    // Compute effectiveIds early so the scheduled closure captures the right value
    let effectiveIdsForSchedule = customer_ids || null
    if (!req.business.is_superadmin) {
      const planForSchedule = (req.business.plan || 'basic').toLowerCase()
      if (planForSchedule !== 'premium') effectiveIdsForSchedule = null
    }

    if (ENFORCE_ET_HOURS && !isWithinEtHours()) {
      const nextTime = getNextEt8amUTC()
      const bizId   = req.business.id
      const bizName = req.business.name
      const ids     = effectiveIdsForSchedule

      schedule.scheduleJob(nextTime, async () => {
        try {
          await pushService.broadcastToBusiness(bizId, message, bizName, ids)
          console.log(`[Push] Scheduled broadcast sent for biz ${bizId} at ${nextTime.toISOString()}`)
        } catch (err) {
          console.error('[Push] Scheduled broadcast failed:', err.message)
        }
      })

      const etStr = nextTime.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
        hour12: true,
      })

      return res.json({
        scheduled: true,
        scheduled_for: nextTime.toISOString(),
        scheduled_for_et: etStr,
        message: `현재는 발송 시간이 아닙니다 (동부시간 오전 8시~오후 8시). 예약 완료: ${etStr} ET`,
      })
    }
    // ─────────────────────────────────────────────────────────

    // ─── Plan enforcement: push frequency ────────────────────
    if (!req.business.is_superadmin) {
      const plan = (req.business.plan || 'basic').toLowerCase()
      const pushLimitDays = { basic: 30, starter: 30, pro: 7 }
      const limitDays = pushLimitDays[plan]

      if (limitDays !== undefined) {
        const since = new Date(Date.now() - limitDays * 86400 * 1000).toISOString()
        const { count } = await supabase
          .from('push_logs')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', req.business.id)
          .eq('status', 'sent')
          .gte('created_at', since)

        if ((count || 0) > 0) {
          const limitLabel = plan === 'pro' ? 'once per week' : 'once per month'
          return res.status(429).json({
            error: `${plan === 'pro' ? 'Pro' : 'Basic'} plan allows push notifications ${limitLabel}. Upgrade to Premium for unlimited pushes.`,
            plan_limit: true
          })
        }
      }
    }

    // Determine effective customer_ids (Pro: always all)
    let effectiveIds = customer_ids || null
    if (!req.business.is_superadmin) {
      const plan = (req.business.plan || 'basic').toLowerCase()
      if (plan !== 'premium') effectiveIds = null  // Basic & Pro always send to all
    }

    const result = await pushService.broadcastToBusiness(
      req.business.id,
      message,
      req.business.name,
      effectiveIds
    )
    res.json(result)
  } catch (err) {
    console.error('Broadcast error:', err)
    res.status(500).json({ error: 'Broadcast failed' })
  }
})

// ─── GET /api/push/vapid ─────────────────────────────────────
// Public: the customer's browser needs the VAPID public key to subscribe
router.get('/vapid', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' })
})

// ─── POST /api/push/subscribe ────────────────────────────────
// Public: a customer's browser registers its Web Push subscription.
// Stored as a JSON string in customers.device_token so broadcasts can
// deliver a real OS notification with the title + body shown directly
// (unlike Google Wallet messages, which only show "New message").
router.post('/subscribe', async (req, res) => {
  try {
    const { customer_id, subscription } = req.body
    if (!customer_id || !subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'customer_id and subscription required' })
    }

    const { error } = await supabase
      .from('customers')
      .update({ device_token: JSON.stringify(subscription), consent_push: true })
      .eq('id', customer_id)

    if (error) throw error
    res.json({ subscribed: true })
  } catch (err) {
    console.error('Push subscribe error:', err)
    res.status(500).json({ error: 'Subscribe failed' })
  }
})

module.exports = { router, pushService }
