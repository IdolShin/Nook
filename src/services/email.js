let _resend = null

function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

function discountLabel(coupon) {
  if (coupon.coupon_type === 'percent')   return `${coupon.discount_value}% off`
  if (coupon.coupon_type === 'fixed')     return `$${coupon.discount_value} off`
  if (coupon.coupon_type === 'free_item') return `Free ${coupon.free_item_name}`
  if (coupon.coupon_type === 'bogo')      return 'Buy One Get One'
  return coupon.title
}

async function sendCouponEmail(customer, coupon, couponPass) {
  const client = getResend()
  if (!client)           return { skipped: true, reason: 'no RESEND_API_KEY' }
  if (!customer.email)   return { skipped: true, reason: 'no customer email' }

  const expiry = new Date(couponPass.expires_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
  const discount = discountLabel(coupon)
  const walletLink = couponPass.wallet_link || ''

  try {
    await client.emails.send({
      from:    'Nook <noreply@nook.app>',
      to:      customer.email,
      subject: `Your coupon: ${coupon.title}`,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#F5F6FA;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">
  <div style="background:linear-gradient(135deg,#0F4D38,#1D9E75);border-radius:16px;padding:28px;color:white;margin-bottom:16px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">Nook Loyalty</div>
    <div style="font-size:36px;font-weight:700;letter-spacing:-0.02em;margin-top:10px;">${discount}</div>
    <div style="font-size:16px;font-weight:600;margin-top:6px;">${coupon.title}</div>
    ${coupon.description ? `<div style="font-size:13px;opacity:.75;margin-top:4px;line-height:1.4;">${coupon.description}</div>` : ''}
  </div>

  <div style="background:white;border-radius:13px;border:1px solid #EBEBEB;padding:20px;margin-bottom:12px;">
    <div style="font-size:11px;color:#8A8D94;text-transform:uppercase;letter-spacing:.04em;margin-bottom:14px;">Coupon details</div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F0F0F2;">
      <span style="font-size:13px;color:#5C5F66;">Code</span>
      <span style="font-size:14px;font-weight:700;font-family:monospace;letter-spacing:.12em;">${couponPass.barcode}</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F0F0F2;">
      <span style="font-size:13px;color:#5C5F66;">Valid for</span>
      <span style="font-size:13px;font-weight:500;">${coupon.valid_days || 30} days</span>
    </div>
    <div style="display:flex;justify-content:space-between;padding:10px 0;">
      <span style="font-size:13px;color:#5C5F66;">Expires</span>
      <span style="font-size:13px;font-weight:500;">${expiry}</span>
    </div>
    ${coupon.terms ? `<div style="font-size:11px;color:#8A8D94;margin-top:14px;padding-top:12px;border-top:1px solid #F0F0F2;">${coupon.terms}</div>` : ''}
  </div>

  ${walletLink ? `
  <a href="${walletLink}" style="display:block;background:#1D9E75;color:white;text-align:center;padding:14px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;margin-bottom:12px;">
    Add to Google Wallet
  </a>` : ''}

  <div style="font-size:11px;color:#8A8D94;text-align:center;margin-top:16px;">
    Powered by <strong>Nook</strong> Loyalty Platform
  </div>
</div>
</body></html>`
    })
    return { sent: true }
  } catch (err) {
    console.error('[Email] sendCouponEmail failed:', err.message)
    return { sent: false, error: err.message }
  }
}

module.exports = { sendCouponEmail }
