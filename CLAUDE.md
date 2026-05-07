# Nook â Digital Loyalty Card Platform

## Project Overview

Digital loyalty card platform for local businesses (like Boomerangme or Stamp Me).
Owner/Admin: Woosang Shin (woosang930414@gmail.com)

**Three-tier hierarchy:**
```
Woosang (operator/admin)
  âââ Businesses (paying clients): Nook Cafe, Kook ë¯¸ì©ì¤, Fort Lee Gym, Korean BBQ...
        âââ Customers (card holders): end-users who collect stamps and redeem rewards
```

---

## Live URLs

| Service | URL |
|---------|-----|
| Backend API | https://nook-production-270f.up.railway.app |
| Frontend Dashboard | https://nook-admin-production.up.railway.app |
| Homepage | https://nook-admin-production.up.railway.app/ |
| Health check | https://nook-production-270f.up.railway.app/health |

---

## GitHub Repos

- Backend: https://github.com/IdolShin/Nook
- Frontend: https://github.com/IdolShin/nook-admin

---

## Architecture

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express (`C:\Users\woosa\Desktop\Nook`) |
| Frontend | Next.js 16 + TypeScript + Tailwind v4 (`C:\Users\woosa\Desktop\Nook\nook-admin`) |
| Database | Supabase PostgreSQL |
| Hosting | Railway.app (both services, auto-deploy on git push) |
| Auth | JWT + Google OAuth |
| Wallet | Google Wallet API (service account OAuth2) |
| Push | Web Push VAPID (`web-push`) |
| Email | Resend |
| QR | `qrcode` npm package |
| Scheduling | `node-schedule` |

### System Diagram

```
âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
â                        Railway                           â
â                                                          â
â  ââââââââââââââââââââââââ  ââââââââââââââââââââââââââââ â
â  â   nook-backend       â  â   nook-admin (Next.js)   â â
â  â   Node.js/Express    â  â   App Router + proxy.ts  â â
â  â   :3001              â  â   :3000                  â â
â  â                      â  â                          â â
â  â  /api/auth           â  â  / (homepage)            â â
â  â  /api/cards          â  â  /auth (login)           â â
â  â  /api/customers      ââââ¤  /dashboard              â â
â  â  /api/scan           â  â  /cards                  â â
â  â  /api/wallet         â  â  /customers              â â
â  â  /api/push           â  â  /analytics              â â
â  â  /api/coupons        â  â  /settings               â â
â  ââââââââââââ¬ââââââââââââ  â  /coupons                â â
â             â              â  /scanner                 â â
âââââââââââââââ¼âââââââââââââââ´âââââââââââââââââââââââââââââ
              â
              â¼
    ââââââââââââââââââââ     âââââââââââââââââââââââââââ
    â   Supabase       â     â   Google Wallet API      â
    â   (Postgres)     â     â   (service account OAuth)â
    â   mbidmkovjvr... â     â   Issuer: 338800000...   â
    ââââââââââââââââââââ     âââââââââââââââââââââââââââ
```

---

## Key Credentials

All secrets stored in Railway environment variables.

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
- Backend service: `nook-production` â `https://nook-production-270f.up.railway.app`
- Admin service: `nook-admin` â `https://nook-admin-production.up.railway.app`
- Project: `https://railway.com/project/e2355956-a305-4026-b7d3-9e5615bdbca3`

### Test Login
```
Email:    woosang@nook.com
Password: nook1234
Plan:     starter
Business: Nook Cafe
ID:       06fd310f-7a77-497c-b682-2b668fa17a29
```

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `businesses` | ê°ê²/ì¬ì¥ë ê³ì  â email, password_hash, plan, logo_url, **is_superadmin**, **page_permissions** |
| `business_users` | ì¤íí ê³ì  per business â email, name, role, page_permissions, password_hash |
| `loyalty_cards` | ë¡ì´í° ì¹´ë ì¢ë¥ â type, goal_stamps, reward_desc, color, google_class_id |
| `customers` | ê³ ê° ì ë³´ â linked to business + card, phone, qr_code, barcode, wallet_type |
| `stamps` | ì¤í¬í ì ë¦½ ê¸°ë¡ â customer_id, card_id, scan_type, scanned_by |
| `redemptions` | ë¦¬ìë ì¬ì© ê¸°ë¡ |
| `push_logs` | í¸ì ë°ì¡ ê¸°ë¡ |
| `coupons` | ì¿ í° ë§ì¤í° â discount, trigger_type, valid_days |
| `coupon_passes` | ê³ ê°ë³ ë°ê¸ ì¿ í° â barcode, status (active/used/expired) |
| `coupon_notifications` | ì¿ í° ìë¦¼ ë°ì¡ ê¸°ë¡ |

---

## API Reference

All `ð` routes require `Authorization: Bearer <jwt>`.

### Auth
```
POST /api/auth/register          { name, email, password }  â  { token, business }
POST /api/auth/login             { email, password }         â  { token, business }
POST /api/auth/scanner-token     ð                          â  { scanner_token }  (30-day)
```

### Cards
```
GET  /api/cards                  ð  â  { cards }
POST /api/cards                  ð  { name, card_type, goal_stamps, reward_desc, color }
PATCH /api/cards/:id             ð  { name, color, goal_stamps, reward_desc, is_active }
GET  /api/cards/:id/stats        ð  â  { total_customers, total_stamps, total_redeems }
```

### Customers
```
POST /api/customers/register     { card_id, name, phone, consent_push, consent_points }
GET  /api/customers              ð  â  { customers }  (via customer_stamp_counts view)
GET  /api/customers/lookup       ð  ?code=&type=qr|barcode  â  customer + stamp count
```

### Scan
```
POST /api/scan                   ð  { code, scan_type }   â  stamp + Google Wallet sync + push
POST /api/scan/redeem            ð  { customer_id }        â  redemption + push
```

### Google Wallet
```
POST /api/wallet/google/create   ð  { customer_id }  â  { wallet_link, current_stamps }
PATCH /api/wallet/google/stamp   ð  { customer_id }  â  { updated, current_stamps, goal }
```

### Push
```
POST /api/push/broadcast         ð  { message, customer_ids? }
```

### Coupons
```
GET  /api/coupons                ð  â  { coupons }
POST /api/coupons                ð  { name, discount_type, discount_value, trigger_type, valid_days }
POST /api/coupons/:id/issue      ð  { customer_ids }  â  issues passes
POST /api/coupons/redeem         ð  { barcode }       â  marks pass as used
```

### Permissions (superadmin only)
```
GET  /api/permissions/businesses         ð  â  { businesses }  (all businesses + permissions)
PATCH /api/permissions/businesses/:id   ð  { page_permissions }  â  { business }
GET  /api/permissions/users              ð  â  { users }  (staff for this business)
POST /api/permissions/users             ð  { email, name, role, password, page_permissions? }
PATCH /api/permissions/users/:id        ð  { name, role, page_permissions, is_active, password? }
DELETE /api/permissions/users/:id       ð  â  { success }
POST /api/permissions/staff-login       { email, password }  â  { token }  (staff login)
```

---

## Business Model

### Pricing Plans

| Plan | Price | Customers | Cards | Features |
|------|-------|-----------|-------|---------|
| Basic | $59/mo | Up to 100 | 1 card | Stamp card, Google Wallet, push notifications |
| Pro | $79/mo | Up to 500 | 3 cards | Everything in Basic + Apple Wallet, coupon system |
| Premium | $119/mo | Unlimited | Unlimited | Everything in Pro + analytics, priority support, custom domain |

---

## Completed Features â

- Backend API (auth, cards, customers, scan, wallet, push, coupons)
- Google Wallet pass creation + stamp updates
- Push notifications (Web Push + Google Wallet lock-screen messages)
- Coupon system (create, issue, redeem by barcode scan)
- Email service via Resend (coupon notifications)
- Auto-trigger scheduler (birthday, winback, stamp-complete coupons) â daily 9am
- Admin dashboard (all pages: overview, cards, customers, push, analytics, coupons, settings)
- Marketing homepage (bilingual KO/EN with language toggle)
- Mobile responsive (all pages including modals as bottom sheets)
- PWA (installable on Android + iPhone)
- Google OAuth login
- Railway deployment (both frontend + backend, auto-deploy on git push)
- **Permissions system** â VIEW/EDIT/ADMIN per page, staff users, superadmin (Woosang)
- **Analytics page** â real DB data, permission guard, superadmin business selector, KPI cards with deltas, day-of-week bar chart
- **`/api/analytics` route** â new backend route with 30d/prev-30d comparisons, stamps by day of week
- **Register page** â responsive phone frame (272Ã560 on phone, 320Ã660 on desktop), scrollable tab bar
- **Cards page** â CardDesigner modal (3 tabs: ì¹´ë ë¯¸ë¦¬ë³´ê¸°, ìë  ì¹´ë, ê°ì QR), StampGrid auto-layout, WalletCardPreview with CSS barcode, RegistrationQRCard
- **Register page** â connected to real backend (`POST /api/customers/register`), QR param pre-fill, success flow
- **Scanner page** â coupon barcode scan mode added (toggle stamp/coupon), `POST /api/coupons/redeem` wired
- **api.ts** â `updateProfile` extended with `phone` + `address` fields; `analytics()` return type extended with `stamps_daily_30d` + `redemptions_daily_30d`
- **Homepage mobile responsive** â `marketing.css` Korean text `word-break: keep-all`, 980px `overflow-x: hidden`, hero grid 55fr/45fr, h1 clamp(28px,7.5vw,40px)
- **Dashboard** â real API data: KPI from `api.stats()`, line chart from `api.analytics()` (30d daily), donut from `api.cards()` card_type grouping, activity feed from `api.customers()` (8 newest, `timeAgo()` timestamps)
- **`/api/analytics` route** â extended: `stamps_daily_30d` + `redemptions_daily_30d` 30-element arrays added to response

---

## In Progress ð

- **Google Wallet publishing approval** â submitted, waiting 1-3 days
  â Once approved: real customers can add passes to Google Wallet (currently demo mode only)

---

## Todo List

### ð´ Urgent
- [ ] **UI bug fixes** â remaining forms not yet wired to real API
      (New Card form, customer search filters, etc.)
- [x] **Edit Card form** â Done (Session 6)
- [x] **Register page backend** â Done (Session 6)
- [x] **Scanner coupon redeem** â Done (Session 6)
- [ ] **Domain purchase** â `nookwallet.com` + Cloudflare DNS setup
- [ ] **Resend API key** â add to Railway backend env vars
- [ ] **Coupon â Google Wallet** â real connection test end-to-end
- [ ] **Scanner app** â wire coupon scan to real `POST /api/coupons/redeem`
- [x] **Homepage** â Done (Session 7) â `mobile responsive fix: `word-break: keep-all` on all Korean text, `overflow-x: hidden` at 980px, hero grid 55fr/45fr, h1 clamp
- [x] **Dashboard charts** â Done (Session 7) â wired to real API: KPI stats, line chart (30d stamps/redeems), donut (card type mix), activity feed (recent signups)

### ð¡ Medium Priority
- [ ] **Customer registration page** â connect to real backend
      (QR scan â landing page â Add to Wallet flow)
- [ ] **Scanner app** â real camera QR/barcode scanning (jsQR library)
- [ ] **Google Wallet pass status** â COMPLETED on redeem, EXPIRED on expiry
      (so customer sees updated state in their wallet)
- [x] **Analytics page** â ~~wire to real DB data~~ â Done (Session 5)
- [ ] **Dashboard forms** â loading states, error messages, success toasts
- [ ] **Google Wallet publishing** â complete 3-step process in Pay Console

### ð¢ Later / Nice to Have
- [ ] **Apple Wallet** â +99/yr Apple Developer account needed
- [ ] **Stripe integration** â subscription billing per plan
- [ ] **Google Review coupon** â customer leaves review â auto-issue coupon
- [ ] **SMS notifications** â Twilio or similar
- [ ] **Multi-location business support**
- [ ] **White-label option** for Premium plan

---

## Wantedeatures

### 1. Coupon Wallet Flow (priority)
1. Owner sends coupon (e.g. "Free garlic bread") to loyal customers
2. Coupon added to customer Google Wallet (barcode + expiry date)
3. Customer visits, shows barcode to staff
4. Staff scans barcode in scanner app â marked REDEEMED
5. Google Wallet pass updates to COMPLETED status
6. Customer can delete used/expired passes (Google Wallet handles natively)

### 2. Push Notification Targeting
- Send to all customers of a specific business
- Send to individual customers
- Already built, needs UI verification

### 3. Auto Campaigns (built, needs testing)
- Birthday coupons (auto-send on birth month)
- Winback coupons (auto-send after 30 days no visit)
- Stamp-complete bonus coupon

---

## Design System

| Token | Value |
|-------|-------|
| Font (UI) | Inter |
| Font (numbers/IDs) | JetBrains Mono |
| Primary green | `#1D9E75` |
| Dark green | `#085041` |
| Light green | `#E8F7F2` |
| Background | `#F5F6FA` |
| Card | `white` |
| Border | `#EBEBEB` |

- Style reference: ByeWind dashboard (clean SaaS, large bold numbers)
- All modals â bottom sheets on mobile
- Bottom nav bar on mobile (5 tabs)

---

## Google Wallet â Important Notes

- **Demo mode:** passes only work for test accounts whitelisted in Google Pay & Wallet Console
- **Class ID pattern:** `{ISSUER_ID}.card_{card_id_with_underscores}`
- **Object ID pattern:** `{ISSUER_ID}.customer_{customer_id_with_underscores}`
- **Fallback logo:** `https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png` â Wikimedia CDNs rejected by Google's image validator
- **Lock screen notifications:** triggered on any pass object update
- **NFC:** considered and rejected â not feasible with standard wallet passes

---

## Next.js Admin â Important Notes

- **Next.js 16**: `middleware.ts` is deprecated. Auth guard logic lives in `proxy.ts` (`export function proxy`). `middleware.ts` kept as a no-op stub with empty matcher to satisfy Turbopack build.
- **Standalone output**: `next.config.ts` uses `output: 'standalone'`. nixpacks.toml copies `public/` and `.next/static/` into the standalone bundle.
- **`NEXT_PUBLIC_API_URL`**: must be set in Railway env vars before build (build-time variable).
- **CORS**: backend must include `/\.railway\.app$/` in allowed origins.

---

## Session Workflow

When starting a new session:
> "Read CLAUDE.md and continue from where we left off"

At end of each work session:
> "Update CLAUDE.md with today's progress and push to git"

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md - $(date +%Y-%m-%d)"
git push origin main
```

---

## Change Log

### 2026-05-06 (Session 7 cont. â Dashboard Real Data + api.ts Types)

**Backend (IdolShin/Nook) â 1 file updated:**

- **`src/routes/analytics.js`** â Extended response with two new 30-element arrays:
  - `stamps_daily_30d`: daily stamp counts for last 30 days (index 0 = 30 days ago, index 29 = today)
  - `redemptions_daily_30d`: daily redemption counts for last 30 days
  - Commit: `feat: analytics - add stamps_daily_30d + redemptions_daily_30d`

**Frontend (IdolShin/nook-admin) â 2 files updated:**

- **`src/lib/api.ts`** â Added `stamps_daily_30d: number[]` + `redemptions_daily_30d: number[]` to `analytics()` return type
  - Commit: `feat: api.ts - add stamps_daily_30d + redemptions_daily_30d types`

- **`src/app/(admin)/dashboard/page.tsx`** â Complete rewrite (326 lines), all mock data replaced with real API:
  - Added `CARD_TYPE_COLORS` map: stamp=#1D9E75, coupon=#3B6BCC, membership=#C53A6B, cashback=#C26B1F
  - Added `timeAgo(isoDate)` helper: mins/hours/days relative timestamp
  - State: `stampsTrend`, `redeemsTrend`, `cardTypeMix`, `recentActivity`
  - `api.stats()` â KPI values (total customers, active cards, stamps, redemptions)
  - `api.analytics()` â `stamps_daily_30d`/`redemptions_daily_30d` â NookLineChart (30d trend)
  - `api.cards()` â groups active cards by `card_type` â NookDonutChart (live card mix)
  - `api.customers()` â sorted desc by `created_at` â top 8 â activity feed (signup type)
  - Activity feed: 2-column grid on desktop, shows real customer names + `timeAgo()` timestamps
  - Fallback: zeros array (30) for line chart, `[{label:'Stamp',value:1}]` for donut when no data
  - Removed: NookStackedBar, "Top businesses" leaderboard (required multi-business mock data)
  - Commit: `feat: dashboard - wire charts to real API data`

---

### 2026-05-06 (Session 7 â Homepage Mobile Responsive Fix + CLAUDE.md Push)

**Frontend (nook-admin) â 1 file updated, committed `b9ef4dc`:**

- **`src/app/(marketing)/marketing.css`** â Korean mobile responsive overhaul
  - `word-break: keep-all` added to all Korean-facing text elements:
    `.h1`, `.h1-sub`, `.section-eyebrow`, `.section-title`, `.section-sub`,
    `.reason h3`, `.reason p`, `.journey-caption h3`, `.journey-caption p`,
    `.faq-item summary`, `.cta-banner h2`
  - `overflow-wrap: break-word` added to `.h1`, `.section-title`, `.cta-banner h2`
  - 980px tablet breakpoint: added `html, body { overflow-x: hidden; max-width: 100vw; }`
  - 980px: `.h1` reduced from 42px â 38px; `.phones` height 460â420px
  - 980px: `.hero-grid` changed from `1fr 1fr` to `55fr 45fr; gap: 32px`
  - 767px mobile: `.h1` â `clamp(28px, 7.5vw, 40px)`, `.h1-sub` â `clamp(14px, 4vw, 17px)`
  - Commit message: `fix: homepage mobile responsive - word-break keep-all, 980px overflow fix`

**Backend (IdolShin/Nook) â 1 file pushed, commit `21b5075`:**
- **`CLAUDE.md`** â Session 6 changelog recorded

---

### 2026-05-06 (Session 6 â Cards CardDesigner + Register API + Scanner Coupon + GitHub Push)

**Frontend (nook-admin) â 4 files updated, pushed via GitHub web editor (commit `02e9c72`):**

- **`src/app/(admin)/cards/page.tsx`** â Added CardDesigner modal (611 lines total)
  - `StampGrid`: auto-layout (â¤7 stamps = single row, >7 = two rows via `Math.ceil/floor`)
  - `WalletCardPreview`: white wallet card with CSS barcode (38 bars) + serial `NK-{id.slice(0,6).toUpperCase()}`
  - `CardDesigner`: full-screen modal, 3 tabs (ì¹´ë ë¯¸ë¦¬ë³´ê¸°, ìë  ì¹´ë, ê°ì QR)
  - Edit card form: name, color, goal_stamps, reward_desc, is_active â calls `PATCH /api/cards/:id`
- **`src/app/(admin)/register/page.tsx`** â Connected to real backend (`POST /api/customers/register`)
- **`src/app/(staff)/scan/page.tsx`** â Coupon barcode scan mode + `POST /api/coupons/redeem`
- **`src/lib/api.ts`** â `updateProfile()` extended: `phone?: string`, `address?: string`

---

### 2026-05-06 (Session 5 â Analytics Backend + Analytics Page Rewrite + Register Page Fix)

**Backend (nook-backend) â 2 files updated:**

- **`src/routes/analytics.js`** â NEW FILE at `/api/analytics` (auth-protected, superadmin bizId override)
- **`src/index.js`** â Registered `/api/analytics` routes

**Frontend (nook-admin) â 4 files updated:**

- **`src/app/(admin)/analytics/page.tsx`** â Complete rewrite: KPI cards, DayBarChart, FunnelRow, real API
- **`src/app/(admin)/register/page.tsx`** â Responsive rewrite (phone 272Ã560, desktop 320Ã660)
- **`src/app/(admin)/layout.tsx`** â Fixed truncated GitHub version (196 lines)
- **`src/lib/api.ts`** â Added `analytics(bizId?)` method

---

### 2026-05-06 (Session 4 â Coupons Mobile Layout + Settings Overhaul + More Menu)

**Frontend (nook-admin) â 6 files updated:**

- **`src/app/(admin)/coupons/page.tsx`** â `isPhone` mobile card layout in `CouponRow`
- **`src/app/(admin)/settings/page.tsx`** â Workspace / Businesses / Billing / Integrations tabs
- **`src/app/(admin)/layout.tsx`** â "More" bottom sheet with grouped accordion
- **`src/components/layout/Topbar.tsx`** â Alert badge on Settings icon
- **`src/components/layout/Sidebar.tsx`** â Desktop sidebar updated
- **`src/lib/api.ts`** â Added `listBusinessUsers`, `createBusinessUser`, `updateBusinessUser`, `deleteBusinessUser`

---

### 2026-05-05 (Session 3 â Scanner Login + Staff Account)

- Scanner account: `scanner@nookcafe.com` / `nookcafe2024` (role: `viewer`, scanner: `admin`)
- New `/scan-login` page using `POST /api/permissions/staff-login`
- Commits: nook-admin `571a7b5`, backend `14e1fd3`

---

### 2026-05-02 (Session 2 â Permissions System)
- Full permissions system: VIEW/EDIT/ADMIN per page per business/staff
- Supabase: `businesses.is_superadmin`, `businesses.page_permissions`, `business_users` table
- Woosang set as superadmin

---

### 2026-05-02 (Session 1 â Railway Deploy Fix)
- Fixed `/auth` 404 â Next.js 16 `middleware.ts` â `proxy.ts`
- Fixed "Failed to fetch" on login â `NEXT_PUBLIC_API_URL` + CORS
- Dashboard login working at `https://nook-admin-production.up.railway.app/auth`
