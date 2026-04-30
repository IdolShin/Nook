-- ============================================================
--  NOOK LOYALTY PLATFORM  ·  Database Schema (Supabase/PostgreSQL)
--  Run this in: Supabase → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── 1. BUSINESSES (가게) ────────────────────────────────────
create table businesses (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  owner_email   text unique not null,
  password_hash text not null,
  phone         text,
  address       text,
  city          text default 'Fort Lee',
  state         text default 'NJ',
  logo_url      text,
  plan          text default 'starter',   -- starter | pro | agency
  created_at    timestamptz default now()
);

-- ─── 2. LOYALTY CARDS (카드 종류) ───────────────────────────
create table loyalty_cards (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid references businesses(id) on delete cascade,
  name            text not null,                  -- e.g. "Nook Café Stamp Card"
  card_type       text not null,                  -- stamp | cashback | coupon | membership
  color           text default '#1D9E75',         -- hex
  goal_stamps     int default 10,                 -- stamps needed for reward
  reward_desc     text,                           -- "1 free drink"
  is_active       boolean default true,
  pass_type_id    text,                           -- Apple: pass.com.nook.xxx
  google_class_id text,                           -- Google Wallet class ID
  created_at      timestamptz default now()
);

-- ─── 3. CUSTOMERS (고객) ─────────────────────────────────────
create table customers (
  id            uuid primary key default uuid_generate_v4(),
  business_id   uuid references businesses(id) on delete cascade,
  card_id       uuid references loyalty_cards(id) on delete cascade,
  name          text not null,
  phone         text not null,
  wallet_type   text,                             -- apple | google
  device_token  text,                             -- push notification token
  qr_code       text unique not null,             -- unique scan code (UUID)
  barcode       text unique not null,             -- 8-digit numeric barcode
  consent_push  boolean default false,
  consent_points boolean default false,
  created_at    timestamptz default now()
);

-- ─── 4. STAMPS (적립 기록) ───────────────────────────────────
create table stamps (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  card_id     uuid references loyalty_cards(id),
  scan_type   text,                               -- qr | barcode | manual
  scanned_by  uuid references businesses(id),     -- which staff/location
  created_at  timestamptz default now()
);

-- ─── 5. REDEMPTIONS (리워드 사용) ────────────────────────────
create table redemptions (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  card_id     uuid references loyalty_cards(id),
  redeemed_at timestamptz default now()
);

-- ─── 6. PUSH LOGS (알림 발송 기록) ──────────────────────────
create table push_logs (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id),
  customer_id uuid references customers(id),
  message     text,
  status      text default 'sent',               -- sent | failed
  sent_at     timestamptz default now()
);

-- ─── VIEWS ────────────────────────────────────────────────────
-- Customer stamp count (현재 적립 스탬프 수)
create or replace view customer_stamp_counts as
select
  c.id as customer_id,
  c.name,
  c.phone,
  c.qr_code,
  c.barcode,
  c.wallet_type,
  c.card_id,
  lc.goal_stamps,
  lc.reward_desc,
  count(s.id) as total_stamps,
  count(s.id) % lc.goal_stamps as current_stamps,
  floor(count(s.id)::decimal / lc.goal_stamps) as rewards_earned
from customers c
join loyalty_cards lc on c.card_id = lc.id
left join stamps s on s.customer_id = c.id
group by c.id, c.name, c.phone, c.qr_code, c.barcode,
         c.wallet_type, c.card_id, lc.goal_stamps, lc.reward_desc;

-- ─── RLS (Row Level Security) ─────────────────────────────────
alter table businesses   enable row level security;
alter table loyalty_cards enable row level security;
alter table customers    enable row level security;
alter table stamps       enable row level security;
alter table redemptions  enable row level security;

-- Service role bypasses RLS (backend uses service role key)
-- Frontend never directly accesses DB — always goes through API
