# 🤖 Claude Code 작업 의뢰 — Nook 광고 사이트 확장

Open Music Studio에서 만든 광고페이지(`Landing.html`)를 기반으로 풀 마케팅 사이트를 만들어주세요.

---

## 📦 현재 가지고 있는 것

이 폴더 안에:
- `Landing.html` — 메인 광고페이지 (KO/EN 양쪽 지원, 디자인 시스템 통일)
- `Dashboard.html` — 어드민 대시보드 (참고용, 이번 작업 범위 X)
- `src/` — React 컴포넌트들
- `LOGO.md` — Nook 로고 디자인 스펙
- `README.md` — 디자인 시스템 (컬러, 타이포, 컴포넌트)

---

## 🎯 작업 목표

`Landing.html`을 **단일 페이지에서 멀티 페이지 마케팅 사이트로 확장**해주세요. Next.js (App Router) + TypeScript + Tailwind 추천. 또는 Astro도 좋음 (정적 사이트라).

### 페이지 구조

```
/                       ← 현재 Landing.html을 그대로 옮김
/features               ← 기능 상세 (Landing의 기능 섹션을 풀 페이지로)
/pricing                ← 요금제 상세 (Landing의 가격 섹션 + FAQ + 비교표)
/customers              ← 고객 사례 (3-5개 케이스 스터디)
/blog                   ← 블로그 인덱스 (MDX 추천)
/blog/[slug]            ← 블로그 글
/about                  ← 회사 소개
/contact                ← 문의 (Landing의 모달을 풀 페이지로)
/legal/privacy          ← 개인정보처리방침
/legal/terms            ← 이용약관

/admin                  ← Dashboard.html (별도 인증)
```

---

## 🎨 디자인 시스템 (반드시 준수)

`Landing.html`의 `<style>` 블록에 정의된 토큰을 그대로 옮기세요:

```css
--bg: #F5F6FA;
--surface: #FFFFFF;
--border: #EBEBEB;
--text: #1A1A1F;
--text-2: #5C5F66;
--text-3: #8A8D94;
--accent: #1D9E75;          /* Nook 그린 */
--accent-light: #E8F7F2;
--accent-dark: #085041;
```

**폰트**: Noto Sans KR (KO) + Inter (EN) + JetBrains Mono (mono)
**라운드**: 카드 18-24px, 버튼 10-12px, 모달 24px
**그림자**: 미묘하게. `0 18px 40px rgba(0,0,0,0.06)` 정도가 최대치
**액센트 그라디언트**: `linear-gradient(135deg, #1D9E75 0%, #0F6B4D 100%)`

### 절대 하지 말 것
- 보라색·핑크·청록 추가 ❌ (Nook 그린만)
- 이모지 남발 ❌ (Landing.html에서 쓴 것만 — 🎁 ☕ 📱 🔔 등 절제)
- 새 폰트 추가 ❌
- 라운드 corner-accent left-border 카드 (AI슬롭) ❌
- 큰 그라디언트 배경 (Hero CTA 빼고) ❌

---

## 🌐 다국어 (i18n)

Landing.html이 KO/EN 토글 방식인데 — Next.js로 옮기면서 **URL 기반**으로 바꾸세요:
- `/` → 한국어 (기본)
- `/en` → 영어
- `/en/pricing` 처럼 prefix 패턴

`next-intl` 또는 Astro의 i18n integration 사용. 모든 카피는 `messages/ko.json`, `messages/en.json` 분리.

---

## ⚙️ 기술 스택 (추천 스택)

```
Framework:    Next.js 14+ (App Router) — SEO 좋고 한국어/영어 split easy
Styling:      Tailwind CSS — Landing.html의 토큰을 tailwind.config.ts로 옮기기
Content:      MDX (블로그)
Forms:        Resend + Server Actions
i18n:         next-intl
Analytics:    Plausible (한국어 친화적)
Hosting:      Vercel
Domain:       (사용자가 별도 구매)
```

선호하는 다른 스택 있으면 그쪽으로 — Astro도 정적 사이트면 더 빠름.

---

## 🔨 구체적 작업 지시

1. **`Landing.html`을 그대로 React/Next 페이지로 변환**
   - 모든 컴포넌트는 `components/landing/` 아래
   - HeroSection, ReasonsSection, HowItWorksSection, FeaturesSection, JourneySection, PricingSection, TestimonialsSection, FAQSection, CTASection, Footer, Nav 분리

2. **JourneySection은 그대로 유지**
   - 시간대별 배경 morph (morning/day/evening/night)
   - 잠금화면 알림 glassmorphism
   - 스탬프 progress 애니메이션
   - prev/pause/next 컨트롤
   - **이게 사이트의 핵심 인터랙션** — 절대 단순화 금지

3. **Contact 모달 → Contact 페이지로 변환**
   - 이메일/SMS 채널 카드는 그대로
   - 양식은 Server Action으로 이메일 발송 (Resend 추천)
   - Spam 방지 honeypot 필드 추가

4. **Dashboard.html은 Phase 2**
   - 일단 `/admin/*`로 기존 HTML 그대로 두고
   - 나중에 Supabase 백엔드 + 실 데이터 연결할 때 변환

5. **SEO 메타**
   - 각 페이지 OG 이미지 (1200×630). Hero의 wallet card 이미지 활용
   - sitemap.xml, robots.txt 자동 생성
   - Schema.org `Organization` + `Product` JSON-LD

6. **성능**
   - Lighthouse 95+ 목표
   - 이미지 next/image
   - 폰트 next/font

---

## 📋 첫 커밋 체크리스트

- [ ] Next.js 프로젝트 셋업 + Tailwind 설정 + Nook 컬러 토큰 등록
- [ ] `Landing.html`을 `app/(marketing)/page.tsx`로 옮기기 (단일 페이지로 먼저)
- [ ] KO/EN 라우트 분리
- [ ] Nav, Footer 공통 레이아웃 분리
- [ ] 배포 (Vercel preview)

---

## ❓ 질문 받기 전에 답해드림

- **CMS 필요?** — 처음엔 MDX로 충분. 5-10편 글 쌓이면 Sanity 추가
- **회원가입은?** — Phase 2. 일단 Contact 양식만으로 베타 받기
- **결제는?** — Phase 3. Stripe + Webhooks. 그땐 백엔드 본격 작업
- **모바일앱?** — 안 만듭니다. Apple Wallet/Google Wallet이 곧 앱
- **데이터 모델은?** — `Dashboard.html`의 `src/data.jsx`에 mock 데이터 있음. 그게 사실상 schema

---

## 🎁 보너스 — 광고페이지 추가 아이디어

여유 되면 추가해주세요:

1. **Interactive ROI 계산기**
   - "월 매출 X원 / 단골 비율 Y% / 재방문 +Z% 이면 → 추가 매출 W원"
   - 슬라이더로 인풋, 즉시 계산

2. **카드 디자인 미리보기**
   - 사용자가 매장 이름 입력 → 즉석에서 wallet 카드 미리보기 SVG 렌더
   - "이게 손님 폰에 들어가요" 데모

3. **푸시 알림 시뮬레이터**
   - 텍스트 입력 → 잠금화면에 어떻게 보일지 실시간 미리보기

이 셋 다 `Landing.html`에 이미 있는 visual vocabulary로 만들 수 있어요.

---

## 🚨 가장 중요한 것

**디자인 일관성**. Landing.html이 현재 sophisticated한 느낌인 이유:
- 컬러 절제 (그린 + 그레이 + 흰색만)
- 폰트 절제 (Noto Sans KR + Inter)
- 마이크로 인터랙션 (호버 lift, 알림 glass blur, 스탬프 펄스)
- 한국어 카피의 톤 (사장님께 친근하게, 그러나 가볍지 않게)

이걸 잃으면 평범한 SaaS 랜딩이 됩니다. 새 컴포넌트 만들 때마다 Landing.html에서 같은 종류의 컴포넌트가 어떻게 디자인됐는지 먼저 확인하세요.

질문 있으면 코드베이스 안의 README.md, LOGO.md도 함께 읽어주세요.
