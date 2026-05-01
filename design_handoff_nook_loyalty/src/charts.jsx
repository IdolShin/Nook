// Charts: line, donut, stacked bar — all SVG, pure-CSS interactions

const { useState, useRef, useMemo, useEffect } = React;

// ——————————————————————— LINE / AREA ———————————————————————
function LineChart({ series, height = 220, showRedemptions = true }) {
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const w = 760, h = height, pad = { l: 36, r: 14, t: 18, b: 26 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const stamps = series.stamps;
  const redeems = series.redeems;
  const max = Math.max(...stamps, ...redeems) * 1.15;
  const min = 0;

  const x = (i) => pad.l + (i / (stamps.length - 1)) * innerW;
  const y = (v) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  const linePath = (arr) => arr.map((v,i) => `${i===0?"M":"L"}${x(i)},${y(v)}`).join(" ");
  const areaPath = (arr) => `${linePath(arr)} L${x(arr.length-1)},${pad.t+innerH} L${x(0)},${pad.t+innerH} Z`;

  const yTicks = 4;
  const tickVals = Array.from({length: yTicks+1}, (_,i) => Math.round((max/yTicks)*i));

  // X labels — show every 5 days
  const today = new Date();
  const dayLabels = stamps.map((_,i) => {
    const d = new Date(today); d.setDate(today.getDate() - (stamps.length - 1 - i));
    return `${d.getMonth()+1}/${d.getDate()}`;
  });

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * w;
          if (px < pad.l || px > pad.l + innerW) { setHover(null); return; }
          const idx = Math.round(((px - pad.l) / innerW) * (stamps.length - 1));
          setHover(Math.max(0, Math.min(stamps.length - 1, idx)));
        }}>
        <defs>
          <linearGradient id="g-stamps" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1D9E75" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* gridlines */}
        {tickVals.map((t, i) => (
          <g key={i}>
            <line x1={pad.l} y1={y(t)} x2={pad.l+innerW} y2={y(t)} stroke="#F0F0F2" strokeWidth="1" />
            <text x={pad.l - 8} y={y(t)+4} fontSize="11" fill="#8A8D94" textAnchor="end" fontFamily="JetBrains Mono">{t}</text>
          </g>
        ))}
        {/* x labels */}
        {stamps.map((_, i) => (i % 5 === 0 || i === stamps.length-1) && (
          <text key={i} x={x(i)} y={h - 8} fontSize="11" fill="#8A8D94" textAnchor="middle" fontFamily="JetBrains Mono">
            {dayLabels[i]}
          </text>
        ))}

        {/* area fill */}
        <path d={areaPath(stamps)} fill="url(#g-stamps)" />
        {/* stamps line */}
        <path d={linePath(stamps)} fill="none" stroke="#1D9E75" strokeWidth="2.2" />
        {/* redeems line */}
        {showRedemptions && (
          <path d={linePath(redeems)} fill="none" stroke="#3B6BCC" strokeWidth="2" strokeDasharray="0" opacity="0.85" />
        )}

        {/* hover indicator */}
        {hover != null && (
          <g>
            <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={pad.t+innerH} stroke="#D6D8DD" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(stamps[hover])} r="4.5" fill="white" stroke="#1D9E75" strokeWidth="2" />
            {showRedemptions && <circle cx={x(hover)} cy={y(redeems[hover])} r="4" fill="white" stroke="#3B6BCC" strokeWidth="2" />}
          </g>
        )}
      </svg>
      {hover != null && (
        <div className="chart-tooltip show" style={{
          left: `${(x(hover)/w)*100}%`,
          top: `${(y(Math.max(stamps[hover], redeems[hover]))/h)*100}%`,
        }}>
          <div className="lbl">{dayLabels[hover]}</div>
          <div className="val" style={{ color: "#7DD9B5" }}>● Stamps {stamps[hover]}</div>
          {showRedemptions && <div className="val" style={{ color: "#9DBBE8" }}>● Redeems {redeems[hover]}</div>}
        </div>
      )}
    </div>
  );
}

// ——————————————————————— DONUT ———————————————————————
function DonutChart({ data, size = 180, thickness = 22 }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size/2, cy = size/2;
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;
  const segs = data.map((d) => {
    const start = acc;
    const len = (d.value / total) * C;
    acc += len;
    return { ...d, dasharray: `${len-2} ${C-len+2}`, dashoffset: -start };
  });

  return (
    <div className="row gap-4" style={{ alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F0F2" strokeWidth={thickness} />
          {segs.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? thickness + 3 : thickness}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-width 120ms", cursor: "pointer", strokeLinecap: "butt" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: ".04em", textTransform: "uppercase" }}>
            {hover != null ? data[hover].label : "Total"}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {hover != null ? data[hover].value : total}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {hover != null ? `${Math.round((data[hover].value/total)*100)}%` : "active cards"}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: "grid", gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} className="row between" style={{ padding: "4px 0", cursor: "pointer", opacity: hover==null||hover===i?1:0.5, transition: "opacity 120ms" }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}>
            <div className="row gap-2">
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: "inline-block" }} />
              <span style={{ fontSize: 13 }}>{d.label}</span>
            </div>
            <div className="row gap-2">
              <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>{Math.round((d.value/total)*100)}%</span>
              <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>{d.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ——————————————————————— STACKED HORIZONTAL BAR ———————————————————————
function StackedBar({ data }) {
  const max = Math.max(...data.map(d => d.stamps + d.redemptions));
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {data.map((d, i) => {
        const stampPct = (d.stamps / max) * 100;
        const redeemPct = (d.redemptions / max) * 100;
        return (
          <div key={i}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</span>
              <span className="mono" style={{ fontSize: 12, color: "var(--text-2)" }}>
                {(d.stamps + d.redemptions).toLocaleString()}
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 999, background: "#F0F0F2",
              display: "flex", overflow: "hidden"
            }}>
              <div title={`Stamps · ${d.stamps}`} style={{
                width: `${stampPct}%`, background: d.color, transition: "width 400ms ease"
              }} />
              <div title={`Redemptions · ${d.redemptions}`} style={{
                width: `${redeemPct}%`, background: d.color, opacity: 0.32, transition: "width 400ms ease"
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ——————————————————————— SPARKLINE ———————————————————————
function Sparkline({ values, color = "#1D9E75", w = 100, h = 28 }) {
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

Object.assign(window, { LineChart, DonutChart, StackedBar, Sparkline });
