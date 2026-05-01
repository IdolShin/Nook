// Analytics, Settings, Scanner (dark), Mobile registration, Login pages

const { useState: useAS } = React;

// ——————————————————————— ANALYTICS ———————————————————————
function AnalyticsPage({ tweaks }) {
  const I = window.Icons;
  const [tab, setTab] = useAS("overview");
  const cohort = [
    [100, 78, 64, 52, 44, 38, 35],
    [100, 82, 71, 60, 51, 45],
    [100, 85, 73, 63, 56],
    [100, 80, 69, 60],
    [100, 84, 72],
    [100, 81],
  ];
  const heatmap = Array.from({length:7}, () => Array.from({length:24}, () => Math.random()));
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div data-screen-label="05 Analytics" style={{ padding: "24px 28px", display: "grid", gap: 16 }}>
      <div className="seg">
        {["overview","retention","funnel","engagement"].map(t => (
          <button key={t} className={tab===t?"on":""} onClick={()=>setTab(t)} style={{ textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <KpiCard label="30-day retention" value="62%" delta="+4.2pp" up />
        <KpiCard label="Avg stamps / customer" value="8.9" delta="+0.6" up />
        <KpiCard label="Reward unlock rate" value="41%" delta="+2.1pp" up />
        <KpiCard label="Push CTR" value="62.4%" delta="−0.8pp" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
            <div className="section-title">Cohort retention</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>% of customers active in week N after signup</div>
          </div>
          <div style={{ padding: 18, overflow: "auto" }}>
            <table style={{ borderCollapse: "separate", borderSpacing: 4 }}>
              <thead>
                <tr>
                  <th style={{ fontSize: 11, color: "var(--text-3)", padding: 6, textAlign: "left" }}>Cohort</th>
                  {[0,1,2,3,4,5,6].map(w => <th key={w} style={{ fontSize: 11, color: "var(--text-3)", padding: 6 }}>W{w}</th>)}
                </tr>
              </thead>
              <tbody>
                {cohort.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11, color: "var(--text-3)", padding: 6, whiteSpace: "nowrap" }}>Mar W{i+1}</td>
                    {row.map((v, j) => (
                      <td key={j} className="mono" style={{
                        width: 50, height: 32, textAlign: "center",
                        background: `oklch(${0.62 + (v/100)*0.18} 0.08 165 / ${0.18 + (v/100)*0.82})`,
                        color: v > 60 ? "white" : "var(--text)",
                        borderRadius: 4, fontSize: 11, fontWeight: 500
                      }}>{v}%</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
            <div className="section-title">Customer funnel</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>Last 30 days</div>
          </div>
          <div style={{ padding: 18, display: "grid", gap: 14 }}>
            {[
              { l: "QR scanned", v: 482, pct: 100 },
              { l: "Card added to wallet", v: 312, pct: 65 },
              { l: "First stamp earned", v: 268, pct: 56 },
              { l: "Returning visit", v: 198, pct: 41 },
              { l: "Reward redeemed", v: 87,  pct: 18 },
            ].map((s,i) => (
              <div key={i}>
                <div className="row between" style={{ fontSize: 12, marginBottom: 4 }}>
                  <span>{s.l}</span>
                  <span className="mono" style={{ color: "var(--text-3)" }}>{s.v} · {s.pct}%</span>
                </div>
                <div style={{ height: 10, background: "#F0F0F2", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${s.pct}%`, height: "100%", background: "var(--accent)", opacity: 1 - i*0.12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-soft)" }}>
          <div className="section-title">Visit heatmap</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>Day of week × hour of day · last 90 days</div>
        </div>
        <div style={{ padding: 20, overflow: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px repeat(24, 1fr)", gap: 3 }}>
            <div />
            {Array.from({length:24},(_,h) => <div key={h} className="mono" style={{ fontSize: 9, color: "var(--text-3)", textAlign: "center" }}>{h}</div>)}
            {heatmap.map((row, di) => (
              <React.Fragment key={di}>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{days[di]}</div>
                {row.map((v, hi) => (
                  <div key={hi} style={{
                    height: 22, borderRadius: 3,
                    background: `oklch(0.95 0.04 165 / ${0.15 + v*0.85})`
                  }} title={`${days[di]} ${hi}:00 · ${Math.round(v*40)} visits`} />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, delta, up }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 11, marginTop: 4, color: up ? "#0D6B45" : "var(--text-3)" }}>{delta}</div>
    </div>
  );
}

// ——————————————————————— SETTINGS ———————————————————————
function SettingsPage({ tweaks }) {
  const I = window.Icons;
  const [tab, setTab] = useAS("workspace");
  const tabs = ["workspace","businesses","team","billing","integrations","branding"];

  return (
    <div data-screen-label="06 Settings" style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 24 }}>
      <nav style={{ display: "grid", gap: 2, alignContent: "start" }}>
        {tabs.map(t => (
          <button key={t} onClick={()=>setTab(t)} style={{
            padding: "8px 12px", border: 0, borderRadius: 8,
            background: tab===t ? "var(--accent-light)" : "transparent",
            color: tab===t ? "var(--accent-dark)" : "var(--text-2)",
            fontWeight: tab===t ? 500 : 400,
            textAlign: "left", fontSize: 13, cursor: "pointer", textTransform: "capitalize",
            fontFamily: "inherit"
          }}>{t}</button>
        ))}
      </nav>

      <div style={{ display: "grid", gap: 16 }}>
        {tab === "workspace" && <>
          <SettingsCard title="Workspace" desc="The container that owns all your businesses.">
            <FieldRow label="Workspace name" value="Nook Loyalty Co." />
            <FieldRow label="Owner" value="Woosang · woosang@nook.app" />
            <FieldRow label="Region" value="us-east-1" />
            <FieldRow label="Timezone" value="America/New_York" />
          </SettingsCard>
          <SettingsCard title="Danger zone" danger>
            <div className="row between">
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Delete workspace</div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>Permanently delete all 4 businesses, 12 cards, and 284 customers.</div>
              </div>
              <button className="btn" style={{ borderColor: "#E5BCC9", color: "#9C2848" }}>Delete</button>
            </div>
          </SettingsCard>
        </>}

        {tab === "businesses" && (
          <SettingsCard title="Businesses" desc="Each business has its own cards, customers, and branding." right={<button className="btn btn-primary"><I.Plus size={13} />Add business</button>}>
            {window.NookData.businesses.filter(b => b.id !== "all").map(b => (
              <div key={b.id} className="row gap-3" style={{ padding: "12px 0", borderTop: "1px solid var(--border-soft)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: b.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{b.short}</div>
                <div style={{ flex: 1, lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 500 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{b.customers} customers · 3 cards</div>
                </div>
                <button className="btn">Manage</button>
              </div>
            ))}
          </SettingsCard>
        )}

        {tab === "team" && (
          <SettingsCard title="Team & roles" desc="Invite teammates and grant access per business." right={<button className="btn btn-primary"><I.Plus size={13} />Invite</button>}>
            {[
              { n: "Woosang", e: "woosang@nook.app", r: "Owner", c: "#1A1A1F" },
              { n: "Mira Park", e: "mira@nook.app", r: "Admin", c: "#1D9E75" },
              { n: "Jay Han",  e: "jay@kook.kr",    r: "Manager · Kook 미용실", c: "#3B6BCC" },
              { n: "Andre Lee", e: "andre@fortlee.com", r: "Staff · Fort Lee Gym", c: "#C26B1F" },
            ].map((m,i) => (
              <div key={i} className="row gap-3" style={{ padding: "12px 0", borderTop: i?"1px solid var(--border-soft)":"none" }}>
                <div className="avatar" style={{ background: m.c }}>{m.n.split(" ").map(w=>w[0]).join("")}</div>
                <div style={{ flex: 1, lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 500 }}>{m.n}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{m.e}</div>
                </div>
                <span className="badge">{m.r}</span>
                <button className="btn-ghost btn" style={{ padding: "0 6px" }}><I.MoreHoriz size={16} /></button>
              </div>
            ))}
          </SettingsCard>
        )}

        {tab === "billing" && <>
          <SettingsCard title="Plan" desc="You're on the trial. Upgrade to keep going." right={<button className="btn btn-primary">Upgrade to Pro</button>}>
            <div className="row gap-3" style={{ padding: 14, background: "var(--accent-light)", borderRadius: 10 }}>
              <I.Sparkle size={20} stroke="var(--accent-dark)" />
              <div style={{ flex: 1, lineHeight: 1.4 }}>
                <div style={{ fontWeight: 500, color: "var(--accent-dark)" }}>Trial · 14 days left</div>
                <div style={{ fontSize: 12, color: "var(--accent-dark)", opacity: 0.8 }}>Pro is $49/mo per business · unlimited cards, Apple Wallet, custom branding.</div>
              </div>
            </div>
          </SettingsCard>
          <SettingsCard title="Usage this month">
            <UsageRow label="Active customers" used={284} cap={500} />
            <UsageRow label="Push notifications sent" used={612} cap={2000} />
            <UsageRow label="Wallet pushes" used={284} cap="∞" />
          </SettingsCard>
        </>}

        {tab === "integrations" && (
          <SettingsCard title="Integrations">
            {[
              { n: "Apple Wallet",   d: "Issue passes to iOS users",     ok: true },
              { n: "Google Wallet",  d: "Issue passes to Android users", ok: true },
              { n: "Square",         d: "Sync transactions for cashback", ok: false },
              { n: "Stripe",         d: "Process subscription payments",  ok: true },
              { n: "Twilio",         d: "SMS fallback for non-wallet users", ok: false },
            ].map((it,i) => (
              <div key={i} className="row between" style={{ padding: "12px 0", borderTop: i?"1px solid var(--border-soft)":"none" }}>
                <div style={{ lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 500 }}>{it.n}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{it.d}</div>
                </div>
                {it.ok ? <span className="badge green">● Connected</span> : <button className="btn">Connect</button>}
              </div>
            ))}
          </SettingsCard>
        )}

        {tab === "branding" && (
          <SettingsCard title="Default branding" desc="Used as fallback when a business hasn't set its own.">
            <div className="row gap-3">
              <div style={{ width: 84, height: 84, borderRadius: 14, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 38 }}>n</div>
              <div style={{ flex: 1 }}>
                <div className="row gap-2"><button className="btn">Upload logo</button><button className="btn btn-ghost">Remove</button></div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>Recommended 512×512px PNG with transparent background.</div>
              </div>
            </div>
            <FieldRow label="Brand color" value="#1D9E75" swatch="#1D9E75" />
            <FieldRow label="Wallet card style" value="Gradient · dark" />
          </SettingsCard>
        )}
      </div>
    </div>
  );
}

function SettingsCard({ title, desc, right, children, danger }) {
  return (
    <div className="card" style={{ padding: 22, ...(danger ? { borderColor: "#F0D5DC" } : {}) }}>
      <div className="row between" style={{ marginBottom: desc ? 4 : 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: danger ? "#9C2848" : "inherit" }}>{title}</div>
        {right}
      </div>
      {desc && <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 14 }}>{desc}</div>}
      {children}
    </div>
  );
}

function FieldRow({ label, value, swatch }) {
  return (
    <div className="row between" style={{ padding: "12px 0", borderTop: "1px solid var(--border-soft)" }}>
      <div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div>
      <div className="row gap-2" style={{ fontSize: 13 }}>
        {swatch && <span style={{ width: 14, height: 14, borderRadius: 4, background: swatch, border: "1px solid rgba(0,0,0,0.06)" }} />}
        <span className="mono">{value}</span>
        <button className="btn-ghost btn" style={{ height: 26, padding: "0 8px", fontSize: 12 }}>Edit</button>
      </div>
    </div>
  );
}

function UsageRow({ label, used, cap }) {
  const pct = typeof cap === "number" ? Math.min(100, (used/cap)*100) : 30;
  return (
    <div style={{ padding: "10px 0", borderTop: "1px solid var(--border-soft)" }}>
      <div className="row between" style={{ fontSize: 13, marginBottom: 6 }}>
        <span>{label}</span>
        <span className="mono" style={{ color: "var(--text-3)" }}>{used} / {cap}</span>
      </div>
      <div style={{ height: 6, background: "#F0F0F2", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }} />
      </div>
    </div>
  );
}

window.AnalyticsPage = AnalyticsPage;
window.SettingsPage = SettingsPage;
