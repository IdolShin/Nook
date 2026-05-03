function Topbar({ businessId, setBusinessId, range, setRange, onToggleSidebar, page = "dashboard" }) {
  const I = window.Icons;
  const { businesses } = window.NookData;
  const [bizOpen, setBizOpen] = useState(false);
  const current = businesses.find(b => b.id === businessId);
  const titles = {
    dashboard: { t: "Dashboard", s: "Welcome back, Woosang — here's what's happening across your businesses." },
    cards:     { t: "Loyalty cards", s: "Design, manage, and track every card across your businesses." },
    customers: { t: "Customers", s: "Everyone who's added one of your cards to their wallet." },
    push:      { t: "Push notifications", s: "Reach customers right inside Apple & Google Wallet." },
    analytics: { t: "Analytics", s: "Performance across cards, businesses, and time." },
    settings:  { t: "Settings", s: "Account, billing, and platform configuration." },
    scanner:   { t: "Staff scanner", s: "Scan a customer's QR or barcode to add stamps." },
    mobile:    { t: "Customer flow", s: "What customers see when they scan your Nook QR code." },
    auth:      { t: "Business login", s: "What new businesses see when they come to Nook." },
    help:      { t: "Help & docs", s: "Guides, FAQ, and support." },
  };
  const head = titles[page] || titles.dashboard;

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "16px 28px",
      gap: 14,
      borderBottom: "1px solid var(--border)",
      background: "var(--surface)",
      position: "sticky", top: 0, zIndex: 5
    }}>
      <button className="btn-ghost btn" onClick={onToggleSidebar} style={{ height: 32, padding: "0 6px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" />
        </svg>
      </button>

      <div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>{head.t}</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>
          {head.s}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <div className="row gap-2" style={{
        height: 34, padding: "0 12px",
        background: "#F0F1F4", borderRadius: 8,
        color: "var(--text-3)", minWidth: 220
      }}>
        <I.Search size={15} />
        <span style={{ fontSize: 13 }}>Search customers, cards…</span>
        <span style={{ marginLeft: "auto", fontSize: 11, padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4, color: "var(--text-3)", background: "white" }}>⌘K</span>
      </div>

      {/* Business filter */}
      <div style={{ position: "relative" }}>
        <button className="btn" onClick={() => setBizOpen(o => !o)} style={{ height: 34 }}>
          <span style={{
            width: 18, height: 18, borderRadius: 5,
            background: current.color, color: "white",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 600
          }}>{current.short}</span>
          <span>{current.name}</span>
          <I.ChevronDown size={14} />
        </button>
        {bizOpen && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setBizOpen(false)} />
            <div className="card fadeup" style={{
              position: "absolute", top: 40, right: 0, zIndex: 10,
              width: 240, padding: 6, boxShadow: "0 12px 32px rgba(0,0,0,.08)"
            }}>
              {businesses.map(b => (
                <button key={b.id} onClick={() => { setBusinessId(b.id); setBizOpen(false); }} className="row gap-2"
                  style={{
                    width: "100%", padding: "8px 10px",
                    border: 0, background: businessId === b.id ? "var(--accent-light)" : "transparent",
                    borderRadius: 8, textAlign: "left", cursor: "pointer"
                  }}
                  onMouseEnter={(e) => { if (businessId !== b.id) e.currentTarget.style.background = "#F5F6FA"; }}
                  onMouseLeave={(e) => { if (businessId !== b.id) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: b.color, color: "white",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 600
                  }}>{b.short}</span>
                  <span style={{ flex: 1, fontSize: 13 }}>{b.name}</span>
                  {b.id !== "all" && <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{b.customers}</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Range */}
      <div className="seg">
        {["7d","30d","90d","12m"].map(r => (
          <button key={r} className={range === r ? "on" : ""} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>

      <button className="btn-primary btn" style={{ height: 34 }}>
        <I.Plus size={15} /> New card
      </button>
    </div>
  );
}

window.Topbar = Topbar;
