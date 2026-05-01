const express  = require('express')
const router   = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

router.use(authMiddleware)

function generateBarcode() {
  return String(Math.floor(100000000000 + Math.random() * 900000000000))
}

// ─── GET /api/coupons ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('business_id', req.business.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ coupons: data })
  } catch (err) {
    console.error('Get coupons error:', err)
    res.status(500).json({ error: 'Failed to fetch coupons' })
  }
})

// ─── POST /api/coupons ────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      title, description, coupon_type, discount_value, free_item_name,
      terms, trigger_type, trigger_config, max_redemptions, valid_days,
      expires_at, color
    } = req.body

    if (!title || !coupon_type) {
      return res.status(400).json({ error: 'title and coupon_type required' })
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        business_id:     req.business.id,
        title,
        description,
        coupon_type,
        discount_value:  discount_value || null,
        free_item_name:  free_item_name || null,
        terms,
        trigger_type:    trigger_type || 'manual',
        trigger_config:  trigger_config || {},
        max_redemptions: max_redemptions || null,
        valid_days:      valid_days || 30,
        expires_at:      expires_at || null,
        color:           color || '#1D9E75',
        is_active:       true
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ coupon: data })
  } catch (err) {
    console.error('Create coupon error:', err)
    res.status(500).json({ error: 'Failed to create coupon' })
  }
})

// ─── POST /api/coupons/redeem ─────────────────────────────────
// Define before /:id so Express matches it correctly
router.post('/redeem', async (req, res) => {
  try {
    const { barcode } = req.body
    if (!barcode) return res.status(400).json({ error: 'barcode required' })

    const { data: pass, error: passErr } = await supabase
      .from('coupon_passes')
      .select(`
        id, status, expires_at, redeemed_at, barcode, customer_id, coupon_id,
        coupons(id, title, coupon_type, discount_value, free_item_name, description, color, business_id),
        customers(id, name, phone, device_token, consent_push, business_id)
      `)
      .eq('barcode', barcode)
      .single()

    if (passErr || !pass) {
      return res.status(404).json({ error: 'not_found', message: 'Coupon not found. Check the barcode.' })
    }

    if (pass.coupons.business_id !== req.business.id) {
      return res.status(403).json({ error: 'not_found', message: 'Coupon not found.' })
    }

    if (pass.status === 'redeemed') {
      return res.status(400).json({
        error: 'already_redeemed',
        message: 'This coupon has already been redeemed.',
        redeemed_at: pass.redeemed_at
      })
    }

    if (pass.status === 'expired' || new Date(pass.expires_at) < new Date()) {
      await supabase.from('coupon_passes').update({ status: 'expired' }).eq('id', pass.id)
      return res.status(400).json({
        error: 'expired',
        message: 'This coupon has expired.',
        expired_at: pass.expires_at
      })
    }

    // Mark redeemed
    const redeemedAt = new Date().toISOString()
    await supabase
      .from('coupon_passes')
      .update({ status: 'redeemed', redeemed_at: redeemedAt, redeemed_by: req.business.id })
      .eq('id', pass.id)

    // Increment total_redeemed
    const { data: currentCoupon } = await supabase
      .from('coupons').select('total_redeemed').eq('id', pass.coupons.id).single()
    await supabase
      .from('coupons')
      .update({ total_redeemed: (currentCoupon?.total_redeemed || 0) + 1 })
      .eq('id', pass.coupons.id)

    // Fire-and-forget: update wallet pass
    ;(async () => {
      try {
        const { updateCouponPassStatus } = require('../services/googleWallet')
        await updateCouponPassStatus(pass.id, 'COMPLETED')
      } catch (e) { console.error('[Wallet] redeem update error:', e.message) }
    })()

    // Send confirmation push
    if (pass.customers?.consent_push && pass.customers?.device_token) {
      const { pushService } = require('../services/push')
      const label = pass.coupons.coupon_type === 'percent'
        ? `${pass.coupons.discount_value}% off`
        : pass.coupons.free_item_name || pass.coupons.title
      pushService.sendToCustomer(
        pass.customers,
        `Coupon redeemed: ${pass.coupons.title} (${label}). Thank you!`,
        req.business.name
      ).catch(() => {})
    }

    await supabase.from('coupon_notifications').insert({
      coupon_pass_id: pass.id,
      customer_id:    pass.customer_id,
      channel:        'redemption',
      status:         'redeemed'
    }).catch(() => {})

    res.json({
      success:     true,
      coupon:      pass.coupons,
      customer:    { name: pass.customers.name, phone: pass.customers.phone },
      barcode:     pass.barcode,
      redeemed_at: redeemedAt
    })
  } catch (err) {
    console.error('Redeem error:', err)
    res.status(500).json({ error: 'Redeem failed' })
  }
})

// ─── GET /api/coupons/passes/:customerId ──────────────────────
router.get('/passes/:customerId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coupon_passes')
      .select(`
        id, barcode, status, issued_at, expires_at, redeemed_at, wallet_link,
        coupons(id, title, coupon_type, discount_value, free_item_name, color, description)
      `)
      .eq('customer_id', req.params.customerId)
      .eq('business_id', req.business.id)
      .order('issued_at', { ascending: false })
    if (error) throw error
    res.json({ passes: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch passes' })
  }
})

// ─── GET /api/coupons/:id ─────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
      .single()

    if (error || !coupon) return res.status(404).json({ error: 'Coupon not found' })

    const { data: passes } = await supabase
      .from('coupon_passes')
      .select(`
        id, barcode, status, issued_at, expires_at, redeemed_at, wallet_link,
        customers(id, name, phone)
      `)
      .eq('coupon_id', req.params.id)
      .order('issued_at', { ascending: false })
      .limit(50)

    res.json({ coupon, passes: passes || [] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupon' })
  }
})

// ─── PATCH /api/coupons/:id ───────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'description', 'is_active', 'color', 'valid_days',
                     'max_redemptions', 'trigger_type', 'trigger_config', 'terms']
    const updates = {}
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key]
    }
    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
      .select()
      .single()
    if (error || !data) return res.status(404).json({ error: 'Coupon not found' })
    res.json({ coupon: data })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update coupon' })
  }
})

// ─── POST /api/coupons/:id/issue ──────────────────────────────
router.post('/:id/issue', async (req, res) => {
  try {
    const { customer_ids, send_push = true, send_email = false } = req.body

    const { data: coupon, error: couponErr } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
      .single()

    if (couponErr || !coupon) return res.status(404).json({ error: 'Coupon not found' })
    if (!coupon.is_active)    return res.status(400).json({ error: 'Coupon is not active' })

    let custQuery = supabase
      .from('customers')
      .select('id, name, phone, email, device_token, wallet_type, business_id, consent_push')
      .eq('business_id', req.business.id)
    if (customer_ids && customer_ids.length > 0) {
      custQuery = custQuery.in('id', customer_ids)
    }
    const { data: customers, error: custErr } = await custQuery
    if (custErr) throw custErr

    const now       = new Date()
    const expiresAt = new Date(now.getTime() + (coupon.valid_days || 30) * 86_400_000)

    // Avoid issuing duplicates for active passes
    const { data: existing } = await supabase
      .from('coupon_passes')
      .select('customer_id')
      .eq('coupon_id', coupon.id)
      .eq('status', 'active')
    const alreadyIssued = new Set((existing || []).map(p => p.customer_id))

    let issued = 0, skipped = 0
    const results = []

    for (const customer of customers) {
      if (alreadyIssued.has(customer.id)) { skipped++; continue }

      // Unique barcode
      let barcode, unique = false
      while (!unique) {
        barcode = generateBarcode()
        const { data: dup } = await supabase
          .from('coupon_passes').select('id').eq('barcode', barcode).maybeSingle()
        if (!dup) unique = true
      }

      const { data: passRecord, error: insertErr } = await supabase
        .from('coupon_passes')
        .insert({
          coupon_id:   coupon.id,
          customer_id: customer.id,
          business_id: req.business.id,
          barcode,
          status:      'active',
          issued_at:   now.toISOString(),
          expires_at:  expiresAt.toISOString()
        })
        .select()
        .single()

      if (insertErr) { console.error('Pass insert error:', insertErr); skipped++; continue }

      issued++
      results.push({ customer_id: customer.id, pass_id: passRecord.id, barcode })

      // Fire-and-forget: Google Wallet
      ;(async () => {
        try {
          const { createCouponObject, generateCouponWalletLink } = require('../services/googleWallet')
          const biz = { id: req.business.id, name: req.business.name }
          await createCouponObject(passRecord, coupon, customer, biz)
          const link = generateCouponWalletLink(passRecord.id)
          await supabase.from('coupon_passes').update({ wallet_link: link }).eq('id', passRecord.id)
          passRecord.wallet_link = link
        } catch (e) { console.error('[Wallet] coupon create error:', e.message) }
      })()

      // Fire-and-forget: push
      if (send_push && customer.consent_push && customer.device_token) {
        const { pushService } = require('../services/push')
        const label = coupon.coupon_type === 'percent' ? `${coupon.discount_value}% off`
          : coupon.coupon_type === 'fixed' ? `$${coupon.discount_value} off`
          : coupon.free_item_name || coupon.title
        pushService.sendToCustomer(
          customer,
          `You received a coupon! ${coupon.title} — ${label}. Expires ${expiresAt.toLocaleDateString()}.`,
          req.business.name
        ).catch(() => {})
      }

      // Fire-and-forget: email
      if (send_email) {
        const { sendCouponEmail } = require('../services/email')
        sendCouponEmail(customer, coupon, passRecord).catch(() => {})
      }
    }

    // Update total_issued
    await supabase
      .from('coupons')
      .update({ total_issued: (coupon.total_issued || 0) + issued })
      .eq('id', coupon.id)

    res.json({ issued, skipped, total: customers.length, results })
  } catch (err) {
    console.error('Issue coupon error:', err)
    res.status(500).json({ error: 'Failed to issue coupons' })
  }
})

module.exports = router
