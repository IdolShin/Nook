const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../db/supabase')

const SUPERADMIN_EMAIL = 'woosang930414@gmail.com'

// ─── Helper: build JWT payload with permissions ──────────────
function buildToken(biz) {
  return jwt.sign(
    {
      id: biz.id,
      email: biz.owner_email,
      name: biz.name,
      plan: biz.plan,
      is_superadmin: biz.is_superadmin || biz.owner_email === SUPERADMIN_EMAIL || false,
      page_permissions: biz.page_permissions || null,  // null = full access
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

// ─── POST /api/auth/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' })
    }

    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_email', email)
      .single()

    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const password_hash = await bcrypt.hash(password, 12)

    const { data, error } = await supabase
      .from('businesses')
      .insert({ name, owner_email: email, password_hash, phone, address })
      .select('id, name, owner_email, plan, is_superadmin, page_permissions')
      .single()

    if (error) throw error

    const token = buildToken(data)
    const { password_hash: _, ...safe } = data
    res.status(201).json({ token, business: safe })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// ─── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' })
    }

    const { data: biz, error } = await supabase
      .from('businesses')
      .select('id, name, owner_email, password_hash, plan, is_superadmin, page_permissions')
      .eq('owner_email', email)
      .single()

    if (error || !biz) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, biz.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = buildToken(biz)
    const { password_hash, ...safe } = biz
    res.json({ token, business: safe })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ─── POST /api/auth/google ─────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { id_token } = req.body
    if (!id_token) return res.status(400).json({ error: 'id_token required' })

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: 'Google OAuth not configured on server' })
    }

    const { OAuth2Client } = require('google-auth-library')
    const gclient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

    let payload
    try {
      const ticket = await gclient.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch {
      return res.status(401).json({ error: 'Invalid Google token' })
    }

    const { email, name, picture, sub: google_id } = payload

    const { data: existing } = await supabase
      .from('businesses')
      .select('id, name, owner_email, plan, is_superadmin, page_permissions')
      .eq('owner_email', email)
      .single()

    let biz = existing

    if (!biz) {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          name: name || email.split('@')[0],
          owner_email: email,
          password_hash: '',
          google_id,
          logo_url: picture,
          auth_provider: 'google',
          is_superadmin: email === SUPERADMIN_EMAIL,
        })
        .select('id, name, owner_email, plan, is_superadmin, page_permissions')
        .single()

      if (error) throw error
      biz = data
    } else {
      // Keep Google metadata current (non-blocking)
      supabase
        .from('businesses')
        .update({ google_id, logo_url: picture, auth_provider: 'google' })
        .eq('id', biz.id)
        .then(() => {})
    }

    const token = buildToken(biz)
    res.json({ token, business: biz })
  } catch (err) {
    console.error('Google auth error:', err)
    res.status(500).json({ error: 'Google authentication failed' })
  }
})

// ─── PATCH /api/auth/me ───────────────────────────────────────
router.patch('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { name, owner_email, phone, address, timezone, region } = req.body
    const updates = {}
    if (name)        updates.name = name
    if (owner_email) updates.owner_email = owner_email
    if (phone)       updates.phone = phone
    if (address)     updates.address = address
    if (timezone)    updates.timezone = timezone
    if (region)      updates.region = region

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', req.business.id)
      .select('id, name, owner_email, plan')
      .single()

    if (error) throw error
    res.json({ business: data })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ─── POST /api/auth/scanner-token ────────────────────────────
router.post('/scanner-token', require('../middleware/auth').authMiddleware, async (req, res) => {
  const token = jwt.sign(
    { id: req.business.id, name: req.business.name, role: 'scanner' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )
  res.json({ scanner_token: token })
})

module.exports = router
