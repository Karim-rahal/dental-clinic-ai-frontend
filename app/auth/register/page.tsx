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

function validateName(v: string): string {
  if (!v.trim()) return "Full name is required.";
  if (/\d/.test(v)) return "Name must not contain numbers.";
  if (!/^[a-zA-Z\u00C0-\u024F\s'-]+$/.test(v.trim())) return "Name must contain letters only.";
  const words = v.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length < 2) return "Please enter your full name (first and last name).";
  if (words.some((w) => w.length < 2)) return "Each name part must be at least 2 characters.";
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

type Field = "name" | "email" | "phone" | "password" | "confirmPassword";
const FIELDS: Field[] = ["name", "email", "phone", "password", "confirmPassword"];

function getValidator(field: Field, form: Record<Field, string>): string {
  if (field === "name")            return validateName(form.name);
  if (field === "email")           return validateEmail(form.email);
  if (field === "phone")           return validatePhone(form.phone);
  if (field === "password")        return validatePassword(form.password);
  if (field === "confirmPassword") return validateConfirm(form.confirmPassword, form.password);
  return "";
}

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
function AlertIcon() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

export default function RegisterPage() {
  const router   = useRouter();
  const isMobile = useIsMobile();

  const [form, setForm] = useState<Record<Field, string>>({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
  });
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    name: false, email: false, phone: false, password: false, confirmPassword: false,
  });
  const [focused, setFocused] = useState<Field | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [serverError,  setServerError]  = useState("");
  const [loading,      setLoading]      = useState(false);

  // Show error only if field has been touched
  const getError = (field: Field) =>
    touched[field] ? getValidator(field, form) : "";

  const isFieldOk = (field: Field) =>
    touched[field] && getValidator(field, form) === "" && form[field] !== "";

  const handleChange = (field: Field, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setServerError("");
  };

  const handleFocus = (field: Field) => {
    // If there's currently a focused field with an error, block moving away
    if (focused && focused !== field) {
      const currentErr = getValidator(focused, form);
      if (currentErr && touched[focused]) {
        // Re-focus the errored field
        setTimeout(() => {
          const el = document.getElementById(`field-${focused}`) as HTMLInputElement | null;
          el?.focus();
        }, 10);
        return;
      }
    }
    setFocused(field);
  };

  const handleBlur = (field: Field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    // Only clear focused if the new focus isn't another field
    // (handled by handleFocus of the next field)
    setTimeout(() => {
      setFocused((prev) => (prev === field ? null : prev));
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: Field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setTouched((t) => ({ ...t, [field]: true }));
      const err = getValidator(field, form);
      if (err) return;
      const idx = FIELDS.indexOf(field);
      if (idx < FIELDS.length - 1) {
        const el = document.getElementById(`field-${FIELDS[idx + 1]}`) as HTMLInputElement | null;
        el?.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const allTouched = FIELDS.reduce((acc, f) => ({ ...acc, [f]: true }), {} as Record<Field, boolean>);
    setTouched(allTouched);
    for (const f of FIELDS) {
      const err = getValidator(f, form);
      if (err) {
        const el = document.getElementById(`field-${f}`) as HTMLInputElement | null;
        el?.focus();
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

  const getPasswordStrength = () => {
    const pw = form.password;
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strengthColors = ["", "#EF4444", "#F59E0B", "#F59E0B", "#3EB489"];
  const strengthLabels = ["", "Too weak", "Weak", "Good", "Strong"];
  const strength = getPasswordStrength();

  const inputStyle = (field: Field): React.CSSProperties => {
    const err = getError(field);
    const ok  = isFieldOk(field);
    return {
      width: "100%",
      padding: field === "password" || field === "confirmPassword" ? "14px 48px 14px 18px" : "14px 18px",
      borderRadius: 14,
      border: `1.5px solid ${err ? COLORS.errorBorder : ok ? COLORS.mint : focused === field ? COLORS.green : "#E6F7F2"}`,
      backgroundColor: err ? COLORS.errorBg : COLORS.lightMint,
      fontSize: 15,
      color: COLORS.navy,
      fontFamily: "'Josefin Sans', sans-serif",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s, background-color 0.2s",
    };
  };

  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy,
    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8,
  };

  const renderError = (field: Field) => {
    const err = getError(field);
    return (
      <AnimatePresence>
        {err && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{ fontSize: 12, color: COLORS.error, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}
          >
            <AlertIcon /> {err}
          </motion.p>
        )}
      </AnimatePresence>
    );
  };

  const renderOk = (field: Field) => {
    if (!isFieldOk(field)) return null;
    return (
      <p style={{ fontSize: 11, color: COLORS.green, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
        <CheckIcon /> {field === "confirmPassword" ? "Passwords match" : "Looks good!"}
      </p>
    );
  };

  return (
    <main style={{ fontFamily: "'Josefin Sans', sans-serif", minHeight: "100vh", backgroundColor: COLORS.white, display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #E6F7F2 inset !important; -webkit-text-fill-color: #2C3E50 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Left panel */}
      {!isMobile && (
        <motion.aside initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}
          style={{ width: "45%", minWidth: 340, maxWidth: 520, backgroundColor: COLORS.navy, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 48px", position: "relative", overflow: "hidden", flexShrink: 0 }}
        >
          <motion.div animate={{ scale: [1,1.15,1], opacity: [0.12,0.22,0.12] }} transition={{ repeat: Infinity, duration: 7 }}
            style={{ position: "absolute", width: 450, height: 450, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -120, right: -120, pointerEvents: "none" }}
          />
          <motion.div animate={{ scale: [1,1.1,1], opacity: [0.07,0.15,0.07] }} transition={{ repeat: Infinity, duration: 9, delay: 3 }}
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
          <span onClick={() => router.push("/")} style={{ position: "absolute", top: 28, left: 28, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, zIndex: 10 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back Home
          </span>
        </motion.aside>
      )}

      {/* Form panel */}
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
            <p style={{ color: COLORS.navyMid, fontSize: 14, marginBottom: 28 }}>Fix any red errors before moving to the next field.</p>

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
              <div>
                <label style={lbl}>Full Name</label>
                <input id="field-name" type="text" placeholder="Karim Rahal"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onFocus={() => handleFocus("name")}
                  onBlur={() => handleBlur("name")}
                  onKeyDown={(e) => handleKeyDown(e, "name")}
                  style={inputStyle("name")}
                />
                {renderError("name")}
                {renderOk("name")}
              </div>

              {/* Email */}
              <div>
                <label style={lbl}>Email Address</label>
                <input id="field-email" type="email" placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onFocus={() => handleFocus("email")}
                  onBlur={() => handleBlur("email")}
                  onKeyDown={(e) => handleKeyDown(e, "email")}
                  style={inputStyle("email")}
                />
                {renderError("email")}
                {renderOk("email")}
              </div>

              {/* Phone */}
              <div>
                <label style={lbl}>Phone Number</label>
                <input id="field-phone" type="tel" placeholder="+961 70 000 000"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  onFocus={() => handleFocus("phone")}
                  onBlur={() => handleBlur("phone")}
                  onKeyDown={(e) => handleKeyDown(e, "phone")}
                  style={inputStyle("phone")}
                />
                {renderError("phone")}
                {!getError("phone") && !touched["phone"] && (
                  <p style={{ fontSize: 11, color: COLORS.navyMid, marginTop: 5 }}>Lebanese numbers only (e.g. +961 70 000 000)</p>
                )}
                {renderOk("phone")}
              </div>

              {/* Password */}
              <div>
                <label style={lbl}>Password</label>
                <div style={{ position: "relative" }}>
                  <input id="field-password" type={showPassword ? "text" : "password"} placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    value={form.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onFocus={() => handleFocus("password")}
                    onBlur={() => handleBlur("password")}
                    onKeyDown={(e) => handleKeyDown(e, "password")}
                    style={inputStyle("password")}
                  />
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShowPassword((p) => !p)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
                  >{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                {form.password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map((level) => (
                        <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: level <= strength ? strengthColors[strength] : "#E6F7F2", transition: "background 0.2s" }} />
                      ))}
                    </div>
                    {strength > 0 && <p style={{ fontSize: 11, color: strengthColors[strength] }}>{strengthLabels[strength]}</p>}
                  </div>
                )}
                {renderError("password")}
                {renderOk("password")}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={lbl}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input id="field-confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    onFocus={() => handleFocus("confirmPassword")}
                    onBlur={() => handleBlur("confirmPassword")}
                    onKeyDown={(e) => handleKeyDown(e, "confirmPassword")}
                    style={inputStyle("confirmPassword")}
                  />
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShowConfirm((p) => !p)}
                    style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
                  >{showConfirm ? <EyeOffIcon /> : <EyeIcon />}</button>
                </div>
                {renderError("confirmPassword")}
                {renderOk("confirmPassword")}
              </div>

              {/* Submit */}
              <button onClick={handleSubmit} disabled={loading}
                style={{ width: "100%", padding: "16px", backgroundColor: loading ? COLORS.mint : COLORS.green, color: "white", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", boxShadow: "0 8px 24px rgba(62,180,137,0.3)", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation", transition: "all 0.2s" }}
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