-- Session 29 Migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add birthday column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday DATE;

-- 2. (Optional) Index for birthday-based coupon scheduler queries
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birthday);

-- That's it! Birthday is now stored when customers register via /join/[slug] pages.
