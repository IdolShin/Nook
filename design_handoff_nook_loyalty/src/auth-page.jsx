// Login / Signup page (business-facing)

const { useState: useLS } = React;

function AuthPage({ tweaks }) {
  const I = window.Icons;
  const [mode, setMode] = useLS("login");

  return (
    <div data-screen-label="09 Business login" style={{ padding: "24px 28px" }}>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row between">
          <div>
            <div className="section-title">Business signup / login</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>What new businesses see when they come to Nook.</div>
          </div>
          <div className="seg">
            <button className={mode==="login"?"on":""} onClick={()=>setMode("login")}>Log in</button>
            <button className={mode==="signup"?"on":""} onClick={()=>setMode("signup")}>Sign up</button>
          </div>
        </div>
      </div>

      <div className="card" style={{
        padding: 0, overflow: "hidden",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        minHeight: 580
      }}>
        {/* Left form */}
        <div style={{ padding: "48px 56px", display: "flex", flexDirection: "column" }}>
          <div className="row gap-2" style={{ marginBottom: 36 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>n</div>
            <span style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" }}>Nook</span>
          </div>

          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {mode === "login" ? "Welcome back" : "Start your loyalty program"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>
            {mode === "login"
              ? "Log in to your Nook workspace."
              : "Free for 14 days. No credit card. Set up your first card in 5 minutes."}
          </div>

          <div className="row gap-2" style={{ marginTop: 28 }}>
            <button className="btn" style={{ flex: 1, height: 42, justifyContent: "center", fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <button className="btn" style={{ flex: 1, height: 42, justifyContent: "center", fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="black"><path d="M17.05 11.97c-.03-2.92 2.39-4.32 2.5-4.39-1.36-1.99-3.48-2.27-4.24-2.3-1.81-.18-3.53 1.06-4.45 1.06-.93 0-2.34-1.04-3.85-1.01-1.98.03-3.81 1.15-4.83 2.93-2.06 3.57-.53 8.86 1.48 11.76.99 1.42 2.16 3.01 3.7 2.95 1.49-.06 2.05-.96 3.85-.96 1.79 0 2.31.96 3.88.93 1.6-.03 2.61-1.44 3.59-2.86 1.13-1.64 1.6-3.23 1.62-3.31-.04-.02-3.11-1.19-3.14-4.73zM14.07 3.97c.83-1 1.39-2.39 1.23-3.78-1.2.05-2.65.8-3.5 1.79-.77.88-1.44 2.29-1.26 3.66 1.34.1 2.7-.68 3.53-1.67z"/></svg>
              Continue with Apple
            </button>
          </div>

          <div className="row gap-2" style={{ margin: "20px 0", color: "var(--text-3)", fontSize: 11 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            OR
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {mode === "signup" && (
            <Field label="Business name" placeholder="e.g. Nook Café" />
          )}
          <Field label="Email" type="email" placeholder="you@yourbusiness.com" />
          <Field label="Password" type="password" placeholder="••••••••" hint={mode === "login" ? <a href="#" style={{ color: "var(--accent-dark)", textDecoration: "none", fontWeight: 500 }}>Forgot?</a> : null} />

          <button style={{
            width: "100%", marginTop: 18, height: 44,
            border: 0, borderRadius: 10, background: "var(--accent)", color: "white",
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
          }}>
            {mode === "login" ? "Log in" : "Create workspace"}
          </button>

          <div style={{ flex: 1 }} />

          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 24, textAlign: "center" }}>
            {mode === "login"
              ? <>New to Nook? <a href="#" onClick={(e)=>{e.preventDefault();setMode("signup");}} style={{ color: "var(--accent-dark)", textDecoration: "none", fontWeight: 500 }}>Create a workspace</a></>
              : <>Already have an account? <a href="#" onClick={(e)=>{e.preventDefault();setMode("login");}} style={{ color: "var(--accent-dark)", textDecoration: "none", fontWeight: 500 }}>Log in</a></>}
          </div>
        </div>

        {/* Right side feature panel */}
        <div style={{
          background: "linear-gradient(135deg, #0F4D38 0%, #1D9E75 100%)",
          color: "white",
          padding: "48px 48px",
          position: "relative", overflow: "hidden",
          display: "flex", flexDirection: "column"
        }}>
          <div style={{ position: "absolute", right: -20, bottom: -60, fontSize: 360, fontWeight: 700, opacity: 0.06, lineHeight: 1, letterSpacing: "-0.05em" }}>n</div>

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", opacity: 0.85 }}>
            Loyalty, in the wallet
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 12, lineHeight: 1.2 }}>
            Run a punch-card program your customers actually use.
          </div>

          <div style={{ display: "grid", gap: 18, marginTop: 30, position: "relative" }}>
            {[
              { t: "Apple & Google Wallet", d: "No app to download. Lives where customers already are." },
              { t: "QR enrollment in 30s",  d: "Scan, enter phone, done. Tap-to-stamp at checkout." },
              { t: "Push that converts",    d: "Wallet pushes hit the lock screen — 60%+ open rates." },
            ].map((f,i) => (
              <div key={i} className="row gap-3">
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 13, fontWeight: 700 }}>{i+1}</div>
                <div style={{ lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.t}</div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{f.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ marginTop: 30, padding: 16, background: "rgba(255,255,255,0.10)", borderRadius: 12, position: "relative", backdropFilter: "blur(4px)" }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: "italic" }}>
              "We launched Nook in a weekend. By month two, we'd issued more punch cards than we did in a year of paper."
            </div>
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>JK</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Jisoo K. · Owner, Nook Café</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", placeholder, hint }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="row between" style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 500 }}>{label}</label>
        {hint}
      </div>
      <input type={type} placeholder={placeholder} style={{
        width: "100%", height: 42, padding: "0 12px",
        border: "1px solid var(--border)", borderRadius: 10,
        fontSize: 14, fontFamily: "inherit", outline: "none"
      }} />
    </div>
  );
}

window.AuthPage = AuthPage;
