# Nook Logo — Claude Code Implementation

Paste this prompt into Claude Code in your project root to add the Nook logo.

---

## Prompt to paste

```
Add the Nook brand logo to my codebase.

CONCEPT
The Nook mark is a rounded-square "card slot / wallet pocket" containing a
stylized "n" that doubles as an arch (a card sliding into a slot). A small
dot at the top-right of the arch represents the wallet "tap-to-pay" contact
point. Use it everywhere we currently show a generic "n" letter or placeholder.

GEOMETRY (32×32 viewBox, scales to any size)
- Container: rounded square, radius = 30% of size
- Arch path:  M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22
- Stroke width 2.6, linecap round, linejoin round
- Dot: circle cx=23 cy=9.5 r=2

COLORS / VARIANTS
- accent      : container = linear-gradient(140deg, #1D9E75 0%, #16855F 100%)
                stroke = #FFFFFF, dot = #FFFFFF
                inset highlight: inset 0 1px 0 rgba(255,255,255,0.18),
                                 0 1px 1px rgba(8,80,65,0.18)
- mono-dark   : container = #1A1A1F,  stroke = white, dot = #1D9E75
- mono-light  : container = white,    stroke = #1A1A1F, dot = #1D9E75,
                inset 0 0 0 1px rgba(0,0,0,0.06)
- ghost       : transparent container, stroke + dot = currentColor

DELIVERABLE
Build a <NookMark size={32} variant="accent" /> React component (TypeScript
preferred). Also build a <NookLockup size={32} subtitle="..." variant="..." />
that renders the mark next to the word "Nook" in Inter 600, letter-spacing
-0.02em, font size = round(size * 0.5), with optional 11px subtitle in muted
text color.

Match my project's component conventions (folder, styling system — Tailwind,
CSS modules, styled-components, etc.). After building, replace every existing
"n" letter placeholder logo across the app with <NookMark>.

For the auth/marketing page background watermark, render the SVG arch path
at 380px, white, opacity 0.10, rotated -8deg, positioned bottom-right with
overflow hidden.
```

---

## Reference SVG (drop-in if you skip the prompt)

```jsx
export function NookMark({ size = 32, variant = "accent" }) {
  const r = Math.round(size * 0.30);
  const palettes = {
    accent: { bg: "linear-gradient(140deg, #1D9E75 0%, #16855F 100%)",
              shadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 1px rgba(8,80,65,0.18)",
              stroke: "#FFFFFF", dot: "#FFFFFF" },
    "mono-dark":  { bg: "#1A1A1F", shadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                    stroke: "#FFFFFF", dot: "#1D9E75" },
    "mono-light": { bg: "#FFFFFF", shadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
                    stroke: "#1A1A1F", dot: "#1D9E75" },
    ghost: { bg: "transparent", shadow: "none",
             stroke: "currentColor", dot: "currentColor" },
  };
  const p = palettes[variant];
  return (
    <span style={{
      width: size, height: size, borderRadius: r,
      background: p.bg, boxShadow: p.shadow,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flex: "none",
    }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path
          d="M9 22 L9 14.5 C9 11.46 11.46 9 14.5 9 L17.5 9 C20.54 9 23 11.46 23 14.5 L23 22"
          stroke={p.stroke} strokeWidth="2.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="23" cy="9.5" r="2" fill={p.dot} />
      </svg>
    </span>
  );
}
```

## Where it goes in the existing handoff
Add a new screen "0 — Brand mark" to README.md before the screens section, or
treat this as a patch on top of the original handoff.
