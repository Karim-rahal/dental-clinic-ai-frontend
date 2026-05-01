"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";

const COLORS = {
  green:     "#3EB489",
  mint:      "#A7E4D8",
  lightMint: "#E6F7F2",
  navy:      "#2C3E50",
  navyMid:   "rgba(44,62,80,0.55)",
  navyLight: "rgba(44,62,80,0.07)",
  white:     "#FFFFFF",
  offWhite:  "#F7F9F8",
  border:    "rgba(44,62,80,0.10)",
};

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

function validateName(name: string): string {
  if (!name.trim()) return "Full name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return "";
}

function validatePhone(phone: string): string {
  if (!phone.trim()) return ""; // optional
  const cleaned = phone.replace(/\s/g, "");
  const re = /^(\+?961|0)?[0-9]{8}$/;
  if (!re.test(cleaned)) return "Enter a valid phone number (e.g. +961 70 000 000).";
  return "";
}

function validateNewPassword(pw: string): string {
  if (!pw) return "New password is required.";
  if (pw.length < 6) return "Password must be at least 6 characters.";
  return "";
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function EyeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOffIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function SaveIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}
function LogoutIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

// ─────────────────────────────────────────────
// PasswordInput
// ─────────────────────────────────────────────

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "••••••••"}
        style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.offWhite, fontSize: 14, color: COLORS.navy, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        onClick={() => setShow((p) => !p)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return msg ? <p style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>{msg}</p> : null;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function DoctorProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("doctor_photo") : null
  );

  // Info form
  const [infoForm, setInfoForm] = useState({
    full_name:    user?.full_name    || "",
    phone_number: user?.phone_number || "",
  });
  const [infoFieldErrors, setInfoFieldErrors] = useState({ full_name: "", phone_number: "" });
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError]     = useState("");

  // Password form
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwFieldErrors, setPwFieldErrors] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwError, setPwError]     = useState("");

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPhotoUrl(url);
      localStorage.setItem("doctor_photo", url);
    };
    reader.readAsDataURL(file);
  };

  // ── Save info ──
  const handleInfoSave = async () => {
    const nameErr  = validateName(infoForm.full_name);
    const phoneErr = validatePhone(infoForm.phone_number);
    setInfoFieldErrors({ full_name: nameErr, phone_number: phoneErr });
    if (nameErr || phoneErr) return;

    setInfoError(""); setInfoSuccess("");
    setInfoLoading(true);
    try {
      await api.patch("/me", {
        full_name:    infoForm.full_name.trim(),
        phone_number: infoForm.phone_number.trim(),
      });
      setInfoSuccess("Profile updated successfully.");
      setTimeout(() => setInfoSuccess(""), 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setInfoError(err.response?.data?.message || "Failed to update profile.");
      } else {
        setInfoError("Failed to update profile.");
      }
    } finally {
      setInfoLoading(false);
    }
  };

  // ── Change password ──
  const handlePasswordChange = async () => {
    const currentErr = pwForm.current_password ? "" : "Current password is required.";
    const newErr     = validateNewPassword(pwForm.new_password);
    const confirmErr = pwForm.confirm_password !== pwForm.new_password ? "Passwords do not match." : "";
    setPwFieldErrors({ current_password: currentErr, new_password: newErr, confirm_password: confirmErr });
    if (currentErr || newErr || confirmErr) return;

    if (pwForm.new_password === pwForm.current_password) {
      setPwFieldErrors((e) => ({ ...e, new_password: "New password must differ from your current one." }));
      return;
    }

    setPwError(""); setPwSuccess("");
    setPwLoading(true);
    try {
      await api.post("/me/change-password", {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      setPwSuccess("Password changed successfully.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwFieldErrors({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg    = err.response?.data?.message || "";
        const status = err.response?.status;
        if (status === 401 || msg.toLowerCase().includes("current")) {
          setPwFieldErrors((e) => ({ ...e, current_password: "Current password is incorrect." }));
        } else {
          setPwError(msg || "Failed to change password.");
        }
      } else {
        setPwError("Failed to change password.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => { logout(); router.push("/"); };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.offWhite }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif" }}>Access Restricted</h2>
          <Link href="/auth/login" style={{ color: COLORS.green }}>Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "0 2rem", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/doctor/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontWeight: 500, fontFamily: "'Josefin Sans', sans-serif" }}>
            <ArrowLeftIcon /> Dashboard
          </Link>
          <div style={{ width: 1, height: 20, background: COLORS.border }} />
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy }}>My Profile</h1>
        </div>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, background: "none", border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>
          <LogoutIcon /> Sign Out
        </button>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>

        {/* Profile header card — navy, unchanged */}
        <div style={{ background: COLORS.navy, borderRadius: 20, padding: "2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", animation: "fadeUp 0.3s ease", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: COLORS.green, opacity: 0.08, right: -60, top: -60, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.green, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
              {photoUrl
                ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 24, fontWeight: 900, color: "white" }}>{getInitials(user.full_name || "Dr")}</span>
              }
            </div>
            <label style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white", fontSize: 11 }}>
              +
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
            </label>
          </div>
          <div style={{ flex: 1, zIndex: 1 }}>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 22, fontWeight: 900, color: "white", marginBottom: 4 }}>{user.full_name}</p>
            <p style={{ fontSize: 13, color: COLORS.mint, marginBottom: 4 }}>Doctor · DentAI Clinic</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{user.email}</p>
          </div>
          {photoUrl && (
            <button onClick={() => { setPhotoUrl(null); localStorage.removeItem("doctor_photo"); }}
              style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", zIndex: 1 }}
            >Remove photo</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", background: COLORS.white, padding: 6, borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
          {(["info", "password"] as const).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setInfoError(""); setInfoSuccess(""); setPwError(""); setPwSuccess(""); }}
              style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: "none", background: activeTab === tab ? COLORS.navy : "transparent", color: activeTab === tab ? "white" : COLORS.navyMid, fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s" }}
            >
              {tab === "info" ? "Personal Info" : "Change Password"}
            </button>
          ))}
        </div>

        {/* ── Personal Info Tab ── */}
        {activeTab === "info" && (
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.25s ease" }}>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: "1.5rem" }}>Personal Information</h2>

            {infoError && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: "1rem" }}>{infoError}</div>}
            {infoSuccess && <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: "1rem" }}>✓ {infoSuccess}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>Full Name</label>
                <input
                  type="text"
                  value={infoForm.full_name}
                  onChange={(e) => { setInfoForm((f) => ({ ...f, full_name: e.target.value })); setInfoFieldErrors((fe) => ({ ...fe, full_name: validateName(e.target.value) })); }}
                  placeholder="Dr. John Smith"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${infoFieldErrors.full_name ? "#FECACA" : COLORS.border}`, background: infoFieldErrors.full_name ? "#FEF2F2" : COLORS.offWhite, fontSize: 14, color: COLORS.navy, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = infoFieldErrors.full_name ? "#DC2626" : COLORS.green)}
                  onBlur={(e) => (e.target.style.borderColor = infoFieldErrors.full_name ? "#FECACA" : COLORS.border)}
                />
                <FieldError msg={infoFieldErrors.full_name} />
              </div>

              {/* Email — read only, cannot be changed */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.navyLight, fontSize: 14, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif", outline: "none", cursor: "not-allowed" }}
                />
                <p style={{ fontSize: 11, color: COLORS.navyMid, marginTop: 5 }}>Email address cannot be changed.</p>
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>Phone Number</label>
                <input
                  type="tel"
                  value={infoForm.phone_number}
                  onChange={(e) => { setInfoForm((f) => ({ ...f, phone_number: e.target.value })); setInfoFieldErrors((fe) => ({ ...fe, phone_number: validatePhone(e.target.value) })); }}
                  placeholder="+961 XX XXX XXX"
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${infoFieldErrors.phone_number ? "#FECACA" : COLORS.border}`, background: infoFieldErrors.phone_number ? "#FEF2F2" : COLORS.offWhite, fontSize: 14, color: COLORS.navy, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
                  onFocus={(e) => (e.target.style.borderColor = infoFieldErrors.phone_number ? "#DC2626" : COLORS.green)}
                  onBlur={(e) => (e.target.style.borderColor = infoFieldErrors.phone_number ? "#FECACA" : COLORS.border)}
                />
                <FieldError msg={infoFieldErrors.phone_number} />
              </div>

              <button onClick={handleInfoSave} disabled={infoLoading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: infoLoading ? COLORS.navyLight : COLORS.navy, color: infoLoading ? COLORS.navyMid : "white", borderRadius: 10, border: "none", cursor: infoLoading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", marginTop: 4, transition: "background 0.15s" }}
              >
                {infoLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {/* ── Change Password Tab ── */}
        {activeTab === "password" && (
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.25s ease" }}>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: "1.5rem" }}>Change Password</h2>

            {pwError && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: "1rem" }}>{pwError}</div>}
            {pwSuccess && <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: "1rem" }}>✓ {pwSuccess}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Current password */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>Current Password</label>
                <PasswordInput
                  value={pwForm.current_password}
                  onChange={(v) => { setPwForm((f) => ({ ...f, current_password: v })); setPwFieldErrors((e) => ({ ...e, current_password: "" })); }}
                  placeholder="Your current password"
                />
                <FieldError msg={pwFieldErrors.current_password} />
              </div>

              {/* New password */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>New Password</label>
                <PasswordInput
                  value={pwForm.new_password}
                  onChange={(v) => { setPwForm((f) => ({ ...f, new_password: v })); setPwFieldErrors((e) => ({ ...e, new_password: validateNewPassword(v) })); }}
                  placeholder="Min. 6 characters"
                />
                <FieldError msg={pwFieldErrors.new_password} />
                {/* Strength bar */}
                {pwForm.new_password.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map((level) => {
                        const strength = pwForm.new_password.length < 6 ? 1 : pwForm.new_password.length < 10 ? 2 : 3;
                        const colors = ["#DC2626", "#F59E0B", COLORS.green];
                        return <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: level <= strength ? colors[strength - 1] : COLORS.border, transition: "background 0.2s" }} />;
                      })}
                    </div>
                    <p style={{ fontSize: 11, color: COLORS.navyMid }}>
                      {pwForm.new_password.length < 6 ? "Too short" : pwForm.new_password.length < 10 ? "Good" : "Strong password"}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>Confirm Password</label>
                <PasswordInput
                  value={pwForm.confirm_password}
                  onChange={(v) => { setPwForm((f) => ({ ...f, confirm_password: v })); setPwFieldErrors((e) => ({ ...e, confirm_password: v !== pwForm.new_password ? "Passwords do not match." : "" })); }}
                  placeholder="Re-enter new password"
                />
                <FieldError msg={pwFieldErrors.confirm_password} />
                {pwForm.confirm_password && !pwFieldErrors.confirm_password && (
                  <p style={{ fontSize: 11, color: "#15803D", marginTop: 5 }}>✓ Passwords match</p>
                )}
              </div>

              <button onClick={handlePasswordChange} disabled={pwLoading}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: pwLoading ? COLORS.navyLight : COLORS.navy, color: pwLoading ? COLORS.navyMid : "white", borderRadius: 10, border: "none", cursor: pwLoading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", marginTop: 4, transition: "background 0.15s" }}
              >
                {pwLoading ? "Changing…" : "Change Password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}