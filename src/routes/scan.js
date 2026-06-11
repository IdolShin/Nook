const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')
const { pushService } = require('../services/push')
const { updateStamps, updateMembershipPoints } = require('../services/googleWallet')

// POST /api/scan  — QR/barcode/unique_key scan -> add stamp
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, scan_type } = req.body
    // scan_type: 'qr' | 'barcode' | 'unique_key' | 'manual'

    if (!code) return res.status(400).json({ error: 'code required' })

    // 1. Find customer — match by QR code, barcode, OR unique_key.
    const trimmed = String(code).trim()
    const upper = trimmed.toUpperCase()

    const orParts = [
      `qr_code.eq.${trimmed}`,
      `barcode.eq.${trimmed}`,
      `unique_key.eq.${upper}`,
    ]

    // If staff typed ONLY digits, prepend this business's unique_key prefix.
    // Must match the unique_key generation rule in customers.js:
    // first 3 alphanumerics of the business name, uppercase, padded to 3 with 'X'.
    if (/^\d+$/.test(trimmed)) {
      const prefix = (req.business.name || 'NOO')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 3)
        .padEnd(3, 'X')
      orParts.push(`unique_key.eq.${prefix}${trimmed}`)
    }

    const { data: customer, error: findErr } = await supabase
      .from('customers')
      .select(`
        id, name, phone, wallet_type, device_token, card_id,
        loyalty_cards ( name, card_type, goal_stamps, reward_desc, reward_tiers, color )
      `)
      .or(orParts.join(','))
      .eq('business_id', req.business.id)
      .single()

    if (findErr || !customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // 2. Get current stamp count BEFORE adding
    const { count: prevCount } = await supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer.id)

    const goal = customer.loyalty_cards?.goal_stamps || 10
    const prevCurrent = (prevCount || 0) % goal

    // 3. Add stamp
    const { error: stampErr } = await supabase
      .from('stamps')
      .insert({
        customer_id: customer.id,
        card_id:     customer.card_id,
        scan_type:   scan_type || 'qr',
        scanned_by:  req.business.id
      })

    if (stampErr) throw stampErr

    // 4. Calculate new stamp count
    const newTotal   = (prevCount || 0) + 1
    const cardType   = customer.loyalty_cards?.card_type || 'stamp'
    const isMembership = cardType === 'membership'

    const newCurrent = isMembership ? null : (newTotal % goal)
    const isReward   = isMembership ? false : (newCurrent === 0)

    // Membership: wallet/UI shows BALANCE (earned - already redeemed)
    let totalPoints = null
    if (isMembership) {
      const { data: prevRed } = await supabase
        .from('redemptions')
        .select('points_redeemed')
        .eq('customer_id', customer.id)
        .eq('redeem_type', 'points')
      const spent = (prevRed || []).reduce((s, r) => s + (r.points_redeemed || 0), 0)
      totalPoints = newTotal * 100 - spent
    }

    // 5. If reward (stamp cards only) — auto-issue stamp_complete coupons
    let rewardReady = false
    if (!isMembership && isReward) {
      rewardReady = true

      ;(async () => {
        try {
          const { data: bonusCoupons } = await supabase
            .from('coupons')
            .select('id, valid_days, total_issued')
            .eq('business_id', req.business.id)
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

            const barcode    = String(Math.floor(100000000000 + Math.random() * 900000000000))
            const expiresAt  = new Date(Date.now() + (coupon.valid_days || 30) * 86400000)

            await supabase.from('coupon_passes').insert({
              coupon_id:   coupon.id,
              customer_id: customer.id,
              business_id: req.business.id,
              barcode,
              status:      'active',
              issued_at:   new Date().toISOString(),
              expires_at:  expiresAt.toISOString()
            })
            await supabase.from('coupons')
              .update({ total_issued: (coupon.total_issued || 0) + 1 })
              .eq('id', coupon.id)
          }
        } catch (e) { console.error('[Scan] stamp_complete coupon error:', e.message) }
      })()
    }

    // 6. Sync Google Wallet (fire-and-forget)
    if (customer.wallet_type === 'google') {
      if (isMembership) {
        updateMembershipPoints(customer.id, totalPoints).catch(err =>
          console.error('[Google Wallet] membership points sync failed:', err.message)
        )
      } else {
        updateStamps(customer.id, newCurrent).catch(err =>
          console.error('[Google Wallet] stamp sync failed:', err.message)
        )
      }
    }

    // 7. Send push notification
    const pushMsg = isMembership
      ? `+100 points! Total: ${totalPoints} pts. ${customer.loyalty_cards?.reward_desc ? '(' + customer.loyalty_cards.reward_desc + ')' : 'Keep it up!'}`
      : isReward
        ? `Stamp added! You now have ${goal}/${goal}. Your free ${customer.loyalty_cards?.reward_desc || 'reward'} is ready!`
        : `Stamp added! You now have ${newCurrent}/${goal}. ${goal - newCurrent} more for your free reward.`

    await pushService.sendToCustomer(customer, pushMsg, req.business.name)

    res.json({
      success:        true,
      customer_id:    customer.id,
      customer_name:  customer.name,
      card_type:      cardType,
      reward_desc:    customer.loyalty_cards?.reward_desc || null,
      reward_tiers:   isMembership ? (customer.loyalty_cards?.reward_tiers || []) : null,
      points_earned:  isMembership ? 100 : null,
      total_points:   totalPoints,
      prev_stamps:    isMembership ? null : prevCurrent,
      new_stamps:     isMembership ? null : (isReward ? goal : newCurrent),
      goal_stamps:    isMembership ? null : goal,
      rewards_earned: isMembership ? null : Math.floor(newTotal / goal),
      reward_ready:   rewardReady,
      scan_type:      scan_type || 'qr',
      message:        isMembership
        ? `+100 pts! ${customer.name} now has ${totalPoints} pts total.`
        : isReward
          ? `Reward unlocked! ${customer.name} gets a free ${customer.loyalty_cards?.reward_desc || 'reward'}.`
          : `Stamp added! ${customer.name} now has ${newCurrent}/${goal}.`
    })
  } catch (err) {
    console.error('Scan error:', err)
    res.status(500).json({ error: 'Scan failed' })
  }
})

// POST /api/scan/redeem — redeem stamp reward
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { customer_id } = req.body
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

    const { data: customer, error: findErr } = await supabase
      .from('customers')
      .select('id, name, device_token, wallet_type, card_id, loyalty_cards(goal_stamps, reward_desc)')
      .eq('id', customer_id)
      .eq('business_id', req.business.id)
      .single()

    if (findErr || !customer) return res.status(404).json({ error: 'Customer not found' })

    const { count: stampCount } = await supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer_id)

    const goal         = customer.loyalty_cards?.goal_stamps || 10
    const rewardDesc   = customer.loyalty_cards?.reward_desc || 'Reward'
    const total        = stampCount || 0
    const current      = total % goal
    const rewardsEarned = Math.floor(total / goal)

    if (current !== 0) {
      return res.status(400).json({ error: `Not enough stamps. Customer has ${current}/${goal}.` })
    }
    if (rewardsEarned === 0) {
      return res.status(400).json({ error: 'No rewards earned yet.' })
    }

    const { count: redeemsCount } = await supabase
      .from('redemptions')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer_id)
      .eq('redeem_type', 'stamp')

    if ((redeemsCount || 0) >= rewardsEarned) {
      return res.status(400).json({ error: `Reward already redeemed for this cycle. Collect ${goal} more stamps to earn the next reward.` })
    }

    await supabase.from('redemptions').insert({
      customer_id,
      card_id:         customer.card_id,
      stamps_redeemed: goal,
      redeem_type:     'stamp'
    })

    // Sync Google Wallet - reset pass to 0/goal right away (fire-and-forget)
    if (customer.wallet_type === 'google') {
      updateStamps(customer_id, 0).catch(err =>
        console.error('[Google Wallet] redeem reset sync failed:', err.message)
      )
    }

    await pushService.sendToCustomer(
      customer,
      `Your "${rewardDesc}" reward has been redeemed! Collect ${goal} more stamps to earn the next one. See you next time!`,
      req.business.name
    )

    res.json({
      success:     true,
      reward_desc: rewardDesc,
      message:     `"${rewardDesc}" redeemed for ${customer.name}. Stamp card reset to 0/${goal}.`
    })
  } catch (err) {
    console.error('Redeem error:', err)
    res.status(500).json({ error: 'Redeem failed' })
  }
})

// POST /api/scan/redeem-points — membership points deduction
router.post('/redeem-points', authMiddleware, async (req, res) => {
  try {
    const { customer_id, points, reward_label } = req.body
    if (!customer_id || !points || points <= 0) {
      return res.status(400).json({ error: 'customer_id and positive points required' })
    }

    const { data: customer, error: findErr } = await supabase
      .from('customers')
      .select('id, name, device_token, wallet_type, card_id, loyalty_cards(card_type, reward_desc)')
      .eq('id', customer_id)
      .eq('business_id', req.business.id)
      .single()

    if (findErr || !customer) return res.status(404).json({ error: 'Customer not found' })

    const cardType = customer.loyalty_cards?.card_type || 'stamp'
    if (cardType !== 'membership') {
      return res.status(400).json({ error: 'Points redemption is only available for membership cards' })
    }

    const [{ count: totalStamps }, { data: prevRedemptions }] = await Promise.all([
      supabase.from('stamps').select('id', { count: 'exact' }).eq('customer_id', customer_id),
      supabase.from('redemptions').select('points_redeemed').eq('customer_id', customer_id).eq('redeem_type', 'points')
    ])

    const totalEarned  = (totalStamps || 0) * 100
    const totalSpent   = (prevRedemptions || []).reduce((sum, r) => sum + (r.points_redeemed || 0), 0)
    const pointsBalance = totalEarned - totalSpent

    if (points > pointsBalance) {
      return res.status(400).json({ error: `Not enough points. Balance: ${pointsBalance} pts, requested: ${points} pts.` })
    }

    await supabase.from('redemptions').insert({
      customer_id,
      card_id:          customer.card_id,
      points_redeemed:  points,
      redeem_type:      'points',
      ...(reward_label ? { reward_label } : {})
    })

    const newBalance = pointsBalance - points

    // Sync Google Wallet - show remaining balance (fire-and-forget)
    if (customer.wallet_type === 'google') {
      updateMembershipPoints(customer_id, newBalance).catch(err =>
        console.error('[Google Wallet] points balance sync failed:', err.message)
      )
    }

    await pushService.sendToCustomer(
      customer,
      `${points} points redeemed! Remaining balance: ${newBalance} pts.`,
      req.business.name
    )

    res.json({
      success:      true,
      points_spent: points,
      new_balance:  newBalance,
      message:      `${points} pts redeemed for ${customer.name}. New balance: ${newBalance} pts.`
    })
  } catch (err) {
    console.error('Redeem points error:', err)
    res.status(500).json({ error: 'Points redemption failed' })
  }
})

module.exports = router
