const express = require('express')
const router = express.Router()
const supabase = require('../db/supabase')

// Convert business name to URL slug
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-가-힣]/g, '')  // keep Korean chars + word chars + hyphens
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ─── GET /api/businesses/public/:slug ─────────────────────────
// Public endpoint — customer-facing registration page
// Returns business name, logo, active cards (no sensitive info)
router.get('/public/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    // Fetch all businesses and find by slug match
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, logo_url, plan')
      .order('created_at', { ascending: true })

    if (error) throw error

    const match = (businesses || []).find(b => nameToSlug(b.name) === slug)

    if (!match) {
      return res.status(404).json({ error: 'Business not found' })
    }

    // Fetch active loyalty cards for this business
    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('id, name, card_type, goal_stamps, reward_desc, color')
      .eq('business_id', match.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    res.json({
      business: {
        id: match.id,
        name: match.name,
        logo_url: match.logo_url,
        slug,
      },
      cards: cards || [],
    })
  } catch (err) {
    console.error('Public business lookup error:', err)
    res.status(500).json({ error: 'Failed to fetch business' })
  }
})

// ─── GET /api/businesses/public ───────────────────────────────
// List all businesses with their slugs (for generating links)
router.get('/public', async (req, res) => {
  try {
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, logo_url')
      .order('created_at', { ascending: true })

    if (error) throw error

    const result = (businesses || []).map(b => ({
      id: b.id,
      name: b.name,
      logo_url: b.logo_url,
      slug: nameToSlug(b.name),
      register_url: `/join/${nameToSlug(b.name)}`,
    }))

    res.json({ businesses: result })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch businesses' })
  }
})

module.exports = router
