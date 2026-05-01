"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";

const COLORS = {
  green:      "#3EB489",
  mint:       "#A7E4D8",
  white:      "#FFFFFF",
  lightMint:  "#E6F7F2",
  navy:       "#2C3E50",
  navyMid:    "rgba(44,62,80,0.5)",
  error:      "#DC2626",
  errorBg:    "#FEF2F2",
  errorBorder:"#FECACA",
};

type Role = "patient" | "staff";

function validateEmail(email: string): string {
  if (!email.trim()) return "Email address is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email.trim())) return "Please enter a valid email address.";
  return "";
}
function validatePassword(password: string): string {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters.";
  return "";
}

function EyeIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function AlertIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function ArrowLeftIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function ToothIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 8c.2 1 1 1 1.5 0L9 17h6l.5 4c.5 1 1.3 1 1.5 0l1-8c.5-1.5 1-3 1-5 0-3-3-6-7-6z"/></svg>;
}
function PatientIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function StaffIcon() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}

function FieldError({ message }: { message: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div key="err" initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }} transition={{ duration: 0.18 }}
          style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 12, color: COLORS.error }}
        >
          <AlertIcon /> {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep]     = useState<1 | 2>(1);
  const [role, setRole]     = useState<Role | null>(null);
  const [form, setForm]     = useState({ email: "", password: "" });
  const [touched, setTouched]     = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]   = useState(false);
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
    setRole(r);
    setStep(2);
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

    setServerError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role,
      });
      login(res.data.token, res.data.user);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status  = err.response?.status;
        const message = err.response?.data?.message || err.response?.data?.error || "";
        if (status === 404 || message.toLowerCase().includes("not found")) {
          setServerError("No account found with this email address.");
        } else if (status === 403 || message.toLowerCase().includes("role") || message.toLowerCase().includes("unauthorized")) {
          setServerError(`This account does not have ${role === "staff" ? "staff/admin" : "patient"} access.`);
        } else if (status === 401 || message.toLowerCase().includes("password") || message.toLowerCase().includes("invalid")) {
          setServerError("Incorrect password. Please try again.");
        } else if (status === 429) {
          setServerError("Too many login attempts. Please wait a moment.");
        } else {
          setServerError(message || "Login failed. Please check your credentials.");
        }
      } else {
        setServerError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSubmit(); };
  const hasFieldError = (name: "email" | "password") => touched[name] && !!fieldErrors[name];

  return (
    <main style={{ fontFamily: "'Josefin Sans', sans-serif", minHeight: "100vh", backgroundColor: COLORS.white, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #E6F7F2 inset !important; -webkit-text-fill-color: #2C3E50 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <motion.div initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
        style={{ backgroundColor: COLORS.navy, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 56px", position: "relative", overflow: "hidden" }}
      >
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.25, 0.12] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", backgroundColor: COLORS.green, top: -100, left: -100, pointerEvents: "none" }}
        />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 2 }}
          style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", backgroundColor: COLORS.mint, bottom: -60, right: -60, pointerEvents: "none" }}
        />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 380 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, type: "spring", delay: 0.2 }}
            style={{ width: 72, height: 72, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", boxShadow: "0 16px 48px rgba(62,180,137,0.45)", color: "white" }}
          >
            <ToothIcon />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 44, fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20 }}
          >
            YOUR SMILE<br /><span style={{ color: COLORS.mint }}>DESERVES</span><br />THE BEST.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 48 }}
          >
            Sign in to manage your appointments, view your dental records, and connect with our AI receptionist 24/7.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ display: "flex", gap: 24, justifyContent: "center" }}>
            {[{ value: "2,400+", label: "Patients" }, { value: "98%", label: "Satisfaction" }, { value: "24/7", label: "AI Support" }].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.mint }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ── RIGHT PANEL ── */}
      <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
        style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 64px", backgroundColor: COLORS.white }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <AnimatePresence mode="wait">

            {/* ══ STEP 1 — Role Picker ══ */}
            {step === 1 && (
              <motion.div key="picker" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ marginBottom: 40 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, marginBottom: 10 }}>Welcome to DentAI</p>
                  <h2 style={{ fontSize: 30, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, marginBottom: 10 }}>Who are you?</h2>
                  <p style={{ color: COLORS.navyMid, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Select your role to continue.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Patient */}
                  <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(62,180,137,0.2)" }} whileTap={{ scale: 0.98 }}
                    onClick={() => selectRole("patient")}
                    style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 24px", borderRadius: 18, border: `2px solid ${COLORS.lightMint}`, background: COLORS.lightMint, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: "0 8px 20px rgba(62,180,137,0.35)" }}>
                      <PatientIcon />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 900, color: COLORS.navy, marginBottom: 4 }}>I&apos;m a Patient</p>
                      <p style={{ fontSize: 13, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif" }}>Access your appointments &amp; records</p>
                    </div>
                    <div style={{ marginLeft: "auto", color: COLORS.green, fontSize: 20 }}>→</div>
                  </motion.button>

                  {/* Staff / Admin */}
                  <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 32px rgba(44,62,80,0.15)" }} whileTap={{ scale: 0.98 }}
                    onClick={() => selectRole("staff")}
                    style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 24px", borderRadius: 18, border: `2px solid rgba(44,62,80,0.08)`, background: "rgba(44,62,80,0.04)", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}
                  >
                    <div style={{ width: 56, height: 56, borderRadius: 14, background: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0, boxShadow: "0 8px 20px rgba(44,62,80,0.25)" }}>
                      <StaffIcon />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 900, color: COLORS.navy, marginBottom: 4 }}>Staff / Admin</p>
                      <p style={{ fontSize: 13, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif" }}>Doctor &amp; admin portal access</p>
                    </div>
                    <div style={{ marginLeft: "auto", color: COLORS.navyMid, fontSize: 20 }}>→</div>
                  </motion.button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                  <span style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em" }}>NEW HERE?</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                </div>
                <p style={{ textAlign: "center", fontSize: 13, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif" }}>
                  Don&apos;t have an account?{" "}
                  <span onClick={() => router.push("/auth/register")} style={{ color: COLORS.green, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                    Register as a patient
                  </span>
                </p>
              </motion.div>
            )}

            {/* ══ STEP 2 — Login Form ══ */}
            {step === 2 && role && (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>

                {/* Back */}
                <button onClick={() => setStep(1)}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.navyMid, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, marginBottom: 28, padding: 0 }}
                >
                  <ArrowLeftIcon /> Back
                </button>

                {/* Role badge + heading */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999, background: role === "patient" ? COLORS.lightMint : "rgba(44,62,80,0.07)", marginBottom: 14 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: role === "patient" ? COLORS.green : COLORS.navy }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: role === "patient" ? COLORS.green : COLORS.navy }}>
                      {role === "patient" ? "Patient" : "Staff / Admin"}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 30, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, marginBottom: 8 }}>Welcome back</h2>
                  <p style={{ color: COLORS.navyMid, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                    Sign in to your {role === "patient" ? "patient" : "staff"} account
                  </p>
                </div>

                {/* Server error */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                      style={{ marginBottom: 20, padding: "13px 16px", backgroundColor: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 10 }}
                    >
                      <span style={{ color: COLORS.error, flexShrink: 0, marginTop: 1 }}><AlertIcon /></span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: COLORS.error, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, margin: 0 }}>{serverError}</p>
                        {serverError.includes("No account found") && role === "patient" && (
                          <p style={{ fontSize: 12, color: COLORS.error, opacity: 0.75, fontFamily: "'DM Sans', sans-serif", marginTop: 4, marginBottom: 0 }}>
                            Want to{" "}
                            <span onClick={() => router.push("/auth/register")} style={{ fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>create an account</span>
                            {" "}instead?
                          </p>
                        )}
                      </div>
                      <button onClick={() => setServerError("")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.error, fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fields */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                  {/* Email */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Email Address</label>
                    <input type="email" placeholder="you@example.com" value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      onKeyDown={handleKeyDown}
                      style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${hasFieldError("email") ? COLORS.errorBorder : "#E6F7F2"}`, backgroundColor: hasFieldError("email") ? COLORS.errorBg : COLORS.lightMint, fontSize: 14, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif", outline: "none", transition: "border-color 0.15s" }}
                      onFocus={(e) => { e.target.style.borderColor = hasFieldError("email") ? COLORS.error : COLORS.green; }}
                      onBlurCapture={(e) => { e.target.style.borderColor = hasFieldError("email") ? COLORS.errorBorder : "#E6F7F2"; }}
                    />
                    <FieldError message={touched.email ? fieldErrors.email : ""} />
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        onBlur={() => handleBlur("password")}
                        onKeyDown={handleKeyDown}
                        style={{ width: "100%", padding: "14px 48px 14px 18px", borderRadius: 14, border: `1.5px solid ${hasFieldError("password") ? COLORS.errorBorder : "#E6F7F2"}`, backgroundColor: hasFieldError("password") ? COLORS.errorBg : COLORS.lightMint, fontSize: 14, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif", outline: "none", transition: "border-color 0.15s" }}
                        onFocus={(e) => { e.target.style.borderColor = hasFieldError("password") ? COLORS.error : COLORS.green; }}
                        onBlurCapture={(e) => { e.target.style.borderColor = hasFieldError("password") ? COLORS.errorBorder : "#E6F7F2"; }}
                      />
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShowPassword((p) => !p)}
                        style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    <FieldError message={touched.password ? fieldErrors.password : ""} />
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: role === "patient" ? "0 16px 40px rgba(62,180,137,0.4)" : "0 16px 40px rgba(44,62,80,0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit} disabled={loading}
                    style={{ width: "100%", padding: "16px", backgroundColor: loading ? COLORS.mint : (role === "patient" ? COLORS.green : COLORS.navy), color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", boxShadow: role === "patient" ? "0 8px 24px rgba(62,180,137,0.3)" : "0 8px 24px rgba(44,62,80,0.2)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {loading && <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />}
                    {loading ? "Signing in..." : "Sign In"}
                  </motion.button>
                </div>

                {/* Register link — patients only */}
                {role === "patient" && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "28px 0" }}>
                      <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                      <span style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em" }}>OR</span>
                      <div style={{ flex: 1, height: 1, backgroundColor: "#E6F7F2" }} />
                    </div>
                    <p style={{ textAlign: "center", fontSize: 13, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif" }}>
                      Don&apos;t have an account?{" "}
                      <span onClick={() => router.push("/auth/register")} style={{ color: COLORS.green, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                        Create one
                      </span>
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Back Home */}
      <span onClick={() => router.push("/")}
        style={{ position: "fixed", top: 28, left: 32, fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer", letterSpacing: "0.08em", zIndex: 100, display: "flex", alignItems: "center", gap: 6 }}
      >
        ← Back Home
      </span>
    </main>
  );
}
