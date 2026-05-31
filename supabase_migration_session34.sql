-- ============================================================
-- Session 34 Migration
-- Adds user_id, unique_key, birthday_mmdd to customers table
-- Relaxes name/phone to nullable
-- ============================================================

-- 1. New columns
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS unique_key TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday_mmdd VARCHAR(5);  -- 'MM-DD' format

-- 2. Unique index on unique_key (sparse — only when NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS customers_unique_key_idx
  ON customers (unique_key)
  WHERE unique_key IS NOT NULL;

-- 3. Make name and phone nullable (old registrations keep their values)
ALTER TABLE customers ALTER COLUMN name  DROP NOT NULL;
ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;

-- 4. Back-fill user_id for existing customers that have a name
UPDATE customers SET user_id = name WHERE user_id IS NULL AND name IS NOT NULL;
