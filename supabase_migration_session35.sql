-- Session 35: reward_tiers for membership cards + reward_label for redemptions

-- 1. Membership card reward options (JSONB array)
-- Format: [{"label": "Free Coffee", "points": 500}, {"label": "Free Service", "points": 1000}]
ALTER TABLE loyalty_cards ADD COLUMN IF NOT EXISTS reward_tiers JSONB DEFAULT '[]'::jsonb;

-- 2. Track which reward was given when redeeming points
ALTER TABLE redemptions ADD COLUMN IF NOT EXISTS reward_label TEXT;
