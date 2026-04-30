const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')
const pushService = require('../services/push')
const { updateStamps } = require('../services/googleWallet')

// ─── POST /api/scan ──────────────────────────────────────────
// 핵심 엔드포인트: QR/바코드 스캔 → 스탬프 적립
// Called by: Scanner App (Step 3) after reading QR or barcode
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { code, scan_type } = req.body
    // scan_type: 'qr' | 'barcode' | 'manual'

    if (!code) return res.status(400).json({ error: 'code required' })

    // 1. Find customer by QR or barcode
    const field = scan_type === 'barcode' ? 'barcode' : 'qr_code'

    const { data: customer, error: findErr } = await supabase
      .from('customers')
      .select(`
        id, name, phone, wallet_type, device_token, card_id,
        loyalty_cards ( name, card_type, goal_stamps, reward_desc, color )
      `)
      .eq(field, code)
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
    const newCurrent = newTotal % goal
    const isReward   = newCurrent === 0   // completed a full round

    // 5. If reward — record redemption prompt (customer still needs to claim)
    let rewardReady = false
    if (isReward) {
      rewardReady = true
      // Don't auto-redeem — staff needs to manually redeem via /api/redeem
    }

    // 6. Sync Google Wallet (fire-and-forget — don't delay the scan response)
    if (customer.wallet_type === 'google') {
      updateStamps(customer.id, newCurrent).catch(err =>
        console.error('[Google Wallet] stamp sync failed:', err.message)
      )
    }

    // 7. Send push notification
    const pushMsg = isReward
      ? `Stamp added! You now have ${goal}/${goal}. Your free ${customer.loyalty_cards?.reward_desc || 'reward'} is ready!`
      : `Stamp added! You now have ${newCurrent}/${goal}. ${goal - newCurrent} more for your free reward.`

    await pushService.sendToCustomer(customer, pushMsg, req.business.name)

    res.json({
      success:        true,
      customer_name:  customer.name,
      prev_stamps:    prevCurrent,
      new_stamps:     isReward ? goal : newCurrent,   // show full on reward
      goal_stamps:    goal,
      reward_ready:   rewardReady,
      scan_type:      scan_type || 'qr',
      message:        isReward
        ? `Reward unlocked! ${customer.name} gets a free ${customer.loyalty_cards?.reward_desc || 'reward'}.`
        : `Stamp added! ${customer.name} now has ${newCurrent}/${goal}.`
    })
  } catch (err) {
    console.error('Scan error:', err)
    res.status(500).json({ error: 'Scan failed' })
  }
})

// ─── POST /api/scan/redeem ───────────────────────────────────
// 리워드 사용 처리 (직원이 "Redeem" 버튼 누를 때)
router.post('/redeem', authMiddleware, async (req, res) => {
  try {
    const { customer_id } = req.body
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

    const { data: customer, error: findErr } = await supabase
      .from('customers')
      .select('id, name, device_token, card_id, loyalty_cards(goal_stamps, reward_desc)')
      .eq('id', customer_id)
      .eq('business_id', req.business.id)
      .single()

    if (findErr || !customer) return res.status(404).json({ error: 'Customer not found' })

    // Check they actually have a reward ready
    const { count } = await supabase
      .from('stamps')
      .select('id', { count: 'exact' })
      .eq('customer_id', customer_id)

    const goal    = customer.loyalty_cards?.goal_stamps || 10
    const current = (count || 0) % goal
    if (current !== 0) {
      return res.status(400).json({
        error: `Not enough stamps. Customer has ${current}/${goal}.`
      })
    }

    // Record redemption
    await supabase.from('redemptions').insert({
      customer_id,
      card_id: customer.card_id
    })

    // Push: confirm redemption
    await pushService.sendToCustomer(
      customer,
      `Your free ${customer.loyalty_cards?.reward_desc || 'reward'} has been redeemed! Card reset to 0/${goal}. See you next time!`,
      req.business.name
    )

    res.json({
      success: true,
      message: `Reward redeemed for ${customer.name}. Card reset.`
    })
  } catch (err) {
    console.error('Redeem error:', err)
    res.status(500).json({ error: 'Redeem failed' })
  }
})

module.exports = router
