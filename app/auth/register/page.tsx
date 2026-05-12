"use client";

import { useState, useEffect, useRef } from "react";
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

// ── Validators ────────────────────────────────────────────────────────────────
function validateName(v: string): string {
  if (!v.trim()) return "Full name is required.";
  if (/\d/.test(v)) return "Name must not contain numbers.";
 if (v.trim().split(/\s+/).length < 2) {
  return "Full name must contain at least first name and last name.";
}
  if (!/^[a-zA-Z\u00C0-\u024F\s'-]+$/.test(v.trim())) return "Name must contain letters only.";
  return "";
}

function validateEmail(v: string): string {
  if (!v.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return "Enter a valid email (e.g. name@example.com).";
  return "";
}

function validatePhone(v: string): string {
  if (!v.trim()) return "Phone number is required.";
  const cleaned = v.replace(/[\s\-().]/g, "");
  // Lebanese: +961 or 961 or 0 prefix, then 7/8 digits (mobile or landline)
  if (!/^(\+?961|0)?(3|70|71|76|78|79|81|1|4|5|6|7|8|9)\d{6,7}$/.test(cleaned)) {
    return "Enter a valid Lebanese number (e.g. +961 70 000 000).";
  }
  return "";
}

function validatePassword(v: string): string {
  if (!v) return "Password is required.";
  if (v.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(v)) return "Must contain at least one uppercase letter.";
  if (!/[0-9]/.test(v)) return "Must contain at least one number.";
  return "";
}

function validateConfirm(v: string, pw: string): string {
  if (!v) return "Please confirm your password.";
  if (v !== pw) return "Passwords do not match.";
  return "";
}

const FIELDS = ["name", "email", "phone", "password", "confirmPassword"] as const;
type Field = typeof FIELDS[number];

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

function CheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

export default function RegisterPage() {
  const router   = useRouter();
  const isMobile = useIsMobile();

  const [form, setForm] = useState<Record<Field, string>>({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<Field, string>>({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  // Which fields have been successfully completed
  const [done, setDone] = useState<Record<Field, boolean>>({
    name: false, email: false, phone: false, password: false, confirmPassword: false,
  });
  // Index of the currently active field (0-4)
  const [activeIdx, setActiveIdx] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [serverError,  setServerError]  = useState("");
  const [loading,      setLoading]      = useState(false);

  const inputRefs = useRef<Record<Field, HTMLInputElement | null>>({
    name: null, email: null, phone: null, password: null, confirmPassword: null,
  });

  const activeField = FIELDS[activeIdx];

  // Focus active field when it changes
  useEffect(() => {
    setTimeout(() => inputRefs.current[activeField]?.focus(), 80);
  }, [activeField]);

  const getValidator = (field: Field) => {
    if (field === "name")            return validateName(form.name);
    if (field === "email")           return validateEmail(form.email);
    if (field === "phone")           return validatePhone(form.phone);
    if (field === "password")        return validatePassword(form.password);
    if (field === "confirmPassword") return validateConfirm(form.confirmPassword, form.password);
    return "";
  };

  const handleChange = (field: Field, value: string) => {
    if (field !== activeField) return; // locked
    setForm((f) => ({ ...f, [field]: value }));
    // Clear error while typing
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleBlur = (field: Field) => {
    if (field !== activeField) return;
    const err = getValidator(field);
    setErrors((e) => ({ ...e, [field]: err }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: Field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryAdvance(field);
    }
  };

  const tryAdvance = (field: Field) => {
    const err = getValidator(field);
    if (err) {
      setErrors((e) => ({ ...e, [field]: err }));
      return;
    }
    // Mark as done
    setDone((d) => ({ ...d, [field]: true }));
    setErrors((e) => ({ ...e, [field]: "" }));
    if (activeIdx < FIELDS.length - 1) {
      setActiveIdx(activeIdx + 1);
    }
  };

  const handleSubmit = async () => {
    // Validate final field first
    const lastErr = getValidator(activeField);
    if (lastErr) { setErrors((e) => ({ ...e, [activeField]: lastErr })); return; }
    // Make sure all fields are done
    for (const f of FIELDS) {
      const err = getValidator(f);
      if (err) {
        setErrors((e) => ({ ...e, [f]: err }));
        const idx = FIELDS.indexOf(f);
        setActiveIdx(idx);
        return;
      }
    }
    setServerError(""); setLoading(true);
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
      if (axios.isAxiosError(err)) setServerError(err.response?.data?.message || err.response?.data?.error || "Registration failed.");
      else setServerError("Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const isLocked = (field: Field) => FIELDS.indexOf(field) !== activeIdx;
  const isDone   = (field: Field) => done[field];

  const getPasswordStrength = () => {
    const pw = form.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthColors = ["#EF4444", "#F59E0B", "#F59E0B", "#3EB489", "#3EB489"];
  const strengthLabels = ["", "Too weak", "Weak", "Good", "Strong"];
  const strength = getPasswordStrength();

  const fieldStyle = (field: Field): React.CSSProperties => {
    const locked = isLocked(field);
    const hasErr = !!errors[field];
    const ok     = isDone(field);
    return {
      width: "100%",
      padding: field === "password" || field === "confirmPassword" ? "14px 48px 14px 18px" : "14px 18px",
      borderRadius: 14,
      border: `1.5px solid ${hasErr ? COLORS.errorBorder : ok ? COLORS.mint : locked ? "rgba(44,62,80,0.08)" : "#E6F7F2"}`,
      backgroundColor: hasErr ? COLORS.errorBg : locked ? "rgba(44,62,80,0.03)" : COLORS.lightMint,
      fontSize: 15,
      color: locked ? COLORS.navyMid : COLORS.navy,
      fontFamily: "'Josefin Sans', sans-serif",
      outline: "none",
      boxSizing: "border-box",
      transition: "all 0.2s",
      cursor: locked ? "not-allowed" : "text",
      opacity: locked ? 0.6 : 1,
    };
  };

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy,
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
  };

  const allDone = FIELDS.slice(0, -1).every((f) => done[f]) && activeIdx === FIELDS.length - 1;

  return (
    <main style={{ fontFamily: "'Josefin Sans', sans-serif", minHeight: "100vh", backgroundColor: COLORS.white, display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #E6F7F2 inset !important; -webkit-text-fill-color: #2C3E50 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
      `}</style>

      {/* Left panel */}
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

            {/* Progress steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left" }}>
              {[
                { label: "Full Name",        field: "name"            },
                { label: "Email Address",    field: "email"           },
                { label: "Phone Number",     field: "phone"           },
                { label: "Password",         field: "password"        },
                { label: "Confirm Password", field: "confirmPassword" },
              ].map((step, i) => {
                const f = step.field as Field;
                const isActive = activeIdx === i;
                const isCompleted = done[f];
                return (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: isCompleted ? COLORS.green : isActive ? "rgba(62,180,137,0.3)" : "rgba(255,255,255,0.08)", border: `2px solid ${isCompleted ? COLORS.green : isActive ? COLORS.green : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s" }}>
                      {isCompleted
                        ? <span style={{ color: "white" }}><CheckIcon /></span>
                        : <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? COLORS.green : "rgba(255,255,255,0.3)" }}>{i + 1}</span>
                      }
                    </div>
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isCompleted ? COLORS.mint : isActive ? "white" : "rgba(255,255,255,0.3)", transition: "all 0.3s" }}>{step.label}</span>
                  </div>
                );
              })}
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

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? "28px 20px 48px" : "40px 32px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {isMobile && (
            <div style={{ marginBottom: 28 }}>
              <span onClick={() => router.push("/")} style={{ fontSize: 13, fontWeight: 700, color: COLORS.navyMid, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginBottom: 24 }}>
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
            <p style={{ color: COLORS.navyMid, fontSize: 14, marginBottom: 28 }}>
              Fill each field and press <strong>Enter</strong> or <strong>Next</strong> to continue.
            </p>

            {/* Mobile progress bar */}
            {isMobile && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: COLORS.navyMid }}>Step {activeIdx + 1} of {FIELDS.length}</span>
                  <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 700 }}>{Math.round(((activeIdx) / FIELDS.length) * 100)}%</span>
                </div>
                <div style={{ height: 4, backgroundColor: COLORS.lightMint, borderRadius: 2, overflow: "hidden" }}>
                  <motion.div animate={{ width: `${((activeIdx) / FIELDS.length) * 100}%` }} transition={{ duration: 0.3 }}
                    style={{ height: "100%", backgroundColor: COLORS.green, borderRadius: 2 }}
                  />
                </div>
              </div>
            )}

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginBottom: 18, padding: "12px 15px", backgroundColor: COLORS.errorBg, border: `1px solid ${COLORS.errorBorder}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}
                >
                  <p style={{ fontSize: 13, color: COLORS.error, lineHeight: 1.5, margin: 0 }}>{serverError}</p>
                  <button onClick={() => setServerError("")} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.error, fontSize: 15, padding: 0, flexShrink: 0 }}>✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Full Name */}
              <motion.div animate={errors.name ? { animation: "shake 0.4s ease" } : {}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={lbl}>Full Name</label>
                  {isDone("name") && <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckIcon /> Done</span>}
                  {isLocked("name") && !isDone("name") && <span style={{ fontSize: 10, color: COLORS.navyMid }}>🔒 Locked</span>}
                </div>
                <input
                  ref={(el) => { inputRefs.current.name = el; }}
                  type="text" placeholder="Karim Rahal"
                  value={form.name}
                  disabled={isLocked("name")}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  onKeyDown={(e) => handleKeyDown(e, "name")}
                  style={fieldStyle("name")}
                  onFocus={(e) => { if (!isLocked("name")) e.target.style.borderColor = errors.name ? COLORS.error : COLORS.green; }}
                />
                <AnimatePresence>
                  {errors.name && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: COLORS.error, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {errors.name}
                    </motion.p>
                  )}
                </AnimatePresence>
                {activeField === "name" && !errors.name && !isDone("name") && (
                  <button onClick={() => tryAdvance("name")}
                    style={{ marginTop: 8, padding: "8px 18px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >Next →</button>
                )}
              </motion.div>

              {/* Email */}
              <motion.div animate={errors.email ? { animation: "shake 0.4s ease" } : {}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={lbl}>Email Address</label>
                  {isDone("email") && <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckIcon /> Done</span>}
                  {isLocked("email") && !isDone("email") && <span style={{ fontSize: 10, color: COLORS.navyMid }}>🔒 Locked</span>}
                </div>
                <input
                  ref={(el) => { inputRefs.current.email = el; }}
                  type="email" placeholder="you@example.com"
                  value={form.email}
                  disabled={isLocked("email")}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  onKeyDown={(e) => handleKeyDown(e, "email")}
                  style={fieldStyle("email")}
                  onFocus={(e) => { if (!isLocked("email")) e.target.style.borderColor = errors.email ? COLORS.error : COLORS.green; }}
                />
                <AnimatePresence>
                  {errors.email && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: COLORS.error, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
                {activeField === "email" && !errors.email && !isDone("email") && (
                  <button onClick={() => tryAdvance("email")}
                    style={{ marginTop: 8, padding: "8px 18px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >Next →</button>
                )}
              </motion.div>

              {/* Phone */}
              <motion.div animate={errors.phone ? { animation: "shake 0.4s ease" } : {}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={lbl}>Phone Number</label>
                  {isDone("phone") && <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckIcon /> Done</span>}
                  {isLocked("phone") && !isDone("phone") && <span style={{ fontSize: 10, color: COLORS.navyMid }}>🔒 Locked</span>}
                </div>
                <input
                  ref={(el) => { inputRefs.current.phone = el; }}
                  type="tel" placeholder="+961 70 000 000"
                  value={form.phone}
                  disabled={isLocked("phone")}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onBlur={() => handleBlur("phone")}
                  onKeyDown={(e) => handleKeyDown(e, "phone")}
                  style={fieldStyle("phone")}
                  onFocus={(e) => { if (!isLocked("phone")) e.target.style.borderColor = errors.phone ? COLORS.error : COLORS.green; }}
                />
                <AnimatePresence>
                  {errors.phone && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: COLORS.error, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {errors.phone}
                    </motion.p>
                  )}
                </AnimatePresence>
                {!errors.phone && form.phone && activeField === "phone" && (
                  <p style={{ fontSize: 11, color: COLORS.navyMid, marginTop: 5 }}>Accepted: +961 7X / 8X or landline formats</p>
                )}
                {activeField === "phone" && !errors.phone && !isDone("phone") && (
                  <button onClick={() => tryAdvance("phone")}
                    style={{ marginTop: 8, padding: "8px 18px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >Next →</button>
                )}
              </motion.div>

              {/* Password */}
              <motion.div animate={errors.password ? { animation: "shake 0.4s ease" } : {}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={lbl}>Password</label>
                  {isDone("password") && <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckIcon /> Done</span>}
                  {isLocked("password") && !isDone("password") && <span style={{ fontSize: 10, color: COLORS.navyMid }}>🔒 Locked</span>}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    ref={(el) => { inputRefs.current.password = el; }}
                    type={showPassword ? "text" : "password"} placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    value={form.password}
                    disabled={isLocked("password")}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    onKeyDown={(e) => handleKeyDown(e, "password")}
                    style={fieldStyle("password")}
                    onFocus={(e) => { if (!isLocked("password")) e.target.style.borderColor = errors.password ? COLORS.error : COLORS.green; }}
                  />
                  {!isLocked("password") && (
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowPassword((p) => !p)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
                    >{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                  )}
                </div>
                {/* Strength bar */}
                {form.password && activeField === "password" && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map((level) => (
                        <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: level <= strength ? strengthColors[strength] : "#E6F7F2", transition: "background 0.2s" }} />
                      ))}
                    </div>
                    {strength > 0 && <p style={{ fontSize: 11, color: strengthColors[strength] }}>{strengthLabels[strength]}</p>}
                  </div>
                )}
                <AnimatePresence>
                  {errors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: COLORS.error, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
                {activeField === "password" && !errors.password && !isDone("password") && (
                  <button onClick={() => tryAdvance("password")}
                    style={{ marginTop: 8, padding: "8px 18px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >Next →</button>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div animate={errors.confirmPassword ? { animation: "shake 0.4s ease" } : {}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={lbl}>Confirm Password</label>
                  {isDone("confirmPassword") && <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}><CheckIcon /> Done</span>}
                  {isLocked("confirmPassword") && !isDone("confirmPassword") && <span style={{ fontSize: 10, color: COLORS.navyMid }}>🔒 Locked</span>}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    ref={(el) => { inputRefs.current.confirmPassword = el; }}
                    type={showConfirm ? "text" : "password"} placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    disabled={isLocked("confirmPassword")}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    onKeyDown={(e) => handleKeyDown(e, "confirmPassword")}
                    style={fieldStyle("confirmPassword")}
                    onFocus={(e) => { if (!isLocked("confirmPassword")) e.target.style.borderColor = errors.confirmPassword ? COLORS.error : COLORS.green; }}
                  />
                  {!isLocked("confirmPassword") && (
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setShowConfirm((p) => !p)}
                      style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
                    >{showConfirm ? <EyeOffIcon /> : <EyeIcon />}</button>
                  )}
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: COLORS.error, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
                {form.confirmPassword && form.confirmPassword === form.password && activeField === "confirmPassword" && (
                  <p style={{ fontSize: 11, color: COLORS.green, marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}><CheckIcon /> Passwords match</p>
                )}
              </motion.div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: "100%", padding: "16px", backgroundColor: loading ? COLORS.mint : COLORS.green, color: "white", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", boxShadow: "0 8px 24px rgba(62,180,137,0.3)", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation", transition: "all 0.2s" }}
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