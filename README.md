# Nook Backend — Setup Guide

## 📁 Project Structure

```
nook-backend/
├── src/
│   ├── index.js              ← Express app entry point
│   ├── routes/
│   │   ├── auth.js           ← Register / Login / Scanner token
│   │   ├── cards.js          ← Loyalty card CRUD
│   │   ├── customers.js      ← Customer register & lookup
│   │   └── scan.js           ← Stamp + Redeem (core!)
│   ├── middleware/
│   │   └── auth.js           ← JWT verification
│   ├── db/
│   │   ├── supabase.js       ← DB client
│   │   └── schema.sql        ← Run this in Supabase first
│   └── services/
│       └── push.js           ← Push notification service
├── .env.example              ← Copy to .env and fill in
└── package.json
```

---

## 🚀 Step-by-Step Setup

### 1. Install dependencies
```bash
cd nook-backend
npm install
```

### 2. Setup Supabase (free)
1. Go to https://app.supabase.com → New project
2. SQL Editor → New Query → paste `src/db/schema.sql` → Run
3. Settings → API → copy `URL` and `service_role key`

### 3. Configure environment
```bash
cp .env.example .env
# Fill in your values:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
# - JWT_SECRET (any random string, make it long)
```

### 4. Generate VAPID keys (for push notifications)
```bash
npx web-push generate-vapid-keys
# Copy output into .env
```

### 5. Run the server
```bash
npm run dev       # development (auto-restart)
npm start         # production
```

### 6. Test it
```bash
# Health check
curl http://localhost:3001/health

# Register a business
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Nook Café","email":"test@nook.com","password":"test1234"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nook.com","password":"test1234"}'
```

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | 비즈니스 계정 생성 |
| POST | `/api/auth/login` | ❌ | 로그인 → JWT 반환 |
| POST | `/api/auth/scanner-token` | ✅ | 직원용 스캐너 토큰 |
| GET  | `/api/cards` | ✅ | 내 카드 목록 |
| POST | `/api/cards` | ✅ | 카드 생성 |
| GET  | `/api/cards/:id/stats` | ✅ | 카드 통계 |
| POST | `/api/customers/register` | ❌ | 고객 카드 등록 |
| GET  | `/api/customers/lookup?code=&type=` | ✅ | QR/바코드로 고객 조회 |
| POST | `/api/scan` | ✅ | 스캔 → 스탬프 적립 |
| POST | `/api/scan/redeem` | ✅ | 리워드 사용 |
| POST | `/api/push/broadcast` | ✅ | 전체 고객 푸시 발송 |
| GET  | `/health` | ❌ | 서버 상태 확인 |

---

## 🚢 Deployment (Railway.app)

1. Push code to GitHub
2. railway.app → New Project → Deploy from GitHub
3. Add environment variables in Railway dashboard
4. Railway auto-assigns a domain (e.g. `nook-backend.up.railway.app`)

**Cost: ~$5/month** for the starter plan.

---

## ⏭️ Step 5 — Apple & Google Wallet
Next we'll add:
- `pkpass` file generation (Apple Wallet)
- Google Wallet API (JWT-signed passes)
- Real camera QR scanning in the browser (`jsQR` library)
- Pass update webhooks (stamp count updates the wallet card in real time)
