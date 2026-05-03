# Nook — Digital Loyalty Card Platform

## 1. What Is Nook

Nook is a B2B SaaS loyalty card platform — like Boomerangme or Stamp Me. Businesses pay Woosang (the operator/admin) to use the platform. Their customers (card holders) use the loyalty cards.

**Three-tier hierarchy:**
```
Woosang (operator/admin)
  └── Businesses (paying clients): Nook Cafe, Kook 미용실, Fort Lee Gym, Korean BBQ...
        └── Customers (card holders): end-users who collect stamps and redeem rewards
```

Businesses never touch the backend code. They get a dashboard to manage their cards, customers, and push notifications. Customers interact via a registration landing page and their Google/Apple Wallet.

---

## 2. Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js + Express |
| Database | Supabase (Postgres) — project `mbidmkovjvrownymlpgg` |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Wallet | Google Wallet API (service account OAuth2) |
| Push | Web Push VAPID (`web-push`) |
| QR generation | `qrcode` npm package |
| Scheduling | `node-schedule` |
| Deployment | Railway |
| Source control | GitHub |

---

## 3. Repositories & Deployment

| Resource | URL |
|----------|-----|
| Production API | https://nook-production-270f.up.railway.app |
| Dashboard | https://nook-production-270f.up.railway.app/dashboard/ |
| Health check | https://nook-production-270f.up.railway.app/health |
| GitHub | https://github.com/IdolShin/Nook |
| Supabase project | mbidmkovjvrownymlpgg |

---

## 4. File Structure

```
Nook/
├── CLAUDE.md
├── README.md
├── package.json
├── .env                            # local dev only — gitignored
├── .gitignore
├── certs/
│   └── google-service-account.json # local dev only — gitignored
├── test_wallet_qr.png              # test artifact
└── src/
    ├── index.js                    # Express app, middleware, route wiring
    ├── routes/
    │   ├── auth.js                 # register / login / scanner-token
    │   ├── cards.js                # loyalty card CRUD
    │   ├── customers.js            # customer registration + lookup
    │   ├── scan.js                 # stamp + redeem (calls wallet + push)
    │   ├── wallet.js               # Google Wallet create + stamp update
    │   └── googleWallet.js         # (legacy route file, check if still wired)
    ├── services/
    │   ├── googleWallet.js         # Google Wallet API: class, object, JWT link, messages
    │   └── push.js                 # Web push sendToCustomer + broadcastToBusiness
    │                               # also mounts POST /api/push/broadcast router
    ├── middleware/
    │   └── auth.js                 # JWT authMiddleware → req.business
    ├── db/
    │   ├── supabase.js             # Supabase client (service role key)
    │   └── schema.sql              # full DB schema — run once in Supabase SQL editor
    └── public/
        └── index.html              # self-contained dashboard SPA (vanilla JS, no build step)
```

---

## 5. Environment Variables

### Local (`.env`)
```
SUPABASE_URL=https://mbidmkovjvrownymlpgg.supabase.co
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=mailto:woosang930414@gmail.com
GOOGLE_APPLICATION_CREDENTIALS=./certs/google-service-account.json
GOOGLE_WALLET_ISSUER_ID=3388000000023113032
```

### Railway (production)
Same keys, plus:
```
GOOGLE_SERVICE_ACCOUNT_BASE64=<base64 of google-service-account.json>
```
`loadCredentials()` in `googleWallet.js` checks `GOOGLE_SERVICE_ACCOUNT_BASE64` first (Railway), then falls back to the file path (local).

---

## 6. Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `businesses` | One row per paying client — email, password_hash, plan, logo_url |
| `loyalty_cards` | Cards per business — type (stamp/cashback/coupon/membership), goal_stamps, reward_desc, color, google_class_id |
| `customers` | Card holders — linked to business + card, phone, qr_code, barcode, wallet_type, device_token, consents |
| `stamps` | One row per stamp event — customer_id, card_id, scan_type, scanned_by |
| `redemptions` | Reward redemption events |
| `push_logs` | Push notification send history |
| `customer_stamp_counts` | DB view used by `GET /api/customers` |

---

## 7. API Reference

All `🔒` routes require `Authorization: Bearer <jwt>`.

### Auth
```
POST /api/auth/register          { name, email, password }  →  { token, business }
POST /api/auth/login             { email, password }         →  { token, business }
POST /api/auth/scanner-token     🔒                          →  { scanner_token }  (30-day)
```

### Cards
```
GET  /api/cards                  🔒  →  { cards }
POST /api/cards                  🔒  { name, card_type, goal_stamps, reward_desc, color }
PATCH /api/cards/:id             🔒  { name, color, goal_stamps, reward_desc, is_active }
GET  /api/cards/:id/stats        🔒  →  { total_customers, total_stamps, total_redeems }
```

### Customers
```
POST /api/customers/register     { card_id, name, phone, consent_push, consent_points }
GET  /api/customers              🔒  →  { customers }  (via customer_stamp_counts view)
GET  /api/customers/lookup       🔒  ?code=&type=qr|barcode  →  customer + stamp count
```

### Scan
```
POST /api/scan                   🔒  { code, scan_type }   →  stamp + Google Wallet sync + push
POST /api/scan/redeem            🔒  { customer_id }        →  redemption + push
```

### Google Wallet
```
POST /api/wallet/google/create   🔒  { customer_id }  →  { wallet_link, current_stamps }
PATCH /api/wallet/google/stamp   🔒  { customer_id }  →  { updated, current_stamps, goal }
```

### Push
```
POST /api/push/broadcast         🔒  { message, customer_ids? }
  → sends Web Push (if device_token) + updates Google Wallet pass (if wallet_type=google)
  → if no customer_ids: targets ALL customers of the business
  → returns { total_customers, web_push_sent, wallet_updated, failed }
```

---

## 8. Google Wallet — Important Notes

- **Demo mode:** Google Wallet passes only work for test accounts added in the Google Pay & Wallet Console. Add test emails at: console → Issuers → [issuer] → Test accounts.
- **Issuer ID:** `3388000000023113032`
- **Service account:** `nook-wallet@nook-494804.iam.gserviceaccount.com`
- **Class ID pattern:** `{ISSUER_ID}.card_{card_id_with_underscores}`
- **Object ID pattern:** `{ISSUER_ID}.customer_{customer_id_with_underscores}`
- **Fallback logo:** uses `https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png` when business has no `logo_url` — Wikimedia and other CDNs are rejected by Google's image validator.
- **Lock screen notifications:** triggered automatically when a pass object is updated (stamp sync or `updateWithMessage`).
- **NFC considered and rejected** — not feasible with standard wallet passes.

---

## 9. Scanner Approach

Staff scan customer wallet cards using:
1. **QR code** — UUID stored as `qr_code` in customers table
2. **Barcode** — 8-digit numeric code stored as `barcode` in customers table

Scanner calls `GET /api/customers/lookup?code=&type=qr|barcode` to find the customer, then `POST /api/scan` to add a stamp. No NFC.

---

## 10. What's Built & Working

- [x] Business register / login (JWT, bcrypt)
- [x] Loyalty card CRUD (stamp, cashback, coupon, membership types)
- [x] Customer registration — QR + barcode generation, consent capture
- [x] Customer lookup by QR or barcode
- [x] Stamp scan — adds stamp, auto-syncs Google Wallet, sends push
- [x] Reward redemption
- [x] Google Wallet pass creation (loyalty class + object + JWT "Add to Wallet" link)
- [x] Google Wallet stamp count sync on every scan
- [x] Google Wallet pass message update (lock screen notification on broadcast)
- [x] Web push broadcast (all customers or specific customer_ids)
- [x] Dashboard UI at `/dashboard/` — login screen + push notification broadcast panel
- [x] Railway deployment with Supabase connection verified
- [x] `.env` and `certs/` removed from git history; `GOOGLE_SERVICE_ACCOUNT_BASE64` in Railway

---

## 11. What's NOT Done Yet

### Immediate next (dashboard pages)
- [ ] **Card creation UI** — form to create a new loyalty card (API exists: `POST /api/cards`)
- [ ] **Customer CRM UI** — customer list with stamp counts, search, filter by card
- [ ] **Analytics page** — stamp volume, redemption rate, new customers over time
- [ ] **Settings page** — business profile, logo upload, plan info

### Customer-facing
- [ ] **Customer landing page** — QR scan → registration web form → wallet add flow (connected to real backend)
- [ ] **Scanner PWA** — mobile-friendly camera page for staff to scan QR codes

### Growth / monetization
- [ ] **Business signup page** — public-facing UI (API exists: `POST /api/auth/register`)
- [ ] **Stripe integration** — subscription billing by plan (starter / pro / enterprise)
- [ ] **Domain** — custom domain for production

### Platform
- [ ] **Apple Wallet** — requires $99/yr Apple Developer account + PassKit implementation
- [ ] **Full UI redesign** — see design direction below

---

## 12. Design Direction (Decided)

Reference: ByeWind-style clean SaaS dashboard.

- **Base:** light background (`#F7F8FA`)
- **Accent:** Nook green `#1D9E75` (buttons, active states, charts)
- **Font:** Inter
- **Components:** gradient stat cards (green → teal), line/donut/bar charts, sidebar nav
- **Tone:** consistent across all pages — no mixed styles
- **Dashboard URL:** `/dashboard/` (served as static HTML from Express)
- Current `public/index.html` is a working skeleton to be redesigned

---

## 13. Test Account

```
Email:    woosang@nook.com
Password: nook1234
Plan:     starter
Business: Nook Cafe
ID:       06fd310f-7a77-497c-b682-2b668fa17a29
```

Test customer registered to the Nook Cafe stamp card:
```
customer_id: b1f70cfd-ec99-4b47-9ed2-c387b99d4272
card_id:     57ef9f1c-ae5f-4df0-94f6-ad77252bd742
```

---

## 14. Current Status (2026-05)

### Deployed & Working
- **Backend API** — `https://nook-production-270f.up.railway.app` (Railway, auto-deploys on push)
- **Admin dashboard (Next.js)** — `https://nook-admin-production.up.railway.app` (Railway, separate service)
- **Google login** — working (email/password via `/api/auth/login`, JWT stored as `nook_auth` cookie)
- **Google Wallet** — working in **demo mode** only (passes visible to test accounts added in Google Pay & Wallet Console)
- **Coupon system** — DB tables exist (`coupons`, `coupon_passes`), API routes exist, UI not yet built
- **CORS** — backend allows `*.railway.app`, `*.vercel.app`, `*.nookapp.com`
- **Next.js 16** — migrated from deprecated `middleware.ts` to `proxy.ts` (routing/auth guard)

### Known Limitations
- Google Wallet passes only work for whitelisted test emails (not yet production-approved)
- Apple Wallet not implemented (requires Apple Developer account)
- No customer-facing registration page connected to production
- No Stripe billing — all accounts manually created

---

## 15. Todo List — Priority Order

### 🔴 Urgent
- [ ] **Admin dashboard full UI** — card creation, customer CRM, analytics, settings pages
- [ ] **Customer registration landing page** — public page: scan QR → fill form → "Add to Wallet"
- [ ] **Scanner PWA** — staff-facing mobile camera page to scan QR/barcode

### 🟡 Medium
- [ ] **Coupon system UI** — create coupons, view issued passes, redemption tracking in dashboard
- [ ] **Stripe integration** — subscription billing (Basic / Pro / Premium plans)
- [ ] **Business signup page** — public-facing onboarding flow (API exists)
- [ ] **Apple Wallet** — PassKit implementation (requires $99/yr Apple Developer account)
- [ ] **Custom domain** — point `nookapp.com` or similar to Railway services

### 🟢 Later
- [ ] **Analytics page** — stamp volume charts, redemption rates, new customer trends
- [ ] **Settings page** — logo upload, business profile, plan management
- [ ] **Multi-language support** — Korean + English UI
- [ ] **Google Wallet production approval** — submit for review in Google Pay & Wallet Console
- [ ] **SMS notifications** — Twilio or similar for customers without push subscriptions
- [ ] **Referral / share feature** — customers share card link to earn bonus stamps

---

## 16. Wanted Features

### Coupon System (planned flow)
1. Business creates a coupon in the dashboard — sets discount %, expiry days, trigger type
2. **Trigger types:**
   - `manual` — business selects customers and issues manually
   - `winback` — auto-issued to customers with no stamp activity in 30+ days (daily scheduler runs at 9am)
   - `milestone` — auto-issued when customer reaches N total stamps
3. Customer receives a **coupon pass** (barcode) via push notification or wallet update
4. Staff scans coupon barcode at checkout to redeem
5. Redemption recorded in `coupon_passes` (status: `active` → `used`)

### Scanner PWA (planned)
- Mobile web app (PWA) for staff
- Camera opens to scan QR code or barcode
- Calls `/api/customers/lookup` then `/api/scan`
- Shows customer name + current stamp count + reward status
- One-tap stamp or redeem buttons
- Works offline with cached scanner token (30-day JWT)

### Customer Landing Page (planned)
- URL: `https://nookapp.com/join/:card_id` (or `/register/:card_id`)
- Shows business name, card type, reward description
- Registration form: name + phone + consent checkboxes
- On submit: registers customer → shows QR + "Add to Google Wallet" button
- Wallet link generated via `POST /api/wallet/google/create`

---

## 17. Pricing Plans

| Plan | Price | Customers | Cards | Features |
|------|-------|-----------|-------|---------|
| Basic | $59/mo | Up to 500 | 1 card | Stamp card, Google Wallet, push notifications |
| Pro | $79/mo | Up to 2,000 | 3 cards | Everything in Basic + coupon system, analytics |
| Premium | $119/mo | Unlimited | Unlimited | Everything in Pro + Apple Wallet, priority support, custom domain |

---

## 18. Key Credentials

### Supabase
- Project ID: `mbidmkovjvrownymlpgg`
- URL: `https://mbidmkovjvrownymlpgg.supabase.co`
- Dashboard: `https://supabase.com/dashboard/project/mbidmkovjvrownymlpgg`

### Google Wallet
- Issuer ID: `3388000000023113032`
- GCP Project: `nook-494804`
- Service account: `nook-wallet@nook-494804.iam.gserviceaccount.com`
- Console: `https://pay.google.com/business/console`

### Railway
- Backend service: `nook-production` → `https://nook-production-270f.up.railway.app`
- Admin service: `nook-admin` → `https://nook-admin-production.up.railway.app`
- Project: `https://railway.com/project/e2355956-a305-4026-b7d3-9e5615bdbca3`

### GitHub
- Repo (backend): `https://github.com/IdolShin/Nook`
- Repo (admin): same monorepo, `nook-admin/` subdirectory

---

## 19. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Railway                           │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   nook-backend       │  │   nook-admin (Next.js)   │ │
│  │   Node.js/Express    │  │   App Router + proxy.ts  │ │
│  │   :3001              │  │   :3000                  │ │
│  │                      │  │                          │ │
│  │  /api/auth           │  │  /auth  (login page)     │ │
│  │  /api/cards          │  │  /dashboard              │ │
│  │  /api/customers      │◄─┤  /cards                  │ │
│  │  /api/scan           │  │  /customers              │ │
│  │  /api/wallet         │  │  /analytics              │ │
│  │  /api/push           │  │  /settings               │ │
│  │  /api/coupons        │  │  /coupons                │ │
│  │  /dashboard/ (HTML)  │  │  /scanner                │ │
│  └──────────┬───────────┘  └──────────────────────────┘ │
└─────────────┼───────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐     ┌─────────────────────────┐
    │   Supabase       │     │   Google Wallet API      │
    │   (Postgres)     │     │   (service account OAuth)│
    │   mbidmkovjvr... │     │   Issuer: 338800000...   │
    └──────────────────┘     └─────────────────────────┘

Data flow:
  Customer → scans QR → staff scanner → POST /api/scan
           → stamp saved in DB
           → Google Wallet pass updated (stamp count)
           → Web Push sent to customer device

  Business → admin dashboard → POST /api/push/broadcast
           → Web Push to all customers
           → Google Wallet lock-screen message updated
```
