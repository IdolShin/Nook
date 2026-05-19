const express  = require('express')
const router   = express.Router()
const supabase = require('../db/supabase')
const { authMiddleware } = require('../middleware/auth')

// GET /api/reviews/config
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('google_review_url, review_reward_config')
      .eq('id', req.business.id)
      .single()
    if (error) throw error
    res.json({
      google_review_url:    data.google_review_url || '',
      review_reward_config: data.review_reward_config || {
        enabled: false, reward_type: 'stamp', stamp_count: 1, coupon_id: null, days_to_wait: 3
      }
    })
  } catch (err) {
    console.error('Get review config error:', err)
    res.status(500).json({ error: 'Failed to fetch review config' })
  }
})

// PATCH /api/reviews/config
router.patch('/config', authMiddleware, async (req, res) => {
  try {
    const { google_review_url, review_reward_config } = req.body
    const updates = {}
    if (typeof google_review_url !== 'undefined') updates.google_review_url = google_review_url
    if (review_reward_config) updates.review_reward_config = review_reward_config
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', req.business.id)
      .select('google_review_url, review_reward_config')
      .single()
    if (error) throw error
    res.json({ google_review_url: data.google_review_url, review_reward_config: data.review_reward_config })
  } catch (err) {
    console.error('Update review config error:', err)
    res.status(500).json({ error: 'Failed to update review config' })
  }
})

// GET /api/reviews/public/:businessId  (public, no auth)
router.get('/public/:businessId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('google_review_url, review_reward_config')
      .eq('id', req.params.businessId)
      .single()
    if (error || !data) return res.status(404).json({ error: 'Not found' })
    const cfg = data.review_reward_config || {}
    res.json({
      google_review_url: data.google_review_url || '',
      reward_enabled:    cfg.enabled || false,
      days_to_wait:      cfg.days_to_wait || 3,
      reward_type:       cfg.reward_type || 'stamp',
      stamp_count:       cfg.reward_type === 'stamp' ? (cfg.stamp_count || 1) : null
    })
  } catch (err) {
    console.error('Get public review config error:', err)
    res.status(500).json({ error: 'Failed to fetch config' })
  }
})

// POST /api/reviews/initiate  (public, no auth)
router.post('/initiate', async (req, res) => {
  try {
    const { customer_id, business_id } = req.body
    if (!customer_id || !business_id)
      return res.status(400).json({ error: 'customer_id and business_id required' })

    const { data: biz, error: bizErr } = await supabase
      .from('businesses').select('review_reward_config, name').eq('id', business_id).single()
    if (bizErr || !biz) return res.status(404).json({ error: 'Business not found' })

    const cfg = biz.review_reward_config || {}
    if (!cfg.enabled) return res.status(400).json({ error: 'Review rewards not enabled' })

    const { data: customer, error: custErr } = await supabase
      .from('customers').select('id, name').eq('id', customer_id).eq('business_id', business_id).single()
    if (custErr || !customer) return res.status(404).json({ error: 'Customer not found' })

    const { data: existing } = await supabase
      .from('review_rewards').select('id, status')
      .eq('customer_id', customer_id).eq('business_id', business_id)
      .in('status', ['pending', 'issued']).maybeSingle()
    if (existing) return res.status(400).json({ error: 'already_claimed', message: existing.status === 'pending' ? 'Review reward already pending' : 'Review reward already issued' })

    const daysToWait = cfg.days_to_wait || 3
    const rewardAt   = new Date(Date.now() + daysToWait * 86400000).toISOString()

    const { data: reward, error: insertErr } = await supabase
      .from('review_rewards')
      .insert({
        customer_id, business_id,
        pending_since: new Date().toISOString(),
        reward_at:     rewardAt,
        reward_type:   cfg.reward_type || 'stamp',
        reward_value:  cfg.reward_type === 'stamp' ? { stamp_count: cfg.stamp_count || 1 } : { coupon_id: cfg.coupon_id },
        status: 'pending'
      }).select().single()
    if (insertErr) throw insertErr

    res.json({ success: true, reward_at: rewardAt, days_to_wait: daysToWait,
      message: `Review reward pending! Keep your review for ${daysToWait} days to receive your reward.` })
  } catch (err) {
    console.error('Initiate review error:', err)
    res.status(500).json({ error: 'Failed to initiate review reward' })
  }
})

module.exports = router
