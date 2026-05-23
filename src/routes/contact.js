const express = require('express')
const router  = express.Router()

const NOTIFY_EMAILS = [
  'info.tgtm@gmail.com',
  'woosang930414@gmail.com',
]
const NOTIFY_PHONE = '+12012336184'

// ── Resend (lazy-init) ──────────────────────────────────────────────────────
let _resend = null
function getResend() {
  if (!_resend && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend')
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

// ── Twilio (lazy-init) ──────────────────────────────────────────────────────
let _twilio = null
function getTwilio() {
  if (!_twilio && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    _twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  }
  return _twilio
}

// ── POST /api/contact ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, email, phone, businessName, businessType, inquiryType, message } = req.body

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, message are required' })
  }

  const inquiryLabel = {
    pricing:     'Pricing / Plans',
    demo:        'Request a Demo',
    technical:   'Technical Support',
    partnership: 'Partnership',
    other:       'Other',
  }[inquiryType] || inquiryType || 'General Inquiry'

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const emailHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Inter,system-ui,sans-serif;background:#F5F6FA;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">

  <div style="background:linear-gradient(135deg,#0F4D38,#1D9E75);border-radius:16px;padding:28px;color:white;margin-bottom:16px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.7;">Nook Wallet · New Inquiry</div>
    <div style="font-size:24px;font-weight:700;letter-spacing:-0.02em;margin-top:10px;">📬 ${inquiryLabel}</div>
    <div style="font-size:13px;opacity:.75;margin-top:4px;">${timestamp} ET</div>
  </div>

  <div style="background:white;border-radius:13px;border:1px solid #EBEBEB;padding:20px;margin-bottom:12px;">
    <div style="font-size:11px;color:#8A8D94;text-transform:uppercase;letter-spacing:.04em;margin-bottom:14px;">Contact Details</div>
    ${[
      ['Name',          name],
      ['Email',         email],
      ['Phone',         phone         || '—'],
      ['Business Name', businessName  || '—'],
      ['Business Type', businessType  || '—'],
      ['Inquiry Type',  inquiryLabel],
    ].map(([label, val]) => `
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F0F0F2;">
      <span style="font-size:13px;color:#5C5F66;">${label}</span>
      <span style="font-size:13px;font-weight:500;text-align:right;max-width:300px;">${val}</span>
    </div>`).join('')}
  </div>

  <div style="background:white;border-radius:13px;border:1px solid #EBEBEB;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#8A8D94;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px;">Message</div>
    <div style="font-size:14px;line-height:1.6;color:#1A1A1F;white-space:pre-wrap;">${message}</div>
  </div>

  <a href="mailto:${email}" style="display:block;background:#1D9E75;color:white;text-align:center;padding:14px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">
    Reply to ${name}
  </a>

  <div style="font-size:11px;color:#8A8D94;text-align:center;margin-top:16px;">
    Nook Wallet · nook-wallet.com
  </div>
</div>
</body></html>`

  const smsText = `[Nook] New inquiry from ${name} (${businessName || 'no biz'}) — ${inquiryLabel}. Email: ${email}${phone ? `, Ph: ${phone}` : ''}. Msg: ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`

  let emailResult = { skipped: true, reason: 'no RESEND_API_KEY' }
  let smsResult   = { skipped: true, reason: 'no Twilio credentials' }

  // ── Send email ──────────────────────────────────────────────────────────
  const resend = getResend()
  if (resend) {
    try {
      await resend.emails.send({
        from:    'Nook Contact <noreply@nook-wallet.com>',
        to:      NOTIFY_EMAILS,
        replyTo: email,
        subject: `[Nook Inquiry] ${inquiryLabel} — ${name}`,
        html:    emailHtml,
      })
      emailResult = { sent: true }
    } catch (err) {
      console.error('[Contact] email error:', err.message)
      emailResult = { sent: false, error: err.message }
    }
  }

  // ── Send SMS via Twilio ─────────────────────────────────────────────────
  const twilio = getTwilio()
  if (twilio && process.env.TWILIO_FROM_NUMBER) {
    try {
      await twilio.messages.create({
        body: smsText,
        from: process.env.TWILIO_FROM_NUMBER,
        to:   NOTIFY_PHONE,
      })
      smsResult = { sent: true }
    } catch (err) {
      console.error('[Contact] SMS error:', err.message)
      smsResult = { sent: false, error: err.message }
    }
  }

  res.json({ ok: true, email: emailResult, sms: smsResult })
})

module.exports = router
