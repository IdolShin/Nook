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
| `businesses` | 가게/사장님 계정 — email, password_hash, plan, logo_url |
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
- [ ] **Analytics pages** — wire to real DB data
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

### 2026-05-02
- Fixed `/auth` 404 on Railway — Next.js 16 `middleware.ts` → `proxy.ts` migration
- Fixed nixpacks.toml — standalone static file copy + `HOSTNAME=0.0.0.0`
- Fixed "Failed to fetch" on login — added `NEXT_PUBLIC_API_URL` to Railway + CORS fix
- Admin dashboard login fully working at `https://nook-admin-production.up.railway.app/auth`
- CLAUDE.md fully rewritten with complete project status
