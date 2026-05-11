"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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

type Role = "patient" | "staff";

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

function validateEmail(v: string) {
  if (!v.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Enter a valid email.";
  return "";
}
function validatePassword(v: string) {
  if (!v) return "Password is required.";
  return "";
}

function EyeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function ToothIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 8c.2 1 1 1 1.5 0L9 17h6l.5 4c.5 1 1.3 1 1.5 0l1-8c.5-1.5 1-3 1-5 0-3-3-6-7-6z"/></svg>;
}
function PatientIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function StaffIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function AlertIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

export default function LoginPage() {
  const router    = useRouter();
  const { login } = useAuth();
  const isMobile  = useIsMobile();

  const [step,         setStep]         = useState<1 | 2>(1);
  const [role,         setRole]         = useState<Role | null>(null);
  const [form,         setForm]         = useState({ email: "", password: "" });
  const [touched,      setTouched]      = useState({ email: false, password: false });
  const [fieldErrors,  setFieldErrors]  = useState({ email: "", password: "" });
  const [serverError,  setServerError]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (name: "email" | "password", value: string) =>
    name === "email" ? validateEmail(value) : validatePassword(value);

  const handleChange = (name: "email" | "password", value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    setServerError("");
    if (touched[name]) setFieldErrors((fe) => ({ ...fe, [name]: validate(name, value) }));
  };

  const handleBlur = (name: "email" | "password") => {
    setTouched((t) => ({ ...t, [name]: true }));
    setFieldErrors((fe) => ({ ...fe, [name]: validate(name, form[name]) }));
  };

  const selectRole = (r: Role) => {
    setRole(r); setStep(2);
    setForm({ email: "", password: "" });
    setTouched({ email: false, password: false });
    setFieldErrors({ email: "", password: "" });
    setServerError("");
  };

  const handleSubmit = async () => {
    const emailErr    = validateEmail(form.email);
    const passwordErr = validatePassword(form.password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;
    setServerError(""); setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: form.email.trim().toLowerCase(), password: form.password, role });
      login(res.data.token, res.data.user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status  = err.response?.status;
        const message = err.response?.data?.message || err.response?.data?.error || "";
        if (status === 404 || message.toLowerCase().includes("not found"))
          setServerError("No account found with this email.");
        else if (status === 403 || message.toLowerCase().includes("role") || message.toLowerCase().includes("unauthorized"))
          setServerError(`This account does not have ${role === "staff" ? "staff/admin" : "patient"} access.`);
        else if (status === 401 || message.toLowerCase().includes("password") || message.toLowerCase().includes("invalid"))
          setServerError("Incorrect password. Please try again.");
        else if (status === 429)
          setServerError("Too many attempts. Please wait a moment.");
        else
          setServerError(message || "Login failed. Please check your credentials.");
      } else {
        setServerError("Network error. Please check your connection.");
      }
    } finally { setLoading(false); }
  };

  const hasErr = (name: "email" | "password") => touched[name] && !!fieldErrors[name];

  const fieldStyle = (name: "email" | "password"): React.CSSProperties => ({
    width: "100%", padding: "14px 18px", borderRadius: 14,
    border: `1.5px solid ${hasErr(name) ? COLORS.errorBorder : "#E6F7F2"}`,
    backgroundColor: hasErr(name) ? COLORS.errorBg : COLORS.lightMint,
    fontSize: 15, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  });

  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 };

  return (
    <main style={{ fontFamily: "'Josefin Sans', sans-serif", minHeight: "100vh", backgroundColor: COLORS.white, display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #E6F7F2 inset !important; -webkit-text-fill-color: #2C3E50 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {!isMobile && (
        <motion.aside initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
          style={{ width: "45%", minWidth: 340, maxWidth: 520, backgroundColor: COLORS.navy, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 48px", position: "relative", overflow: "hidden", flexShrink: 0 }}
        >
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.25, 0.12] }} transition={{ repeat: Infinity, duration: 6 }}
            style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", backgroundColor: COLORS.green, top: -100, left: -100, pointerEvents: "none" }}
          />
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ repeat: Infinity, duration: 8, delay: 2 }}
            style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", backgroundColor: COLORS.mint, bottom: -60, right: -60, pointerEvents: "none" }}
          />
          <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 340 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", boxShadow: "0 16px 48px rgba(62,180,137,0.45)", color: "white" }}>
              <ToothIcon />
            </div>
            <h1 style={{ fontSize: "clamp(30px, 3vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20 }}>
              YOUR SMILE<br /><span style={{ color: COLORS.mint }}>DESERVES</span><br />THE BEST.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 48 }}>
              Sign in to manage your appointments and connect with our AI receptionist 24/7.
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
                <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><ToothIcon /></div>
                <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="picker" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.2 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, marginBottom: 8 }}>Welcome to DentAI</p>
                <h2 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, marginBottom: 8 }}>Who are you?</h2>
                <p style={{ color: COLORS.navyMid, fontSize: 14, marginBottom: 28 }}>Select your role to continue.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { r: "patient" as Role, icon: <PatientIcon />, label: "I'm a Patient", desc: "Access your appointments & records", bg: COLORS.green, cardBg: COLORS.lightMint, cardBorder: COLORS.lightMint, arrowColor: COLORS.green },
                    { r: "staff" as Role, icon: <StaffIcon />, label: "Staff / Admin", desc: "Doctor & admin portal access", bg: COLORS.navy, cardBg: "rgba(44,62,80,0.04)", cardBorder: "rgba(44,62,80,0.08)", arrowColor: COLORS.navyMid },
                  ].map((item) => (
                    <button key={item.r} onClick={() => selectRole(item.r)}
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 18, border: `2px solid ${item.cardBorder}`, background: item.cardBg, cursor: "pointer", textAlign: "left", fontFamily: "inherit", width: "100%", transition: "all 0.15s", touchAction: "manipulation" }}
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(62,180,137,0.15)")}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: 13, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: `0 8px 20px ${item.bg}40` }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 900, color: COLORS.navy, marginBottom: 3 }}>{item.label}</p>
                        <p style={{ fontSize: 13, color: COLORS.navyMid }}>{item.desc}</p>
                      </div>
                      <span style={{ color: item.arrowColor, fontSize: 18 }}>→</span>
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0" }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                  <span style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em" }}>NEW HERE?</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                </div>
                <p style={{ textAlign: "center", fontSize: 13, color: COLORS.navyMid }}>
                  Don&apos;t have an account?{" "}
                  <span onClick={() => router.push("/auth/register")} style={{ color: COLORS.green, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                    Register as a patient
                  </span>
                </p>
              </motion.div>
            )}

            {step === 2 && role && (
              <motion.div key="form" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.2 }}>
                <button onClick={() => setStep(1)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.navyMid, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, marginBottom: 22, padding: 0 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back
                </button>

                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, background: role === "patient" ? COLORS.lightMint : "rgba(44,62,80,0.07)", marginBottom: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: role === "patient" ? COLORS.green : COLORS.navy }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: role === "patient" ? COLORS.green : COLORS.navy }}>
                    {role === "patient" ? "Patient" : "Staff / Admin"}
                  </span>
                </div>
                <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, marginBottom: 6 }}>Welcome back</h2>
                <p style={{ color: COLORS.navyMid, fontSize: 14, marginBottom: 24 }}>Sign in to your {role === "patient" ? "patient" : "staff"} account</p>

                <AnimatePresence>
                  {serverError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ marginBottom: 18, padding: "12px 15px", backgroundColor: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 10 }}
                    >
                      <span style={{ color: COLORS.error, flexShrink: 0, marginTop: 1 }}><AlertIcon /></span>
                      <p style={{ fontSize: 13, color: COLORS.error, lineHeight: 1.5, margin: 0, flex: 1 }}>{serverError}</p>
                      <button onClick={() => setServerError("")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.error, fontSize: 15, padding: 0, flexShrink: 0 }}>✕</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={lbl}>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      style={fieldStyle("email")}
                      onFocus={(e) => (e.target.style.borderColor = hasErr("email") ? COLORS.error : COLORS.green)}
                      onBlurCapture={(e) => (e.target.style.borderColor = hasErr("email") ? COLORS.errorBorder : "#E6F7F2")}
                    />
                    {touched.email && fieldErrors.email && (
                      <p style={{ fontSize: 12, color: COLORS.error, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><AlertIcon /> {fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label style={lbl}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        onBlur={() => handleBlur("password")}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        style={{ ...fieldStyle("password"), paddingRight: 48 }}
                        onFocus={(e) => (e.target.style.borderColor = hasErr("password") ? COLORS.error : COLORS.green)}
                        onBlurCapture={(e) => (e.target.style.borderColor = hasErr("password") ? COLORS.errorBorder : "#E6F7F2")}
                      />
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShowPassword((p) => !p)}
                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
                      >{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                    </div>
                    {touched.password && fieldErrors.password && (
                      <p style={{ fontSize: 12, color: COLORS.error, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><AlertIcon /> {fieldErrors.password}</p>
                    )}
                  </div>

                  <button onClick={handleSubmit} disabled={loading}
                    style={{ width: "100%", padding: "16px", backgroundColor: loading ? COLORS.mint : (role === "patient" ? COLORS.green : COLORS.navy), color: "white", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", boxShadow: role === "patient" ? "0 8px 24px rgba(62,180,137,0.3)" : "0 8px 24px rgba(44,62,80,0.2)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation" }}
                  >
                    {loading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />}
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                </div>

                {role === "patient" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "22px 0" }}>
                      <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                      <span style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em" }}>OR</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                    </div>
                    <p style={{ textAlign: "center", fontSize: 13, color: COLORS.navyMid }}>
                      Don&apos;t have an account?{" "}
                      <span onClick={() => router.push("/auth/register")} style={{ color: COLORS.green, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>Create one</span>
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}