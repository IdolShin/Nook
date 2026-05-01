// Activity feed, leaderboard, scheduled push, chart cards

function ActivityFeed() {
  const I = window.Icons;
  const items = window.NookData.activity;
  const iconFor = (t) => {
    if (t === "stamp")  return { icon: I.Stamp,       bg: "var(--grad-amber)", c: "#8C5A11" };
    if (t === "redeem") return { icon: I.Gift,        bg: "var(--grad-pink)",  c: "#99355C" };
    if (t === "signup") return { icon: I.Users,       bg: "var(--grad-green)", c: "#0D6B45" };
    if (t === "push")   return { icon: I.Send,        bg: "var(--grad-blue)",  c: "#1F4E94" };
    return { icon: I.CheckCircle, bg: "#F0F1F4", c: "#5C5F66" };
  };
  return (
    <div className="card" style={{ padding: 0, height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
        <div>
          <div className="section-title">Recent activity</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>Live across all businesses</div>
        </div>
        <button className="btn btn-ghost" style={{ height: 28, fontSize: 12 }}>View all</button>
      </div>
      <div style={{ padding: "8px 8px", overflow: "auto", flex: 1 }}>
        {items.map((it, i) => {
          const { icon: Ic, bg, c } = iconFor(it.type);
          return (
            <div key={i} className="row gap-3" style={{ padding: "10px 12px", borderRadius: 8, transition: "background 120ms" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FAFAFB"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: bg, color: c,
                display: "flex", alignItems: "center", justifyContent: "center", flex: "none"
              }}>
                <Ic size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
                <div style={{ fontSize: 13 }}>
                  <strong style={{ fontWeight: 600 }}>{it.who}</strong>
                  <span style={{ color: "var(--text-3)" }}> · {it.biz}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>{it.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", whiteSpace: "nowrap" }}>{it.when}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Leaderboard() {
  const I = window.Icons;
  const rows = [...window.NookData.bizActivity]
    .map(d => ({ ...d, total: d.stamps + d.redemptions }))
    .sort((a,b) => b.total - a.total);
  const max = rows[0].total;
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
        <div>
          <div className="section-title">Top businesses</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>By engagement · last 30 days</div>
        </div>
        <button className="btn btn-ghost" style={{ height: 28, padding: "0 6px" }}>
          <I.MoreHoriz size={16} />
        </button>
      </div>
      <div style={{ padding: "10px 16px 14px" }}>
        {rows.map((r, i) => (
          <div key={i} style={{ padding: "10px 4px", borderBottom: i < rows.length-1 ? "1px solid var(--border-soft)" : "none" }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <div className="row gap-2">
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", width: 16 }}>#{i+1}</span>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, background: r.color, color: "white",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 600
                }}>{r.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</span>
              </div>
              <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>{r.total.toLocaleString()}</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: "#F0F0F2", overflow: "hidden" }}>
              <div style={{ width: `${(r.total/max)*100}%`, background: r.color, height: "100%", transition: "width 400ms" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduledPush() {
  const I = window.Icons;
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
        <div>
          <div className="section-title">Scheduled pushes</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>Next 7 days</div>
        </div>
        <button className="btn-primary btn" style={{ height: 28, fontSize: 12, padding: "0 10px" }}>
          <I.Send size={13} /> New
        </button>
      </div>
      <div>
        {window.NookData.scheduledPush.map((p, i) => (
          <div key={i} className="row gap-3" style={{
            padding: "14px 20px",
            borderBottom: i < window.NookData.scheduledPush.length-1 ? "1px solid var(--border-soft)" : "none"
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: p.status === "draft" ? "#F0F1F4" : "var(--accent-light)",
              color: p.status === "draft" ? "var(--text-2)" : "var(--accent-dark)",
              display: "flex", alignItems: "center", justifyContent: "center", flex: "none"
            }}>
              <I.Bell size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>
              <div className="row gap-2">
                <span style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</span>
                <span className={`badge ${p.status === "draft" ? "" : "green"}`}>
                  {p.status === "draft" ? "Draft" : "Scheduled"}
                </span>
              </div>
              <div className="row gap-2" style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                <span>{p.biz}</span>
                <span>·</span>
                <span><I.Calendar size={11} style={{ verticalAlign: "-1px", marginRight: 3 }} />{p.when}</span>
                <span>·</span>
                <span>{p.reach} customers</span>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ height: 28, padding: "0 6px" }}>
              <I.MoreHoriz size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, sub, right, children, padding = 20 }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
        <div>
          <div className="section-title">{title}</div>
          {sub && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{sub}</div>}
        </div>
        {right}
      </div>
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

Object.assign(window, { ActivityFeed, Leaderboard, ScheduledPush, ChartCard });
