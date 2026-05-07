# Nook — Digital Loyalty Card Platform

## Project Overview

Digital loyalty card platform for local businesses (like Boomerangme or Stamp Me).
Owner/Admin: Woosang Shin (woosang930414@gmail.com)

**Three-tier hierarchy:**
```
Woosang (operator/admin)
  └── Businesses (paying clients): Nook Cafe, Kook 미용실, Fort Lee Gym, Korean BBQ...
        └── Customers (card holders): end-users who collect stamps and redeem rewards
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
| Backend | Node.js + Express (`C:\\Users\\woosa\\Desktop\\Nook`) |
| Frontend | Next.js 16 + TypeScript + Tailwind v4 (`C:\\Users\\woosa\\Desktop\\Nook\\nook-admin`) |
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
┌─────────────────────────────────────────────────────────┐
│                        Railway                           │
│                                                          │
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   nook-backend       │  │   nook-admin (Next.js)   │ │
│  │   Node.js/Express    │  │   App Router + proxy.ts  │ │
│  │   :3001              │  │   :3000                  │ │
│  │                      │  │                          │ │
│  │  /api/auth           │  │  / (homepage)            │ │
│  │  /api/cards          │  │  /auth (login)           │ │
│  │  /api/customers      │◄─┤  /dashboard              │ │
│  │  /api/scan           │  │  /cards                  │ │
│  │  /api/wallet         │  │  /customers              │ │
│  │  /api/push           │  │  /analytics              │ │
│  │  /api/coupons        │  │  /settings               │ │
│  └──────────┬───────────┘  │  /coupons                │ │
│             │              │  /scanner                 │ │
└─────────────┼──────────────┴──────────────────────────┘─┘
              │
              ▼
    ┌──────────────────┐     ┌─────────────────────────┐
    │   Supabase       │     │   Google Wallet API      │
    │   (Postgres)     │     │   (service account OAuth)│
    │   mbidmkovjvr... │     │   Issuer: 338800000...   │
    └──────────────────┘     └─────────────────────────┘
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
- Backend service: `nook-production` → `https://nook-production-270f.up.railway.app`
- Admin service: `nook-admin` → `https://nook-admin-production.up.railway.app`
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
| `businesses` | 가게/사장님 계정 — email, password_hash, plan, logo_url, **is_superadmin**, **page_permissions** |
| `business_users` | 스태프 계정 per business — email, name, role, page_permissions, password_hash |
| `loyalty_cards` | 로열티 카드 종류 — type, goal_stamps, reward_desc, color, google_class_id |
| `customers` | 고객 정보 — linked to business + card, phone, qr_code, barcode, wallet_type |
| `stamps` | 스탬프 적립 기록 — customer_id, card_id, scan_type, scanned_by |
| `redemptions` | 리워드 사용 기록 |
| `push_logs` | 푸시 발송 기록 |
| `coupons` | 쿠폰 마스터 — discount, trigger_type, valid_days |
| `coupon_passes` | 고객별 발급 쿠폰 — barcode, status (active/used/expired) |
| `coupon_notifications` | 쿠폰 알림 발송 기록 |

---

## API Reference

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
```

### Coupons
```
GET  /api/coupons                🔒  →  { coupons }
POST /api/coupons                🔒  { name, discount_type, discount_value, trigger_type, valid_days }
POST /api/coupons/:id/issue      🔒  { customer_ids }  →  issues passes
POST /api/coupons/redeem         🔒  { barcode }       →  marks pass as used
```

### Analytics
```
GET  /api/analytics              🔒  →  { total_customers, new_customers_30d, stamps_by_day, ... }
GET  /api/analytics?bizId=xxx    🔒 (superadmin only)  →  same, scoped to another business
```

### Permissions (superadmin only)
```
GET  /api/permissions/businesses         🔒  →  { businesses }  (all businesses + permissions)
PATCH /api/permissions/businesses/:id   🔒  { page_permissions }  →  { business }
GET  /api/permissions/users              🔒  →  { users }  (staff for this business)
POST /api/permissions/users             🔒  { email, name, role, password, page_permissions? }
PATCH /api/permissions/users/:id        🔒  { name, role, page_permissions, is_active, password? }
DELETE /api/permissions/users/:id       🔒  →  { success }
POST /api/permissions/staff-login       { email, password }  →  { token }  (staff login)
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

## Completed Features ✅

- Backend API (auth, cards, customers, scan, wallet, push, coupons)
- Google Wallet pass creation + stamp updates
- Push notifications (Web Push + Google Wallet lock-screen messages)
- Coupon system (create, issue, redeem by barcode scan)
- Email service via Resend (coupon notifications)
- Auto-trigger scheduler (birthday, winback, stamp-complete coupons) — daily 9am
- Admin dashboard (all pages: overview, cards, customers, push, analytics, coupons, settings)
- Marketing homepage (bilingual KO/EN with language toggle)
- Mobile responsive (all pages including modals as bottom sheets)
- PWA (installable on Android + iPhone)
- Google OAuth login
- Railway deployment (both frontend + backend, auto-deploy on git push)
- **Permissions system** — VIEW/EDIT/ADMIN per page, staff users, superadmin (Woosang)
- **Analytics page** — real DB data, permission guard, superadmin business selector, KPI cards with deltas, day-of-week bar chart
- **`/api/analytics` route** — new backend route with 30d/prev-30d comparisons, stamps by day of week
- **Register page** — responsive phone frame (272×560 on phone, 320×660 on desktop), scrollable tab bar

---

## In Progress 🔄

- **Google Wallet publishing approval** — submitted, waiting 1-3 days
  → Once approved: real customers can add passes to Google Wallet (currently demo mode only)

---

## Todo List

### 🔴 Urgent
- [ ] **UI bug fixes** — many buttons/forms still not wired to real API
      (New Card form, Edit Card, customer search filters, etc.)
- [ ] **Domain purchase** — `nookwallet.com` + Cloudflare DNS setup
- [ ] **Resend API key** — add to Railway backend env vars
- [ ] **Coupon → Google Wallet** — real connection test end-to-end
- [ ] **Scanner app** — wire coupon scan to real `POST /api/coupons/redeem`
- [ ] **Homepage** — mobile responsive fix (text overflow, layout issues)

### 🟡 Medium Priority
- [ ] **Customer registration page** — connect to real backend
      (QR scan → landing page → Add to Wallet flow)
- [ ] **Scanner app** — real camera QR/barcode scanning (jsQR library)
- [ ] **Google Wallet pass status** — COMPLETED on redeem, EXPIRED on expiry
      (so customer sees updated state in their wallet)
- [x] **Analytics page** — ~~wire to real DB data~~ ✅ Done (Session 5)
- [ ] **Dashboard forms** — loading states, error messages, success toasts
- [ ] **Google Wallet publishing** — complete 3-step process in Pay Console

### 🟢 Later / Nice to Have
- [ ] **Apple Wallet** — $99/yr Apple Developer account needed
- [ ] **Stripe integration** — subscription billing per plan
- [ ] **Google Review coupon** — customer leaves review → auto-issue coupon
- [ ] **SMS notifications** — Twilio or similar
- [ ] **Multi-location business support**
- [ ] **White-label option** for Premium plan

---

## Wanted Features

### 1. Coupon Wallet Flow (priority)
1. Owner sends coupon (e.g. "Free garlic bread") to loyal customers
2. Coupon added to customer Google Wallet (barcode + expiry date)
3. Customer visits, shows barcode to staff
4. Staff scans barcode in scanner app → marked REDEEMED
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
- All modals → bottom sheets on mobile
- Bottom nav bar on mobile (5 tabs)

---

## Google Wallet — Important Notes

- **Demo mode:** passes only work for test accounts whitelisted in Google Pay & Wallet Console
- **Class ID pattern:** `{ISSUER_ID}.card_{card_id_with_underscores}`
- **Object ID pattern:** `{ISSUER_ID}.customer_{customer_id_with_underscores}`
- **Fallback logo:** `https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png` — Wikimedia CDNs rejected by Google's image validator
- **Lock screen notifications:** triggered on any pass object update
- **NFC:** considered and rejected — not feasible with standard wallet passes

---

## Next.js Admin — Important Notes

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

### 2026-05-06 (Session 5 — Analytics Backend + Analytics Page Rewrite + Register Page Fix)

**Backend (nook-backend) — 2 files updated:**

- **`src/routes/analytics.js`** — NEW FILE, registered at `/api/analytics`
  - Auth-protected (`authMiddleware`)
  - Superadmin can override bizId via `?bizId=xxx`
  - Returns: `total_customers`, `new_customers_30d`, `new_customers_prev` (30–60d), `active_cards`, `total_stamps`, `stamps_last_30d`, `stamps_prev_30d`, `total_redemptions`, `redemptions_30d`, `coupons_issued`, `coupons_redeemed`, `stamps_by_day` (Mon=0, Sun=6 using `(d.getDay() + 6) % 7`)
- **`src/index.js`** — Added `const analyticsRoutes = require('./routes/analytics')` + `app.use('/api/analytics', analyticsRoutes)`

**Frontend (nook-admin) — 4 files updated:**

- **`src/app/(admin)/analytics/page.tsx`** — Complete rewrite (326 lines)
  - Permission guard: `hasPermission = isSuperadmin || canView(decoded, 'analytics')`
  - Superadmin business selector dropdown (`api.listBusinesses()`)
  - KpiCard component with TrendingUp/TrendingDown delta display
  - DayBarChart (Mon–Sun, 7 bars, stamps by day of week)
  - FunnelRow (customer → stamp → redeem funnel)
  - Real API calls via `api.analytics(bizId)`
- **`src/app/(admin)/register/page.tsx`** — Responsive rewrite (338 lines)
  - Phone: frame 272×560, desktop: 320×660
  - Tab bar: horizontal scroll with `overflowX: auto`, `WebkitOverflowScrolling: touch`, `scrollbarWidth: none`
  - Short labels on phone (`STEP_SHORT`), full labels on desktop (`STEP_LABELS`)
- **`src/app/(admin)/layout.tsx`** — Fixed truncated GitHub version (196 lines, was 177)
  - GitHub had an older version missing the full `MORE_GROUPS_ALL` structure and `MoreItem` type
- **`src/lib/api.ts`** — Added missing `analytics()` method
  - `analytics(bizId?: string)` → `GET /api/analytics?bizId=xxx` with full return type

**Key technique discovered:** GitHub's CodeMirror 6 web editor requires `execCommand` injection:
```js
cmContent.focus();
document.execCommand('selectAll', false, null);
document.execCommand('insertText', false, content); // returns true = success
```
(Direct CM view object access via JS properties does not work)

**Verification:**
- `GET /health` → `{"status":"ok","service":"nook-backend"}` ✅
- `GET /api/analytics` with fake token → HTTP 401 (route live, auth-protected) ✅

**⚠️ Note:** Local `nook-admin` repo is still behind remote. Always `git pull origin main` before local git push.

---

### 2026-05-06 (Session 4 — Coupons Mobile Layout + Settings Overhaul + More Menu)

**Frontend (nook-admin) — 6 files updated, pushed via GitHub web editor:**

- **`src/app/(admin)/coupons/page.tsx`** — Added `isPhone` mobile card layout to `CouponRow`
  - `const { isPhone } = useBreakpoint()` added at top of CouponRow
  - Full mobile card view (icon + title + discount badge row, stats row, controls row with Toggle + Issue button)
  - Desktop layout unchanged; card switches at phone breakpoint with `borderLeft` color accent
- **`src/app/(admin)/settings/page.tsx`** — Full overhaul
  - Tab nav: Workspace / Businesses (superadmin) / Billing / Integrations
  - Mobile: pill-style horizontal scroll tab bar; Desktop: vertical left sidebar nav
  - Workspace tab: Business name + owner email editable fields (calls `api.updateProfile`), Danger zone
  - Businesses tab (superadmin only): `BizCard` with expand → staff users, `StaffRow` edit/delete, `CreateStaffForm`
  - Billing tab: current plan card, plan comparison grid (Basic/Pro/Premium), usage bars
  - Integrations tab: status list (Google Wallet ✓, Apple Wallet ✗, Resend ✗, Web Push ✓, Stripe ✗, Twilio ✗) with alert badge
  - Alert count written to `localStorage('nook_alert_count')` + `nook:alerts` CustomEvent for Topbar badge
- **`src/app/(admin)/layout.tsx`** — "More" bottom sheet restructured with grouped accordion
  - Groups: "Reports & tools" (Analytics, Coupons, Staff scanner) + "Admin" (Settings)
  - Each group collapsible with ChevronDown/Right; items in 2-column grid with active highlight
- **`src/components/layout/Topbar.tsx`** — Alert badge on Settings icon reads from `localStorage('nook_alert_count')`
- **`src/components/layout/Sidebar.tsx`** — Desktop sidebar updated to match new nav structure
- **`src/lib/api.ts`** — Added 4 superadmin business user management methods:
  - `listBusinessUsers(bizId)` → `GET /api/permissions/businesses/:id/users`
  - `createBusinessUser(bizId, data)` → `POST /api/permissions/businesses/:id/users`
  - `updateBusinessUser(bizId, uid, data)` → `PATCH /api/permissions/businesses/:id/users/:uid`
  - `deleteBusinessUser(bizId, uid)` → `DELETE /api/permissions/businesses/:id/users/:uid`

**Commits (GitHub web editor — local repo was 5 commits behind remote):**
- `15aef40`: feat: CouponRow mobile layout - isPhone card view
- `083d09e`: feat: add listBusinessUsers, createBusinessUser, updateBusinessUser, deleteBusinessUser to api.ts
- (settings/page.tsx, layout.tsx, Topbar.tsx, Sidebar.tsx committed in earlier part of session)

**⚠️ Note:** Local `nook-admin` repo is behind remote (non-fast-forward). Use `git pull origin main` before next local git push.

### 2026-05-05 (Session 3 — Scanner Login + Staff Account)

**Scanner account created (direct Supabase REST API insert):**
- Email: `scanner@nookcafe.com` / Password: `nookcafe2024`
- Role: `viewer` (Supabase `business_users_role_check` only allows `viewer` and `admin` — NOT `staff`)
- page_permissions: `{ scanner: 'admin', everything else: 'none' }`
- business_id: `06fd310f-7a77-497c-b682-2b668fa17a29` (Nook Cafe)

**Root cause of POST /api/permissions/users failure:** Supabase check constraint `business_users_role_check` rejects any role not in `(viewer, admin)`. Was sending `role: 'staff'` in test calls. Fixed API to validate role and return 400 instead of 500.

**New: `/scan-login` page** — dedicated scanner staff login:
- URL: `https://nook-admin-production.up.railway.app/scan-login?biz=06fd310f-7a77-497c-b682-2b668fa17a29&redirect=/scan`
- Shows email + password fields; `biz` (business_id) taken from URL param or typed manually
- Uses `POST /api/permissions/staff-login` (NOT the business owner `/api/auth/login`)
- Stores JWT as `nook_token` → redirects to `/scan`

**Updated `(staff)/layout.tsx`:** Now redirects unauthenticated users to `/scan-login` instead of `/auth`.

**Added `api.staffLogin(email, password, business_id)`** to `src/lib/api.ts`.

**Commits:**
- nook-admin `571a7b5`: feat: staff scanner login page + staffLogin API method
- backend `14e1fd3`: fix: validate role in POST /api/permissions/users (viewer|admin only)

**⚠️ Important notes:**
- Valid roles in `business_users`: `viewer`, `admin` only (Supabase constraint)
- Scanner staff should bookmark the scan-login URL with `?biz=<uuid>`
- `POST /api/scan` and `/api/customers/lookup` both filter by `business_id` from JWT → cross-business isolation enforced at DB level

### 2026-05-02 (Session 2 — Permissions System)
- Built full permissions system: VIEW/EDIT/ADMIN per page per business/staff
- Backend: `src/routes/permissions.js` — CRUD for businesses + staff users, superadmin guard
- Backend: `src/routes/auth.js` — JWT now includes `is_superadmin` + `page_permissions`
- Backend: `src/index.js` — registered `/api/permissions` routes
- Frontend: `src/lib/permissions.ts` — PermLevel types, helpers (canView/canEdit/canAdmin), decodeToken
- Frontend: `src/app/(admin)/permissions/page.tsx` — full UI (staff tab + businesses tab)
- Frontend: `src/components/layout/Sidebar.tsx` — dynamic nav based on page permissions
- Frontend: `src/app/(admin)/layout.tsx` — route guard, redirects on insufficient permissions
- Frontend: `src/components/layout/BottomNav.tsx` — filters tabs by permissions
- Supabase migration done: `businesses` table + `is_superadmin`/`page_permissions` columns, `business_users` table
- Woosang set as superadmin (is_superadmin = true) via SQL UPDATE
- Git push via `C:\\Users\\woosa\\Desktop\\nook_git_push.bat` (reusable)
- ⚠️ After Railway deploy: must log out + log back in to get JWT with is_superadmin field

### 2026-05-02 (Session 1 — Railway Deploy Fix)
- Fixed `/auth` 404 on Railway — Next.js 16 `middleware.ts` → `proxy.ts` migration
- Fixed nixpacks.toml — standalone static file copy + `HOSTNAME=0.0.0.0`
- Fixed "Failed to fetch" on login — added `NEXT_PUBLIC_API_URL` to Railway + CORS fix
- Admin dashboard login fully working at `https://nook-admin-production.up.railway.app/auth`
- CLAUDE.md fully rewritten with complete project status


### 2026-05-06 (Session 6 — Scheduled Auto-Debug + Bug Fixes)

**Scheduled Tasks created:**
- **nook-daily-debug** (6:00 AM daily) — autonomous codebase scan: git log check, bug detection, CLAUDE.md review, writes `daily_debug_report.md`
- **nook-morning-report** (7:30 AM daily) — presents findings from 6 AM scan in Korean to Woosang

**Bug Fixes (nook-admin) — 3 files pushed:**

- **`src/lib/api.ts`** — commit `0b18db0`
  - Fixed `updateProfile` type: added `phone?: string` and `address?: string` fields (were missing, causing Settings page to drop those values on save)

- **`src/app/(staff)/scan/page.tsx`** — commit `7e12180`
  - Added `ScanMode = 'stamp' | 'coupon'` type
  - Added `coupon_ok` discriminant to `AppState` discriminated union
  - Added `scanMode` state + toggle button in top bar (Stamp / Coupon)
  - Added coupon branch in `handleScanCode`: calls `api.redeemCoupon(barcode)` → shows COUPON OK screen with success animation
  - Staff can now scan stamp cards AND redeem coupon barcodes from the same scanner page

- **`src/app/(admin)/cards/page.tsx`** — commit `fd955a2`
  - Added `EditCardModal` component — full form with name, goal_stamps, reward_desc, color picker, live card preview
  - Modified `CardDetail` component to accept `onEdit` prop
  - Added `handleEdit` in page — calls `api.updateCard(id, data)` and propagates changes upward
  - Edit button now appears in CardDetail header (pencil icon)

**Key technique (GitHub web editor):** CodeMirror 6 injection via:
```js
cmContent.focus();
document.execCommand('selectAll', false, null);
document.execCommand('insertText', false, content); // returns true = success
```
(Established in Session 5, reused here for all 3 file pushes)
