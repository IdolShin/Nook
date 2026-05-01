const { useState: useS, useEffect: useE } = React;

function App() {
  const I = window.Icons;
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "sidebarCollapsed": false,
    "density": "comfortable",
    "showGradients": true,
    "showRedemptionsLine": true
  }/*EDITMODE-END*/);

  const [businessId, setBusinessId] = useS("all");
  const [range, setRange] = useS("30d");
  const [chartTab, setChartTab] = useS("trend"); // trend | redeem
  const [page, setPage] = useS("dashboard");

  const sidebarW = tweaks.sidebarCollapsed ? 72 : 240;
  const series = {
    stamps: window.NookData.trend30,
    redeems: window.NookData.redeem30
  };

  return (
    <div className="app" style={{ "--sidebar-w": sidebarW + "px" }} data-density={tweaks.density}>
      <Sidebar
        collapsed={tweaks.sidebarCollapsed}
        current={page}
        onNav={setPage}
        accent="var(--accent)"
      />
      <main style={{ minWidth: 0 }}>
        <Topbar
          businessId={businessId}
          setBusinessId={setBusinessId}
          range={range}
          setRange={setRange}
          onToggleSidebar={() => setTweak("sidebarCollapsed", !tweaks.sidebarCollapsed)}
          page={page}
        />

        {page === "dashboard" ? (
          <DashboardPage
            tweaks={tweaks}
            series={series}
            range={range}
            chartTab={chartTab}
            setChartTab={setChartTab}
          />
        ) : page === "cards" ? (
          <CardsPage tweaks={tweaks} businessId={businessId} />
        ) : page === "customers" ? (
          <CustomersPage tweaks={tweaks} />
        ) : page === "push" ? (
          <PushPage tweaks={tweaks} />
        ) : page === "analytics" ? (
          <AnalyticsPage tweaks={tweaks} />
        ) : page === "settings" ? (
          <SettingsPage tweaks={tweaks} />
        ) : page === "scanner" ? (
          <ScannerPage tweaks={tweaks} />
        ) : page === "mobile" ? (
          <MobilePage tweaks={tweaks} />
        ) : page === "auth" ? (
          <AuthPage tweaks={tweaks} />
        ) : (
          <PlaceholderPage page={page} />
        )}
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Layout">
          <TweakToggle label="Collapse sidebar" value={tweaks.sidebarCollapsed} onChange={(v) => setTweak("sidebarCollapsed", v)} />
          <TweakRadio label="Density" value={tweaks.density} options={[{value:"comfortable",label:"Comfy"},{value:"compact",label:"Compact"}]} onChange={(v) => setTweak("density", v)} />
        </TweakSection>
        <TweakSection title="Visuals">
          <TweakToggle label="Gradient stat cards" value={tweaks.showGradients} onChange={(v) => setTweak("showGradients", v)} />
          <TweakToggle label="Redemptions line" value={tweaks.showRedemptionsLine} onChange={(v) => setTweak("showRedemptionsLine", v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function DashboardPage({ tweaks, series, range, chartTab, setChartTab }) {
  const I = window.Icons;
  return (
    <div data-screen-label="01 Dashboard" style={{
      padding: tweaks.density === "compact" ? "20px 24px" : "24px 28px",
      display: "grid",
      gap: tweaks.density === "compact" ? 16 : 20
    }}>
      {/* Stats */}
      {tweaks.showGradients ? (
        <StatCards density={tweaks.density} />
      ) : (
        <PlainStatCards density={tweaks.density} />
      )}

      {/* Row 1: line chart (wide) + donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 16 }}>
        <ChartCard
          title={chartTab === "trend" ? "Stamp issuance" : "Redemptions"}
          sub={`Last ${range} · across all businesses`}
          right={
            <div className="row gap-2">
              <div className="seg">
                <button className={chartTab === "trend" ? "on" : ""} onClick={() => setChartTab("trend")}>Issuance</button>
                <button className={chartTab === "redeem" ? "on" : ""} onClick={() => setChartTab("redeem")}>Redemptions</button>
              </div>
              <button className="btn btn-ghost" style={{ height: 28, padding: "0 6px" }}>
                <I.Download size={14} />
              </button>
            </div>
          }>
          <div className="row gap-6" style={{ alignItems: "flex-end", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em" }}>Total</div>
              <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {chartTab === "trend" ? "2,517" : "847"}
              </div>
            </div>
            <div className="row gap-3">
              <div className="row gap-1" style={{ fontSize: 12, color: "var(--text-2)" }}>
                <span style={{ width: 10, height: 2, background: "#1D9E75", display: "inline-block", borderRadius: 1 }} />
                Stamps
              </div>
              {tweaks.showRedemptionsLine && (
                <div className="row gap-1" style={{ fontSize: 12, color: "var(--text-2)" }}>
                  <span style={{ width: 10, height: 2, background: "#3B6BCC", display: "inline-block", borderRadius: 1 }} />
                  Redeems
                </div>
              )}
            </div>
          </div>
          <LineChart series={chartTab === "trend" ? series : { stamps: series.redeems, redeems: series.redeems }}
            showRedemptions={chartTab === "trend" && tweaks.showRedemptionsLine} />
        </ChartCard>

        <ChartCard title="Card type mix" sub="Currently active">
          <DonutChart data={window.NookData.cardMix} />
        </ChartCard>
      </div>

      {/* Row 2: bar chart + activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
        <ChartCard title="Activity by business" sub="Stamps + redemptions · last 30 days">
          <StackedBar data={window.NookData.bizActivity} />
          <div className="row gap-3" style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border-soft)" }}>
            <div className="row gap-1" style={{ fontSize: 12, color: "var(--text-2)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1D9E75", display: "inline-block" }} />
              Stamps
            </div>
            <div className="row gap-1" style={{ fontSize: 12, color: "var(--text-2)" }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#1D9E75", opacity: 0.32, display: "inline-block" }} />
              Redemptions
            </div>
          </div>
        </ChartCard>

        <ActivityFeed />
      </div>

      {/* Row 3: leaderboard + scheduled push */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
        <Leaderboard />
        <ScheduledPush />
      </div>

      <div style={{ textAlign: "center", padding: "8px 0 12px", fontSize: 11, color: "var(--text-3)" }}>
        Nook · v0.4.2 · Last sync 2s ago
      </div>
    </div>
  );
}

function PlainStatCards({ density }) {
  const I = window.Icons;
  const cards = [
    { label: "Total customers", value: "284",   delta: "+6.8%", up: true,  icon: I.Users,  color: "#1D9E75", spark: [210, 218, 225, 234, 241, 252, 260, 268, 275, 284], sub: "across 4 businesses" },
    { label: "Active cards",    value: "359",   delta: "+7.2%", up: true,  icon: I.Wallet, color: "#3B6BCC", spark: [280, 290, 298, 308, 318, 328, 338, 345, 352, 359], sub: "in Apple / Google Wallet" },
    { label: "Stamps issued",   value: "2,517", delta: "+14.1%",up: true,  icon: I.Stamp,  color: "#C26B1F", spark: window.NookData.trend30, sub: "last 30 days" },
    { label: "Redemptions",     value: "847",   delta: "−0.4%", up: false, icon: I.Gift,   color: "#C53A6B", spark: window.NookData.redeem30, sub: "last 30 days" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
      {cards.map((c, i) => {
        const Ic = c.icon;
        return (
          <div key={i} className="card" style={{ padding: density === "compact" ? 16 : 20 }}>
            <div className="row between" style={{ alignItems: "flex-start" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)" }}>{c.label}</div>
              <Ic size={16} stroke={c.color} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 8 }}>{c.value}</div>
            <div className="row between" style={{ marginTop: 12 }}>
              <div className="row gap-1">
                <span style={{ fontSize: 12, fontWeight: 600, color: c.up ? "#0D6B45" : "#9C2848" }}>
                  {c.up ? "↑" : "↓"} {c.delta}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>{c.sub}</span>
              </div>
              <Sparkline values={c.spark} color={c.color} w={70} h={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PlaceholderPage({ page }) {
  const I = window.Icons;
  const labels = {
    cards: "Loyalty cards",
    customers: "Customers",
    push: "Push notifications",
    analytics: "Analytics",
    settings: "Settings",
    scanner: "Staff scanner",
    help: "Help & docs"
  };
  return (
    <div data-screen-label={`02 ${labels[page] || page}`} style={{
      padding: "60px 28px", display: "flex", justifyContent: "center"
    }}>
      <div className="card" style={{ padding: 48, maxWidth: 460, textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px",
          background: "var(--accent-light)", color: "var(--accent-dark)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <I.Sparkle size={22} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {labels[page] || page}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>
          This page is up next. The dashboard is shipped first — say the word and we'll design this page in the same system.
        </div>
        <button className="btn btn-primary" style={{ marginTop: 18 }}>
          Design this page
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
