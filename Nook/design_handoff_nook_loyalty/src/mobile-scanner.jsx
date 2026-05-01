// Mobile registration (customer-facing) + Staff scanner (dark)

const { useState: useMS, useEffect: useME } = React;

// Phone frame helper
function PhoneFrame({ children, dark, label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{
        width: 320, height: 660,
        borderRadius: 44, padding: 8,
        background: "#0E0E12",
        boxShadow: "0 30px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
        position: "relative"
      }}>
        <div style={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
          width: 96, height: 26, borderRadius: 999, background: "#0E0E12", zIndex: 5
        }} />
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 36,
          overflow: "hidden",
          background: dark ? "#0E0E12" : "white",
          color: dark ? "white" : "var(--text)",
          position: "relative",
          display: "flex", flexDirection: "column"
        }}>
          {/* status bar */}
          <div className="row between" style={{
            padding: "16px 24px 8px",
            fontSize: 12, fontWeight: 600,
            color: dark ? "white" : "#1A1A1F"
          }}>
            <span className="mono">9:41</span>
            <span style={{ width: 80 }} />
            <span className="row gap-1">
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 8h2M5 6h2M9 4h2M13 2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="20" y="3" width="1.5" height="4" rx="0.5" fill="currentColor"/></svg>
            </span>
          </div>
          <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
        </div>
      </div>
      {label && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{label}</div>}
    </div>
  );
}

// ——————————————————————— MOBILE REGISTRATION ———————————————————————
function MobilePage({ tweaks }) {
  const [step, setStep] = useMS(0);
  const steps = ["Scan QR", "Enter phone", "Verify", "Add to wallet", "Done"];
  return (
    <div data-screen-label="07 Customer registration" style={{ padding: "24px 28px" }}>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row between">
          <div>
            <div className="section-title">Customer registration flow</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>What customers see when they scan a Nook QR code at the counter.</div>
          </div>
          <div className="seg">
            {steps.map((s,i) => (
              <button key={i} className={step===i?"on":""} onClick={()=>setStep(i)}>{i+1}. {s}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap",
        padding: "20px 0"
      }}>
        {step === 0 && <PhoneFrame label="① QR landing page"><MobileLanding onContinue={() => setStep(1)} /></PhoneFrame>}
        {step === 1 && <PhoneFrame label="② Enter phone"><MobilePhone onContinue={() => setStep(2)} /></PhoneFrame>}
        {step === 2 && <PhoneFrame label="③ Verify with code"><MobileVerify onContinue={() => setStep(3)} /></PhoneFrame>}
        {step === 3 && <PhoneFrame label="④ Add to wallet"><MobileWallet onContinue={() => setStep(4)} /></PhoneFrame>}
        {step === 4 && <PhoneFrame label="⑤ Confirmation"><MobileDone /></PhoneFrame>}
      </div>
    </div>
  );
}

function MobileLanding({ onContinue }) {
  return (
    <div style={{ padding: "12px 24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "center", padding: "30px 0 18px" }}>
        <div style={{
          width: 200, height: 124, borderRadius: 14,
          background: "linear-gradient(135deg, #0F4D38 0%, #1D9E75 100%)",
          color: "white", padding: 14, position: "relative", overflow: "hidden",
          boxShadow: "0 12px 28px rgba(15,77,56,0.28)"
        }}>
          <div style={{ position: "absolute", right: -8, bottom: -22, fontSize: 110, opacity: 0.12, fontWeight: 700, lineHeight: 1 }}>N</div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".1em", opacity: 0.85 }}>NOOK CAFÉ</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Coffee lovers</div>
          <div style={{ fontSize: 9, opacity: 0.85, marginTop: 1 }}>Free latte after 10 stamps</div>
          <div className="row gap-1" style={{ position: "absolute", bottom: 12, left: 14 }}>
            {Array.from({length:10}).map((_,i) => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: 999, background: i<3?"white":"rgba(255,255,255,0.2)", border: i>=3?"1px dashed rgba(255,255,255,0.4)":"none" }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "0 4px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#1D9E75", textTransform: "uppercase" }}>Nook Café</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 6 }}>Get your loyalty card</div>
        <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.5 }}>
          Earn a free latte after 10 stamps. Lives right inside your wallet — no app to download.
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 14, background: "#F5F6FA", borderRadius: 12, fontSize: 12, color: "var(--text-2)", display: "grid", gap: 8 }}>
        <div className="row gap-2"><span style={{ width: 18, height: 18, borderRadius: 6, background: "var(--accent-light)", color: "var(--accent-dark)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>1</span> Add the card to your wallet</div>
        <div className="row gap-2"><span style={{ width: 18, height: 18, borderRadius: 6, background: "var(--accent-light)", color: "var(--accent-dark)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>2</span> Show it at checkout for stamps</div>
        <div className="row gap-2"><span style={{ width: 18, height: 18, borderRadius: 6, background: "var(--accent-light)", color: "var(--accent-dark)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>3</span> Redeem rewards in-store</div>
      </div>

      <button onClick={onContinue} style={{
        width: "100%", marginTop: 22, height: 50,
        border: 0, borderRadius: 14, background: "#1A1A1F", color: "white",
        fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
      }}>Continue</button>
    </div>
  );
}

function MobilePhone({ onContinue }) {
  const [v, setV] = useMS("");
  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Your phone number</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>
        We'll text you a 6-digit code. We never share your number.
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>Mobile</div>
        <div className="row gap-2" style={{ padding: "0 12px", height: 50, border: "1px solid var(--border)", borderRadius: 12 }}>
          <span className="mono" style={{ fontSize: 14, color: "var(--text-2)" }}>🇺🇸 +1</span>
          <input value={v} onChange={(e)=>setV(e.target.value)} placeholder="(201) 555-0142"
            style={{ flex: 1, border: 0, outline: 0, fontSize: 16, fontFamily: "inherit", letterSpacing: "0.5px" }} />
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 16, lineHeight: 1.5 }}>
        By continuing, you agree to receive transactional and promotional messages from Nook Café. Reply STOP anytime.
      </div>

      <button onClick={onContinue} style={{
        width: "100%", marginTop: 22, height: 50,
        border: 0, borderRadius: 14, background: "#1A1A1F", color: "white",
        fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
      }}>Send code</button>
    </div>
  );
}

function MobileVerify({ onContinue }) {
  const [code, setCode] = useMS(["1","8","2"," "," "," "]);
  return (
    <div style={{ padding: "20px 24px 28px" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Enter the code</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>
        We sent a 6-digit code to <span className="mono">+1 (201) 555-0142</span>.
      </div>
      <div className="row gap-2" style={{ marginTop: 28, justifyContent: "center" }}>
        {code.map((c,i) => (
          <div key={i} style={{
            width: 38, height: 50, borderRadius: 10,
            border: c.trim() ? "2px solid var(--accent)" : "1px solid var(--border)",
            background: c.trim() ? "var(--accent-light)" : "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 600, fontFamily: "JetBrains Mono"
          }}>{c.trim() || ""}</div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: "var(--text-3)" }}>
        Didn't get it? <span style={{ color: "var(--accent-dark)", fontWeight: 500 }}>Resend in 0:24</span>
      </div>
      <button onClick={onContinue} style={{
        width: "100%", marginTop: 28, height: 50,
        border: 0, borderRadius: 14, background: "#1A1A1F", color: "white",
        fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
      }}>Verify</button>
    </div>
  );
}

function MobileWallet({ onContinue }) {
  return (
    <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Add to wallet</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 6, lineHeight: 1.5 }}>
        Your card is ready. Add it to keep it handy.
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
        <div style={{
          width: 240, height: 148, borderRadius: 14,
          background: "linear-gradient(135deg, #0F4D38 0%, #1D9E75 100%)",
          color: "white", padding: 14, position: "relative", overflow: "hidden",
          boxShadow: "0 14px 30px rgba(15,77,56,0.32)"
        }}>
          <div style={{ position: "absolute", right: -8, bottom: -28, fontSize: 130, opacity: 0.12, fontWeight: 700, lineHeight: 1 }}>N</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".1em", opacity: 0.85 }}>NOOK CAFÉ</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Min-jae Kim</div>
          <div style={{ fontSize: 10, opacity: 0.85 }}>Coffee lovers · 0/10</div>
          <div className="row gap-1" style={{ position: "absolute", bottom: 12, left: 14 }}>
            {Array.from({length:10}).map((_,i) => (
              <span key={i} style={{ width: 11, height: 11, borderRadius: 999, background: "rgba(255,255,255,0.18)", border: "1px dashed rgba(255,255,255,0.4)" }} />
            ))}
          </div>
        </div>
      </div>

      <button onClick={onContinue} style={{
        width: "100%", height: 50,
        border: 0, borderRadius: 14, background: "black", color: "white",
        fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.05 11.97c-.03-2.92 2.39-4.32 2.5-4.39-1.36-1.99-3.48-2.27-4.24-2.3-1.81-.18-3.53 1.06-4.45 1.06-.93 0-2.34-1.04-3.85-1.01-1.98.03-3.81 1.15-4.83 2.93-2.06 3.57-.53 8.86 1.48 11.76.99 1.42 2.16 3.01 3.7 2.95 1.49-.06 2.05-.96 3.85-.96 1.79 0 2.31.96 3.88.93 1.6-.03 2.61-1.44 3.59-2.86 1.13-1.64 1.6-3.23 1.62-3.31-.04-.02-3.11-1.19-3.14-4.73zM14.07 3.97c.83-1 1.39-2.39 1.23-3.78-1.2.05-2.65.8-3.5 1.79-.77.88-1.44 2.29-1.26 3.66 1.34.1 2.7-.68 3.53-1.67z"/></svg>
        Add to Apple Wallet
      </button>
      <button onClick={onContinue} style={{
        width: "100%", marginTop: 8, height: 50,
        border: "1px solid var(--border)", borderRadius: 14, background: "white", color: "#1A1A1F",
        fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
      }}>
        Save to Google Wallet
      </button>
    </div>
  );
}

function MobileDone() {
  return (
    <div style={{ padding: "60px 24px 28px", textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, margin: "0 auto 20px",
        borderRadius: 999, background: "var(--accent-light)",
        display: "flex", alignItems: "center", justifyContent: "center"
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>You're in!</div>
      <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.5 }}>
        Your Nook Café card is now in your wallet. Show it at checkout to start earning stamps.
      </div>

      <div style={{ marginTop: 24, padding: 14, background: "#F5F6FA", borderRadius: 12, textAlign: "left" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: ".06em", textTransform: "uppercase" }}>Welcome bonus</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>1 free stamp on us 🎉</div>
        <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>It's already on your card. Just 9 more to a free latte.</div>
      </div>
    </div>
  );
}

// ——————————————————————— STAFF SCANNER (DARK) ———————————————————————
function ScannerPage({ tweaks }) {
  const [view, setView] = useMS("scan"); // scan | success | customer
  return (
    <div data-screen-label="08 Staff scanner" style={{ padding: "24px 28px" }}>
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row between">
          <div>
            <div className="section-title">Staff scanner</div>
            <div style={{ fontSize: 12, color: "var(--text-3)" }}>The tablet view shop staff use to add stamps. Designed for one-handed use, glove-friendly.</div>
          </div>
          <div className="seg">
            <button className={view==="scan"?"on":""} onClick={()=>setView("scan")}>Scan</button>
            <button className={view==="success"?"on":""} onClick={()=>setView("success")}>Stamp added</button>
            <button className={view==="customer"?"on":""} onClick={()=>setView("customer")}>Customer found</button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0" }}>
        <div style={{
          width: 720, height: 480, borderRadius: 22,
          background: "#0A0A0E", color: "white",
          boxShadow: "0 30px 60px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)",
          padding: 18, position: "relative", overflow: "hidden",
          fontFamily: "Inter"
        }}>
          {/* topbar */}
          <div className="row between" style={{ marginBottom: 16 }}>
            <div className="row gap-2">
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>n</div>
              <div style={{ fontSize: 13 }}>Nook Café · <span style={{ opacity: 0.5 }}>Counter</span></div>
            </div>
            <div className="row gap-2">
              <div className="row gap-1" style={{ fontSize: 11, padding: "3px 8px", background: "rgba(29,158,117,0.16)", color: "#7DD9B5", borderRadius: 999 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "#1D9E75" }} /> Online
              </div>
              <div style={{ fontSize: 12, opacity: 0.6 }} className="mono">9:41</div>
              <button style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "white", cursor: "pointer" }}>⏻</button>
            </div>
          </div>

          {view === "scan" && <ScanView />}
          {view === "success" && <SuccessView />}
          {view === "customer" && <CustomerView />}
        </div>
      </div>
    </div>
  );
}

function ScanView() {
  return (
    <div className="row gap-4" style={{ height: "calc(100% - 50px)" }}>
      <div style={{
        flex: 1, borderRadius: 16,
        background: "radial-gradient(circle at center, #15171D 0%, #0A0A0E 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 240, height: 240, borderRadius: 24,
            border: "2px solid rgba(125,217,181,0.5)",
            position: "relative",
            boxShadow: "0 0 0 8px rgba(29,158,117,0.06)"
          }}>
            {/* corner brackets */}
            {[
              { t: -2, l: -2, br: "0 0 16px 0" },
              { t: -2, r: -2, br: "0 0 0 16px" },
              { b: -2, l: -2, br: "0 16px 0 0" },
              { b: -2, r: -2, br: "16px 0 0 0" },
            ].map((c,i) => (
              <div key={i} style={{
                position: "absolute",
                top: c.t, bottom: c.b, left: c.l, right: c.r,
                width: 36, height: 36,
                borderTop: c.t!=null ? "3px solid #1D9E75" : "none",
                borderBottom: c.b!=null ? "3px solid #1D9E75" : "none",
                borderLeft: c.l!=null ? "3px solid #1D9E75" : "none",
                borderRight: c.r!=null ? "3px solid #1D9E75" : "none",
                borderRadius: c.br
              }} />
            ))}
            {/* scanning line */}
            <div style={{
              position: "absolute", left: 8, right: 8, height: 2,
              background: "linear-gradient(90deg, transparent, #1D9E75, transparent)",
              top: "50%", boxShadow: "0 0 12px #1D9E75"
            }} />
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", fontSize: 14, opacity: 0.7 }}>
          Hold the customer's QR or barcode in the frame
        </div>
      </div>

      <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={scanActionBtn(true)}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Add stamp</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>+1 to current card</span>
        </button>
        <button style={scanActionBtn()}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Redeem reward</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>Free latte etc.</span>
        </button>
        <button style={scanActionBtn()}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Look up by phone</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>If no card on hand</span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: ".06em" }}>Today</div>
          <div className="row between" style={{ marginTop: 6 }}>
            <span style={{ fontSize: 12 }}>Stamps</span>
            <span className="mono" style={{ fontWeight: 600 }}>42</span>
          </div>
          <div className="row between" style={{ marginTop: 4 }}>
            <span style={{ fontSize: 12 }}>Redeems</span>
            <span className="mono" style={{ fontWeight: 600 }}>7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function scanActionBtn(primary) {
  return {
    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
    padding: "14px 16px", border: 0, borderRadius: 12,
    background: primary ? "#1D9E75" : "rgba(255,255,255,0.06)",
    color: "white", cursor: "pointer", fontFamily: "inherit",
    textAlign: "left"
  };
}

function SuccessView() {
  return (
    <div style={{ height: "calc(100% - 50px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
      <div style={{
        width: 100, height: 100, borderRadius: 999,
        background: "rgba(29,158,117,0.18)", color: "#7DD9B5",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 14px rgba(29,158,117,0.06)"
      }}>
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 22 }}>Stamp added</div>
      <div style={{ fontSize: 14, opacity: 0.65, marginTop: 6 }}>Min-jae Kim · Coffee lovers · <span className="mono">7/10</span></div>
      <div className="row gap-1" style={{ marginTop: 18 }}>
        {Array.from({length:10}).map((_,i) => (
          <span key={i} style={{
            width: 18, height: 18, borderRadius: 999,
            background: i < 7 ? "#1D9E75" : "rgba(255,255,255,0.12)",
            border: i >= 7 ? "1px dashed rgba(255,255,255,0.2)" : "none",
            transition: "background 200ms"
          }} />
        ))}
      </div>
      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.5 }}>Auto-returning to scanner in 3s</div>
    </div>
  );
}

function CustomerView() {
  return (
    <div className="row gap-4" style={{ height: "calc(100% - 50px)" }}>
      <div style={{ flex: 1, padding: 22, borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="row gap-3">
          <div style={{ width: 56, height: 56, borderRadius: 999, background: "#1D9E75", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600 }}>MK</div>
          <div style={{ flex: 1, lineHeight: 1.3 }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Min-jae Kim</div>
            <div style={{ fontSize: 12, opacity: 0.55 }} className="mono">+1 201 555 0142 · Member since Mar 2026</div>
            <div className="row gap-2" style={{ marginTop: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(194,107,31,0.18)", color: "#E0A560", fontWeight: 500 }}>● VIP</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>38 stamps</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>2 cards</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>Cards in wallet</div>
          {[
            { n: "Coffee lovers", p: 6, max: 10, type: "Stamp" },
            { n: "Welcome bonus", p: null, type: "Coupon", note: "Free pastry · expires May 14" },
          ].map((c,i) => (
            <div key={i} style={{ padding: 14, borderRadius: 12, background: "rgba(255,255,255,0.04)", marginBottom: 8 }}>
              <div className="row between">
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{c.n}</div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>{c.note || `${c.p} of ${c.max} stamps`}</div>
                </div>
                <div style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(29,158,117,0.18)", color: "#7DD9B5", fontWeight: 500 }}>{c.type}</div>
              </div>
              {c.p != null && (
                <div className="row gap-1" style={{ marginTop: 10 }}>
                  {Array.from({length: c.max}).map((_,j) => (
                    <span key={j} style={{
                      flex: 1, height: 6, borderRadius: 999,
                      background: j < c.p ? "#1D9E75" : "rgba(255,255,255,0.10)"
                    }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 220, display: "flex", flexDirection: "column", gap: 10 }}>
        <button style={scanActionBtn(true)}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>+ Add stamp</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>Coffee lovers</span>
        </button>
        <button style={scanActionBtn()}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Redeem coupon</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>Free pastry</span>
        </button>
        <button style={scanActionBtn()}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>View history</span>
        </button>
        <div style={{ flex: 1 }} />
        <button style={{ ...scanActionBtn(), background: "transparent", border: "1px solid rgba(255,255,255,0.12)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

window.MobilePage = MobilePage;
window.ScannerPage = ScannerPage;
