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
â  âââââââââââââââââââââââ  ââââââââââââââââââââââââââââ â
â  â   nook-backend       â  â   nook-admin (Next.js)   â â
â  â   Node.js/Express    â  â   Ap App Router + proxy.ts  â â
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
- **Customers page** â Export CSV (Blob download) + CouponPickerModal (send coupon to individual customer via `api.issueCoupon`)
- **Customers page sort** â sortable columns (Customer/Status/Stamps/Last visit), SortIcon component (ArrowUp/ArrowDown/ChevronsUpDown), fixed empty-state for "no search results" vs "no customers"

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
- [x] **Homepage** â Done (Session 7) â mobile responsive fix: `word-break: keep-all` on all Korean text, `overflow-x: hidden` at 980px, hero grid 55fr/45fr, h1 clamp
- [x] **Dashboard charts** â Done (Session 7) â wired to real API: KPI stats, line chart (30d stamps/redeems), donut (card type mix), activity feed (recent signups)
- [x] **New Card registratio bug** â Done (Session 8) â fixed 502 caused by truncated analytics.js on GitHub
- [x] **Customers page â Export CSV** â Done (Session 8) â Blob download with Name/Phone/Status/Stamps/Joined/LastVisit
- [x] **Customers page â Send coupon** â Done (Session 8) â CouponPickerModal per-customer coupon dispatch
- [x] **api.ts registerCustomer** ✅ Done (Session 11) — `registerCustomer()` added to api.ts, calls `POST /api/customers/register`
- [x] **Register page API** ✅ Done (Session 11) — name field added, `handleRegister` wired to real backend, card_id from URL param

### ð¡ Medium Priority
- [x] **Customer registration page** — ✅ Done (Session 11) — connected to real backend (`POST /api/customers/register`), name + phone fields, card_id from URL `?card_id=` param
- [ ] **Scanner app** â real camera QR/barcode scanning (jsQR library)
- [ ] **Google Wallet pass status** â COMPLETED on redeem, EXPIRED on expiry
      (so customer sees updated state in their wallet)
- [x] **Analytics page** â ~~wire to real DB data~~ â Done (Session 5)
- [ ] **Dashboard forms** â loading states, error messages, success toasts
- [ ] **Google Wallet publishing** â complete 3-step process in Pay Console

### ð¢ Later / Nice to Have
- [ ] **Apple Wallet** â $99/yr Apple Developer account needed
- [ ] **Stripe integration** â subscription billing per plan
- [ ] **Google Review coupon** â customer leaves review â auto-issue coupon
- [ ] **SMS notifications** â Twilio or similar
- [ ] **Multi-location business support**
- [ ] **White-label option** for Premium plan

---

## Wanted Features

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
- `woosang@nook.com` login JWT contains `is_superadmin: true` ✅
- /cards page shows business selector dropdown (Nook Cafe, Audit Test Biz, 베이커리 샘플) ✅
- Created "베이커리 스탬프 카드" for "베이커리 샘플" business (ID `226510b3-d4e1-4d5a-94c3-897c0194ae21`) via superadmin API ✅
  - Card ID: `d16a5266-6595-4464-b172-65c87c8b40ff`
  - `business_id` in response matches 베이커리 샘플 ID — bizId override confirmed working

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
  - **`RegisterPage` rewritten**: added `useSearchParams` to read `?card_id=` URL param, state for `name`/`phone`/`loading`/`regError`, `async handleRegister()` that calls `api.registerCustomer()`, inline step rendering replacing the old `STEPS[step]` pattern
  - Step 1 description panel updated to reflect real API call behavior

**Backend (IdolShin/Nook) — no code changes:**

- **Git worktree fixed** (no commit needed): `.claude/worktrees/naughty-bhaskara-9f4139/.git` had Windows absolute path in `gitdir`. Overwrote with relative path `gitdir: ../../../.git/worktrees/naughty-bhaskara-9f4139`. `git status` now works normally.
- **`src/routes/analytics.js`** — confirmed intact (200 lines) via Read tool. Linux sandbox mount was serving stale 172-line cached version — false alarm.
- **`CLAUDE.md`** — Session 8 changelog pushed via CodeMirror dispatch (commit `706c4fa`)

---

### 2026-05-07 (Session 11 — Restore Truncated nook-admin Files)

**Root Cause:** Multiple `nook-admin` files were truncated in sessions 7-8 by `document.execCommand('insertText', false, content)` which silently truncates content when the file is larger than ~5000 characters. Files were committed as broken truncated versions.

**Frontend (IdolShin/nook-admin) — 4 files fully restored:**

- **`src/app/(marketing)/marketing.css`** — Restored complete file (commit `b186a2c`)
- **`src/app/(admin)/dashboard/page.tsx`** — Restored complete 326-line file (commit `3dc0d06`)
- **`src/lib/api.ts`** — Restored complete file with all API methods (commit `8bfb4fa`)
- **`src/app/(admin)/cards/page.tsx`** — Restored from 612-line truncated version to 1029-line complete file (commit `3eb9ae7`)
  - Contains full: TypePill, StatusPill, FilterDropdown, NewCardModal, EditCardModal, StampGrid, CardDesignPreview, WalletCardPreview, RegistrationQRCard, CardDesigner, CardTile, CardsTable, CardDetail, CardsPage

**Method:** Base64 chunked injection via `atob()` + CodeMirror EditorView dispatch API. Files split into ~6KB base64 chunks, accumulated in `window._inject`, then dispatched via `view.dispatch({ changes: { from: 0, to: doc.length, insert: content } })`.

**Note:** Box-drawing/emoji characters in comments show as garbled (UTF-8 multi-byte encoding artifact from atob() byte-level decoding) — TypeScript compiles fine since they are in comments only.

---

### 2026-05-06 (Session 10 â Coupons Error Handling + GitHub Push)

**Frontend (IdolShin/nook-admin) â 1 file updated, pushed via GitHub web editor:**

- **`src/app/(admin)/coupons/page.tsx`** â 691 lines (was 666 lines), committed `fix: coupons - add error handling to CreateModal and IssuePanel`
  - Added `import { toast } from '@/lib/toast'`
  - **`CreateModal`**:
    - Added `const [createError, setCreateError] = useState('')`
    - `handleCreate`: validates `title.trim()` â sets `createError` + returns early if empty
    - `catch (e)`: extracts message, calls `setCreateError(msg)` + `toast(msg, 'error')`
    - Footer: added `{createError && <div style={{ margin: '0 24px', padding: '10px 14px', background: '#FBE2EC', ... }}>{createError}</div>}` above the nav buttons
  - **`IssuePanel`**:
    - Added `const [issueError, setIssueError] = useState('')`
    - `handleIssue`: clears `issueError` at start; `catch (e)` sets `issueError` + `toast(msg, 'error')`
    - `onDone()` moved from the "Done" button click to after `setResult(...)` in the try block
    - Added error banner `{issueError && <div ...>}` above the Cancel/Issue buttons

**Also confirmed (no changes needed):**
- **`src/app/(admin)/customers/page.tsx`** â search (`q`), segment filter (`seg`), sort (`sortBy`/`sortDir`) all already implemented via `useMemo`

---

### 2026-05-06 (Session 9 â Customers Page: Sort by Column + No-Results Empty State)

**Frontend (IdolShin/nook-admin) â 1 file updated:**

- **`src/app/(admin)/customers/page.tsx`** â ~526 lines, committed `feat: customers - sort by column + no-results empty state`
  - Added `ArrowUp, ArrowDown, ChevronsUpDown` to lucide-react imports
  - **New state**: `sortBy` ('name' | 'stamps' | 'lastVisit' | 'status', default 'name'), `sortDir` ('asc' | 'desc', default 'asc')
  - **`handleSort`**: toggles direction if same column, resets to 'asc' on new column
  - **`SortIcon` component**: renders `ChevronsUpDown` (inactive, 35% opacity) or `ArrowUp`/`ArrowDown` (active, green #1D9E75)
  - **`rows` useMemo** updated: filter first â then sort with STATUS_ORDER map (vip=0, active=1, new=2, at-risk=3)
  - **Sortable columns**: Customer (name), Status, Stamps, Last visit
  - **Fixed empty state**: split into `allCustomers.length === 0` ("No customers yet") vs `rows.length === 0` with data ("No results found" + Search icon + Clear filters button)
  - Commit hash: (Railway deploying)

---

### 2026-05-06 (Session 8 cont. â Customers Page: Export CSV + Send Coupon Modal)

**Frontend (IdolShin/nook-admin) â 1 file updated:**

- **`src/app/(admin)/customers/page.tsx`** â 426 lines (was 404 lines), committed `feat: customers - export CSV + send coupon modal`
  - Added `ApiCoupon` to imports from `@/lib/api`
  - Added `ResponsiveModal` import from `@/components/ui/ResponsiveModal`
  - **`CouponPickerModal`** new component (before `CustomerDetail`):
    - Loads active coupons via `api.coupons()` on mount
    - Issues coupon to single customer: `api.issueCoupon(couponId, { customer_ids: [customer.id], send_push: true })`
    - Visual state: loading / empty state (no active coupons) / coupon list with issue button
    - Success: button shows `â ë°ì¡ë¨` â auto-closes after 1400ms
    - Error: calls `toast(msg, 'error')`
  - **`CustomerDetail`** â added `onSendCoupon?: () => void` prop + "Send coupon" dashed-border button wired to it
  - **`CustomersPage`** â added `showCouponPicker` state + `handleExportCSV` function:
    - `handleExportCSV`: CSV headers (Name, Phone, Status, Stamps, Joined, Last Visit) â Blob â URL.createObjectURL â `<a download>` click â revoke URL
    - Export CSV button in toolbar wired to `handleExportCSV`
    - Both `CustomerDetail` instances (mobile sheet + desktop panel) have `onSendCoupon={() => setShowCouponPicker(true)}`
    - `CouponPickerModal` rendered when `showCouponPicker && selected`

---

### 2026-05-07 (Session 8 â ì ì¹´ë ë±ë¡ ë²ê·¸ ìì  / Backend 502 Fix)

**Root Cause:** `src/routes/analytics.js`ê° ì´ì  ì¸ììì GitHub ì¹ ìëí°ì `document.execCommand('insertText')` ì£¼ì ë°©ìì¼ë¡ ì»¤ë°ë  ë íì¼ì´ ì¤ê°ì ìë¦¼ (6008ììì truncate). `res.json()`, catch ë¸ë¡, `module.exports = router`ê° ëë½ëì´ Node.jsê° `SyntaxError: Unexpected end of input`ì ë°ììí¤ë©° ìë² í¬ëì â ì ì²´ API 502 Bad Gateway.

**Backend (IdolShin/Nook) â 1 file fixed:**

- **`src/routes/analytics.js`** â ìì í íì¼ë¡ ì¬ì»¤ë° (148ì¤, 5.25KB)
  - Unicode box-drawing chars (`â`) ì ê±° (ì¸ì½ë© ë¬¸ì  ë°©ì§)
  - Supabase ì²´ì¸ ë¨ì¼ ë¼ì¸ì¼ë¡ ìì¶ (íì¼ í¬ê¸° ì¶ì)
  - `res.json({...})`, catch block, `module.exports = router` ëª¨ë í¬í¨ íì¸
  - Commit: `fix: analytics.js - restore complete file (was truncated, caused 502)` (hash: `9bc4fce`)

**Verified:**
- `/health` â `{"status":"ok"}` â
- New Card ë±ë¡ â "Bug Fix Test Card" ìì± ì±ê³µ, ëª©ë¡ì ì¦ì ë°ì â
- ëìë³´ë ë¡ê·¸ì¸ ì ì â

**â ï¸ execCommand ì£¼ì ë°©ì ê²½ê³ :** GitHub ì¹ ìëí°ìì `document.execCommand('insertText', false, content)` ë°©ìì¼ë¡ ê¸´ íì¼(>5000ì)ì ì£¼ìíë©´ íì¼ì´ truncateë  ì ìì. í¥í ê¸´ íì¼ì Git CLI ëë GitHub APIë¥¼ íµí´ ì§ì  ì»¤ë° ê¶ì¥.

---

### 2026-05-06 (Session 7 cont. â Dashboard Real Data + api.ts Types)

**Backend (
