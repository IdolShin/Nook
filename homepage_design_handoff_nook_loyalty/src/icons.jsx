// Lucide-style line icons. Stroke-based, 1.5 width, 18px default.
const Icon = ({ d, size = 18, stroke = "currentColor", fill = "none", paths, children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d && <path d={d} />}
    {paths && paths.map((p, i) => <path key={i} d={p} />)}
    {children}
  </svg>
);

const Icons = {
  Home:   (p) => <Icon {...p} paths={["M3 11.5 12 4l9 7.5","M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"]} />,
  Card:   (p) => <Icon {...p} paths={["M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M3 10h18","M7 15h3"]} />,
  Users:  (p) => <Icon {...p} paths={["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8","M22 21v-2a4 4 0 0 0-3-3.87","M17 3.13a4 4 0 0 1 0 7.75"]} />,
  Bell:   (p) => <Icon {...p} paths={["M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9","M10.3 21a1.94 1.94 0 0 0 3.4 0"]} />,
  Chart:  (p) => <Icon {...p} paths={["M3 3v18h18","M7 14l4-4 4 4 5-6"]} />,
  Settings:(p)=> <Icon {...p} paths={["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"]} />,
  Search: (p) => <Icon {...p} paths={["M21 21l-4.3-4.3","M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"]} />,
  Plus:   (p) => <Icon {...p} paths={["M12 5v14","M5 12h14"]} />,
  ChevronDown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  ChevronRight:(p)=> <Icon {...p} d="M9 6l6 6-6 6" />,
  ArrowUp: (p) => <Icon {...p} paths={["M12 19V5","M5 12l7-7 7 7"]} />,
  ArrowDown:(p)=> <Icon {...p} paths={["M12 5v14","M19 12l-7 7-7-7"]} />,
  Zap:    (p) => <Icon {...p} d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />,
  Stamp:  (p) => <Icon {...p} paths={["M5 21h14","M9 17h6a2 2 0 0 0 2-2v-2a3 3 0 0 1-1-2.24V8a4 4 0 0 0-8 0v2.76A3 3 0 0 1 7 13v2a2 2 0 0 0 2 2Z"]} />,
  Gift:   (p) => <Icon {...p} paths={["M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8","M2 7h20v5H2z","M12 22V7","M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7Z","M12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z"]} />,
  Wallet: (p) => <Icon {...p} paths={["M3 7a2 2 0 0 1 2-2h13a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z","M16 14h2"]} />,
  QrCode: (p) => <Icon {...p} paths={["M3 3h7v7H3z","M14 3h7v7h-7z","M3 14h7v7H3z","M14 14h3v3h-3z","M20 14v3","M14 20h3","M20 20v1"]} />,
  Logout: (p) => <Icon {...p} paths={["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"]} />,
  HelpCircle: (p) => <Icon {...p} paths={["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z","M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3","M12 17h.01"]} />,
  Calendar:(p)=> <Icon {...p} paths={["M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M3 10h18","M8 2v4","M16 2v4"]} />,
  Filter: (p) => <Icon {...p} d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />,
  Download: (p) => <Icon {...p} paths={["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4","M7 10l5 5 5-5","M12 15V3"]} />,
  MoreHoriz:(p)=> <Icon {...p} paths={["M5 12h.01","M12 12h.01","M19 12h.01"]} />,
  Sparkle:(p)=> <Icon {...p} paths={["M12 3v4","M12 17v4","M3 12h4","M17 12h4","M5.6 5.6l2.8 2.8","M15.6 15.6l2.8 2.8","M5.6 18.4l2.8-2.8","M15.6 8.4l2.8-2.8"]} />,
  Send:   (p) => <Icon {...p} d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />,
  CheckCircle:(p)=> <Icon {...p} paths={["M22 11.08V12a10 10 0 1 1-5.93-9.14","M22 4 12 14.01l-3-3"]} />,
  Building:(p)=> <Icon {...p} paths={["M4 21h16","M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16","M9 9h.01","M15 9h.01","M9 13h.01","M15 13h.01","M9 17h2v4H9z"]} />,
};

window.Icons = Icons;
