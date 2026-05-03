// Loyalty Cards management — list/grid of cards across all businesses,
// with filters, status, performance, and a card-preview panel.

const { useState: useLCS, useMemo: useLCM } = React;

const LC_DATA = [
  { id: "c1", name: "Coffee lovers", biz: "Nook Café", bizColor: "#1D9E75", type: "stamp",     status: "active",  active: 86, issued: 412, redemptions: 138, reward: "Free latte after 10 stamps", updated: "2h ago",   stamps: 10, gradient: ["#0F4D38","#1D9E75"] },
  { id: "c2", name: "Weekend special", biz: "Nook Café", bizColor: "#1D9E75", type: "coupon",   status: "active",  active: 42, issued: 64,  redemptions: 31,  reward: "20% off all drinks",        updated: "1d ago",   stamps: null,gradient: ["#1B3D24","#3F8F5C"] },
  { id: "c3", name: "Hair refresh", biz: "Kook 미용실", bizColor: "#3B6BCC", type: "stamp",     status: "active",  active: 58, issued: 264, redemptions: 81,  reward: "Free cut after 8 visits",  updated: "5h ago",   stamps: 8, gradient: ["#0F2A55","#3B6BCC"] },
  { id: "c4", name: "VIP membership", biz: "Kook 미용실", bizColor: "#3B6BCC", type: "membership",status:"active", active: 12, issued: 12,  redemptions: 4,   reward: "Priority booking + 15% off", updated: "3d ago",  stamps: null,gradient: ["#1A1A1F","#3F4252"] },
  { id: "c5", name: "Gym starter pack", biz: "Fort Lee Gym", bizColor: "#C26B1F", type: "cashback", status: "active", active: 36, issued: 142, redemptions: 41,  reward: "5% back on every visit",     updated: "12h ago",  stamps: null,gradient: ["#5C2F0E","#C26B1F"] },
  { id: "c6", name: "Boot camp pass", biz: "Fort Lee Gym", bizColor: "#C26B1F", type: "stamp",   status: "draft",   active: 0,  issued: 0,   redemptions: 0,   reward: "Free class after 6 sessions", updated: "Just now", stamps: 6, gradient: ["#5C2F0E","#C26B1F"] },
  { id: "c7", name: "BBQ feast card", biz: "Korean BBQ", bizColor: "#C53A6B", type: "stamp",     status: "active",  active: 27, issued: 96,  redemptions: 28,  reward: "Free entrée after 7 visits",  updated: "1d ago",   stamps: 7, gradient: ["#5C1A30","#C53A6B"] },
  { id: "c8", name: "Anniversary coupon", biz: "Korean BBQ", bizColor: "#C53A6B", type: "coupon", status: "paused", active: 14, issued: 28,  redemptions: 9,   reward: "Free dessert on birthday",   updated: "1w ago",   stamps: null,gradient: ["#5C1A30","#C53A6B"] },
  { id: "c9", name: "Welcome bonus", biz: "Nook Café", bizColor: "#1D9E75", type: "coupon",     status: "active",  active: 50, issued: 78,  redemptions: 22,  reward: "Free pastry on signup",      updated: "2d ago",   stamps: null,gradient: ["#0F4D38","#1D9E75"] },
  { id: "c10", name: "Color treatment club", biz: "Kook 미용실", bizColor: "#3B6BCC", type: "stamp", status: "active", active: 19, issued: 47,  redemptions: 12,  reward: "Free toner after 5 colors", updated: "4d ago",   stamps: 5, gradient: ["#0F2A55","#3B6BCC"] },
  { id: "c11", name: "Personal trainer pass", biz: "Fort Lee Gym", bizColor: "#C26B1F", type: "membership", status: "active", active: 8, issued: 8, redemptions: 2, reward: "10 PT sessions / month", updated: "6d ago",  stamps: null,gradient: ["#5C2F0E","#C26B1F"] },
  { id: "c12", name: "Group dinner deal", biz: "Korean BBQ", bizColor: "#C53A6B", type: "coupon", status: "draft",  active: 0,  issued: 0,   redemptions: 0,   reward: "Group of 4: 1 free portion",  updated: "Today",    stamps: null,gradient: ["#5C1A30","#C53A6B"] },
];

const TYPE_META = {
  stamp:      { label: "Stamp",      color: "#1D9E75", bg: "#E8F7F2", text: "#085041" },
  coupon:     { label: "Coupon",     color: "#3B6BCC", bg: "#E5EDF8", text: "#1F4E94" },
  cashback:   { label: "Cashback",   color: "#C26B1F", bg: "#FBEFD9", text: "#8C5A11" },
  membership: { label: "Membership", color: "#1A1A1F", bg: "#EDEDF0", text: "#1A1A1F" },
};

const STATUS_META = {
  active: { label: "Active", color: "#0D6B45", bg: "#E8F7F2", dot: "#1D9E75" },
  draft:  { label: "Draft",  color: "#5C5F66", bg: "#F0F1F4", dot: "#8A8D94" },
  paused: { label: "Paused", color: "#8C5A11", bg: "#FBEFD9", dot: "#C26B1F" },
};

function CardsPage({ tweaks, businessId }) {
  const I = window.Icons;
  const [view, setView] = useLCS("grid");           // grid | list
  const [type, setType] = useLCS("all");
  const [status, setStatus] = useLCS("all");
  const [search, setSearch] = useLCS("");
  const [selected, setSelected] = useLCS(null);

  const filtered = useLCM(() => {
    return LC_DATA.filter(c => {
      if (businessId && businessId !== "all") {
        const map = { nook: "Nook Café", kook: "Kook 미용실", fortlee: "Fort Lee Gym", kbbq: "Korean BBQ" };
        if (c.biz !== map[businessId]) return false;
      }
      if (type !== "all" && c.type !== type) return false;
      if (status !== "all" && c.status !== status) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.biz.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [businessId, type, status, search]);

  const totals = useLCM(() => ({
    total: filtered.length,
    active: filtered.filter(c => c.status === "active").length,
    issued: filtered.reduce((s, c) => s + c.issued, 0),
    redemptions: filtered.reduce((s, c) => s + c.redemptions, 0),
  }), [filtered]);

  return (
    <div data-screen-label="02 Loyalty cards" style={{
      padding: tweaks.density === "compact" ? "20px 24px" : "24px 28px",
      display: "grid", gap: 18
    }}>
      {/* Header strip */}
      <div className="row between">
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em" }}>Loyalty cards</div>
          <div style={{ fontSize: 13, color: "var(--text-2)" }}>
            {totals.total} cards · {totals.active} active · {totals.issued.toLocaleString()} total issued
          </div>
        </div>
        <div className="row gap-2">
          <button className="btn"><I.Download size={14} /> Export</button>
          <button className="btn btn-primary"><I.Plus size={14} /> New card</button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div className="row gap-2" style={{
          height: 32, padding: "0 10px",
          background: "#F5F6FA", borderRadius: 8,
          color: "var(--text-2)", flex: "1 1 280px", minWidth: 220
        }}>
          <I.Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards or businesses…"
            style={{ flex: 1, border: 0, background: "transparent", outline: "none", fontSize: 13, fontFamily: "inherit", color: "inherit" }}
          />
        </div>

        <FilterDropdown label="Type" value={type} onChange={setType}
          options={[{value:"all",label:"All types"},{value:"stamp",label:"Stamp"},{value:"coupon",label:"Coupon"},{value:"cashback",label:"Cashback"},{value:"membership",label:"Membership"}]} />

        <FilterDropdown label="Status" value={status} onChange={setStatus}
          options={[{value:"all",label:"All statuses"},{value:"active",label:"Active"},{value:"draft",label:"Draft"},{value:"paused",label:"Paused"}]} />

        <div style={{ flex: 1 }} />

        <div className="seg">
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>Grid</button>
          <button className={view === "list" ? "on" : ""} onClick={() => setView("list")}>List</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap: 16, alignItems: "start" }}>
        <div>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filtered.map((c, i) => (
                <CardTile key={c.id} card={c} selected={selected?.id === c.id} onSelect={() => setSelected(c)} delay={i*30} />
              ))}
            </div>
          ) : (
            <CardsTable rows={filtered} selectedId={selected?.id} onSelect={setSelected} />
          )}
        </div>

        {selected && (
          <CardDetail card={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const I = window.Icons;
  const [open, setOpen] = useLCS(false);
  const cur = options.find(o => o.value === value);
  return (
    <div style={{ position: "relative" }}>
      <button className="btn" onClick={() => setOpen(o => !o)} style={{ height: 32 }}>
        <span style={{ color: "var(--text-3)" }}>{label}:</span>
        <span>{cur?.label}</span>
        <I.ChevronDown size={13} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setOpen(false)} />
          <div className="card fadeup" style={{
            position: "absolute", top: 38, left: 0, zIndex: 10,
            minWidth: 180, padding: 6, boxShadow: "0 12px 32px rgba(0,0,0,.08)"
          }}>
            {options.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: "block", width: "100%", padding: "8px 10px",
                  border: 0, background: value === o.value ? "var(--accent-light)" : "transparent",
                  color: value === o.value ? "var(--accent-dark)" : "var(--text)",
                  borderRadius: 6, textAlign: "left", fontSize: 13, cursor: "pointer"
                }}
                onMouseEnter={(e) => { if (value !== o.value) e.currentTarget.style.background = "#F5F6FA"; }}
                onMouseLeave={(e) => { if (value !== o.value) e.currentTarget.style.background = "transparent"; }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniCardArt({ card, w = 240, h = 148 }) {
  const t = TYPE_META[card.type];
  const total = card.stamps || 10;
  const filled = Math.max(0, Math.min(total, Math.floor((card.redemptions/Math.max(1,card.issued))*total) || Math.floor(total*0.4)));
  return (
    <div style={{
      width: w, height: h, borderRadius: 12,
      background: `linear-gradient(135deg, ${card.gradient[0]} 0%, ${card.gradient[1]} 100%)`,
      color: "white", padding: 14,
      position: "relative", overflow: "hidden",
      boxShadow: "0 6px 18px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.06)"
    }}>
      {/* big watermark glyph */}
      <div style={{
        position: "absolute", right: -10, bottom: -28, fontSize: 130,
        opacity: 0.10, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.04em",
        color: "white"
      }}>{card.biz[0]}</div>

      <div className="row between" style={{ position: "relative" }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", opacity: 0.8 }}>
          {card.biz}
        </div>
        <div style={{
          fontSize: 9, padding: "2px 6px", borderRadius: 999,
          background: "rgba(255,255,255,0.18)", textTransform: "uppercase", letterSpacing: ".08em"
        }}>{t.label}</div>
      </div>
      <div style={{ marginTop: 10, fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", position: "relative" }}>
        {card.name}
      </div>
      <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2, position: "relative" }}>{card.reward}</div>

      {card.type === "stamp" && (
        <div className="row gap-1" style={{ position: "absolute", left: 14, bottom: 12, gap: 5 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{
              width: w > 200 ? 12 : 9, height: w > 200 ? 12 : 9, borderRadius: 999,
              background: i < filled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.18)",
              border: i < filled ? "none" : "1px dashed rgba(255,255,255,0.4)"
            }} />
          ))}
        </div>
      )}
      {card.type !== "stamp" && (
        <div style={{ position: "absolute", left: 14, bottom: 12, fontSize: 10, opacity: 0.85 }}>
          ●●●● ●●●● {card.id.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function CardTile({ card, selected, onSelect, delay }) {
  const I = window.Icons;
  const s = STATUS_META[card.status];
  const t = TYPE_META[card.type];
  const adoption = card.issued ? Math.round((card.active / card.issued) * 100) : 0;
  return (
    <div className="card"
      onClick={onSelect}
      style={{
        padding: 14,
        cursor: "pointer",
        outline: selected ? "2px solid var(--accent)" : "2px solid transparent",
        outlineOffset: -1,
        transition: "transform 160ms ease, box-shadow 160ms ease"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 0 14px" }}>
        <MiniCardArt card={card} />
      </div>
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row gap-2" style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{card.name}</span>
          </div>
          <div className="row gap-2" style={{ fontSize: 12, color: "var(--text-3)" }}>
            <span style={{ color: card.bizColor, fontWeight: 500 }}>{card.biz}</span>
            <span>·</span>
            <span style={{ color: t.color, background: t.bg, padding: "1px 7px", borderRadius: 999, fontWeight: 500, fontSize: 11 }}>{t.label}</span>
          </div>
        </div>
        <div className="row gap-1" style={{
          fontSize: 11, fontWeight: 500,
          background: s.bg, color: s.color,
          padding: "3px 8px", borderRadius: 999
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
          {s.label}
        </div>
      </div>

      <div className="row gap-3" style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border-soft)" }}>
        <Stat label="Active" value={card.active} />
        <Stat label="Issued" value={card.issued} />
        <Stat label="Redeems" value={card.redemptions} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="row between" style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>
          <span>Adoption</span>
          <span className="mono">{adoption}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: "#F0F0F2", overflow: "hidden" }}>
          <div style={{ width: `${adoption}%`, height: "100%", background: card.bizColor, transition: "width 400ms" }} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>{value.toLocaleString()}</div>
    </div>
  );
}

function CardsTable({ rows, selectedId, onSelect }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#FAFAFB", color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
            <th style={th}>Card</th>
            <th style={th}>Business</th>
            <th style={th}>Type</th>
            <th style={th}>Status</th>
            <th style={{ ...th, textAlign: "right" }}>Active</th>
            <th style={{ ...th, textAlign: "right" }}>Issued</th>
            <th style={{ ...th, textAlign: "right" }}>Redeems</th>
            <th style={th}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c, i) => {
            const s = STATUS_META[c.status];
            const t = TYPE_META[c.type];
            return (
              <tr key={c.id} onClick={() => onSelect(c)}
                style={{
                  borderTop: "1px solid var(--border-soft)",
                  background: selectedId === c.id ? "var(--accent-light)" : "transparent",
                  cursor: "pointer", transition: "background 100ms"
                }}
                onMouseEnter={(e) => { if (selectedId !== c.id) e.currentTarget.style.background = "#FAFAFB"; }}
                onMouseLeave={(e) => { if (selectedId !== c.id) e.currentTarget.style.background = "transparent"; }}>
                <td style={td}>
                  <div className="row gap-2">
                    <div style={{
                      width: 36, height: 24, borderRadius: 5,
                      background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})`,
                      flex: "none"
                    }} />
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ ...td, color: c.bizColor, fontWeight: 500 }}>{c.biz}</td>
                <td style={td}><span style={{ color: t.color, background: t.bg, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 500 }}>{t.label}</span></td>
                <td style={td}>
                  <span className="row gap-1" style={{ fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 999, display: "inline-flex" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
                    {s.label}
                  </span>
                </td>
                <td className="mono" style={{ ...td, textAlign: "right" }}>{c.active}</td>
                <td className="mono" style={{ ...td, textAlign: "right" }}>{c.issued}</td>
                <td className="mono" style={{ ...td, textAlign: "right" }}>{c.redemptions}</td>
                <td style={{ ...td, color: "var(--text-3)" }}>{c.updated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const th = { padding: "12px 14px", textAlign: "left", fontWeight: 500 };
const td = { padding: "12px 14px", verticalAlign: "middle" };

function CardDetail({ card, onClose }) {
  const I = window.Icons;
  const s = STATUS_META[card.status];
  const t = TYPE_META[card.type];
  const last7 = [12, 18, 22, 19, 26, 31, 28];
  return (
    <div className="card fadeup" style={{ padding: 0, position: "sticky", top: 84 }}>
      <div className="row between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--border-soft)" }}>
        <div className="row gap-2">
          <span className="row gap-1" style={{ fontSize: 11, fontWeight: 500, background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 999 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: s.dot }} />
            {s.label}
          </span>
          <span style={{ fontSize: 11, fontWeight: 500, color: t.color, background: t.bg, padding: "2px 8px", borderRadius: 999 }}>{t.label}</span>
        </div>
        <button className="btn-ghost btn" onClick={onClose} style={{ height: 26, padding: "0 6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>{card.biz}</div>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 2 }}>{card.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>{card.reward}</div>

        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 4px" }}>
          <MiniCardArt card={card} w={280} h={172} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 14 }}>
          <DetailStat label="Active" value={card.active} />
          <DetailStat label="Issued" value={card.issued} />
          <DetailStat label="Redeems" value={card.redemptions} />
        </div>

        <div style={{ marginTop: 16, padding: 14, background: "#FAFAFB", borderRadius: 10 }}>
          <div className="row between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Last 7 days</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{last7.reduce((a,b)=>a+b,0)} stamps</span>
          </div>
          <Sparkline values={last7} color={card.bizColor} w={290} h={36} />
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "var(--text-3)" }}>
          Updated {card.updated}
        </div>

        <div className="row gap-2" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
            <I.Sparkle size={13} /> Edit card
          </button>
          <button className="btn">
            <I.Send size={13} /> Push
          </button>
          <button className="btn btn-ghost" style={{ padding: "0 8px" }}>
            <I.MoreHoriz size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value }) {
  return (
    <div style={{ padding: "10px 12px", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
      <div style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>{value.toLocaleString()}</div>
    </div>
  );
}

function EmptyState() {
  const I = window.Icons;
  return (
    <div className="card" style={{ padding: 48, textAlign: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px",
        background: "var(--accent-light)", color: "var(--accent-dark)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <I.Card size={22} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>No cards match</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 4 }}>Try clearing a filter or creating a new card.</div>
    </div>
  );
}

window.CardsPage = CardsPage;
