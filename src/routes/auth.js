const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const supabase = require('../db/supabase')

// ─── POST /api/auth/register ─────────────────────────────────
// 새 비즈니스 계정 생성
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' })
    }

    // Check duplicate
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
      .select('id, name, owner_email, plan')
      .single()

    if (error) throw error

    const token = jwt.sign(
      { id: data.id, email: data.owner_email, name: data.name, plan: data.plan },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.status(201).json({ token, business: data })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// ─── POST /api/auth/login ─────────────────────────────────────
// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' })
    }

    const { data: biz, error } = await supabase
      .from('businesses')
      .select('id, name, owner_email, password_hash, plan')
      .eq('owner_email', email)
      .single()

    if (error || !biz) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, biz.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: biz.id, email: biz.owner_email, name: biz.name, plan: biz.plan },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    const { password_hash, ...safe } = biz
    res.json({ token, business: safe })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ─── POST /api/auth/scanner-token ────────────────────────────
// 직원용 스캐너 전용 토큰 발급 (30일 유효)
router.post('/scanner-token', require('../middleware/auth').authMiddleware, async (req, res) => {
  const token = jwt.sign(
    { id: req.business.id, name: req.business.name, role: 'scanner' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  )
  res.json({ scanner_token: token })
})

module.exports = router
