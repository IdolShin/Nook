function StatCards({ density }) {
  const I = window.Icons;
  const cards = [
    {
      label: "Total customers", value: "284", delta: "+18", deltaPct: "+6.8%", up: true,
      icon: I.Users, grad: "var(--grad-green)", spark: [210, 218, 225, 234, 241, 252, 260, 268, 275, 284], sparkColor: "#1D9E75",
      sub: "across 4 businesses"
    },
    {
      label: "Active cards", value: "359", delta: "+24", deltaPct: "+7.2%", up: true,
      icon: I.Wallet, grad: "var(--grad-blue)", spark: [280, 290, 298, 308, 318, 328, 338, 345, 352, 359], sparkColor: "#3B6BCC",
      sub: "in Apple / Google Wallet"
    },
    {
      label: "Stamps issued", value: "2,517", delta: "+312", deltaPct: "+14.1%", up: true,
      icon: I.Stamp, grad: "var(--grad-amber)", spark: window.NookData.trend30, sparkColor: "#C26B1F",
      sub: "last 30 days"
    },
    {
      label: "Redemptions", value: "847", delta: "−3", deltaPct: "−0.4%", up: false,
      icon: I.Gift, grad: "var(--grad-pink)", spark: window.NookData.redeem30, sparkColor: "#C53A6B",
      sub: "last 30 days"
    },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 16
    }}>
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div key={i} className="card fadeup" style={{
            padding: density === "compact" ? 16 : 20,
            background: c.grad,
            border: "1px solid rgba(0,0,0,0.04)",
            position: "relative", overflow: "hidden",
            animationDelay: `${i*40}ms`
          }}>
            <div className="row between" style={{ alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(20,30,30,0.65)" }}>{c.label}</div>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 8, color: "#1A1A1F" }}>
                  {c.value}
                </div>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(255,255,255,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#1A1A1F"
              }}>
                <Icon size={16} />
              </div>
            </div>
            <div className="row between" style={{ marginTop: 14 }}>
              <div className="row gap-1">
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 2,
                  fontSize: 12, fontWeight: 600,
                  color: c.up ? "#0D6B45" : "#9C2848"
                }}>
                  {c.up ? <I.ArrowUp size={12} /> : <I.ArrowDown size={12} />}
                  {c.deltaPct}
                </span>
                <span style={{ fontSize: 11, color: "rgba(20,30,30,0.55)" }}>{c.sub}</span>
              </div>
              <Sparkline values={c.spark} color={c.sparkColor} w={70} h={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.StatCards = StatCards;
