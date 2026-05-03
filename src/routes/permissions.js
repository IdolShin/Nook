const express = require('express')
const bcrypt = require('bcryptjs')
const router = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

const DEFAULT_BIZ_PERMISSIONS = {
  dashboard: 'admin', cards: 'admin', customers: 'admin',
  push: 'admin', analytics: 'admin', coupons: 'admin',
  settings: 'admin', scanner: 'admin',
}

const DEFAULT_STAFF_PERMISSIONS = {
  dashboard: 'view', cards: 'none', customers: 'view',
  push: 'none', analytics: 'view', coupons: 'none',
  settings: 'none', scanner: 'view',
}

// ─── Superadmin guard ────────────────────────────────────────
function superadminOnly(req, res, next) {
  if (!req.business?.is_superadmin) {
    return res.status(403).json({ error: 'Superadmin only' })
  }
  next()
}

// ─── GET /api/permissions/businesses (superadmin) ───────────
// List all businesses with their page_permissions
router.get('/businesses', authMiddleware, superadminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, owner_email, plan, is_superadmin, page_permissions, created_at')
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json({ businesses: data })
  } catch (err) {
    console.error('List businesses error:', err)
    res.status(500).json({ error: 'Failed to list businesses' })
  }
})

// ─── PATCH /api/permissions/businesses/:id (superadmin) ─────
// Update a business's page_permissions
router.patch('/businesses/:id', authMiddleware, superadminOnly, async (req, res) => {
  try {
    const { page_permissions } = req.body
    if (!page_permissions) return res.status(400).json({ error: 'page_permissions required' })

    const { data, error } = await supabase
      .from('businesses')
      .update({ page_permissions })
      .eq('id', req.params.id)
      .select('id, name, owner_email, plan, page_permissions')
      .single()

    if (error) throw error
    res.json({ business: data })
  } catch (err) {
    console.error('Update biz permissions error:', err)
    res.status(500).json({ error: 'Failed to update permissions' })
  }
})

// ─── GET /api/permissions/users ─────────────────────────────
// List staff users for current business
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('business_users')
      .select('id, email, name, role, page_permissions, is_active, created_at')
      .eq('business_id', req.business.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json({ users: data || [] })
  } catch (err) {
    console.error('List users error:', err)
    res.status(500).json({ error: 'Failed to list users' })
  }
})

// ─── POST /api/permissions/users ────────────────────────────
// Invite / create a staff user for current business
router.post('/users', authMiddleware, async (req, res) => {
  try {
    const { email, name, role = 'viewer', password, page_permissions } = req.body
    if (!email || !name) return res.status(400).json({ error: 'email and name required' })

    // Check duplicate
    const { data: existing } = await supabase
      .from('business_users')
      .select('id')
      .eq('business_id', req.business.id)
      .eq('email', email)
      .single()

    if (existing) return res.status(409).json({ error: 'User already exists for this business' })

    const password_hash = password ? await bcrypt.hash(password, 12) : ''

    const { data, error } = await supabase
      .from('business_users')
      .insert({
        business_id: req.business.id,
        email,
        name,
        role,
        password_hash,
        page_permissions: page_permissions || DEFAULT_STAFF_PERMISSIONS,
        is_active: true,
      })
      .select('id, email, name, role, page_permissions, is_active, created_at')
      .single()

    if (error) throw error
    res.status(201).json({ user: data })
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

// ─── PATCH /api/permissions/users/:id ───────────────────────
// Update a staff user's role / permissions
router.patch('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { name, role, page_permissions, is_active, password } = req.body

    // Verify this user belongs to current business
    const { data: existing } = await supabase
      .from('business_users')
      .select('id, business_id')
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
      .single()

    if (!existing) return res.status(404).json({ error: 'User not found' })

    const updates = {}
    if (name !== undefined)             updates.name = name
    if (role !== undefined)             updates.role = role
    if (page_permissions !== undefined) updates.page_permissions = page_permissions
    if (is_active !== undefined)        updates.is_active = is_active
    if (password)                       updates.password_hash = await bcrypt.hash(password, 12)

    const { data, error } = await supabase
      .from('business_users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, email, name, role, page_permissions, is_active, created_at')
      .single()

    if (error) throw error
    res.json({ user: data })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// ─── DELETE /api/permissions/users/:id ──────────────────────
// Remove staff user (deactivate)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('business_users')
      .select('id')
      .eq('id', req.params.id)
      .eq('business_id', req.business.id)
      .single()

    if (!existing) return res.status(404).json({ error: 'User not found' })

    await supabase.from('business_users').delete().eq('id', req.params.id)
    res.json({ success: true })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// ─── POST /api/auth/staff-login ──────────────────────────────
// Staff member login (separate from business owner)
router.post('/staff-login', async (req, res) => {
  try {
    const { email, password, business_id } = req.body
    if (!email || !password || !business_id) {
      return res.status(400).json({ error: 'email, password, and business_id required' })
    }

    const { data: user, error } = await supabase
      .from('business_users')
      .select('id, email, name, role, page_permissions, password_hash, business_id, is_active')
      .eq('business_id', business_id)
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    // Get business info
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, plan')
      .eq('id', business_id)
      .single()

    const jwt = require('jsonwebtoken')
    const token = jwt.sign(
      {
        id: biz.id, name: biz.name, plan: biz.plan,
        email: user.email,
        is_superadmin: false,
        is_staff: true,
        staff_id: user.id,
        staff_role: user.role,
        page_permissions: user.page_permissions,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({ token, business: biz, staff: { id: user.id, name: user.name, role: user.role } })
  } catch (err) {
    console.error('Staff login error:', err)
    res.status(500).json({ error: 'Staff login failed' })
  }
})

module.exports = router
