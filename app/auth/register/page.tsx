"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";

const COLORS = {
  green:       "#3EB489",
  mint:        "#A7E4D8",
  white:       "#FFFFFF",
  lightMint:   "#E6F7F2",
  navy:        "#2C3E50",
  navyMid:     "rgba(44,62,80,0.5)",
  error:       "#DC2626",
  errorBg:     "#FEF2F2",
  errorBorder: "#FECACA",
};

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function EyeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

function PasswordInput({ value, onChange, placeholder = "••••••••" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "14px 48px 14px 18px", borderRadius: 14, border: "1.5px solid #E6F7F2", backgroundColor: COLORS.lightMint, fontSize: 15, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
        onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")}
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShow((p) => !p)}
        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
      >{show ? <EyeOffIcon /> : <EyeIcon />}</button>
    </div>
  );
}

export default function RegisterPage() {
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const [form,    setForm]    = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) { setError("Enter a valid email address."); return; }
    if (!form.password) { setError("Password is required."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        full_name:    form.name.trim(),
        email:        form.email.trim().toLowerCase(),
        phone_number: form.phone.trim(),
        password:     form.password,
        role:         "patient",
      });
      router.push("/auth/login");
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message || err.response?.data?.error || "Registration failed.");
      else setError("Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "14px 18px", borderRadius: 14,
    border: "1.5px solid #E6F7F2", backgroundColor: COLORS.lightMint,
    fontSize: 15, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 };

  return (
    <main style={{ fontFamily: "'Josefin Sans', sans-serif", minHeight: "100vh", backgroundColor: COLORS.white, display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #E6F7F2 inset !important; -webkit-text-fill-color: #2C3E50 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {!isMobile && (
        <motion.aside initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
          style={{ width: "45%", minWidth: 340, maxWidth: 520, backgroundColor: COLORS.navy, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 48px", position: "relative", overflow: "hidden", flexShrink: 0 }}
        >
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }} transition={{ repeat: Infinity, duration: 7 }}
            style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -120, right: -120, pointerEvents: "none" }}
          />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.07, 0.15, 0.07] }} transition={{ repeat: Infinity, duration: 9, delay: 3 }}
            style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", backgroundColor: COLORS.mint, top: -60, left: -60, pointerEvents: "none" }}
          />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 340 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", boxShadow: "0 16px 48px rgba(62,180,137,0.45)", fontSize: 28, fontWeight: 900, color: "white" }}>D</div>
            <h1 style={{ fontSize: "clamp(28px, 3vw, 42px)", fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20 }}>
              JOIN BRIGHT<br /><span style={{ color: COLORS.mint }}>SMILE</span><br />DENTAL CLINIC
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 48 }}>
              Create your account in seconds and start managing your dental health with AI-powered support.
            </p>
            <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
              {[{ value: "2,400+", label: "Patients" }, { value: "98%", label: "Satisfaction" }, { value: "24/7", label: "AI Support" }].map((s) => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.mint }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <span onClick={() => router.push("/")}
            style={{ position: "absolute", top: 28, left: 28, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back Home
          </span>
        </motion.aside>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? "28px 20px 48px" : "40px 32px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {isMobile && (
            <div style={{ marginBottom: 28 }}>
              <span onClick={() => router.push("/")}
                style={{ fontSize: 13, fontWeight: 700, color: COLORS.navyMid, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginBottom: 24 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                Back to Home
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 900 }}>D</div>
                <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
              </div>
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, marginBottom: 8 }}>DentAI Clinic</p>
            <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, marginBottom: 6 }}>Create your account</h2>
            <p style={{ color: COLORS.navyMid, fontSize: 14, marginBottom: 28 }}>Join hundreds of patients at Bright Smile Clinic</p>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 18, padding: "12px 15px", backgroundColor: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}
                >
                  <p style={{ fontSize: 13, color: COLORS.error, lineHeight: 1.5, margin: 0 }}>{error}</p>
                  <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.error, fontSize: 15, padding: 0, flexShrink: 0 }}>✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input type="text" placeholder="Karim Rahal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inp} onFocus={(e) => (e.target.style.borderColor = COLORS.green)} onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")} />
              </div>
              <div>
                <label style={lbl}>Email Address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inp} onFocus={(e) => (e.target.style.borderColor = COLORS.green)} onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")} />
              </div>
              <div>
                <label style={lbl}>Phone Number <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: COLORS.navyMid }}>(optional)</span></label>
                <input type="tel" placeholder="+961 70 000 000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inp} onFocus={(e) => (e.target.style.borderColor = COLORS.green)} onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")} />
              </div>
              <div>
                <label style={lbl}>Password</label>
                <PasswordInput value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
                {form.password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map((level) => {
                        const strength = form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
                        const colors = [COLORS.error, "#F59E0B", COLORS.green];
                        return <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: level <= strength ? colors[strength - 1] : "#E6F7F2", transition: "background 0.2s" }} />;
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: COLORS.navyMid }}>{form.password.length < 6 ? "Too short" : form.password.length < 10 ? "Good" : "Strong password"}</p>
                  </div>
                )}
              </div>
              <div>
                <label style={lbl}>Confirm Password</label>
                <PasswordInput value={form.confirmPassword} onChange={(v) => setForm({ ...form, confirmPassword: v })} placeholder="Re-enter your password" />
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p style={{ fontSize: 11, color: COLORS.green, marginTop: 6 }}>✓ Passwords match</p>
                )}
              </div>

              <button onClick={handleSubmit} disabled={loading}
                style={{ width: "100%", padding: "16px", backgroundColor: loading ? COLORS.mint : COLORS.green, color: "white", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", boxShadow: "0 8px 24px rgba(62,180,137,0.3)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation" }}
              >
                {loading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />}
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
              <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
              <span style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em" }}>OR</span>
              <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
            </div>
            <p style={{ textAlign: "center", fontSize: 13, color: COLORS.navyMid }}>
              Already have an account?{" "}
              <span onClick={() => router.push("/auth/login")} style={{ color: COLORS.green, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Sign In</span>
            </p>
          </motion.div>
        </div>
      </div>
    </main>
  );
}