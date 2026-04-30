const webpush = require('web-push')
const supabase = require('../db/supabase')

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

      const payload = JSON.stringify({
        title:   businessName || 'Nook',
        body:    message,
        icon:    '/icons/icon-192.png',
        badge:   '/icons/badge-72.png',
        tag:     'nook-stamp',
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

    const result = await pushService.broadcastToBusiness(
      req.business.id,
      message,
      req.business.name,
      customer_ids || null
    )
    res.json(result)
  } catch (err) {
    console.error('Broadcast error:', err)
    res.status(500).json({ error: 'Broadcast failed' })
  }
})

module.exports = { router, pushService }
