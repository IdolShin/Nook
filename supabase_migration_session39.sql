-- Session 39: NFC tap-to-collect (Phase 1)
-- Applied to Supabase on 2026-07-02 via MCP (already executed).
CREATE TABLE IF NOT EXISTS nfc_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT,
  uid TEXT UNIQUE NOT NULL,
  meta_key TEXT NOT NULL DEFAULT '00000000000000000000000000000000',
  file_key TEXT NOT NULL DEFAULT '00000000000000000000000000000000',
  last_ctr INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS tap_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES nfc_tags(id) ON DELETE SET NULL,
  business_id UUID,
  customer_id UUID,
  ctr INTEGER,
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nfc_tags_business_idx ON nfc_tags(business_id);
CREATE INDEX IF NOT EXISTS tap_events_tag_idx ON tap_events(tag_id, created_at DESC);
