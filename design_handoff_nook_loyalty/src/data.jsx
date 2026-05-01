// Mock data for Nook admin dashboard
const businesses = [
  { id: "all", name: "All businesses", short: "ALL", color: "#1D9E75", customers: 284, accent: "#1D9E75" },
  { id: "nook", name: "Nook Café", short: "NC", color: "#1D9E75", customers: 128, accent: "#1D9E75", emoji: "☕" },
  { id: "kook", name: "Kook 미용실", short: "K", color: "#3B6BCC", customers: 76, accent: "#3B6BCC", emoji: "✂︎" },
  { id: "fortlee", name: "Fort Lee Gym", short: "FL", color: "#C26B1F", customers: 53, accent: "#C26B1F", emoji: "💪" },
  { id: "kbbq", name: "Korean BBQ", short: "KB", color: "#C53A6B", customers: 27, accent: "#C53A6B", emoji: "🥩" },
];

// 30 days of stamp issuance — pleasingly varied
const trend30 = [
  41, 38, 52, 47, 55, 62, 49, 58, 64, 71,
  68, 75, 82, 78, 85, 91, 87, 79, 88, 96,
  103, 98, 105, 112, 108, 117, 121, 115, 124, 132
];
const redeem30 = [
  8, 11, 9, 14, 12, 18, 15, 17, 19, 22,
  24, 21, 27, 25, 28, 31, 29, 26, 32, 35,
  37, 34, 38, 41, 39, 42, 45, 43, 47, 49
];

// Card type breakdown (donut)
const cardMix = [
  { label: "Stamp",     value: 178, color: "#1D9E75" },
  { label: "Coupon",    value: 96,  color: "#3B6BCC" },
  { label: "Cashback",  value: 54,  color: "#C26B1F" },
  { label: "Membership",value: 31,  color: "#C53A6B" },
];

// Per-business activity (stacked bar)
const bizActivity = [
  { name: "Nook Café",     stamps: 412, redemptions: 138, color: "#1D9E75" },
  { name: "Kook 미용실",    stamps: 264, redemptions: 81,  color: "#3B6BCC" },
  { name: "Fort Lee Gym",  stamps: 187, redemptions: 52,  color: "#C26B1F" },
  { name: "Korean BBQ",    stamps: 96,  redemptions: 28,  color: "#C53A6B" },
];

const activity = [
  { type: "stamp",   who: "Min-jae K.",     biz: "Nook Café",     when: "2 min ago",  detail: "+1 stamp · 7/10" },
  { type: "redeem",  who: "Sarah Chen",     biz: "Korean BBQ",    when: "8 min ago",  detail: "Redeemed: Free entrée" },
  { type: "signup",  who: "David P.",       biz: "Fort Lee Gym",  when: "14 min ago", detail: "New customer · Wallet added" },
  { type: "stamp",   who: "Hye-jin L.",     biz: "Kook 미용실",    when: "22 min ago", detail: "+1 stamp · 3/8" },
  { type: "push",    who: "—",              biz: "Nook Café",     when: "31 min ago", detail: "Sent to 128 customers" },
  { type: "redeem",  who: "Marco V.",       biz: "Nook Café",     when: "47 min ago", detail: "Redeemed: Free latte" },
  { type: "stamp",   who: "Yu-jin S.",      biz: "Kook 미용실",    when: "1h ago",     detail: "+1 stamp · 5/8" },
  { type: "signup",  who: "Olivia R.",      biz: "Korean BBQ",    when: "2h ago",     detail: "New customer · Wallet added" },
];

const scheduledPush = [
  { biz: "Nook Café",    title: "Weekend special: 2x stamps",          when: "Tomorrow, 9:00 AM", reach: 128, status: "scheduled" },
  { biz: "Korean BBQ",   title: "We miss you — 10% off this week",     when: "May 2, 11:00 AM",   reach: 27,  status: "scheduled" },
  { biz: "Fort Lee Gym", title: "New class drop · Saturday boot camp", when: "May 3, 7:00 AM",    reach: 53,  status: "draft" },
];

window.NookData = { businesses, trend30, redeem30, cardMix, bizActivity, activity, scheduledPush };
