# Handoff: Nook — Digital Loyalty Card Platform

## Overview
Nook is a digital loyalty card platform (similar in scope to Boomerangme). An admin (Woosang) manages multiple business clients. Each business has loyalty cards (stamp / coupon / cashback / membership). Customers add cards to Apple/Google Wallet via QR code. Staff scan a customer's QR/barcode to add stamps. Push notifications go out via the Wallet pass channel.

This package contains hi-fi HTML/React prototypes for **9 surfaces** of the platform.

## About the Design Files
The files in this bundle are **design references created as a single-file React + Babel HTML prototype**. They are prototypes showing intended look and behavior, **not production code to copy directly**.

Recreate these designs in your target codebase using its established patterns (React + Tailwind, Next.js, SwiftUI, etc.). If no environment exists yet, React + TypeScript + Tailwind is recommended given the SaaS dashboard scope.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, interactions, and copy are decided. Recreate pixel-perfectly using your existing component library.

## Tech in the prototype (reference only)
- React 18 + Babel standalone (single-file dev prototype)
- All charts hand-rolled in SVG (no chart lib)
- Inter (UI) + JetBrains Mono (numbers/IDs) from Google Fonts
- All icons inline SVG (Lucide-style stroke 1.6)

---

## Design Tokens

### Colors
```
--bg:           #F5F6FA   /* page background */
--surface:      #FFFFFF   /* card background */
--border:       #EBEBEB
--border-soft:  #F0F0F2
--text:         #1A1A1F
--text-2:       #5C5F66
--text-3:       #8A8D94

--accent:       #1D9E75   /* Nook green */
--accent-light: #E8F7F2
--accent-dark:  #085041

/* Stat-card gradients (135deg) */
green:  #DFF4EB → #C7EBDB
blue:   #E2ECFB → #CADCF7
amber:  #FBEFD9 → #F6E0B5
pink:   #FBE2EC → #F6CCDD

/* Per-business accent */
Nook Café:    #1D9E75
Kook 미용실:  #3B6BCC
Fort Lee Gym: #C26B1F
Korean BBQ:   #C53A6B

/* Status */
Active:  bg #E8F7F2 / fg #085041 / dot #1D9E75
Draft:   bg #F0F1F4 / fg #5C5F66 / dot #8A8D94
Paused:  bg #FBEFD9 / fg #8C5A11 / dot #C26B1F
VIP:     bg #FBEFD9 / fg #8C5A11 / dot #C26B1F
At-risk: bg #FBE6EE / fg #99355C / dot #C53A6B
New:     bg #E5EDF8 / fg #1F4E94 / dot #3B6BCC
```

### Typography
- Font: **Inter** 400/500/600/700 — UI everywhere
- Mono: **JetBrains Mono** 400/500 — numbers, phone numbers, IDs, timestamps
- Scale: 11 / 12 / 13 (body) / 14 / 15 (section title) / 17 / 20 (page title) / 26–28 (KPI numbers)
- Letter-spacing: `-0.01em` to `-0.025em` on display sizes (tighter on bigger)
- Line-height: 1.45 body, 1.1–1.3 headings

### Spacing & shape
- Card radius: **13px** (page-level cards), 10px (inputs/inner), 8px (buttons/pills), 999px (badges)
- Button height: 32 (default), 34 (topbar), 42 (mobile), 50 (mobile primary CTA)
- Card padding: 14–22 depending on density
- Gap scale: 4 / 8 / 12 / 16 / 24
- Page padding: 24–28 horizontal, 20–24 vertical

### Shadows
- Card hover: `0 8px 22px rgba(0,0,0,0.06)`
- Dropdown: `0 12px 32px rgba(0,0,0,0.08)`
- Wallet card: `0 6px 18px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)`
- Phone frame: `0 30px 60px rgba(0,0,0,0.18)`

---

## Screens

### 1. Admin Dashboard (`Dashboard`)
**Purpose:** Cross-business overview for Woosang.
**Layout:** Sidebar (240px, collapsible to 72px) + main column. Top sticky topbar (search, business filter dropdown, range segmented `7d/30d/90d/12m`, primary "New card" button).
**Sections (top to bottom):**
1. **4 gradient KPI cards** in a `repeat(4, 1fr)` grid, gap 16. Each: small label + 28px number + delta + sparkline (70×22 SVG, polyline stroke 1.6). KPIs: Total customers 284, Active cards 359, Stamps issued 2,517, Redemptions 847.
2. **Row 2** — `grid 1.7fr 1fr`: Line chart (stamps issuance, 30-day, with hover tooltip + crosshair, optional redemptions overlay dashed) + Donut chart (card type mix: Stamp/Coupon/Cashback/Membership) with center label that swaps on hover.
3. **Row 3** — `grid 1fr 1.3fr`: Stacked horizontal bar (per-business stamps + redemptions, single hue per business with redemptions at 32% opacity) + Recent activity feed (icon tile + name + biz + relative time).
4. **Row 4** — `grid 1fr 1.3fr`: Top businesses leaderboard (rank, square chip, progress bar) + Scheduled pushes (next 7 days, draft/scheduled badge).

### 2. Loyalty Cards (`CardsPage`)
**Purpose:** Manage all loyalty cards across businesses.
**Layout:** Header (counts + Export + New card) → Filter bar (search, type dropdown, status dropdown, Grid/List toggle) → Body. Body uses `grid 1fr 360px` when a card is selected (right detail panel sticky top: 84).
- **Grid tile** (280px min): MiniCardArt (240×148 gradient pass with watermark glyph, stamp dots OR mock card number) + name + biz + type pill + status pill + stat row (Active/Issued/Redeems mono numbers) + adoption progress bar.
- **List view:** Table with thumbnail swatch, name, biz (colored), type pill, status pill, right-aligned numbers, updated timestamp.
- **Detail panel:** Larger 280×172 card art, 3 stat tiles, last-7-days sparkline in a #FAFAFB inset, Edit/Push/More buttons.

### 3. Customers CRM (`CustomersPage`)
**Layout:** 4-up KPI strip → Toolbar (search + 5 segments: All/VIP/New (30d)/At-risk/Multi-business + Message segment + Export CSV) → `grid 1fr 380px` table + sticky detail.
- **Table cols:** Customer (avatar + name + mono phone), Status pill, Businesses (chip stack), Cards, Stamps, Spend $, Last visit.
- **Detail:** Avatar 52px, tags row (#regular #weekday), 3 stat tiles, 12-week visits bar chart (gradient opacity 0.65→1), Cards-in-wallet list, "Send push" + "Reward" CTAs.

### 4. Push Notifications (`PushPage`)
**Tabs:** Compose / History / Templates.
- **Compose:** `grid 1fr 380px`. Form sections: From business (chip selector), Audience (2×2 cards with reach count: All 128 / VIPs 23 / Lapsing 19 / New 14), Title (50 char limit), Message (160 char), Send (Now / Schedule with datetime-local input). Footer: Save draft / Send test to me / Send to N (primary).
- **Right column:** Live iPhone lock-screen preview (dark gradient panel, blurred glass notification with 18px green app icon, title, body), Estimated impact card (Reach / Estimated opens 62% / Visits driven 18%).
- **History:** Table — Campaign / Business / Sent / Reach / Opens / CTR (CTR colored green-dark, weight 500).
- **Templates:** Auto-fill grid of 6 template cards with placeholder vars like `{name}`, `{business}`, `{reward}`.

### 5. Analytics (`AnalyticsPage`)
- 4 KPIs: 30-day retention 62%, Avg stamps/customer 8.9, Reward unlock rate 41%, Push CTR 62.4%.
- **Cohort retention table:** Mar W1–W6 rows × W0–W6 cols. Cell bg `oklch(0.62+v*0.18 0.08 165 / 0.18+v*0.82)` — green at high values, white text when v>60.
- **Funnel:** 5 stages with bars at decreasing accent opacity (1.0 → 0.4): QR scanned 482 / Card added 312 / First stamp 268 / Returning 198 / Reward redeemed 87.
- **Heatmap:** 7 days × 24 hours grid, cell bg `oklch(0.95 0.04 165 / 0.15+v*0.85)`, 22px height, 3px gap.

### 6. Settings (`SettingsPage`)
`grid 200px 1fr`. Left nav tabs: Workspace / Businesses / Team / Billing / Integrations / Branding. Each tab shows SettingsCards with title + desc + optional right-side button + FieldRows (label / value mono / Edit ghost button). Billing has trial banner and UsageRow progress bars. Danger zone uses #F0D5DC border and #9C2848 destructive button.

### 7. Customer Registration (mobile, `MobilePage`)
5 steps shown in a PhoneFrame (320×660, radius 44, 8px bezel, 96×26 notch).
1. **Landing:** Mini wallet card preview (200×124 green gradient with stamp dots) + headline + 3-step list + "Continue" black 50px CTA.
2. **Phone:** Country code 🇺🇸 +1 + tel input with 16px font + ToS micro + "Send code".
3. **Verify:** 6 digit boxes (38×50, 10px radius, accent border + accent-light bg when filled, mono 22px) + "Resend in 0:24" + "Verify".
4. **Add to wallet:** Larger 240×148 card preview + black "Add to Apple Wallet" with inline SVG Apple logo + white "Save to Google Wallet" outline.
5. **Done:** 72px green checkmark badge + headline + welcome bonus tile (#F5F6FA, "1 free stamp on us 🎉").

### 8. Staff Scanner (`ScannerPage`, **dark theme**)
720×480 tablet frame, bg #0A0A0E, white text. Topbar: Nook lockup + "Online" green dot + clock + power button.
- **Scan view:** Left radial-gradient region with 240×240 corner-bracket viewfinder (3px #1D9E75 borders), animated scanning line (linear-gradient with 0 0 12px glow). Right column: 3 large 14px-padding action buttons (Add stamp primary green, Redeem reward, Look up by phone) + Today counter (Stamps 42 / Redeems 7).
- **Stamp added:** 100px circle with checkmark + "Stamp added" 32px + "Min-jae Kim · Coffee lovers · 7/10" + animated stamp dot row + auto-return.
- **Customer found:** Left detail panel (avatar 56px + VIP/stamps/cards chips + cards list with progress strips) + right action stack (+ Add stamp / Redeem coupon / View history / Cancel outline).

### 9. Business Login (`AuthPage`)
`grid 1fr 1fr` split card, min-height 580.
- **Left:** Logo + heading toggle (Welcome back / Start your loyalty program) + Google + Apple SSO buttons (with brand SVGs) + OR divider + email + password (with "Forgot?" hint) + green primary CTA + footer link toggle.
- **Right:** Green-gradient marketing panel with giant 360px "n" watermark at 6% opacity, eyebrow "LOYALTY, IN THE WALLET", 28px headline, 3 numbered features (Apple & Google Wallet / QR enrollment in 30s / Push that converts), and a glass-blur testimonial card from Jisoo K.

---

## Interactions & Behavior
- **Sidebar:** collapse toggle persists; collapsed state shows tooltip on hover via title attr.
- **Topbar:** business filter is a dropdown overlay with click-outside dismissal; date range is a segmented control.
- **Charts:** line chart has mouse-move crosshair + tooltip via inline-positioned absolute div; donut center label and segment thickness change on hover (`stroke-width` transition 120ms).
- **Card grid hover:** `translateY(-2px)` + box-shadow `0 8px 22px rgba(0,0,0,0.06)`, transitions 160ms ease.
- **Tabs / segments:** active pill has white bg + subtle shadow; inactive is text-2 on #F0F1F4 track.
- **Push composer:** title + body update the live preview in real time; reach count drives "Send to N" CTA.
- **Animations:** `fadeUp 360ms ease both` on first render of stat cards. Avoid combining with mouse-driven inline transforms (caused a regression — use CSS hover or omit fadeup on hover-animated tiles).

## State Management
Per-page local state. Top-level app state holds: `page`, `businessId`, `range`, `tweaks` (sidebar collapsed, density, gradient on, redemptions line on). Detail panels (cards, customers) own their selected row.

## Assets
None external — all icons inline SVG, all imagery is CSS gradients with letter watermarks. The "n" wordmark is just Inter 700 in a 30×30 (or larger) #1D9E75 rounded square.

## Files in this bundle
- `Dashboard.html` — entry, loads all scripts in order
- `tweaks-panel.jsx` — tweaks shell
- `src/icons.jsx` — Lucide-style icon set
- `src/data.jsx` — mock data (businesses, trend, activity)
- `src/charts.jsx` — LineChart, DonutChart, StackedBar, Sparkline
- `src/sidebar.jsx`, `src/topbar.jsx` — chrome
- `src/stat-cards.jsx`, `src/panels.jsx` — dashboard sections
- `src/cards-page.jsx`, `src/customers-page.jsx`, `src/push-page.jsx`, `src/analytics-settings.jsx`, `src/mobile-scanner.jsx`, `src/auth-page.jsx` — page modules
- `src/app.jsx` — root + routing

## Suggested Claude Code prompt
```
I'm implementing Nook, a digital loyalty card SaaS, in <Next.js + TypeScript + Tailwind + shadcn/ui>.

Use the design references in design_handoff_nook_loyalty/. The HTML files are
high-fidelity prototypes — do NOT copy the React+Babel code; recreate each
screen using our component library and folder conventions.

Start with these tokens (Tailwind config):
- accent green #1D9E75 (light #E8F7F2, dark #085041)
- bg #F5F6FA, surface white, border #EBEBEB
- card radius 13px, button radius 8px, badge 999px
- font-sans Inter, font-mono JetBrains Mono

Build in this order:
1. Layout shell (sidebar + topbar with business switcher)
2. Dashboard (4 KPI cards, line/donut/stacked-bar charts, activity, leaderboard, scheduled pushes)
3. Loyalty Cards (grid + list + detail)
4. Customers CRM (table + segments + detail with visits chart)
5. Push composer with live wallet preview
6. Analytics (cohort, funnel, heatmap)
7. Settings (workspace/businesses/team/billing/integrations/branding)
8. Customer registration mobile flow (5 steps)
9. Staff scanner (dark theme, 3 states)
10. Business login

Charts: use Recharts. Mobile/tablet frames: simple CSS. Match every spacing
and color token from the README. Read each HTML file to confirm details.
```
