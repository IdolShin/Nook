// Customers CRM — list + detail panel

const { useState: useCS, useMemo: useCM } = React;

const CUSTOMERS = [
  { id: "u1", name: "Min-jae Kim",    initials: "MK", color: "#1D9E75", phone: "+1 201 555 0142", joined: "Mar 8, 2026",  biz: ["Nook Café"], cards: 2, totalStamps: 38, lastVisit: "2 min ago",  spend: 412, status: "vip", tags: ["regular","weekday"] },
  { id: "u2", name: "Sarah Chen",     initials: "SC", color: "#3B6BCC", phone: "+1 201 555 0184", joined: "Jan 22, 2026", biz: ["Korean BBQ","Nook Café"], cards: 3, totalStamps: 72, lastVisit: "8 min ago", spend: 980, status: "vip", tags: ["high-value"] },
  { id: "u3", name: "David Park",     initials: "DP", color: "#C26B1F", phone: "+1 201 555 0119", joined: "Apr 14, 2026", biz: ["Fort Lee Gym"], cards: 1, totalStamps: 4, lastVisit: "14 min ago", spend: 98, status: "new", tags: ["new"] },
  { id: "u4", name: "Hye-jin Lee",    initials: "HL", color: "#C53A6B", phone: "+1 201 555 0177", joined: "Feb 3, 2026",  biz: ["Kook 미용실"], cards: 2, totalStamps: 14, lastVisit: "22 min ago", spend: 245, status: "active", tags: ["referrer"] },
  { id: "u5", name: "Marco Velez",    initials: "MV", color: "#1D9E75", phone: "+1 201 555 0163", joined: "Dec 12, 2025", biz: ["Nook Café"],   cards: 1, totalStamps: 22, lastVisit: "47 min ago", spend: 156, status: "active", tags: ["weekend"] },
  { id: "u6", name: "Yu-jin Song",    initials: "YS", color: "#3B6BCC", phone: "+1 201 555 0125", joined: "Mar 30, 2026", biz: ["Kook 미용실","Nook Café"], cards: 2, totalStamps: 19, lastVisit: "1h ago",   spend: 318, status: "active", tags: ["regular"] },
  { id: "u7", name: "Olivia Rocha",   initials: "OR", color: "#C53A6B", phone: "+1 201 555 0102", joined: "Apr 28, 2026", biz: ["Korean BBQ"],  cards: 1, totalStamps: 1, lastVisit: "2h ago",  spend: 42,  status: "new", tags: ["new"] },
  { id: "u8", name: "James Cho",      initials: "JC", color: "#1A1A1F", phone: "+1 201 555 0156", joined: "Nov 4, 2025",  biz: ["Nook Café","Fort Lee Gym","Kook 미용실"], cards: 4, totalStamps: 124, lastVisit: "5h ago", spend: 1842, status: "vip", tags: ["high-value","referrer"] },
  { id: "u9", name: "Nora Singh",     initials: "NS", color: "#C26B1F", phone: "+1 201 555 0188", joined: "Mar 18, 2026", biz: ["Fort Lee Gym"], cards: 1, totalStamps: 8, lastVisit: "Yesterday",  spend: 132, status: "at-risk", tags: ["lapsing"] },
  { id: "u10", name: "Dani Suh",      initials: "DS", color: "#3B6BCC", phone: "+1 201 555 0110", joined: "Feb 22, 2026", biz: ["Kook 미용실"],  cards: 1, totalStamps: 6, lastVisit: "3d ago",  spend: 180, status: "at-risk", tags: ["lapsing"] },
];

const STATUS = {
  vip:     { label: "VIP",    bg: "#FBEFD9", fg: "#8C5A11", dot: "#C26B1F" },
  active:  { label: "Active", bg: "#E8F7F2", fg: "#085041", dot: "#1D9E75" },
  new:     { label: "New",    bg: "#E5EDF8", fg: "#1F4E94", dot: "#3B6BCC" },
  "at-risk": { label: "At risk", bg: "#FBE6EE", fg: "#99355C", dot: "#C53A6B" },
};

function CustomersPage({ tweaks }) {
  const I = window.Icons;
  const [q, setQ] = useCS("");
  const [seg, setSeg] = useCS("all");
  const [selected, setSelected] = useCS(CUSTOMERS[0]);

  const segs = [
    { id: "all", label: "All", count: CUSTOMERS.length },
    { id: "vip", label: "VIP", count: CUSTOMERS.filter(c=>c.status==="vip").length },
    { id: "new", label: "New (30d)", count: CUSTOMERS.filter(c=>c.status==="new").length },
    { id: "at-risk", label: "At risk", count: CUSTOMERS.filter(c=>c.status==="at-risk").length },
    { id: "multi", label: "Multi-business", count: CUSTOMERS.filter(c=>c.biz.length>1).length },
  ];

  const rows = useCM(() => {
    return CUSTOMERS.filter(c => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (seg === "all") return true;
      if (seg === "multi") return c.biz.length > 1;
      return c.status === seg;
    });
  }, [q, seg]);

  return (
    <div data-screen-label="03 Customers" style={{
      padding: tweaks.density === "compact" ? "20px 24px" : "24px 28px",
      display: "grid", gap: 16
    }}>
      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <KPI label="Total customers"  value="284" delta="+18 this week" up />
        <KPI label="VIPs"              value="32"  delta="11.3% of base" />
        <KPI label="New (30d)"         value="46"  delta="+12% MoM" up />
        <KPI label="At-risk"           value="9"   delta="No visit in 14d" warn />
      </div>

      {/* Toolbar */}
      <div className="card" style={{ padding: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div className="row gap-2" style={{
          height: 32, padding: "0 10px", background: "#F5F6FA", borderRadius: 8, flex: "1 1 280px", minWidth: 220
        }}>
          <I.Search size={14} stroke="#8A8D94" />
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by name, phone…"
            style={{ flex: 1, border: 0, background: "transparent", outline: "none", fontSize: 13, fontFamily: "inherit" }} />
        </div>
        <div className="seg">
          {segs.map(s => (
            <button key={s.id} className={seg === s.id ? "on" : ""} onClick={() => setSeg(s.id)}>
              {s.label} <span style={{ marginLeft: 4, fontSize: 11, color: "var(--text-3)" }}>{s.count}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn"><I.Send size={13} /> Message segment</button>
        <button className="btn"><I.Download size={13} /> Export CSV</button>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAFAFB", color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Customer</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Businesses</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>Cards</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>Stamps</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>Spend</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Last visit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = STATUS[c.status];
                const isSel = selected?.id === c.id;
                return (
                  <tr key={c.id} onClick={() => setSelected(c)} style={{
                    borderTop: "1px solid var(--border-soft)",
                    background: isSel ? "var(--accent-light)" : "transparent",
                    cursor: "pointer"
                  }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="row gap-2">
                        <div className="avatar" style={{ background: c.color }}>{c.initials}</div>
                        <div style={{ lineHeight: 1.3 }}>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="row gap-1" style={{ display: "inline-flex", fontSize: 11, fontWeight: 500, background: s.bg, color: s.fg, padding: "2px 8px", borderRadius: 999 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} /> {s.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-2)" }}>
                      <div className="row gap-1" style={{ flexWrap: "wrap" }}>
                        {c.biz.map((b,i) => (
                          <span key={i} style={{ fontSize: 11, padding: "1px 7px", background: "#F0F1F4", borderRadius: 999 }}>{b}</span>
                        ))}
                      </div>
                    </td>
                    <td className="mono" style={{ padding: "12px 16px", textAlign: "right" }}>{c.cards}</td>
                    <td className="mono" style={{ padding: "12px 16px", textAlign: "right" }}>{c.totalStamps}</td>
                    <td className="mono" style={{ padding: "12px 16px", textAlign: "right" }}>${c.spend}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-3)" }}>{c.lastVisit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {selected && <CustomerDetail customer={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}

function KPI({ label, value, delta, up, warn }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 6, color: warn ? "#9C2848" : up ? "#0D6B45" : "var(--text-3)" }}>
        {delta}
      </div>
    </div>
  );
}

function CustomerDetail({ customer, onClose }) {
  const I = window.Icons;
  const s = STATUS[customer.status];
  const visits = [3, 5, 4, 6, 7, 5, 8, 6, 7, 9, 8, 10];
  return (
    <div className="card" style={{ padding: 0, position: "sticky", top: 84 }}>
      <div className="row between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)" }}>
        <span className="row gap-1" style={{ fontSize: 11, fontWeight: 500, background: s.bg, color: s.fg, padding: "2px 8px", borderRadius: 999 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} /> {s.label}
        </span>
        <button className="btn-ghost btn" onClick={onClose} style={{ height: 26, padding: "0 6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div style={{ padding: 18 }}>
        <div className="row gap-3">
          <div className="avatar" style={{ width: 52, height: 52, fontSize: 16, background: customer.color }}>{customer.initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{customer.name}</div>
            <div className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{customer.phone}</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Joined {customer.joined}</div>
          </div>
        </div>

        <div className="row gap-1" style={{ flexWrap: "wrap", marginTop: 12 }}>
          {customer.tags.map((t,i) => (
            <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#F0F1F4", borderRadius: 999, color: "var(--text-2)" }}>#{t}</span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
          <DetailKpi label="Cards" value={customer.cards} />
          <DetailKpi label="Stamps" value={customer.totalStamps} />
          <DetailKpi label="Spend" value={`$${customer.spend}`} />
        </div>

        <div style={{ marginTop: 16 }}>
          <div className="row between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Visits · 12 weeks</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{visits.reduce((a,b)=>a+b,0)} total</span>
          </div>
          <div className="row gap-1" style={{ height: 40, alignItems: "flex-end" }}>
            {visits.map((v,i) => (
              <div key={i} style={{ flex: 1, height: `${(v/Math.max(...visits))*100}%`, background: customer.color, borderRadius: 2, opacity: 0.65 + (i/visits.length)*0.35 }} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Cards in wallet</div>
          {customer.biz.map((b,i) => (
            <div key={i} className="row between" style={{ padding: "8px 10px", border: "1px solid var(--border-soft)", borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{b}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{Math.floor(customer.totalStamps/customer.biz.length)} stamps</span>
            </div>
          ))}
        </div>

        <div className="row gap-2" style={{ marginTop: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}><I.Send size={13} /> Send push</button>
          <button className="btn"><I.Gift size={13} /> Reward</button>
        </div>
      </div>
    </div>
  );
}

function DetailKpi({ label, value }) {
  return (
    <div style={{ padding: "10px 12px", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{value}</div>
    </div>
  );
}

window.CustomersPage = CustomersPage;
