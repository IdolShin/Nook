// Push composer & history page

const { useState: usePS } = React;

function PushPage({ tweaks }) {
  const I = window.Icons;
  const [tab, setTab] = usePS("compose");
  const [biz, setBiz] = usePS("Nook Café");
  const [audience, setAudience] = usePS("all");
  const [title, setTitle] = usePS("Weekend special: 2x stamps");
  const [body, setBody] = usePS("Drop by this weekend and earn double stamps on every drink. Limited time only ☕");
  const [when, setWhen] = usePS("now");
  const audiences = [
    { id: "all", label: "All customers", count: 128 },
    { id: "vip", label: "VIPs only", count: 23 },
    { id: "lapsing", label: "Lapsing (14+ days)", count: 19 },
    { id: "new", label: "New this month", count: 14 },
  ];
  const reach = audiences.find(a => a.id === audience).count;

  const pastCampaigns = [
    { title: "Free pastry weekend", biz: "Nook Café", sent: "Apr 26", reach: 128, opens: 84, ctr: "65.6%" },
    { title: "10% off this week", biz: "Korean BBQ", sent: "Apr 22", reach: 27, opens: 19, ctr: "70.3%" },
    { title: "New trainer announcement", biz: "Fort Lee Gym", sent: "Apr 19", reach: 53, opens: 31, ctr: "58.4%" },
    { title: "Spring color promo", biz: "Kook 미용실", sent: "Apr 14", reach: 76, opens: 42, ctr: "55.2%" },
  ];

  return (
    <div data-screen-label="04 Push notifications" style={{
      padding: tweaks.density === "compact" ? "20px 24px" : "24px 28px",
      display: "grid", gap: 16
    }}>
      <div className="row between">
        <div className="seg">
          <button className={tab === "compose" ? "on" : ""} onClick={() => setTab("compose")}>Compose</button>
          <button className={tab === "history" ? "on" : ""} onClick={() => setTab("history")}>History</button>
          <button className={tab === "templates" ? "on" : ""} onClick={() => setTab("templates")}>Templates</button>
        </div>
      </div>

      {tab === "compose" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }}>
          <div className="card" style={{ padding: 22 }}>
            <FormSection title="From business">
              <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                {["Nook Café","Kook 미용실","Fort Lee Gym","Korean BBQ"].map(b => (
                  <button key={b} className="btn" onClick={() => setBiz(b)}
                    style={{ borderColor: biz===b ? "var(--accent)" : "var(--border)", background: biz===b ? "var(--accent-light)" : "white", color: biz===b ? "var(--accent-dark)" : "var(--text)" }}>
                    {b}
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection title="Audience" hint={`${reach} customers will receive this`}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {audiences.map(a => (
                  <button key={a.id} onClick={() => setAudience(a.id)} style={{
                    border: "1px solid",
                    borderColor: audience === a.id ? "var(--accent)" : "var(--border)",
                    background: audience === a.id ? "var(--accent-light)" : "white",
                    borderRadius: 10, padding: "10px 14px", cursor: "pointer",
                    textAlign: "left", fontFamily: "inherit"
                  }}>
                    <div className="row between">
                      <span style={{ fontSize: 13, fontWeight: 500, color: audience===a.id ? "var(--accent-dark)" : "var(--text)" }}>{a.label}</span>
                      <span className="mono" style={{ fontSize: 12, color: "var(--text-3)" }}>{a.count}</span>
                    </div>
                  </button>
                ))}
              </div>
            </FormSection>

            <FormSection title="Title" hint={`${title.length} / 50`}>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} maxLength={50}
                style={inputStyle} placeholder="Catchy title…" />
            </FormSection>

            <FormSection title="Message" hint={`${body.length} / 160`}>
              <textarea value={body} onChange={(e)=>setBody(e.target.value)} maxLength={160} rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} />
            </FormSection>

            <FormSection title="Send">
              <div className="row gap-2">
                <button className="btn" onClick={() => setWhen("now")}
                  style={{ borderColor: when==="now"?"var(--accent)":"var(--border)", background: when==="now"?"var(--accent-light)":"white", color: when==="now"?"var(--accent-dark)":"var(--text)" }}>
                  <I.Zap size={13} /> Send now
                </button>
                <button className="btn" onClick={() => setWhen("schedule")}
                  style={{ borderColor: when==="schedule"?"var(--accent)":"var(--border)", background: when==="schedule"?"var(--accent-light)":"white", color: when==="schedule"?"var(--accent-dark)":"var(--text)" }}>
                  <I.Calendar size={13} /> Schedule
                </button>
                {when === "schedule" && (
                  <input type="datetime-local" defaultValue="2026-05-02T11:00" style={{ ...inputStyle, width: "auto" }} />
                )}
              </div>
            </FormSection>

            <div className="row gap-2" style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-soft)" }}>
              <button className="btn">Save as draft</button>
              <div style={{ flex: 1 }} />
              <button className="btn">Send test to me</button>
              <button className="btn btn-primary"><I.Send size={13} /> {when === "now" ? `Send to ${reach}` : `Schedule (${reach})`}</button>
            </div>
          </div>

          {/* Live preview */}
          <div style={{ position: "sticky", top: 84 }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Live preview</div>
            <div className="card" style={{ padding: 18, background: "linear-gradient(180deg, #1A1A1F 0%, #2A2A30 100%)", borderColor: "transparent" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 8, textAlign: "center" }}>iPhone lock screen</div>
              <div style={{ background: "rgba(255,255,255,0.16)", backdropFilter: "blur(10px)", borderRadius: 14, padding: 12, color: "white" }}>
                <div className="row gap-2" style={{ marginBottom: 6 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>n</div>
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>WALLET · NOOK</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.55 }}>now</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{title || "Title"}</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2, lineHeight: 1.4 }}>{body || "Message body…"}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 16, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Estimated impact</div>
              <div className="row between" style={{ fontSize: 12, padding: "4px 0" }}>
                <span style={{ color: "var(--text-3)" }}>Reach</span>
                <span className="mono" style={{ fontWeight: 500 }}>{reach}</span>
              </div>
              <div className="row between" style={{ fontSize: 12, padding: "4px 0" }}>
                <span style={{ color: "var(--text-3)" }}>Estimated opens</span>
                <span className="mono" style={{ fontWeight: 500 }}>{Math.round(reach*0.62)}</span>
              </div>
              <div className="row between" style={{ fontSize: 12, padding: "4px 0" }}>
                <span style={{ color: "var(--text-3)" }}>Visits driven (avg)</span>
                <span className="mono" style={{ fontWeight: 500 }}>{Math.round(reach*0.18)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#FAFAFB", color: "var(--text-3)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Campaign</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Business</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500 }}>Sent</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>Reach</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>Opens</th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 500 }}>CTR</th>
              </tr>
            </thead>
            <tbody>
              {pastCampaigns.map((p,i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 500 }}>{p.title}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-2)" }}>{p.biz}</td>
                  <td style={{ padding: "12px 16px", color: "var(--text-3)" }}>{p.sent}</td>
                  <td className="mono" style={{ padding: "12px 16px", textAlign: "right" }}>{p.reach}</td>
                  <td className="mono" style={{ padding: "12px 16px", textAlign: "right" }}>{p.opens}</td>
                  <td className="mono" style={{ padding: "12px 16px", textAlign: "right", color: "#0D6B45", fontWeight: 500 }}>{p.ctr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "templates" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12 }}>
          {[
            { t: "Welcome new customer", b: "Hey {name}, welcome to {business}! Your first stamp is on us 🎉" },
            { t: "Win-back lapsing", b: "We miss you, {name}. Come back this week for 15% off." },
            { t: "Reward unlocked", b: "🎁 You've earned a free {reward}! Show this card to redeem." },
            { t: "New product drop", b: "Just launched at {business}: come check it out." },
            { t: "Birthday treat", b: "Happy birthday, {name}! Free {reward} on us today only." },
            { t: "Weekend boost", b: "Double stamps all weekend. See you soon ☕" },
          ].map((tpl,i) => (
            <div key={i} className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tpl.t}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 6, lineHeight: 1.45 }}>{tpl.b}</div>
              <button className="btn" style={{ marginTop: 12, height: 28, fontSize: 12 }}>Use template</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px",
  border: "1px solid var(--border)", borderRadius: 8,
  fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "white"
};

function FormSection({ title, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

window.PushPage = PushPage;
