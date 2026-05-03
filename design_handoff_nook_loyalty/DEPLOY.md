# 🚀 Nook 배포 가이드 (Quick Start)

도메인 사기 전에 일단 무료 호스팅으로 띄워서 사람들에게 보여주려는 분께. 5분이면 끝납니다.

---

## 📂 현재 가지고 있는 파일

```
design_handoff_nook_loyalty/
├── Landing.html       ← 광고 페이지 (KO/EN)
├── Dashboard.html     ← 어드민 대시보드 (관리자용)
├── src/               ← 두 페이지가 공유하는 React 컴포넌트
└── tweaks-panel.jsx
```

이걸 그대로 호스팅하면 됩니다. 빌드 과정 없음, 서버 없음, 그냥 **정적 파일**.

---

## 🟢 옵션 A — Netlify Drop (가장 쉬움, 1분)

1. https://app.netlify.com/drop 접속
2. `design_handoff_nook_loyalty` **폴더 통째로** 드래그 앤 드롭
3. 끝. 즉시 `https://random-name-12345.netlify.app` 같은 URL 발급
4. 사이트 설정 → "Site name 변경"으로 `nook-app.netlify.app` 같이 바꾸기

**기본 페이지를 Landing으로 하려면** 폴더에 들어가서:
```bash
cp Landing.html index.html
```
그 다음 폴더 다시 드래그.

---

## 🟢 옵션 B — Vercel (조금 더 폼 나는 URL)

```bash
# Vercel CLI 한 번만 설치
npm i -g vercel

# 폴더로 이동
cd design_handoff_nook_loyalty

# Landing을 메인 페이지로 복사
cp Landing.html index.html

# 배포
vercel --prod
```

Vercel 계정 없으면 자동으로 가입 흐름 떠요. URL: `nook-xxxxx.vercel.app` 발급.

---

## 🟢 옵션 C — GitHub Pages (도메인 살 때까지 영구 무료)

```bash
cd design_handoff_nook_loyalty

# index.html 만들기
cp Landing.html index.html

# Git 초기화
git init
git add .
git commit -m "initial: nook landing + admin"

# GitHub에 빈 repo 만들고 (예: github.com/yourname/nook)
git remote add origin https://github.com/YOURNAME/nook.git
git push -u origin main

# GitHub repo 페이지 → Settings → Pages →
# Source: "Deploy from a branch" → main / root → Save
```

5분 후 `https://YOURNAME.github.io/nook/` 활성화. 광고 페이지가 메인, `/Dashboard.html`로 어드민 접속.

---

## 🟢 옵션 D — Cloudflare Pages (성능 1등, 무료 SSL)

```bash
# Wrangler CLI 설치
npm i -g wrangler

# 로그인
wrangler login

# 배포
cd design_handoff_nook_loyalty
cp Landing.html index.html
wrangler pages deploy . --project-name=nook
```

URL: `nook.pages.dev`. 도메인 사면 Cloudflare에서 바로 연결 가능.

---

## 🔐 어드민 페이지 보호하기 (중요!)

지금 `Dashboard.html`은 **누구나 URL 알면 들어옴**. 베타에 공개하기 전에 한 가지 골라서 보호하세요:

### 가장 쉬움 — Netlify Identity (무료)
1. Netlify 대시보드 → Site → Identity → Enable
2. `Dashboard.html` 맨 위에 추가:
```html
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
<script>
  if (!netlifyIdentity.currentUser()) {
    netlifyIdentity.open();
    netlifyIdentity.on('login', () => location.reload());
  }
</script>
```
3. Netlify Identity에서 본인 이메일 초대 → 로그인하면 접속 가능

### 더 간단 — `_redirects` 파일로 비공개 URL 만들기
폴더에 `_redirects` 파일 생성:
```
/admin    /Dashboard.html    200
/admin/*  /Dashboard.html    200
/Dashboard.html  /404  301
```
그러면 `nook.netlify.app/admin`만 됩니다 (직접 URL은 막힘).

### 가장 강력 — Cloudflare Access (무료, OAuth)
Cloudflare Pages 쓸 때만. Pages 프로젝트 → Settings → Access → "Self-hosted application" 추가 → `dashboard.nook.app` 경로에 본인 Gmail만 허용.

---

## 🌐 도메인 살 때 체크리스트

도메인 사고 (예: `nook.app`, `nook.kr`, `gonook.com`) 한 다음:

1. **DNS 설정**: 호스팅 서비스의 안내대로 CNAME or A 레코드 추가 (5분)
2. **SSL**: 위 서비스들 다 자동으로 발급 (10분 ~ 1시간)
3. **서브도메인 분리**:
   - `nook.app` → 광고페이지 (`Landing.html`)
   - `app.nook.app` → 어드민 대시보드 (`Dashboard.html`)
   - `dev.nook.app` → 베타/스테이징

---

## 📊 추적 추가 (선택)

광고페이지에 누가 들어왔는지 보고 싶으면 `Landing.html` `<head>`에 추가:

### Plausible (무료, 가벼움, 한국어 OK)
```html
<script defer data-domain="nook.app" src="https://plausible.io/js/script.js"></script>
```

### Google Analytics
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>
```

---

## ✅ 추천 워크플로우 (지금 당장)

```bash
# 1. 폴더로 이동
cd design_handoff_nook_loyalty

# 2. 광고페이지를 메인으로
cp Landing.html index.html

# 3. Netlify Drop으로 즉시 배포
#    → https://app.netlify.com/drop 에 폴더 드래그

# 4. 5분 후 친구·잠재 고객들에게 URL 공유
#    "이거 어떻게 생각해?" 피드백 받기

# 5. 피드백 좋으면 도메인 사고 연결
```

---

## 💡 다음 단계

- **광고페이지 추가 페이지** (예: `/about`, `/blog`, `/contact`) 만들고 싶으면
  → Claude Code에 `CLAUDE_CODE_PROMPT.md` 보여주고 작업 의뢰
- **백엔드 (실제 회원가입, DB)** 시작할 때
  → Supabase + Vercel 조합 추천. 무료 티어로 충분
- **결제** (Stripe 연결할 때)
  → 그땐 정적 사이트론 안 되고 Next.js 같은 풀스택으로 옮겨야 함

---

## ❓ 질문

- 폼 제출이 안 됨 → 정적 호스팅이라 그래요. 다음 중 하나 추가:
  - Formspree (3분, 무료)
  - Netlify Forms (Netlify 쓰면 자동)
  - 본인 이메일로만 보내기: `mailto:` 링크는 이미 작동 중
- 한국어가 깨짐 → 호스팅 서비스가 UTF-8을 지원 안 하는 경우. 위 4개 다 지원함
- 모바일에서 이상함 → 이미 반응형 적용됨. 문제 있으면 어떤 폰·브라우저인지 알려주세요
