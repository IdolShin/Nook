const { google } = require('googleapis')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID
const SCOPES = ['https://www.googleapis.com/auth/wallet_object.issuer']

function loadCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'))
  }
  const credPath = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  return JSON.parse(fs.readFileSync(credPath, 'utf8'))
}

function getAuth() {
  const credentials = loadCredentials()
  return new google.auth.GoogleAuth({ credentials, scopes: SCOPES })
}

function classId(cardId) {
  return `${ISSUER_ID}.card_${cardId.replace(/-/g, '_')}`
}

function objectId(customerId) {
  return `${ISSUER_ID}.customer_${customerId.replace(/-/g, '_')}`
}

function buildClass(card, business) {
  return {
    id: classId(card.id),
    issuerName: business.name,
    programName: card.name,
    programLogo: {
      sourceUri: {
        uri: business.logo_url ||
          'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png'
      },
      contentDescription: { defaultValue: { language: 'en-US', value: business.name } }
    },
    rewardsTierLabel: 'Stamps',
    rewardsTier: card.reward_desc || `${card.goal_stamps} stamps for reward`,
    hexBackgroundColor: card.color || '#1D9E75',
    reviewStatus: 'UNDER_REVIEW',
    textModulesData: [
      {
        id: 'reward_info',
        header: 'Reward',
        body: card.reward_desc || `Collect ${card.goal_stamps} stamps for a free reward`
      }
    ]
  }
}

function buildObject(customer, card, currentStamps) {
  return {
    id: objectId(customer.id),
    classId: classId(card.id),
    state: 'ACTIVE',
    accountId: customer.id,
    accountName: customer.name,
    loyaltyPoints: {
      label: 'Stamps',
      balance: { int: currentStamps }
    },
    secondaryLoyaltyPoints: {
      label: 'Goal',
      balance: { int: card.goal_stamps }
    },
    barcode: {
      type: 'QR_CODE',
      value: customer.qr_code,
      alternateText: customer.barcode
    },
    textModulesData: [
      {
        id: 'reward_detail',
        header: 'Reward',
        body: card.reward_desc || `${card.goal_stamps} stamps for a reward`
      }
    ]
  }
}

// ─── createLoyaltyClass ──────────────────────────────────────
// 카드 템플릿 생성 (loyalty_cards 1개당 1번)
async function createLoyaltyClass(card, business) {
  const auth = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })
  const body = buildClass(card, business)

  try {
    const { data } = await client.loyaltyclass.get({ resourceId: body.id })
    // 이미 존재하면 update
    const { data: updated } = await client.loyaltyclass.update({
      resourceId: body.id,
      requestBody: { ...data, ...body }
    })
    return updated
  } catch (err) {
    if (err.code !== 404) throw err
    // 없으면 신규 생성
    const { data } = await client.loyaltyclass.insert({ requestBody: body })
    return data
  }
}

// ─── createLoyaltyObject ─────────────────────────────────────
// 고객별 카드 발급 (customers 1명당 1번)
async function createLoyaltyObject(customer, card, currentStamps = 0) {
  const auth = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })
  const body = buildObject(customer, card, currentStamps)

  try {
    await client.loyaltyobject.get({ resourceId: body.id })
    // 이미 존재하면 update
    const { data } = await client.loyaltyobject.update({
      resourceId: body.id,
      requestBody: body
    })
    return data
  } catch (err) {
    if (err.code !== 404) throw err
    const { data } = await client.loyaltyobject.insert({ requestBody: body })
    return data
  }
}

// ─── generateWalletLink ──────────────────────────────────────
// "Google Wallet에 추가" 버튼 링크 생성
// 사전에 createLoyaltyClass + createLoyaltyObject 호출 필요
function generateWalletLink(customerId) {
  const credentials = loadCredentials()

  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      loyaltyObjects: [{ id: objectId(customerId) }]
    }
  }

  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}

// ─── updateStamps ────────────────────────────────────────────
// 스탬프 찍힐 때마다 호출 — 카드 숫자 업데이트
async function updateStamps(customerId, currentStamps) {
  const auth = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })
  const resId = objectId(customerId)

  let existing
  try {
    const { data } = await client.loyaltyobject.get({ resourceId: resId })
    existing = data
  } catch (err) {
    if (err.code === 404) throw new Error(`Wallet object not found for customer ${customerId}`)
    throw err
  }

  existing.loyaltyPoints = {
    ...existing.loyaltyPoints,
    balance: { int: currentStamps }
  }

  const { data } = await client.loyaltyobject.update({
    resourceId: resId,
    requestBody: existing
  })
  return data
}

// ─── updateWithMessage ───────────────────────────────────────
// Patches a loyalty object with a message — triggers lock screen notification
async function updateWithMessage(customerId, messageHeader, messageBody) {
  const auth = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })
  const resId = objectId(customerId)

  let existing
  try {
    const { data } = await client.loyaltyobject.get({ resourceId: resId })
    existing = data
  } catch (err) {
    if (err.code === 404) return { skipped: true, reason: 'no_wallet_pass' }
    throw err
  }

  existing.messages = [{
    header: messageHeader,
    body: messageBody,
    id: `msg_${Date.now()}`,
    messageType: 'TEXT'
  }]

  await client.loyaltyobject.update({ resourceId: resId, requestBody: existing })
  return { updated: true }
}

// ─── Coupon pass helpers ──────────────────────────────────────
function couponClassId(couponId) {
  return `${ISSUER_ID}.coupon_${couponId.replace(/-/g, '_')}`
}

function couponObjectId(passId) {
  return `${ISSUER_ID}.couponpass_${passId.replace(/-/g, '_')}`
}

function discountLabel(coupon) {
  if (coupon.coupon_type === 'percent')   return `${coupon.discount_value}% off`
  if (coupon.coupon_type === 'fixed')     return `$${coupon.discount_value} off`
  if (coupon.coupon_type === 'free_item') return `Free ${coupon.free_item_name}`
  if (coupon.coupon_type === 'bogo')      return 'Buy One Get One Free'
  return coupon.title
}

// Create / upsert a GenericClass for a coupon template
async function createCouponClass(coupon, business) {
  const auth   = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })
  const body = {
    id:           couponClassId(coupon.id),
    issuerName:   business.name || 'Nook',
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: coupon.color || '#1D9E75',
    multipleDevicesAndHoldersAllowedStatus: 'MULTIPLE_HOLDERS',
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [{
          twoItems: {
            startItem: { firstValue: { fields: [{ fieldPath: 'object.textModulesData["discount"]' }] } },
            endItem:   { firstValue: { fields: [{ fieldPath: 'object.textModulesData["expires"]' }] } }
          }
        }]
      }
    }
  }
  try {
    const { data } = await client.genericclass.get({ resourceId: body.id })
    const { data: updated } = await client.genericclass.update({ resourceId: body.id, requestBody: { ...data, ...body } })
    return updated
  } catch (err) {
    if (err.code !== 404) throw err
    const { data } = await client.genericclass.insert({ requestBody: body })
    return data
  }
}

// Create / upsert a GenericObject for a single issued coupon pass
async function createCouponObject(couponPass, coupon, customer, business) {
  const auth   = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })

  // Ensure class exists first
  await createCouponClass(coupon, business).catch(e => console.error('[Wallet] coupon class error:', e.message))

  const expiry = new Date(couponPass.expires_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  const body = {
    id:      couponObjectId(couponPass.id),
    classId: couponClassId(coupon.id),
    state:   'ACTIVE',
    header: { defaultValue: { language: 'en-US', value: coupon.title } },
    hexBackgroundColor: coupon.color || '#1D9E75',
    textModulesData: [
      { id: 'discount', header: 'Discount',  body: discountLabel(coupon) },
      { id: 'expires',  header: 'Expires',   body: expiry },
      { id: 'holder',   header: 'Customer',  body: customer.name }
    ],
    barcode: {
      type:          'CODE_128',
      value:         couponPass.barcode,
      alternateText: couponPass.barcode
    },
    validTimeInterval: {
      end: { date: couponPass.expires_at }
    }
  }

  try {
    await client.genericobject.get({ resourceId: body.id })
    const { data } = await client.genericobject.update({ resourceId: body.id, requestBody: body })
    return data
  } catch (err) {
    if (err.code !== 404) throw err
    const { data } = await client.genericobject.insert({ requestBody: body })
    return data
  }
}

// Update a coupon pass state: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'INACTIVE'
async function updateCouponPassStatus(passId, state) {
  const auth   = getAuth()
  const client = google.walletobjects({ version: 'v1', auth })
  const resId  = couponObjectId(passId)
  let existing
  try {
    const { data } = await client.genericobject.get({ resourceId: resId })
    existing = data
  } catch (err) {
    if (err.code === 404) return { skipped: true, reason: 'no_wallet_pass' }
    throw err
  }
  existing.state = state
  const { data } = await client.genericobject.update({ resourceId: resId, requestBody: existing })
  return { updated: true }
}

// "Add to Google Wallet" JWT link for a coupon pass
function generateCouponWalletLink(passId) {
  const credentials = loadCredentials()
  const claims = {
    iss:     credentials.client_email,
    aud:     'google',
    typ:     'savetowallet',
    iat:     Math.floor(Date.now() / 1000),
    payload: { genericObjects: [{ id: couponObjectId(passId) }] }
  }
  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}

module.exports = {
  createLoyaltyClass, createLoyaltyObject, generateWalletLink, updateStamps, updateWithMessage,
  createCouponClass, createCouponObject, updateCouponPassStatus, generateCouponWalletLink
}
