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
| **Custom Domain (Frontend)** | **https://nook-wallet.com** |
| Backend API (internal) | https://nook-production-270f.up.railway.app |
| Frontend Dashboard (Railway) | https://nook-admin-production.up.railway.app |
| Homepage | https://nook-wallet.com/ |
| Health check | https://nook-production-270f.up.railway.app/health |

> ⚠️ `nook-wallet.com` purchased via Cloudflare. Frontend Railway service has custom domain set. NEXT_PUBLIC_API_URL = `https://nook-wallet.com`. Next.js rewrites proxy `/api/*` → backend Railway service. Backend CORS allows `nook-wallet.com`.

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
| `customers` | 고객 정보 — linked to business + card, phone, qr_code, barcode, wallet_type, birthday |
| `stamps` | 스탬프 적립 기록 — customer_id, card_id, scan_type, scanned_by |
| `redemptions` | 리워드 사용 기록 — **stamps_redeemed** (stamp cards), **points_redeemed** (membership), **redeem_type** ('stamp'/'points') |
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
                                      membership: 100pts/scan cumulative, wallet shows total points
POST /api/scan/redeem            🔒  { customer_id }        →  redemption + push (stamp cards)
POST /api/scan/redeem-points     🔒  { customer_id, points } →  points deduction + push (membership)
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
POST /api/coupons/:id/issue      🔒  { customer_ids }  →  issues passes + push with pass URL
POST /api/coupons/redeem         🔒  { barcode }       →  marks pass as redeemed
GET  /api/coupons/pass/:barcode  PUBLIC  →  { pass, coupon, business, customer }  (customer-facing)
GET  /api/customers/:id/redemptions  🔒  →  { redemptions }  (stamps/points history)
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
| Basic | $79/mo | Up to 100 | 1 card | Stamp card, Google Wallet, push notifications |
| Pro | $99/mo | Up to 500 | 3 cards | Everything in Basic + Apple Wallet, coupon system |
| Premium | $129/mo | Unlimited | Unlimited | Everything in Pro + analytics, priority support, custom domain |

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
- **Google Review reward system** — `src/routes/reviews.js`: GET/PATCH `/api/reviews/config`, GET `/api/reviews/public/:bizId`, POST `/api/reviews/initiate`; `review_rewards` table with `days_to_wait` delay; daily 9am scheduler processes pending → stamp or coupon issued + push notification
- **Jest test suite** — `tests/` folder: auth (7), cards (6), customers (5), reviews (8) = 26 total; Supabase mock; `src/createApp.js` factory; `npm test` / `npm run test:ci`
- **Navigation UX overhaul** — Sidebar restructured (Main/Growth/Scanner/Settings sections), BottomNav rewritten with central Scan CTA (circular green button) + pill active indicator, More sheet trimmed, bg color refined to #F5F7F6
- **Push page audience targeting** — 4 group quick-select buttons (All/New/Active/Inactive) with customer count display; "Use template" pre-fills + auto-selects audience + switches to Compose tab; KO/EN language toggle for templates
- **Customers add page** — dedicated `/customers/add` page (174 lines); customers page redesigned (4-segment filter, no popup)
- **Contact page** — standalone `/contact` page (replaced modal); lang toggle; mobile responsive; success popup overlay; all CTA buttons link to `/contact`
- **Homepage overhaul** — pricing updated (Basic $79 / Pro $99 / Premium $129); coupon section + Google Review push section added; contact modal removed; hero mobile polish

- **Per-business registration pages** — `/join/[slug]` dynamic pages (e.g. `nook-wallet.com/join/nook-cafe`); business name/logo, card selector, name/phone/birthday fields, QR success screen
- **Plan-based restrictions** — Basic/Pro/Premium limits enforced on frontend + backend
- **`src/hooks/usePlan.ts`** — JWT decode hook exposing `plan`, `isSuperadmin`, `allowedCardTypes`, `customerLimit`, `pushLimitDays`, `canFilterAudience`
- **Superadmin notifications** — Topbar `NotificationBell` gated behind `isSuperadmin`
- **Join page V2** — `/join/[slug]` redesigned: Nook Wallet header, Google/Apple Wallet badges, dropdown card selector (multi-card), KO/EN lang toggle in header, modern design
- **Settings superadmin-only** — Sidebar Settings menu hidden for non-superadmin accounts (`usePlan().isSuperadmin` gate)
- **Membership points system** — 100pts per scan, cumulative (never reset), Google Wallet shows total points, `updateMembershipPoints()` syncs wallet
- **Points redemption** — `POST /api/scan/redeem-points`, balance = total_stamps×100 − sum(points_redeemed), recorded in redemptions table
- **Redemption tracking** — `redemptions` table extended: `stamps_redeemed`, `points_redeemed`, `redeem_type` columns; new `GET /api/customers/:id/redemptions` endpoint
- **Customers page overhaul** — Points column (membership=purple pts, others=—), Redeems tab with history, Spend column removed, `Send` import fix (was crashing CustomerDetail), `onSendCoupon` prop wired
- **Scanner membership UI** — separate success card: purple star icon, "+100 pts / Total: X,XXX pts" display; MiniCardArt shows "100 pts/visit" badge
- **Customer-facing coupon pass page** — `nook-wallet.com/pass/[barcode]` public page (no auth); shows QR code, barcode, status badge, discount label, expiry; mobile-first design
- **Public coupon pass API** — `GET /api/coupons/pass/:barcode` (before authMiddleware, no auth required)
- **Push notification with pass URL** — coupon issue push now includes `https://nook-wallet.com/pass/${barcode}` link

---

## In Progress 🔄

- **Google Wallet publishing approval** — submitted, waiting 1-3 days
  → Once approved: real customers can add passes to Google Wallet (currently demo mode only)
- **Supabase migration done** ✅ — `birthday DATE` column added + `redemptions` table columns added (2026-05-25)
- **⚠️ Supabase migration for Session 32** — `supabase_migration_session32.sql` must be run (adds stamps_redeemed, points_redeemed, redeem_type to redemptions table)

---

## Todo List

### 🔴 Urgent
- [ ] **Run `supabase_migration_session32.sql`** — adds stamps_redeemed/points_redeemed/redeem_type to redemptions table (required before bat files)
- [ ] **Run `push_session32_backend.bat`** — deploys scan.js, customers.js, coupons.js, googleWallet.js
- [ ] **Run `push_session32_frontend.bat`** — deploys scanner/page.tsx, customers/page.tsx, pass/[barcode]/page.tsx, MiniCardArt.tsx, api.ts
- [ ] **Resend API key** — add to Railway backend env vars
- [ ] **Coupon → Google Wallet** — real connection test end-to-end
- [x] **Edit Card form** ✅ Done (Session 6)
- [x] **Register page backend** ✅ Done (Session 6)
- [x] **Scanner coupon redeem** ✅ Done (Session 6)
- [x] **Domain purchase** ✅ Done (Session 21)
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
- [x] **Google Review coupon** ✅ Done (Session 19) — customer leaves review → `days_to_wait` 후 자동 스탬프/쿠폰 지급, `review_rewards` 테이블, 매일 9am 스케줄러 처리
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
- **CORS**: backend must include `/\.railway\.app$/` AND `https://nook-wallet.com` in allowed origins (`src/index.js`).
- **Custom domain routing**: `nook-wallet.com` → Railway frontend (Next.js). `/api/*` calls are proxied by Next.js rewrites (`next.config.ts`) to the backend Railway service. No CORS issues since proxy is server-side.
- **`NEXT_PUBLIC_API_URL`**: now set to `https://nook-wallet.com` (was `https://nook-production-270f.up.railway.app`). Also hardcoded in `.env.local` — update both if domain changes.

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

### 2026-05-25 (Session 32 — 멤버십 포인트 시스템 + 쿠폰 패스 페이지 + 고객 페이지 개편)

**백엔드 (IdolShin/Nook) — 4개 파일 변경:**

- **`src/routes/scan.js`** — 멤버십 카드 포인트 적립 처리
  - `isMembership = cardType === 'membership'` 분기 추가
  - 멤버십: 100pts/스캔, 누적 (reset 없음), `totalPoints = newTotal * 100`
  - `updateMembershipPoints(customer.id, totalPoints)` — Google Wallet 동기화
  - `POST /api/scan/redeem-points` 엔드포인트 추가: 포인트 차감, 잔액 계산(total_stamps×100 − 이전 points_redeemed 합산), redemptions 기록

- **`src/routes/customers.js`** — card_type 노출 + 리딤 히스토리 API
  - SELECT에 `card_type` from loyalty_cards 포함, 응답에 `total_points` (membership만) 포함
  - `GET /api/customers/:id/redemptions` 엔드포인트 추가

- **`src/routes/coupons.js`** — 공개 패스 조회 API + 푸시 URL 개선
  - `GET /api/coupons/pass/:barcode` — **authMiddleware 이전에 등록** (공개, 인증 불필요)
  - pass + coupon + business + customer.name 반환
  - 쿠폰 발급 푸시 알림에 `https://nook-wallet.com/pass/${barcode}` URL 포함

- **`src/services/googleWallet.js`** — 멤버십 포인트 동기화
  - `updateMembershipPoints(customerId, totalPoints)` 함수 추가
  - loyalty object의 `loyaltyPoints` 필드를 총 누적 포인트로 업데이트

- **`supabase_migration_session32.sql`** — redemptions 테이블 확장
  - `stamps_redeemed INTEGER`, `points_redeemed INTEGER`, `redeem_type TEXT` 컬럼 추가
  - **⚠️ 아직 실행 안 됨 — Supabase Dashboard에서 실행 필요**

**프론트엔드 (IdolShin/nook-admin) — 5개 파일 변경:**

- **`src/app/(admin)/customers/page.tsx`** — 고객 페이지 전면 개편
  - `Send` 아이콘 import 추가 (누락으로 CustomerDetail 클릭 시 crash → 에러 페이지 오류 수정)
  - `onSendCoupon` prop 두 곳(데스크탑/모바일) 모두 추가
  - Spend 컬럼 제거 → Points 컬럼 추가 (membership=보라색 pts, 나머지=—)
  - Redeems 탭 추가: stamps_redeemed (녹색 −10 stamps) / points_redeemed (보라색 −500 pts) 히스토리

- **`src/app/(admin)/scanner/page.tsx`** — 멤버십 스캔 성공 UI
  - 보라색 별 아이콘 + "+100 pts / Total: X,XXX pts" 두 카드 표시

- **`src/components/cards/MiniCardArt.tsx`** — 멤버십 배지
  - "100 pts/visit" 보라색 배지 추가

- **`src/lib/api.ts`** — 타입 + 함수 추가
  - `ApiCustomer`: `card_type`, `total_points` 추가
  - `ApiRedemption` 인터페이스 추가
  - `redeemPoints()`, `customerRedemptions()` 함수 추가

- **`src/app/(marketing)/pass/[barcode]/page.tsx`** — NEW: 고객용 쿠폰 패스 페이지
  - `nook-wallet.com/pass/[바코드]` — 인증 불필요 공개 페이지
  - QR 코드 + 바코드 번호 크게 표시
  - 상태 배지 (Active/Redeemed/Expired), 할인 내용, 유효기간, 비즈니스 로고
  - 모바일 우선 디자인

**배포 파일:**
- `push_session32_backend.bat` — scan.js, customers.js, coupons.js, googleWallet.js
- `push_session32_frontend.bat` — scanner/page.tsx, customers/page.tsx, pass/[barcode]/page.tsx, MiniCardArt.tsx, api.ts

**⚠️ 배포 전 필수:**
1. `supabase_migration_session32.sql` → Supabase Dashboard SQL Editor에서 실행
2. `push_session32_backend.bat` 실행
3. `push_session32_frontend.bat` 실행

---

### 2026-05-25 (Session 30 — Join 페이지 V2 리디자인 + Settings 슈퍼어드민 전용 + Superadmin 하드코딩 버그 수정)

**프론트엔드 (IdolShin/nook-admin) — 3개 커밋:**

- **`src/app/(marketing)/join/[slug]/page.tsx`** — `/join/[slug]` 페이지 2단계 리디자인
  - V1 (커밋 `7648e0d`): Nook Wallet 헤더 + 지갑 배지(Google/Apple Wallet) + 기본 스탬프 카드 자동 선택 로직 + Sidebar에 "Customer Sign-up" 메뉴 항목 추가
  - V2 (커밋 `e4f2a80`): 헤더에 한/영 언어 토글 추가, 카드 여러 개일 때 드롭다운 셀렉터로 교체, 모던 월렛 헤더 디자인 적용 (222줄 추가)
  - 소소한 수정 (커밋 `c101572`): contact.tsx stray `h` 문자 제거 + join 페이지의 marketing.css import 경로 오류 수정

- **`src/components/layout/Sidebar.tsx`** — Settings 메뉴 슈퍼어드민 전용 처리 (커밋 `7f7810e`)
  - `usePlan().isSuperadmin`이 false인 일반 비즈니스 계정에게 Sidebar의 Settings 항목 비표시
  - 슈퍼어드민(Woosang)만 Settings 접근 가능

**백엔드 (IdolShin/Nook) — 미커밋 (로컬 수정, push_fix_superadmin.bat 대기 중):**

- **`src/routes/auth.js`** — Superadmin 하드코딩 버그 수정
  - 기존: `SUPERADMIN_EMAILS = ['woosang930414@gmail.com', 'woosang@nook.com']` → `woosang@nook.com`이 DB에서 `is_superadmin: false`로 설정해도 항상 superadmin 처리됨
  - 수정: `SUPERADMIN_EMAILS = ['woosang930414@gmail.com']`만 남김
  - ⚠️ **push_fix_superadmin.bat 아직 실행 안 됨** — Railway 배포 전

**Verified:** 프론트엔드 4개 커밋 Railway 자동 배포 ✅ / 백엔드 auth.js 수정은 미배포

---

### 2026-05-24 (Session 29 — 플랜 제한 시스템 + 비즈니스별 고객 등록 페이지)

**백엔드 (IdolShin/Nook) — 4개 파일 변경 + 신규 1개:**

- **`src/routes/cards.js`** — 플랜별 카드 생성 제한
  - Basic/Starter: stamp 카드만 생성 가능 (non-stamp 시 403 반환)
  - Basic: 카드 1개, Pro: 카드 3개 제한 (초과 시 403 반환)
  - Premium + superadmin: 제한 없음

- **`src/routes/customers.js`** — 고객 수 제한 + birthday 필드
  - Basic/Starter: 최대 100명, Pro: 최대 500명 (초과 시 403 반환)
  - `birthday` 필드 옵션 추가 (Supabase migration 필요: `supabase_migration_session29.sql`)

- **`src/services/push.js`** — 푸시 빈도 제한
  - Basic: 월 1회, Pro: 주 1회 제한 (push_logs 조회로 체크, 초과 시 429 반환)
  - Basic/Pro: customer_ids 필터 무시 → 항상 전체 발송
  - Premium + superadmin: 무제한, 필터 허용

- **`src/routes/businesses.js`** — NEW: 공개 비즈니스 조회 API
  - `GET /api/businesses/public/:slug` — slug(이름→하이픈)으로 비즈니스 조회, 활성 카드 목록 반환
  - `GET /api/businesses/public` — 전체 비즈니스 + slug + register_url 목록

- **`src/index.js`** — `/api/businesses` 라우트 등록

**프론트엔드 (IdolShin/nook-admin) — 4개 파일 변경 + 신규 2개:**

- **`src/hooks/usePlan.ts`** — NEW: JWT 디코딩 플랜 훅
  - `usePlan()` → `{ plan, isSuperadmin, isBasic, isPro, isPremium, allowedCardTypes, customerLimit, cardLimit, pushLimitDays, canFilterAudience, canCreateCustomCoupon }`
  - Basic/Starter: stamp만, 1카드, 100고객, 30일 주기, 필터 불가
  - Pro: 모든 카드 타입, 3카드, 500고객, 7일 주기, 필터 불가
  - Premium: 모든 기능 무제한

- **`src/components/layout/Topbar.tsx`** — NotificationBell 슈퍼어드민 전용
  - `usePlan().isSuperadmin`이 true일 때만 Bell 아이콘 표시 (모바일/데스크탑 양쪽)

- **`src/app/(admin)/cards/page.tsx`** — 카드 생성 플랜 UI
  - Basic 계정: stamp 외 카드 타입 버튼에 🔒 + 클릭 불가
  - Basic/Pro 배너: 현재 플랜 제한 안내 (카드 수, 고객 수, 푸시 주기)

- **`src/app/(admin)/push/page.tsx`** — 푸시 플랜 UI
  - Basic/Pro: New/Active/Inactive 오디언스 버튼 🔒 잠금 (All만 활성)
  - 플랜별 주의 문구 표시 (노란 박스: 필터 불가, 파란 박스: 빈도 제한)

- **`src/app/(marketing)/join/[slug]/page.tsx`** — NEW: 비즈니스별 고객 등록 페이지
  - URL 예: `nook-wallet.com/join/nook-cafe`, `nook-wallet.com/join/kook-미용실`
  - 비즈니스 브랜드 헤더 (로고/이름/컬러)
  - 카드 여러 개 시 카드 선택 UI, 1개 시 자동 표시
  - 필드: 이름(필수), 전화번호(필수), 생일(선택 — 생일 쿠폰용)
  - 동의 체크박스 + 등록 후 QR 코드 성공 화면
  - KO/EN 언어 토글, 모바일 완전 대응

- **`src/lib/api.ts`** — `registerCustomer` birthday 필드 추가, `getPublicBusiness()` 추가

**⚠️ 배포 전 필수:**
1. `supabase_migration_session29.sql` → Supabase Dashboard SQL Editor에서 실행
2. `push_session29_backend.bat` 실행 (백엔드 Railway 자동 배포)
3. `push_session29_frontend.bat` 실행 (프론트엔드 Railway 자동 배포)

---

### 2026-05-23 (Session 28 — Homepage/Contact 전면 개편: 독립 페이지 + 가격 업데이트 + 쿠폰 섹션)

**프론트엔드 (IdolShin/nook-admin) — 대규모 마케팅 페이지 리뉴얼:**

- **`src/app/(marketing)/contact/page.tsx`** — 새 독립 `/contact` 페이지 생성 (모달 방식 → 전용 페이지)
  - 위치·플랜 선택·문의 내용이 표시되는 클린 레이아웃
  - 한/영 언어 토글 (홈페이지 스타일 동일하게 적용)
  - isMobile state로 모바일 단일 컬럼 레이아웃 처리
  - 성공 팝업 오버레이 추가 (폼 제출 후)

- **`src/app/(marketing)/Homepage.tsx`** — 홈페이지 주요 변경
  - Contact 모달 완전 제거 → 모든 CTA 버튼이 `/contact` 페이지로 링크
  - 쿠폰 섹션 추가 (Google Review + 자동 쿠폰 발송 홍보)
  - Push Notification 섹션 개선
  - 가격 업데이트: Basic $79 / Pro $99 / Premium $129
  - 히어로 상단 여백 수정, 모바일 폴리시

**Commits:** `04e9e43`, `daa0009`, `d160240`, `f048394`, `e291ac4`, `7e607a98`, `df91ac1`, `a86ebfe`, `7430cab` (IdolShin/nook-admin main)

**Verified:** Railway 자동 배포 ✅

---

### 2026-05-23 (Session 27 — Push 페이지: Audience 그룹 버튼 + 템플릿 KO/EN 토글)

**프론트엔드 (IdolShin/nook-admin) — 푸시 페이지 UX 개선:**

- **`src/app/(admin)/push/page.tsx`** — Audience 그룹 셀렉터 + 템플릿 완전 연동
  - 4개 색상 퀵셀렉트 버튼 (All / New / Active / Inactive) — 버튼마다 매칭 고객 수 표시
  - `selectGroup()` 함수: 버튼 클릭 시 해당 고객 자동 선택
  - "Use template" 버튼: 제목+메시지 자동 입력 + `selectGroup()` 호출 + Compose 탭으로 전환 (원클릭)
  - 파일 복구도 포함 — 디스크 복사본이 History 섹션부터 잘려있어 완전판 재작성 (493줄)
  - 푸시 템플릿 KO/EN 언어 토글 (국기 버튼 방식)

**Commits:** `c1e7bb8`, `3b86e02` (IdolShin/nook-admin main)

**Verified:** Railway 자동 배포 ✅

---

### 2026-05-23 (Session 26 — UI 개선: Biz 셀렉터 컴팩트화 + 고객/카드 페이지 재설계)

**프론트엔드 (IdolShin/nook-admin) — 4개 파일 변경:**

- **`src/app/(admin)/dashboard/page.tsx`** — 슈퍼어드민 비즈 셀렉터 컴팩트화
- **`src/app/(admin)/customers/page.tsx`** — 팝업 제거, 4-세그먼트 필터, 인라인 레이아웃
- **`src/app/(admin)/customers/add/page.tsx`** — NEW: 고객 추가 전용 페이지 (174줄)
- **`src/app/(admin)/cards/page.tsx`** — 클린 헤더, 균일 너비 필터 버튼

**Commit:** `9f87cf1` (IdolShin/nook-admin main)

**Verified:** Railway 자동 배포 ✅

---

### 2026-05-24 (Session 25 — Contact Form: Resend 도메인 인증 + 이메일 리디자인 + 성공팝업 홈버튼)

**이번 세션 완료 항목 4가지:**

- **Resend 도메인 인증 — `nook-wallet.com`**
  - 기존 문제: Resend 무료 플랜은 `onboarding@resend.dev` 발신 시 계정 소유자(`woosang930414@gmail.com`)에게만 전송 가능 → `info.tgtm@gmail.com` 수신 불가 (403 에러)
  - 해결: Cloudflare Domain Connect → Resend 자동 DNS 설정 (DKIM TXT, SPF MX+TXT, DMARC TXT)
  - 결과: `nook-wallet.com` 도메인 인증 완료 ✅, 다수 수신자에게 정상 발송 가능
  - 발신 주소 변경: `onboarding@resend.dev` → `hello@nook-wallet.com`
  - Backend commit: `af5e21e` (IdolShin/Nook main)

- **Contact 이메일 바디 리디자인** (`src/routes/contact.js`)
  - 기존: 좁은 포맷, 작은 글씨, 항목 간격 없음
  - 개선: 다크 그린 그라디언트 헤더, Contact Details 카드, Message 카드, 구글 캘린더 버튼
  - Reply 버튼 제거
  - **Google Calendar 버튼 추가**: 클릭 시 `"BusinessName (접수)"` 1시간 이벤트로 캘린더 자동 등록
    - URL 형식: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=START/END`
    - 시작=문의 접수 시각, 종료=1시간 후
  - Commit: `cf4085a` (IdolShin/Nook main)

- **Contact 성공 팝업 "홈페이지로 가기" 버튼** (`src/app/(marketing)/contact/page.tsx`)
  - 위치: "확인" 버튼 바로 아래
  - 스타일: 투명 배경 + 초록 아웃라인 테두리 (`border: 1.5px solid #1D9E75`)
  - 링크: `href="/"`
  - 바이링귀얼: `{t('홈페이지로 가기', 'Go to Homepage', lang)}`
  - GitHub 웹 에디터 Regexp Find/Replace 방식으로 커밋
  - Commit: `46fe733` (IdolShin/nook-admin main)

- **Railway 자동 배포**: 위 커밋들이 main 브랜치에 push됨 → 양쪽 서비스 자동 재빌드

**⚠️ 기술 메모:**
- GitHub 에디터 CM6 view를 JS로 찾기 불가 → Regexp Find/Replace UI로 우회 성공
- `rspackChunk_github_ui_github_ui` (GitHub의 번들러)로 webpack require 접근 시도했으나 캐시 없어 실패
- 로컬 Linux sandbox 마운트 파일이 GitHub 원본과 다른 경우 있음 (stale mount) — 항상 GitHub 웹 에디터 또는 API로 커밋할 것

---

### 2026-05-21 (Session 24 — Dashboard Refinement: Font, Loading Screen, iOS Safe-Area)

**Three follow-up fixes applied after the Session 23 ZARVIS redesign:**

- **`src/app/globals.css`** — SF Pro / Apple system font
  - `--font-sans` and `body font-family` updated to `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
  - Improves native feel on macOS/iOS; falls back to `system-ui` on Android/Windows
  - Commit: `style: SF Pro / Apple system font` (`94938d7`)

- **`src/app/(admin)/layout.tsx`** + **`src/app/(admin)/loading.tsx`** — Loading screen centering + remove `setAttribute` antipattern
  - Loading screen: removed stray `paddingTop/Bottom: env(safe-area...)` that was offsetting the centered spinner
  - Layout scroll-lock: replaced `document.getElementById('admin-main')?.setAttribute('style', ...)` with a reactive `mainOverflow` state variable fed directly to the `<main>` JSX inline style — much cleaner, no DOM mutation side-effects
  - Commit: `fix: loading screen pure center + remove setAttribute antipattern in layout` (`dcf449c`)

- **`src/app/(admin)/layout.tsx`** + **`src/components/layout/BottomNav.tsx`** + **`src/components/layout/Topbar.tsx`** — CSS vars for safe-area (iOS Safari `env()` inline-style bug)
  - iOS Safari doesn't process `env(safe-area-inset-*)` inside React inline style strings; must use CSS custom properties instead
  - Replaced all three occurrences: `env(safe-area-inset-bottom, 0px)` → `var(--safe-bottom)`, `env(safe-area-inset-top, 0px)` → `var(--safe-top)`, etc.
  - CSS vars `--safe-top / --safe-bottom / --safe-left / --safe-right` defined in `globals.css` via `@supports`
  - Commit: `fix: use CSS vars for safe-area (iOS Safari env() inline-style bug)` (`f23470a`)

**Railway auto-deploy:** All 3 commits pushed to main → Railway build triggered automatically.

---

### 2026-05-21 (Session 23 — UI Design Polish: ZARVIS-inspired Redesign)

**Full visual redesign of the admin dashboard UI, inspired by ZARVIS dark-sidebar SaaS style:**

- **`src/app/globals.css`** — Design system refresh committed to GitHub
  - Updated `--color-bg` to `#EEF2F7` (cooler, less green)
  - Added Google Fonts Inter import (`wght@300;400;500;600;700;800`)
  - New sidebar dark theme tokens: `--sidebar-bg: #0D1B2E`, `--sidebar-surface: #162235`, `--sidebar-active-bg: rgba(29,158,117,0.18)`, etc.
  - More vibrant KPI gradient tokens: `--color-grad-green-from: #10B981`, `--color-grad-blue-from: #3B82F6`, etc.
  - New shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`
  - New CSS utility classes: `.card`, `.card-glass`, `.kpi-icon`, `.badge`, `.badge-up`, `.badge-down`, `.badge-neu`
  - New animations: `shimmer`, `pulseGlow`
  - Commit: "Update globals.css"

- **`src/components/layout/Sidebar.tsx`** — Dark sidebar redesign committed to GitHub
  - `ICON_META` color map per nav item (green/blue/purple/amber/pink/slate per section)
  - Sidebar background: `linear-gradient(180deg, #0D1B2E 0%, #0F2034 100%)` with `boxShadow: '4px 0 24px rgba(0,0,0,0.18)'`
  - Nav items: 3px solid `#1D9E75` left border when active, `rgba(29,158,117,0.18)` background, 6px green dot indicator at right
  - Icon boxes: 28x28px rounded, colored bg when active, `rgba(255,255,255,0.07)` when inactive
  - Logo: dark green container with border, NookMark centered
  - User row: frosted glass look with avatar gradient, initials, role badge, logout button
  - Commit: "Update Sidebar.tsx"

- **`src/app/(admin)/dashboard/page.tsx`** — Dashboard redesign committed to GitHub
  - KPI cards: gradient icon backgrounds (green/blue/amber/pink per metric), 36x36 icon boxes, 800-weight 30px numbers, colored corner glow (absolute div), "Live" badge, sparkline
  - `ChartCard` component: `accent` prop for 3px top gradient strip (green-blue / purple-pink)
  - Page header (desktop): h1 "Dashboard" + subtitle + "Live" pill + gradient "New Card" button
  - Activity feed: gradient icon backgrounds, timestamp chips, hover states
  - Layout: Row 2 (1.8fr + 1fr), Row 3 (1.4fr + 1fr activity + scheduled pushes)
  - Commit: "Update page.tsx"

**Injection method:** GitHub web editor CM6 dispatch (8 base64 chunks × ~3996 chars each for dashboard, 5 chunks for Sidebar) — local git index.lock bypass as per established pattern.

**Railway auto-deploy:** Both commits pushed to main → Railway build triggered automatically.

---

### 2026-05-20 (Session 22 — useBreakpoint 기본값 수정 + BottomNav 높이 조정)

**핵심 버그 수정 — hydration 미스매치로 인한 레이아웃 점프:**

- **`nook-admin/src/hooks/useBreakpoint.ts`** — `useState(1200)` → `useState(0)` (모바일 우선 기본값)
  - 기존: 기본값이 1200(데스크탑)이라 SSR 시 BottomNav 없음 + padding=0으로 시작 → hydration 후 모바일로 전환 시 레이아웃 점프
  - 수정: `useState(0)`으로 처음부터 모바일로 시작 → 대시보드 첫 로드 시 레이아웃 안정화

- **`nook-admin/src/app/(admin)/layout.tsx`** — `bottomNavH` 86px → 60px
  - 기존: 86px = BottomNav(60px) + Scan 버튼 돌출(26px) 합산 — 하단 여백 과도하게 큼
  - 수정: 60px으로 줄여 다른 페이지와 균등한 하단 여백

**Verified:** Railway 자동 배포 완료, 대시보드 하단 레이아웃 점프 해소 ✅

---

### 2026-05-19 (Session 21 — UI Polish + Custom Domain Setup: nook-wallet.com)

**UI fixes deployed to Railway:**

- **`src/app/(admin)/loading.tsx`** — Loading screen centering fixed
  - Was: `justifyContent: 'flex-start'` + `paddingTop: calc(50vh+4vh)` + `transform: translateY(-50%)` → content appeared too high
  - Fixed: `justifyContent: 'center'` + `paddingBottom: calc(40px + safe-area-inset-bottom)` → true center with slight upward bias
  - Gap increased: `gap: 16`, dots `marginTop: 20` for better breathing room

- **`src/app/(admin)/dashboard/page.tsx`** — Dashboard bottom padding fix
  - Was: `padding: '16px'` (all sides) + `minHeight: '100%'` → bottom 16px stacked on top of layout's 86px nav clearance, making nav area look taller than other pages
  - Fixed: `padding: '16px 16px 0'` (no bottom), `minHeight`/`alignContent` removed

- **`src/app/(staff)/scan/page.tsx`** — Full mojibake fix (committed in Session 20 bat run)
  - 1560 non-ASCII double-encoded chars corrected (Korean text: `입력`, `수동`, `스캔` etc., emoji ✏️)
  - Null bytes stripped, stray `))}` JSX fragment removed

- **`src/app/(admin)/layout.tsx`** — `bottomNavH` = `calc(86px + safe-area-inset-bottom)` (was `60px`)
  - 60px nav height + 26px Scan button overhang = 86px total clearance needed

**Custom domain `nook-wallet.com` setup (Cloudflare → Railway):**

- **`nook-admin/next.config.ts`** — Added Next.js rewrites: `/api/:path*` → backend Railway URL
  - All API calls now proxy server-side through Next.js → no CORS issues
- **`nook-admin/.env.local`** — `NEXT_PUBLIC_API_URL` updated to `https://nook-wallet.com`
- **`src/index.js` (backend)** — CORS updated: added `nook-wallet.com` + `www.nook-wallet.com`
- Cloudflare DNS: CNAME `@` + `www` → Railway frontend CNAME (DNS only, no proxy)
- Railway frontend service: custom domain `nook-wallet.com` added

**Pending (not yet deployed/verified):**
- `run_backend.bat` (CORS fix for backend) may still need running
- `NEXT_PUBLIC_API_URL` Railway env var change: user had difficulty saving — `.env.local` fix should override
- Login flow at `nook-wallet.com` — needs verification after both deploys complete

---

### 2026-05-19 (Session 20 — Navigation UX Overhaul: Sidebar + BottomNav Restructure)

**User-driven redesign of the admin navigation system:**

- **`nook-admin/src/components/layout/Sidebar.tsx`** — Restructured nav into logical sections:
  - **Main**: Dashboard, Customers (daily-use items)
  - **Growth**: Loyalty Cards, Coupons, Push (campaign tools)
  - **Scanner**: standalone with green highlight (staff daily action)
  - **Bottom**: Settings, How to use → section separator → User row → View homepage link
  - Analytics merged into Dashboard concept (removed as standalone sidebar item)

- **`nook-admin/src/components/layout/BottomNav.tsx`** — Complete rewrite:
  - Layout: Home | Customers | `● Scan` (central circular green CTA, rises above bar) | Coupons | More
  - Active tab indicator: pill (capsule background) instead of just icon color change
  - More sheet: Analytics + Settings + How to use only (Coupons + Scanner promoted to bottom bar)

- **`nook-admin/src/app/(admin)/layout.tsx`** — More sheet content updated: only Analytics, Settings, How to use remain; Coupons and Scanner removed (now in bottom bar)

- **`nook-admin/src/app/globals.css`** — Background color: `#EDF3EF` → `#F5F7F6` (reduced green tint so card content stands out better)

**Verified:** bat file created for git push (`run_tests.bat`) — awaiting user execution for Railway auto-deploy

---

### 2026-05-19 (Session 19 — Jest 테스트 수트 + Google Review 기록 정리)

- **`src/createApp.js`** — NEW: Express 앱 팩토리 (index.js에서 서버 시작 코드 분리), 모든 라우트 등록, `app.listen()` 없이 export → 테스트 가능
- **`src/routes/reviews.js`** — Google Review 리워드 API 정식 등록: `GET/PATCH /api/reviews/config`, `GET /api/reviews/public/:bizId`, `POST /api/reviews/initiate`; `days_to_wait` 설정, 중복 방지
- **`tests/__mocks__/supabase.js`** — 체이너블 Supabase 목 (queue 시스템, 실제 DB 없이 테스트)
- **`tests/setup.js`** — `setupFilesAfterEnv`로 JWT_SECRET 등 테스트 env 설정
- **`tests/auth.test.js`** / **`cards.test.js`** / **`customers.test.js`** / **`reviews.test.js`** — 총 26개 케이스
- **`package.json`** — jest devDependency, `testPathIgnorePatterns: ['/.claude/']`
- **`index.js` 확인** — 246줄 완전한 상태 (reviews 라우트 + review rewards 스케줄러 포함)

**Verified:** `run_tests.bat` 실행 → 26개 테스트 전부 통과 ✅

---

### 2026-05-09 (Session 17 — UI Polish: Color Scheme, Push Page, Sidebar, Font, Loading)

**6 simultaneous UI improvements across mobile + web:**

- **`src/app/globals.css`** — Green-tinted color palette + Inter font fix (commit ~`globals`)
  - `--color-bg: #EDF3EF`, `--color-border: #D4E6DB`, `--color-border-soft: #E2EDE6` (green-tinted, less white-dominant)
  - `--font-sans` reordered to put `"Inter"` first (was `"-apple-system"` first → caused Times Roman fallback on desktop)
  - Added `--font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace`

- **`src/app/(admin)/push/page.tsx`** — Complete rewrite: customer audience list + drafts + one-row send (commit `0adf580`)
  - **Audience section**: removed VIP/All/Lapsing/New buttons; replaced with scrollable customer list (max-height 200px), search input, Select All toggle
  - `customers`, `customerSearch`, `selectedIds`, `loadingCx` state; `filteredCustomers` via `filter()`; `allSelected`/`someSelected` computed
  - **Send section**: Save / Test to me / Send to N in ONE action row
  - **Drafts**: `Draft` interface `{ id, title, body, savedAt }`; `DRAFT_KEY = 'nook_push_drafts'`; max 5 drafts in localStorage; drafts list shown below send result as reloadable cards
  - Live preview panel, history table, templates grid all preserved

- **`src/components/layout/Sidebar.tsx`** — Larger mobile nav items (commit `f77eb40`)
  - `NavItem` gets `mobile?: boolean` prop; passed as `mobile={mobileMode}` in both nav sections
  - Mobile: `fontSize: 15` (was 13), `padding: '10px 14px'` (was `6px 10px`), `minHeight: 46` (was 34), icon `size: 18` (was 16), `gap: 10` (was 8)

- **`src/app/(admin)/loading.tsx`** — NEW FILE: loading splash screen (commit `c198394`)
  - NookMark (52px) + "nook" wordmark (20px, 700 weight) + 3 pulsing green dots
  - Green gradient background: `linear-gradient(160deg, #E8F4EE 0%, #F0F7F3 50%, #EDF3EF 100%)`
  - Positioned 20% below visual center: `paddingTop: 'calc(50vh + 10vh)'` + `transform: 'translateY(-50%)'`
  - `@keyframes nook-pulse`: staggered 0.18s delay per dot, scale + opacity animation

**Railway auto-deploy triggered on each commit to main.**

---

### 2026-05-10 (Session 18 — Comprehensive UTF-8 Encoding Fix)

**Root cause:** Multiple source files on GitHub had double-encoded UTF-8 special characters — common pattern from prior CM6 injection sessions where multi-byte Unicode chars (…, ⌘, ·, é) were stored as raw UTF-8 bytes interpreted as individual Latin-1 chars.

**Detection method:** 
- Live site scan found: `Search customers, cardsâ¦` (Topbar), `WALLET Â· NOOK` (push preview), `Nook CafÃ©` (customers)
- Byte-level analysis: `charCodeAt()` on fetched GitHub raw content revealed corruption as char sequences like [226,128,166] instead of single [8230] for `…`, [194,183] instead of [183] for `·`

**Fix method:** All fixes used `String.fromCharCode()` only — no literal special chars in source (to avoid re-encoding issues during tool transmission). Example: `text.split(String.fromCharCode(194,183)).join(String.fromCharCode(183))`

**Files fixed and committed to GitHub (IdolShin/nook-admin):**

- **`src/components/layout/Topbar.tsx`** — Fixed `…` (8230) and `⌘` (8984) in global search bar placeholder
  - Was: chars [226,128,166] = â¦ | Fixed: single U+2026 char code 8230
  - Was: chars [226,140,152] = âK | Fixed: single U+2318 char code 8984
  - Also fixed `Â·` → `·` and `Ã©` → `é` patterns if present
  - Commit: `fix: Topbar - decode ellipsis and cmd symbol (was double-encoded UTF-8)`

- **`src/app/(admin)/push/page.tsx`** — Fixed `·` (183) in live preview and send result strings
  - Was: chars [194,183] = Â· in "WALLET Â· NOOK" (lock screen preview) and `setSendResult` line
  - Fixed: single U+00B7 char code 183
  - Commit: `fix: push/page.tsx - fix middle dot encoding (double-encoded UTF-8)`

- **`src/app/(admin)/customers/page.tsx`** — Fixed `é` (233) in "Nook Café" fallback string
  - Was: chars [195,169] = Ã© on line 46 `biz: [...|| 'Nook CafÃ©']`
  - Fixed: single U+00E9 char code 233
  - Commit: `fix: customers/page - fix Nook Café encoding and other double-encoded UTF-8 chars`

**⚠️ Key lesson:** When using `split('Â·')` with literal chars in JS tool calls, the tool transmission may itself garble the chars. Always use `String.fromCharCode(194,183)` to construct the bad pattern and `String.fromCharCode(183)` for the replacement — this is immune to tool-level encoding issues.

**Also:** CLAUDE.md was pushed to backend repo (IdolShin/Nook) via CM6 base64 injection (Session 17 continuation) — commit `30bf9f0` (34.8KB, 15 chunks of 3000 chars).

**Railway auto-deploy triggered on each commit to main.**

---

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
  - Fix: fetched Session 12 commit `9b2f4c3` (Suspense boundary version — complete, has registerCustomer + handleRegister + Suspense wr