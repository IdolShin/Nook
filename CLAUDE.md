# Nook Loyalty Platform

Digital loyalty card service — think Boomerangme. Businesses create stamp/cashback cards; customers collect stamps via QR scan and add cards to Google Wallet.

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js + Express |
| Database | Supabase (Postgres) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Wallet | Google Wallet API (service account) |
| Push | Web Push (VAPID via web-push) |
| QR | qrcode npm package |
| Deployment | Railway |

## Deployment

- **Production:** https://nook-production-270f.up.railway.app
- **Dashboard:** https://nook-production-270f.up.railway.app/dashboard/
- **Health:** https://nook-production-270f.up.railway.app/health

## Project Structure

```
src/
├── index.js                  # Express entry point, route wiring
├── routes/
│   ├── auth.js               # POST /api/auth/register|login|scanner-token
│   ├── cards.js              # GET|POST /api/cards, PATCH /api/cards/:id
│   ├── customers.js          # POST /api/customers/register, GET /api/customers
│   ├── scan.js               # POST /api/scan (stamp), POST /api/scan/redeem
│   └── wallet.js             # POST /api/wallet/google/create|stamp
├── services/
│   ├── googleWallet.js       # Loyalty class/object creation, JWT link, updateWithMessage
│   └── push.js               # Web push + POST /api/push/broadcast router
├── middleware/
│   └── auth.js               # JWT authMiddleware
├── db/
│   ├── supabase.js           # Supabase client (service role)
│   └── schema.sql            # DB schema — run once in Supabase SQL editor
└── public/
    └── index.html            # Self-contained dashboard (login + broadcast UI)
```

## Environment Variables (Railway)

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
JWT_SECRET
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://nook-production-270f.up.railway.app
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_EMAIL
GOOGLE_SERVICE_ACCOUNT_BASE64   # base64-encoded google-service-account.json
GOOGLE_WALLET_ISSUER_ID
```

Local dev uses `.env` file + `certs/google-service-account.json` (both gitignored).

## Current Status

- [x] Backend deployed on Railway, connected to Supabase
- [x] Business auth (register/login/JWT)
- [x] Loyalty card CRUD (stamp / cashback / coupon / membership types)
- [x] Customer registration with QR + barcode generation
- [x] QR/barcode scan → stamp with Google Wallet sync
- [x] Google Wallet pass creation, stamp updates, broadcast messages
- [x] Web push notifications (VAPID)
- [x] Broadcast endpoint — web push + Google Wallet update in one call
- [x] Dashboard UI at `/dashboard/` — login, broadcast by all / by customer

## Next TODOs

- [ ] **UI redesign** — proper multi-page dashboard (cards list, customers, stats, settings)
- [ ] **Apple Wallet** — pkpass generation + APNs push for stamp updates
- [ ] **Stripe** — subscription billing (starter / pro / enterprise plans)
- [ ] **Customer-facing pages** — registration landing page per card (QR scan → web form)
- [ ] **Scanner app** — mobile-friendly page for staff to scan QR codes
- [ ] **Analytics** — stamp trends, redemption rate, customer retention charts

## Key API Endpoints

```
POST /api/auth/register          { name, email, password }
POST /api/auth/login             { email, password }
POST /api/auth/scanner-token     🔒 → 30-day scanner JWT

GET  /api/cards                  🔒 → business's cards
POST /api/cards                  🔒 { name, card_type, goal_stamps, reward_desc }

POST /api/customers/register     { card_id, name, phone, consent_push, consent_points }
GET  /api/customers              🔒 → all customers (uses customer_stamp_counts view)

POST /api/scan                   🔒 { code, scan_type } → stamp + wallet sync
POST /api/scan/redeem            🔒 { customer_id }

POST /api/wallet/google/create   🔒 { customer_id } → wallet_link
PATCH /api/wallet/google/stamp   🔒 { customer_id }

POST /api/push/broadcast         🔒 { message, customer_ids? }
```
