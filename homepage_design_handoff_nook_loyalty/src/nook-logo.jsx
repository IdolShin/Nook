// Nook brand mark — a tucked card "n" shape inside a soft container.
// The negative space forms an "n" while the outer rounded square reads as
// a card slot / wallet pocket. Works on light, dark, and on-accent.

function NookMark({ size = 30, radius, variant = "accent" }) {
  // variant: "accent" (green bg, white mark), "mono-dark" (black bg, white mark),
  //          "mono-light" (white bg, dark mark), "ghost" (transparent, currentColor)
  const r = radius ?? Math.round(size * 0.30);
  const palettes = {
    accent: {
      bg: "linear-gradient(140deg, #1D9E75 0%, #16855F 100%)",
      glow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 1px rgba(8,80,65,0.18)",
      stroke: "#FFFFFF",
      dot: "#FFFFFF",
    },
    "mono-dark": {
      bg: "#1A1A1F",
      glow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      stroke: "#FFFFFF",
      dot: "#1D9E75",
    },
    "mono-light": {
      bg: "#FFFFFF",
      glow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
      stroke: "#1A1A1F",
      dot: "#1D9E75",
    },
    ghost: {
      bg: "transparent",
      glow: "none",
      stroke: "currentColor",
      dot: "currentColor",
    },
  };
  const p = palettes[variant] || palettes.accent;

  return (
    <span
      aria-label="Nook"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: p.bg,
        boxShadow: p.glow,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        position: "relative",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        style={{ display: "block" }}
      >
        {/* "n" — a card-pocket arch. Two upright legs joined by a half-rounded
            top, drawn as a single open path so it reads as both letterform
            and card slot. The accent dot at the top-right is the "tap" /
            wallet contact point. */}
        <path
          d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
          stroke={p.stroke}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="23" cy="9.5" r="2" fill={p.dot} />
      </svg>
    </span>
  );
}

// Full lockup: mark + wordmark
function NookLockup({ size = 30, color = "var(--text)", subtitle, variant = "accent" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <NookMark size={size} variant={variant} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: Math.round(size * 0.5),
            letterSpacing: "-0.02em",
            color: color,
          }}
        >
          Nook
        </span>
        {subtitle && (
          <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

window.NookMark = NookMark;
window.NookLockup = NookLockup;
