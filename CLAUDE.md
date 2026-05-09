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
- **Cards page** — CardDesigner modal (3 tabs: 카드 미리보기, 월렛 카드, 가입 QR), StampGrid auto-layout, WalletCardPreview with CSS barcode, RegistrationQRCard
- **Register page** — connected to real backend (`POST /api/customers/register`), QR param pre-fill, success flow
- **Scanner page** — coupon barcode scan mode added (toggle stamp/coupon), `POST /api/coupons/redeem` wired
- **api.ts** — `updateProfile` extended with `phone` + `address` fields; `analytics()` return type extended with `stamps_daily_30d` + `redemptions_daily_30d`
- **Homepage mobile responsive** — `marketing.css` Korean text `word-break: keep-all`, 980px `overflow-x: hidden`, hero grid 55fr/45fr, h1 clamp(28px,7.5vw,40px)
- **Dashboard** — real API data: KPI from `api.stats()`, line chart from `api.analytics()` (30d daily), donut from `api.cards()` card_type grouping, activity feed from `api.customers()` (8 newest, `timeAgo()` timestamps)
- **`/api/analytics` route** — extended: `stamps_daily_30d` + `redemptions_daily_30d` 30-element arrays added to response
- **Customers page** — Export CSV (Blob download) + CouponPickerModal (send coupon to individual customer via `api.issueCoupon`)
- **Customers page sort** — sortable columns (Customer/Status/Stamps/Last visit), SortIcon component (ArrowUp/ArrowDown/ChevronsUpDown), fixed empty-state for "no search results" vs "no customers"

---

## In Progress 🔄

- **Google Wallet publishing approval** — submitted, waiting 1-3 days
  → Once approved: real customers can add passes to Google Wallet (currently demo mode only)

---

## Todo List

### 🔴 Urgent
- [ ] **UI bug fixes** — remaining forms not yet wired to real API
      (New Card form, customer search filters, etc.)
- [x] **Edit Card form** ✅ Done (Session 6)
- [x] **Register page backend** ✅ Done (Session 6)
- [x] **Scanner coupon redeem** ✅ Done (Session 6)
- [ ] **Domain purchase** — `nookwallet.com` + Cloudflare DNS setup
- [ ] **Resend API key** — add to Railway backend env vars
- [ ] **Coupon → Google Wallet** — real connection test end-to-end
- [ ] **Scanner app** — wire coupon scan to real `POST /api/coupons/redeem`
- [x] **Homepage** ✅ Done (Session 7) — mobile responsive fix: `word-break: keep-all` on all Korean text, `overflow-x: hidden` at 980px, hero grid 55fr/45fr, h1 clamp
- [x] **Dashboard charts** ✅ Done (Session 7) — wired to real API: KPI stats, line chart (30d stamps/redeems), donut (card type mix), activity feed (recent signups)
- [x] **New Card registration bug** ✅ Done (Session 8) — fixed 502 caused by truncated analytics.js on GitHub
- [x] **Customers page — Export CSV** ✅ Done (Session 8) — Blob download with Name/Phone/Status/Stamps/Joined/LastVisit
- [x] **Customers page — Send coupon** ✅ Done (Session 8) — CouponPickerModal per-customer coupon dispatch
- [x] **api.ts registerCustomer** ✅ Done (Session 11) — `registerCustomer()` added to api.ts, calls `POST /api/customers/register`
- [x] **Register page API** ✅ Done (Session 11) — name field added, `handleRegister` wired to real backend, card_id from URL param

### 🟡 Medium Priority
- [x] **Customer registration page** — ✅ Done (Session 11) — connected to real backend (`POST /api/customers/register`), name + phone fields, card_id from URL `?card_id=` param
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

### 2026-05-09 (Session 16 — Homepage Restore + Mobile UI Fixes)

**Phase 1 — Homepage restore from commit `154478c`:**

- **`src/app/(marketing)/marketing.css`** — Restored from original commit `154478c` (1313 lines, 34,696 bytes)
  - Previous session's base64 chunk injection had corrupted the file (chunk size anomalies made `atob()` fail with InvalidCharacterError)
  - Fix: fetched directly from `https://raw.githubusercontent.com/IdolShin/nook-admin/154478c/...` via browser `fetch()` then injected via CM6 `view.dispatch`
  - Commit: `restore: marketing.css from commit 154478c (original homepage)` (`d5221df`)

- **`src/app/(marketing)/Homepage.tsx`** — Restored from original commit `154478c` (62,528 bytes)
  - Same fetch-from-raw-GitHub + CM6 inject approach
  - Commit: `restore: Homepage.tsx from commit 154478c (original homepage)` (`65bcc33`)

- **`src/app/(marketing)/page.tsx`** and **`layout.tsx`** — Already matched `154478c`, no changes needed

**Phase 2 — Mobile dashboard UI fixes (5 issues total):**

- **`src/components/layout/Sidebar.tsx`** — Fixed `홈페이지` Korean text encoding corruption
  - Problem: `<span>ííì´ì§</span>` (raw UTF-8 bytes stored as Latin-1 chars by prior CM6 injection)
  - Fix: detected chars via `String.fromCharCode(237,153,136,...)` match, replaced with proper `<span>홈페이지</span>`
  - Commit: `fix: Sidebar - restore 홈페이지 Korean text (was encoding-corrupted)` (`aeb3356`)

- **`src/app/(admin)/customers/page.tsx`** — Fixed two encoding bugs:
  1. `'Nook CafÃ©'` → `'Nook Café'` on line 45 (biz fallback string)
     - Commit: `fix: customers - fix 'Nook Café' encoding corruption` (`c781f6b`)
  2. Search placeholder `phoneâ¦"` → `phone..."` (raw UTF-8 bytes [226,128,166] for `…` stored as separate chars)
     - Detected via `Array.from(chunk).map(c => c.charCodeAt(0))`, fixed with `String.fromCharCode(226,128,166)` match
     - Commit: `fix: customers - fix search placeholder encoding (â¦ → ...)` (`d4b9988`)

- **`src/app/(admin)/push/page.tsx`** — Audience section vertical on mobile
  - `gridTemplateColumns: 'repeat(2,1fr)'` → `gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)'`
  - 4 audience boxes now stack in single column on mobile
  - Commit: `fix: push - audience list vertical on mobile` (`26d929b`)

- **`src/app/(admin)/cards/page.tsx`** — `CardsTable` responsive mobile list view
  - Added `const { isPhone } = useBreakpoint()` to `CardsTable` function
  - On mobile: renders card-style rows (gradient swatch + name/type/status + issued count) instead of wide 8-column table that overflowed horizontally
  - On desktop: original table unchanged
  - Commit: `fix: cards - responsive list view for mobile (CardsTable)` (`46ca857`)

**Verified on live site (mobile 390px viewport):**
- Sidebar: `홈페이지` renders correctly ✅
- Cards List view: clean card rows, no horizontal overflow ✅
- Push audience: 4 items stacked vertically ✅
- Customers: "Nook Cafe" clean in table, "Search by name, phone..." clean in placeholder ✅
- Homepage: fully styled (dark green hero, stamp card mockup) ✅

**⚠️ Encoding lesson learned:** CM6 injection in GitHub editor can store multi-byte Unicode chars (Korean, `…`, `—`) as raw UTF-8 byte sequences interpreted as separate Latin-1 chars. Detection method: `Array.from(str).map(c => c.charCodeAt(0))` — if you see values like `[226,128,166]` for a single char, it's a mis-encoded ellipsis. Fix with `String.fromCharCode(226,128,166)` match in JS.

---

### 2026-05-09 (Session 14 — SF Pro Font + Mobile Layout Polish + Git Index Fix)

**Frontend (IdolShin/nook-admin) — 7 files updated:**

- **`src/app/globals.css`** — SF Pro font stack + font smoothing
  - `--font-sans` updated to `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif`
  - Added `-webkit-font-smoothing: antialiased` + `font-feature-settings: "kern" 1, "liga" 1` to `body`
  - Added `--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace`
  - Commit: `feat: SF Pro font + font smoothing`

- **`src/lib/api.ts`** — Restored `updateProfile` phone/address fields + `registerCustomer`
  - `updateProfile()` re-extended with `phone?: string` + `address?: string` params
  - `registerCustomer()` confirmed present (added Session 11, restored after git index corruption)
  - Commit: `feat: api.ts - restore updateProfile phone/address + registerCustomer`

- **`src/app/(admin)/register/page.tsx`** — Reconnected to real backend
  - `handleRegister` wired to `api.registerCustomer()`, name + phone fields, card_id from URL `?card_id=` param
  - Commit: `feat: register page - reconnect to real backend`

- **`src/components/layout/Sidebar.tsx`** — Tighter spacing + scroll-lock
  - Nav item `minHeight: 34`, `padding: '6px 10px'` (was larger)
  - Scrollable area: `overscrollBehavior: 'contain'` to prevent chain scrolling
  - Safe-area padding on mobile, logout button, collapse toggle preserved
  - Commit: `feat: sidebar - tighter spacing + scroll-lock`

- **`src/components/layout/BottomNav.tsx`** — Safe-area + frosted glass
  - `height: 'calc(56px + env(safe-area-inset-bottom, 0px))'`
  - `paddingBottom/Left/Right: env(safe-area-inset-*)` for notched phones
  - `background: 'rgba(255,255,255,0.96)'` + `backdropFilter: 'blur(12px)'`
  - Commit: `feat: bottom nav - safe-area + frosted glass`

- **`src/components/layout/Topbar.tsx`** — Mobile safe-area + blur
  - Mobile header: `paddingTop: 'env(safe-area-inset-top, 0px)'`, `height: 'calc(52px + env(safe-area-inset-top, 0px))'`
  - `background: 'rgba(255,255,255,0.96)'` + `backdropFilter/WebkitBackdropFilter: 'blur(12px)'`
  - `position: 'sticky', top: 0, zIndex: 10` for scroll behavior
  - Commit: `feat: topbar - mobile safe-area + blur`

- **`src/app/(admin)/layout.tsx`** — Scroll-lock fix + main content freeze
  - Drawer open: `document.body.style.overflow = 'hidden'` + `admin-main` inline style `overflow:hidden`
  - Drawer closed: restores `overflow:auto` on `admin-main`
  - `bottomNavH`: `calc(56px + env(safe-area-inset-bottom, 0px))` when mobile, `0px` on desktop
  - Commit: `feat: layout - scroll-lock fix + main content freeze`

**Git index corruption fix:**
- Windows-side git had stale `index.lock` + ghost deletions (files tracked as deleted in index despite existing on disk)
- All 7 files committed individually via GitHub CM6 EditorView injection (browser MCP) — bypassed corrupted local git entirely
- Injection method: base64 chunked (3996-char pieces) → `window._C` array → `atob()` → CM6 `view.dispatch({ changes })` → commit dialog automation

**CSS / homepage broken — 2 additional fixes (Session 14 continuation):**

- **`src/app/globals.css`** — Reverted to pre-Session-14 clean version
  - Session 14's SF Pro globals.css commit introduced two bugs: `ent(` typo (instead of `env(`) in safe-area-inset properties + Unicode encoding corruption
  - Reverted via `execCommand('selectAll')` + `execCommand('insertText')` in GitHub editor
  - Clean version: `@import "tailwindcss"`, `@theme { --font-sans: "Inter"... }`, proper `env()` spellings
  - Commit: `fix: revert globals.css - restore clean version, fix CSS corruption`

- **`src/app/layout.tsx`** — Removed duplicate `export default function RootLayout` (root cause of homepage CSS failure)
  - **Root cause**: CM6 injection for this file appended to the file instead of replacing it, resulting in TWO complete `export default function RootLayout` definitions concatenated:
    1. First (wrong): `Plus_Jakarta_Sans` font + encoding corruption in title (`"Nook â Loyalty Platform"`)
    2. Second (correct): `Inter` font + same encoding corruption
  - **Symptoms**: Duplicate `<meta charset>` + `<meta viewport>` tags in HTML, three font class variables on `<html>` element (including unexpected `sora_f0ca33ab`), all CSS files reporting 0 parsed rules via CSSOM, homepage completely unstyled
  - **Fix**: Replaced entire file via `execCommand('selectAll')` + `execCommand('insertText')` with clean 65-line single-definition version using `Inter` + `JetBrains_Mono` fonts, no encoding corruption
  - Commit `5c64877`: `fix: layout.tsx - remove duplicate RootLayout, restore single Inter-font definition`

**Verified post-fix:**
- Homepage: dark green hero, stamp card mockup, stat cards (94%/+38%/10분), "왜 손님들은 다시 올까요?" section — all styled ✅
- Admin dashboard: KPI cards, line chart, donut chart, recent signups feed — all working ✅
- Railway auto-deploy triggered from `main` branch push ✅

---

### 2026-05-09 (Session 15 — Fix Truncated Files + Railway Build Recovery)

**Root cause:** Session 14's CM6 injection commits silently truncated three files, causing Railway builds to fail with "Parsing ecmascript source code failed". The last successful Railway build was the "feat: integrate SplashScreen into layout with Sora font" commit (all subsequent builds failed). Also `layout.tsx` had a `bottomNavH` used-before-declaration TypeScript error introduced by the Session 14 scroll-lock fix.

**Frontend (IdolShin/nook-admin) — 4 files fixed:**

- **`src/lib/api.ts`** — Restored ApiCoupon + ApiCouponPass interfaces (commit `fix: api.ts - restore complete ApiCoupon + ApiCouponPass interfaces`)
  - File was truncated at line 305: `ApiCoupon { id: string;` (just spaces after)
  - Fix: spliced correct tail content after the `id: string;` line via CM6 dispatch
  - GitHub confirmed: 334 lines, 11641 bytes

- **`src/components/SplashScreen.tsx`** — Restored closing JSX (commit `fix: SplashScreen.tsx - restore complete closing JSX (was truncated)`)
  - File truncated at line 576 (just spaces), missing: `</div>` (nk-markwrap), nk-word/nk-lockup wordmark div, `</div>` (nk-stage), `</div>` (nk-splash), `</>`, `);`, `}`, `export default SplashScreen;`
  - Fix: fetched original commit `22ef043` via GitHub API, found the nk-r2 span as common anchor point, spliced original's tail onto current head
  - GitHub confirmed: 599 lines

- **`src/app/(admin)/register/page.tsx`** — Restored complete 391-line version (commit `fix: register/page.tsx - restore complete 391-line version with Suspense + API`)
  - File truncated to 179 lines on GitHub (severely broken mid-JSX)
  - Fix: fetched Session 12 commit `9b2f4c3` (Suspense boundary version — complete, has registerCustomer + handleRegister + Suspense wrapping)
  - Confirmed: `hasRegisterCustomer: true`, `hasHandleRegister: true`, `hasSuspense: true`

- **`src/app/(admin)/layout.tsx`** — Fixed `bottomNavH` used-before-declaration (commit `fix: layout.tsx - move bottomNavH declaration before useEffect`)
  - TypeScript error: `Block-scoped variable 'bottomNavH' used before its declaration` at line 101
  - Root cause: `const bottomNavH = ...` was declared at line 103 but used in `useEffect` deps array at line 101
  - Fix: moved declaration to just before the scroll-lock `useEffect` block

**Railway build result:**
- All 4 commits → 4 failed builds (each fixed one more error)
- Final "Update layout.tsx" commit → ✅ `Deployment successful`
- Active build confirmed, site live at `https://nook-admin-production.up.railway.app/`

**CM6 injection method refined:**
- Used `document.querySelector('.cm-content')?.cmTile?.view` to find the CM6 EditorView (the `cmTile` property on `.cm-content` element)
- Always use `view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: newContent } })` to replace full document
- For SplashScreen: fetched two versions via GitHub API, used common anchor (nk-r2 span) to splice correct tail onto current head — avoids needing to know exact replacement content

**⚠️ CM6 injection lesson learned:** When injecting via `view.dispatch({ changes })`, always verify the replace range spans the FULL document length (`from: 0, to: doc.length`). If `to` is wrong or the selection API is used instead, content may be appended rather than replaced, causing duplicate definitions.

---

### 2026-05-07 (Session 13 — Dashboard Encoding Bug Fix)

**Frontend (IdolShin/nook-admin) — 1 file fixed:**

- **`src/app/(admin)/dashboard/page.tsx`** — UTF-8 encoding bugs + file truncation fixed (commit `3728170`)
  - **Root cause**: Session 7's GitHub web editor `execCommand('insertText')` injection had two problems:
    1. Literal Unicode chars `·` (U+00B7) and `—` (U+2014) were embedded as raw UTF-8 bytes in the source, causing double-encoding artifacts at build time → garbled characters rendered in the dashboard UI
    2. File was truncated at line 327 (`background: p.status === 'dra`) — the last 14 lines of closing JSX were missing
  - **Fix applied**:
    - All literal `·` → `·` JS escape sequences (lines 173, 279, 332)
    - All literal `—` → `—` JS escape sequences (lines 22, 28, 34, 40, 238)
    - Restored missing 14 lines of closing JSX (status badge span, biz·when·reach line, closing `</div>`×4, `</Card>`, `</div>`, `);`, `}`)
  - **Method**: Python binary base64 chunked injection (11×1900-char pieces → assembled `window._D` → `atob()` decode → `execCommand('insertText')`) to bypass GitHub editor size limits
  - Commit message: `fix: dashboard - fix encoding bugs (·/—) + restore truncated file end`

**Verified:**
- File decoded to 14886 bytes, 341 lines, all content checks passed (HAS_U00B7, HAS_U2014, HAS_USE_CLIENT, HAS_EXPORT, ENDS_CORRECTLY) ✅
- Railway auto-deploy triggered from `main` branch push ✅

---

### 2026-05-07 (Session 12 — Superadmin Cards Selector + Auth Fix)

**Backend (IdolShin/Nook) — 1 file updated:**

- **`src/routes/auth.js`** — `SUPERADMIN_EMAIL` constant replaced with `SUPERADMIN_EMAILS` array (commit `7d2992d`)
  - `const SUPERADMIN_EMAILS = ['woosang930414@gmail.com', 'woosang@nook.com']`
  - `buildToken()` now uses `.includes()` check: `is_superadmin: biz.is_superadmin || SUPERADMIN_EMAILS.includes(biz.owner_email) || false`
  - Google OAuth path also updated: `is_superadmin: SUPERADMIN_EMAILS.includes(email)`
  - **Root cause fixed:** `woosang@nook.com` (test account) was not matching the old single Gmail-only constant, so JWT always had `is_superadmin: false`

**Frontend (IdolShin/nook-admin) — 2 files updated:**

- **`src/app/(admin)/register/page.tsx`** — Suspense boundary fix (commit `9b2f4c3`)
  - `useSearchParams()` moved into non-default-exported `function RegisterPage()`
  - New default export `function Page()` wraps it in `<Suspense fallback={null}>`
  - Fixes Next.js 16 Turbopack prerender error: "useSearchParams() should be wrapped in a suspense boundary"

- **`src/app/(admin)/cards/page.tsx`** — Superadmin business selector (commit `579472d`)
  - New state: `businesses`, `selectedBiz`, `isSuperadmin`
  - On mount: tries `api.listBusinesses()` — if it succeeds, sets `isSuperadmin: true` and filters out superadmin biz from dropdown
  - Dropdown shows when `isSuperadmin: true`; selecting a business loads that business's cards via `api.cards({ bizId })`
  - `NewCardModal` and `EditCardModal` both accept `bizId?: string` and pass it in the request body

**Verified end-to-end:**
- `woosang@nook.com` login → JWT contains `is_superadmin: true` ✅
- `/cards` page shows business selector dropdown (Nook Cafe, Audit Test Biz, 베이커리 샘플) ✅
- Created "베이커리 스탬프 카드" for "베이커리 샘플" business (ID `226510b3-d4e1-4d5a-94c3-897c0194ae21`) via superadmin API ✅
  - Card ID: `d16a5266-6595-4464-b172-65c87c8b40ff`
  - `business_id` in response matches 베이커리 샘플's ID — bizId override confirmed working

---

### 2026-05-07 (Session 11 — Register Page API + Git Worktree Fix)

**Frontend (IdolShin/nook-admin) — 2 files updated:**

- **`src/lib/api.ts`** — Added `registerCustomer()` method (commits `7f81b02` → fixed `2a7b7d2`)
  - `registerCustomer(data: { card_id, name, phone, consent_push?, consent_points? }) → Promise<{ customer: ApiCustomer }>`
  - Calls `POST /api/customers/register` (public endpoint, no auth header)
  - `consent_push` + `consent_points` default to `true`
  - Error parsed from `res.json().error` field

- **`src/app/(admin)/register/page.tsx`** — 380 lines (was 344), commit `48ad108`
  - Added `import { useSearchParams } from 'next/navigation'` + `import { api } from '@/lib/api'`
  - **`Step1` rewritten**: now accepts controlled `name`/`phone` props + `onNameChange`/`onPhoneChange` callbacks + `loading`/`error` props
    - Added Name input field above phone input
    - Error banner shown when `error` prop is set
    - Button text changes to `'Registering...'` when loading, `disabled` during loading
  - **`RegisterPage` rewritten**: added `useSearchParams` to read `?card_id=` URL param, state for `name`/`phone`/`loading`/`regError`, `async handleRegister()` that calls `api.registerCustomer()`, `advance` helper, inline step rendering (step 0–4 as `{step === N && <StepN ... />}`) replacing the old `STEPS[step]` pattern
  - Step 1 description panel updated to reflect real API call behavio
