const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const supabase = require('../db/supabase')
const { pushService } = require('../services/push')
const { updateStamps, updateMembershipPoints } = require('../services/googleWallet')
const { decryptPiccData, verifySdmMac } = require('../services/sdm')

const JWT_SECRET = process.env.JWT_SECRET
const TAP_TOKEN_TTL = '10m'

// ─── POST /api/tap/verify ────────────────────────────────────
// PUBLIC. Called by the /t page right after an NFC tap.
// Body (encrypted SDM mode):  { picc_data, cmac }
// Body (plaintext SDM mode):  { uid, ctr, cmac }
// Verifies the SUN signature, does NOT consume the counter yet.
// Returns business info + a short-lived tap_token for /collect.
router.post('/verify', async (req, res) => {
  try {
    const { picc_data, cmac, uid: plainUid, ctr: plainCtr } = req.body || {}
    if (!cmac) return res.status(400).json({ error: 'cmac required' })

    let tag = null
    let uid = null
    let ctr = null

    if (picc_data) {
      // Encrypted mode: try each distinct meta_key among active tags
      const { data: tags } = await supabase
        .from('nfc_tags')
        .select('id, business_id, name, uid, meta_key, file_key, last_ctr, is_active')
        .eq('is_active', true)

      const tried = new Set()
      for (const t of (tags || [])) {
        if (tried.has(t.meta_key)) continue
        tried.add(t.meta_key)
        const picc = decryptPiccData(t.meta_key, picc_data)
        if (!picc) continue
        const match = (tags || []).find(x => x.uid === picc.uid && x.meta_key === t.meta_key)
        if (match) { tag = match; uid = picc.uid; ctr = picc.ctr; break }
      }
    } else if (plainUid && plainCtr !== undefined) {
      // Plaintext mirror mode: UID + counter in URL
      uid = String(plainUid).trim().toUpperCase()
      // SDM plaintext counter mirror is hex ASCII (6 chars)
      ctr = parseInt(String(plainCtr).trim(), 16)
      if (!Number.isFinite(ctr)) return res.status(400).json({ error: 'invalid ctr' })
      const { data: t } = await supabase
        .from('nfc_tags')
        .select('id, business_id, name, uid, meta_key, file_key, last_ctr, is_active')
        .eq('uid', uid)
        .eq('is_active', true)
        .single()
      tag = t || null
    } else {
      return res.status(400).json({ error: 'picc_data or uid+ctr required' })
    }

    if (!tag) {
      return res.status(404).json({ error: 'Tag not recognized. Ask the store to register this stamp.', code: 'TAG_UNKNOWN' })
    }

    // Verify CMAC (SUN signature)
    if (!verifySdmMac(tag.file_key, uid, ctr, cmac)) {
      return res.status(401).json({ error: 'Invalid tap signature', code: 'BAD_SIGNATURE' })
    }

    // Replay check (soft — hard check happens atomically at /collect)
    if (ctr <= (tag.last_ctr || 0)) {
      return res.status(409).json({ error: 'This tap was already used. Please tap again.', code: 'REPLAY' })
    }

    // Load business + active cards
    const [{ data: business }, { data: cards }] = await Promise.all([
      supabase.from('businesses').select('id, name, logo_url').eq('id', tag.business_id).single(),
      supabase.from('loyalty_cards')
        .select('id, name, card_type, goal_stamps, reward_desc, color')
        .eq('business_id', tag.business_id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
    ])

    if (!business) return res.status(404).json({ error: 'Business not found' })

    const tap_token = jwt.sign(
      { typ: 'tap', tag_id: tag.id, business_id: tag.business_id, uid, ctr },
      JWT_SECRET,
      { expiresIn: TAP_TOKEN_TTL }
    )

    res.json({
      valid: true,
      tap_token,
      tag_name: tag.name || null,
      business,
      cards: cards || []
    })
  } catch (err) {
    console.error('Tap verify error:', err)
    res.status(500).json({ error: 'Tap verification failed' })
  }
})

// ─── POST /api/tap/collect ───────────────────────────────────
// PUBLIC. Body: { tap_token, unique_key }
// Atomically consumes the tap counter and credits a stamp/points
// to the customer identified by unique_key (same logic as /api/scan).
router.post('/collect', async (req, res) => {
  try {
    const { tap_token, unique_key } = req.body || {}
    if (!tap_token || !unique_key) {
      return res.status(400).json({ error: 'tap_token and unique_key required' })
    }

    let claim
    try {
      claim = jwt.verify(tap_token, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Tap expired. Please tap the stamp again.', code: 'TOKEN_EXPIRED' })
    }
    if (claim.typ !== 'tap') return res.status(401).json({ error: 'Invalid tap token' })

    // Load business (needed for prefix rule + push)
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, logo_url')
      .eq('id', claim.business_id)
      .single()
    if (!business) return res.status(404).json({ error: 'Business not found' })

    // Find customer by unique_key (digits-only input gets business prefix)
    const trimmed = String(unique_key).trim().toUpperCase()
    const keys = [trimmed]
    if (/^\d+$/.test(trimmed)) {
      const prefix = (business.name || 'NOO')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 3)
        .padEnd(3, 'X')
      keys.push(`${prefix}${trimmed}`)
    }

    const { data: customer } = await supabase
      .from('customers')
      .select(`
        id, name, user_id, unique_key, wallet_type, device_token, card_id,
        loyalty_cards ( name, card_type, goal_stamps, reward_desc, reward_tiers, color )
      `)
      .in('unique_key', keys)
      .eq('business_id', claim.business_id)
      .limit(1)
      .maybeSingle()

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found for this store', code: 'CUSTOMER_NOT_FOUND' })
    }

    // ─── Atomically consume the counter (replay protection) ──
    const { data: consumed } = await supabase
      .from('nfc_tags')
      .update({ last_ctr: claim.ctr })
      .eq('id', claim.tag_id)
      .eq('is_active', true)
      .lt('last_ctr', claim.ctr)
      .select('id')

    if (!consumed || consumed.length === 0) {
      return res.status(409).json({ error: 'This tap was already used. Please tap the stamp again.', code: 'REPLAY' })
    }

    // ─── Credit stamp (mirrors /api/scan) ─────────────────────
    const { count: prevCount } = await supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)

    const goal = customer.loyalty_cards?.goal_stamps || 10
    const prevCurrent = (prevCount || 0) % goal

    const { error: stampErr } = await supabase
      .from('stamps')
      .insert({
        customer_id: customer.id,
        card_id:     customer.card_id,
        scan_type:   'nfc',
        scanned_by:  claim.business_id
      })
    if (stampErr) throw stampErr

    const newTotal     = (prevCount || 0) + 1
    const cardType     = customer.loyalty_cards?.card_type || 'stamp'
    const isMembership = cardType === 'membership'
    const newCurrent   = isMembership ? null : (newTotal % goal)
    const isReward     = isMembership ? false : (newCurrent === 0)
    const totalPoints  = isMembership ? newTotal * 100 : null

    // Log tap event (fire-and-forget)
    supabase.from('tap_events').insert({
      tag_id:      claim.tag_id,
      business_id: claim.business_id,
      customer_id: customer.id,
      ctr:         claim.ctr,
      result:      'credited'
    }).then(() => {}, e => console.error('[Tap] event log failed:', e.message))

    // Auto-issue stamp_complete coupons on reward (same as scan)
    let rewardReady = false
    if (!isMembership && isReward) {
      rewardReady = true
      ;(async () => {
        try {
          const { data: bonusCoupons } = await supabase
            .from('coupons')
            .select('id, valid_days, total_issued')
            .eq('business_id', claim.business_id)
            .eq('trigger_type', 'stamp_complete')
            .eq('is_active', true)

          for (const coupon of (bonusCoupons || [])) {
            const { data: existing } = await supabase
              .from('coupon_passes')
              .select('id')
              .eq('coupon_id', coupon.id)
              .eq('customer_id', customer.id)
              .eq('status', 'active')
              .maybeSingle()
            if (existing) continue

            const barcode   = String(Math.floor(100000000000 + Math.random() * 900000000000))
            const expiresAt = new Date(Date.now() + (coupon.valid_days || 30) * 86400000)

            await supabase.from('coupon_passes').insert({
              coupon_id:   coupon.id,
              customer_id: customer.id,
              business_id: claim.business_id,
              barcode,
              status:      'active',
              issued_at:   new Date().toISOString(),
              expires_at:  expiresAt.toISOString()
            })
            await supabase.from('coupons')
              .update({ total_issued: (coupon.total_issued || 0) + 1 })
              .eq('id', coupon.id)
          }
        } catch (e) { console.error('[Tap] stamp_complete coupon error:', e.message) }
      })()
    }

    // Google Wallet sync (fire-and-forget)
    if (customer.wallet_type === 'google') {
      if (isMembership) {
        updateMembershipPoints(customer.id, totalPoints).catch(err =>
          console.error('[Google Wallet] membership points sync failed:', err.message))
      } else {
        updateStamps(customer.id, newCurrent).catch(err =>
          console.error('[Google Wallet] stamp sync failed:', err.message))
      }
    }

    // Push notification
    const pushMsg = isMembership
      ? `+100 points! Total: ${totalPoints} pts.`
      : isReward
        ? `Stamp added! You now have ${goal}/${goal}. Your free ${customer.loyalty_cards?.reward_desc || 'reward'} is ready!`
        : `Stamp added! You now have ${newCurrent}/${goal}. ${goal - newCurrent} more for your free reward.`
    pushService.sendToCustomer(customer, pushMsg, business.name)
      .catch(e => console.error('[Tap] push failed:', e.message))

    res.json({
      success:        true,
      customer_id:    customer.id,
      customer_name:  customer.name,
      user_id:        customer.user_id || null,
      unique_key:     customer.unique_key || null,
      business_name:  business.name,
      card_name:      customer.loyalty_cards?.name || null,
      card_color:     customer.loyalty_cards?.color || null,
      card_type:      cardType,
      reward_desc:    customer.loyalty_cards?.reward_desc || null,
      points_earned:  isMembership ? 100 : null,
      total_points:   totalPoints,
      prev_stamps:    isMembership ? null : prevCurrent,
      new_stamps:     isMembership ? null : (isReward ? goal : newCurrent),
      goal_stamps:    isMembership ? null : goal,
      rewards_earned: isMembership ? null : Math.floor(newTotal / goal),
      reward_ready:   rewardReady
    })
  } catch (err) {
    console.error('Tap collect error:', err)
    res.status(500).json({ error: 'Tap collect failed' })
  }
})

// ─── POST /api/tap/wallet ────────────────────────────────────
// PUBLIC. Body: { keys: [unique_key, ...] }  (max 20)
// Returns wallet card summaries for the customer app view.
router.post('/wallet', async (req, res) => {
  try {
    const { keys } = req.body || {}
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ error: 'keys array required' })
    }
    const cleaned = [...new Set(keys.map(k => String(k).trim().toUpperCase()).filter(Boolean))].slice(0, 20)

    const { data: customers } = await supabase
      .from('customers')
      .select(`
        id, name, user_id, unique_key, business_id, card_id, created_at,
        loyalty_cards ( name, card_type, goal_stamps, reward_desc, reward_tiers, color ),
        businesses ( id, name, logo_url, lat, lng )
      `)
      .in('unique_key', cleaned)

    const cards = []
    for (const c of (customers || [])) {
      const goal = c.loyalty_cards?.goal_stamps || 10
      const cardType = c.loyalty_cards?.card_type || 'stamp'
      const isMembership = cardType === 'membership'

      const [{ count: totalStamps }, { count: stampRedeems }, { data: pointRedemptions }, { data: passes }] = await Promise.all([
        supabase.from('stamps').select('id', { count: 'exact', head: true }).eq('customer_id', c.id),
        supabase.from('redemptions').select('id', { count: 'exact', head: true }).eq('customer_id', c.id).eq('redeem_type', 'stamp'),
        supabase.from('redemptions').select('points_redeemed').eq('customer_id', c.id).eq('redeem_type', 'points'),
        supabase.from('coupon_passes')
          .select('id, barcode, status, expires_at, coupons ( title, name, discount_type, discount_value, free_item_name )')
          .eq('customer_id', c.id)
          .eq('status', 'active')
          .order('expires_at', { ascending: true })
      ])

      const total = totalStamps || 0
      const spent = (pointRedemptions || []).reduce((s, r) => s + (r.points_redeemed || 0), 0)
      const rewardsEarned = Math.floor(total / goal)

      // last visit = latest stamp
      const { data: lastStamp } = await supabase
        .from('stamps')
        .select('created_at')
        .eq('customer_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      cards.push({
        unique_key:      c.unique_key,
        user_id:         c.user_id || c.name,
        business:        c.businesses ? { id: c.businesses.id, name: c.businesses.name, logo_url: c.businesses.logo_url, lat: c.businesses.lat ?? null, lng: c.businesses.lng ?? null } : null,
        card_name:       c.loyalty_cards?.name || 'Loyalty Card',
        card_type:       cardType,
        color:           c.loyalty_cards?.color || '#1D9E75',
        goal_stamps:     isMembership ? null : goal,
        current_stamps:  isMembership ? null : (total % goal),
        total_stamps:    total,
        total_points:    isMembership ? (total * 100 - spent) : null,
        reward_desc:     c.loyalty_cards?.reward_desc || null,
        reward_tiers:    isMembership ? (c.loyalty_cards?.reward_tiers || []) : null,
        rewards_earned:  rewardsEarned,
        rewards_redeemed: stampRedeems || 0,
        reward_ready:    !isMembership && rewardsEarned > (stampRedeems || 0),
        coupons:         (passes || []).map(p => ({
          id: p.id, barcode: p.barcode, status: p.status, expires_at: p.expires_at,
          title: p.coupons?.title || p.coupons?.name || 'Coupon',
          discount_type: p.coupons?.discount_type || null,
          discount_value: p.coupons?.discount_value || null,
          free_item_name: p.coupons?.free_item_name || null
        })),
        last_visit:      lastStamp?.created_at || null,
        joined_at:       c.created_at
      })
    }

    // keep requested order
    cards.sort((a, b) => cleaned.indexOf(a.unique_key) - cleaned.indexOf(b.unique_key))

    res.json({ cards, not_found: cleaned.filter(k => !cards.some(c => c.unique_key === k)) })
  } catch (err) {
    console.error('Wallet lookup error:', err)
    res.status(500).json({ error: 'Wallet lookup failed' })
  }
})

module.exports = router
