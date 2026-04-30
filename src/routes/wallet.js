const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')
const {
  createLoyaltyClass,
  createLoyaltyObject,
  generateWalletLink,
  updateStamps
} = require('../services/googleWallet')

// ─── 공통: 고객 + 카드 + 비즈니스 조회 ─────────────────────
async function fetchPassData(customerId, businessId) {
  const [customerRes, businessRes] = await Promise.all([
    supabase
      .from('customers')
      .select('*, loyalty_cards(*)')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .single(),
    supabase
      .from('businesses')
      .select('id, name, logo_url')
      .eq('id', businessId)
      .single()
  ])

  if (customerRes.error || !customerRes.data) throw { status: 404, message: 'Customer not found' }
  if (businessRes.error || !businessRes.data) throw { status: 404, message: 'Business not found' }

  const customer = customerRes.data
  const card = customer.loyalty_cards
  const business = businessRes.data

  const { count: stampCount } = await supabase
    .from('stamps')
    .select('id', { count: 'exact' })
    .eq('customer_id', customerId)

  const currentStamps = (stampCount || 0) % (card.goal_stamps || 10)

  return { customer, card, business, currentStamps }
}

// ─── POST /api/wallet/google/create ─────────────────────────
// 고객 카드 발급 + Google Wallet 링크 반환
router.post('/google/create', authMiddleware, async (req, res) => {
  try {
    const { customer_id } = req.body
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

    const { customer, card, business, currentStamps } = await fetchPassData(
      customer_id,
      req.business.id
    )

    // 클래스 없으면 생성, 있으면 업데이트
    await createLoyaltyClass(card, business)

    // google_class_id 저장 (최초 1회)
    if (!card.google_class_id) {
      await supabase
        .from('loyalty_cards')
        .update({ google_class_id: `${process.env.GOOGLE_WALLET_ISSUER_ID}.card_${card.id.replace(/-/g, '_')}` })
        .eq('id', card.id)
    }

    // 고객 오브젝트 생성/동기화
    await createLoyaltyObject(customer, card, currentStamps)

    // "Add to Google Wallet" 링크 생성
    const wallet_link = generateWalletLink(customer.id)

    // wallet_type 업데이트
    await supabase
      .from('customers')
      .update({ wallet_type: 'google' })
      .eq('id', customer_id)

    res.json({ wallet_link, current_stamps: currentStamps })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    console.error('Google Wallet create error:', err)
    res.status(500).json({ error: 'Failed to create wallet pass' })
  }
})

// ─── PATCH /api/wallet/google/stamp ──────────────────────────
// 스탬프 업데이트 — 스탬프 적립 후 scan.js에서 호출
router.patch('/google/stamp', authMiddleware, async (req, res) => {
  try {
    const { customer_id } = req.body
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

    const { customer, card, currentStamps } = await fetchPassData(customer_id, req.business.id)

    if (customer.wallet_type !== 'google') {
      return res.status(400).json({ error: 'Customer does not have a Google Wallet pass' })
    }

    await updateStamps(customer_id, currentStamps)

    res.json({ updated: true, current_stamps: currentStamps, goal: card.goal_stamps })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    if (err.message?.includes('not found')) {
      return res.status(404).json({ error: 'Wallet pass not found. Issue a pass first via POST /google/create' })
    }
    console.error('Google Wallet stamp error:', err)
    res.status(500).json({ error: 'Failed to update wallet stamp' })
  }
})

module.exports = router
