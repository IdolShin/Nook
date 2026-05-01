function Sidebar({ collapsed, current, onNav, accent }) {
  const I = window.Icons;
  const items = [
    { id: "dashboard", label: "Dashboard", icon: I.Home },
    { id: "cards",     label: "Loyalty cards", icon: I.Card, count: 12 },
    { id: "customers", label: "Customers",  icon: I.Users, count: 284 },
    { id: "push",      label: "Push notifications", icon: I.Bell },
    { id: "analytics", label: "Analytics",  icon: I.Chart },
    { id: "settings",  label: "Settings",   icon: I.Settings },
  ];
  const sec2 = [
    { id: "scanner", label: "Staff scanner", icon: I.QrCode },
    { id: "mobile",  label: "Customer flow", icon: I.Wallet },
    { id: "auth",    label: "Login screen",  icon: I.Logout },
    { id: "help",    label: "Help & docs",   icon: I.HelpCircle },
  ];

  return (
    <aside style={{
      borderRight: "1px solid var(--border)",
      background: "var(--surface)",
      display: "flex", flexDirection: "column",
      padding: "18px 14px",
      position: "sticky", top: 0, height: "100vh",
      overflow: "hidden"
    }}>
      {/* logo */}
      <div className="row gap-2" style={{ padding: "0 6px 18px", borderBottom: "1px solid var(--border-soft)" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: accent, color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em",
          flex: "none"
        }}>n</div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>Nook</span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Loyalty platform</span>
          </div>
        )}
      </div>

      {!collapsed && <div style={{ padding: "16px 8px 6px", fontSize: 11, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Manage
      </div>}

      <nav style={{ display: "grid", gap: 2, marginTop: collapsed ? 16 : 0 }}>
        {items.map((it) => (
          <NavItem key={it.id} item={it} active={current === it.id} onClick={() => onNav(it.id)} collapsed={collapsed} accent={accent} />
        ))}
      </nav>

      {!collapsed && <div style={{ padding: "16px 8px 6px", fontSize: 11, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 18 }}>
        More
      </div>}
      <nav style={{ display: "grid", gap: 2, marginTop: collapsed ? 16 : 0 }}>
        {sec2.map((it) => (
          <NavItem key={it.id} item={it} active={current === it.id} onClick={() => onNav(it.id)} collapsed={collapsed} accent={accent} />
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* upgrade card */}
      {!collapsed && (
        <div style={{
          margin: "12px 4px 8px",
          padding: 14,
          background: "linear-gradient(135deg, #E8F7F2 0%, #D8F0E5 100%)",
          borderRadius: 12,
          position: "relative", overflow: "hidden"
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-dark)" }}>Trial · 14 days left</div>
          <div style={{ fontSize: 11, color: "var(--accent-dark)", opacity: 0.75, marginTop: 4, lineHeight: 1.4 }}>
            Unlock unlimited cards & Apple Wallet on Pro.
          </div>
          <button className="btn" style={{
            marginTop: 10, height: 28, fontSize: 12,
            background: "white", border: "1px solid #C7E5D7", color: "var(--accent-dark)"
          }}>Upgrade</button>
        </div>
      )}

      {/* user */}
      <div className="row gap-2" style={{
        padding: 8, borderRadius: 10,
        border: "1px solid var(--border-soft)",
        marginTop: 4
      }}>
        <div className="avatar" style={{ background: "#1A1A1F" }}>WS</div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Woosang</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Admin</div>
            </div>
            <button className="btn-ghost btn" style={{ height: 28, padding: "0 6px" }}>
              <window.Icons.MoreHoriz size={16} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function NavItem({ item, active, onClick, collapsed, accent }) {
  const I = item.icon;
  return (
    <button onClick={onClick} title={collapsed ? item.label : undefined} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: collapsed ? "9px" : "8px 10px",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: 8, border: 0,
      background: active ? "var(--accent-light)" : "transparent",
      color: active ? "var(--accent-dark)" : "var(--text-2)",
      fontSize: 13, fontWeight: active ? 500 : 400,
      width: "100%", textAlign: "left",
      transition: "background 120ms",
      position: "relative"
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F5F6FA"; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <I size={17} stroke={active ? "var(--accent)" : "var(--text-2)"} />
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && item.count != null && (
        <span style={{
          fontSize: 11, fontWeight: 500,
          padding: "1px 6px", borderRadius: 999,
          background: active ? "white" : "#F0F1F4",
          color: active ? "var(--accent-dark)" : "var(--text-2)"
        }}>{item.count}</span>
      )}
    </button>
  );
}

window.Sidebar = Sidebar;
