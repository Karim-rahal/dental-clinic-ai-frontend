"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";

const COLORS = {
  green:    "#3EB489",
  mint:     "#A7E4D8",
  lightMint:"#E6F7F2",
  navy:     "#2C3E50",
  navyMid:  "rgba(44,62,80,0.55)",
  navyLight:"rgba(44,62,80,0.07)",
  white:    "#FFFFFF",
  offWhite: "#F7F9F8",
  border:   "rgba(44,62,80,0.10)",
};

const NAV_ITEMS = [
  { id: "home",         label: "Home",         path: "/",                    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dashboard",    label: "Dashboard",    path: "/doctor/dashboard",    icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { id: "appointments", label: "Appointments", path: "/doctor/appointments", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "patients",     label: "Patients",     path: "/doctor/patients",     icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "profile",      label: "Profile",      path: "/doctor/profile",      icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: width < 768, isTablet: width >= 768 && width < 1024 };
}

function NavIcon({ d }: { d: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function EyeIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function EyeOffIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }

function validateName(name: string) { if (!name.trim()) return "Full name is required."; if (name.trim().length < 2) return "Name must be at least 2 characters."; return ""; }
function validatePhone(phone: string) { if (!phone.trim()) return ""; const cleaned = phone.replace(/\s/g, ""); return /^(\+?961|0)?[0-9]{8}$/.test(cleaned) ? "" : "Enter a valid phone number (e.g. +961 70 000 000)."; }
function validateNewPassword(pw: string) { if (!pw) return "New password is required."; if (pw.length < 6) return "Password must be at least 6 characters."; return ""; }

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || "••••••••"}
        style={{ width: "100%", padding: "12px 44px 12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.offWhite, fontSize: 14, color: COLORS.navy, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.border)}
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShow((p) => !p)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 4, display: "flex", alignItems: "center" }}
      >{show ? <EyeOffIcon /> : <EyeIcon />}</button>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return msg ? <p style={{ fontSize: 11, color: "#DC2626", marginTop: 5 }}>{msg}</p> : null;
}

function Sidebar({ isMobile, isTablet, logout, router, mobileMenuOpen, setMobileMenuOpen }: {
  isMobile: boolean; isTablet: boolean;
  logout: () => void; router: ReturnType<typeof useRouter>;
  mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
}) {
  const sidebarWidth = isTablet ? 64 : 220;
  return (
    <>
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 2px 12px rgba(44,62,80,0.06)" }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", backgroundColor: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}>
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 12, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
          </button>
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: "0.12em", color: COLORS.navy }}>DentAI</span>
          <div style={{ width: 40 }} />
        </div>
      )}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.4)", zIndex: 55, top: 56 }} />
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, backgroundColor: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)", animation: "slideIn 0.2s ease" }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "profile" ? COLORS.lightMint : "transparent", color: item.id === "profile" ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: item.id === "profile" ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
              ><NavIcon d={item.icon} />{item.label}</button>
            ))}
            <div style={{ borderTop: `1px solid ${COLORS.mint}`, marginTop: 8, paddingTop: 8 }}>
              <button onClick={() => { logout(); router.push("/"); }} style={{ width: "100%", padding: "12px 14px", backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>Sign Out</button>
            </div>
          </div>
        </>
      )}
      {!isMobile && (
        <div style={{ width: sidebarWidth, backgroundColor: COLORS.white, borderRight: "1px solid rgba(167,228,216,0.3)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, boxShadow: "2px 0 20px rgba(44,62,80,0.04)", transition: "width 0.2s ease", overflow: "hidden" }}>
          <div style={{ padding: isTablet ? "24px 0" : "24px 20px 20px", borderBottom: "1px solid rgba(167,228,216,0.3)", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white", flexShrink: 0 }}>D</div>
            {!isTablet && <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>}
          </div>
          <div style={{ padding: isTablet ? "20px 8px" : "20px 12px", flex: 1, overflowY: "auto" }}>
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Doctor Portal</div>}
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => router.push(item.path)} title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "profile" ? COLORS.lightMint : "transparent", color: item.id === "profile" ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: item.id === "profile" ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (item.id !== "profile") e.currentTarget.style.backgroundColor = "#F8FFFE"; }}
                onMouseLeave={(e) => { if (item.id !== "profile") e.currentTarget.style.backgroundColor = "transparent"; }}
              ><NavIcon d={item.icon} />{!isTablet && item.label}</button>
            ))}
          </div>
          {!isTablet && (
            <div style={{ padding: 16, borderTop: "1px solid rgba(167,228,216,0.3)" }}>
              <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", backgroundColor: COLORS.green, opacity: 0.15, bottom: -20, right: -20 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 9, color: "rgba(167,228,216,0.7)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Doctor Portal</div>
                  <button onClick={() => router.push("/doctor/appointments")} style={{ width: "100%", padding: 8, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>Appointments →</button>
                </div>
              </div>
            </div>
          )}
          <div style={{ padding: isTablet ? "0 8px 16px" : "0 12px 16px" }}>
            <button onClick={() => { logout(); router.push("/"); }} title={isTablet ? "Sign Out" : undefined}
              style={{ width: "100%", padding: isTablet ? "12px 0" : "10px", backgroundColor: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}
            >{isTablet ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> : "Sign Out"}</button>
          </div>
        </div>
      )}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: item.id === "profile" ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 10px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44 }}
            >
              <NavIcon d={item.icon} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", fontFamily: "'Josefin Sans', sans-serif" }}>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default function DoctorProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isMobile, isTablet } = useBreakpoint();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab]           = useState<"info" | "password">("info");
  const [photoUrl, setPhotoUrl]             = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("doctor_photo");
    if (saved) setPhotoUrl(saved);
  }, []);

  const [infoForm, setInfoForm]             = useState({ full_name: user?.full_name || "", phone_number: user?.phone_number || "" });
  const [infoFieldErrors, setInfoFieldErrors] = useState({ full_name: "", phone_number: "" });
  const [infoLoading, setInfoLoading]       = useState(false);
  const [infoSuccess, setInfoSuccess]       = useState("");
  const [infoError, setInfoError]           = useState("");

  const [pwForm, setPwForm]                 = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwFieldErrors, setPwFieldErrors]   = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading]           = useState(false);
  const [pwSuccess, setPwSuccess]           = useState("");
  const [pwError, setPwError]               = useState("");

  const sidebarWidth = isTablet ? 64 : 220;

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const url = ev.target?.result as string; setPhotoUrl(url); localStorage.setItem("doctor_photo", url); };
    reader.readAsDataURL(file);
  };

  const handleInfoSave = async () => {
    const nameErr = validateName(infoForm.full_name);
    const phoneErr = validatePhone(infoForm.phone_number);
    setInfoFieldErrors({ full_name: nameErr, phone_number: phoneErr });
    if (nameErr || phoneErr) return;
    setInfoError(""); setInfoSuccess(""); setInfoLoading(true);
    try {
      await api.patch("/me", { full_name: infoForm.full_name.trim(), phone_number: infoForm.phone_number.trim() });
      setInfoSuccess("Profile updated successfully.");
      setTimeout(() => setInfoSuccess(""), 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) setInfoError(err.response?.data?.message || "Failed to update profile.");
      else setInfoError("Failed to update profile.");
    } finally { setInfoLoading(false); }
  };

  const handlePasswordChange = async () => {
    const currentErr = pwForm.current_password ? "" : "Current password is required.";
    const newErr     = validateNewPassword(pwForm.new_password);
    const confirmErr = pwForm.confirm_password !== pwForm.new_password ? "Passwords do not match." : "";
    setPwFieldErrors({ current_password: currentErr, new_password: newErr, confirm_password: confirmErr });
    if (currentErr || newErr || confirmErr) return;
    if (pwForm.new_password === pwForm.current_password) { setPwFieldErrors((e) => ({ ...e, new_password: "New password must differ from your current one." })); return; }
    setPwError(""); setPwSuccess(""); setPwLoading(true);
    try {
      await api.post("/me/change-password", { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwSuccess("Password changed successfully.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwFieldErrors({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setPwSuccess(""), 3000);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.message || "";
        if (err.response?.status === 401 || msg.toLowerCase().includes("current")) setPwFieldErrors((e) => ({ ...e, current_password: "Current password is incorrect." }));
        else setPwError(msg || "Failed to change password.");
      } else setPwError("Failed to change password.");
    } finally { setPwLoading(false); }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.offWhite, fontFamily: "'Josefin Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: COLORS.navy, marginBottom: 12 }}>Access Restricted</h2>
          <button onClick={() => router.push("/auth/login")} style={{ color: COLORS.green, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>Sign in</button>
        </div>
      </div>
    );
  }

  const inp: React.CSSProperties = { width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.offWhite, fontSize: 14, color: COLORS.navy, fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <Sidebar isMobile={isMobile} isTablet={isTablet} logout={logout} router={router} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0, minWidth: 0 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: isMobile ? "1.25rem 1rem 5rem" : "2.5rem 1.5rem 5rem" }}>

          <div style={{ background: COLORS.navy, borderRadius: 20, padding: "2rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", animation: "fadeUp 0.3s ease", position: "relative", overflow: "hidden", flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: COLORS.green, opacity: 0.08, right: -60, top: -60, pointerEvents: "none" }} />
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.green, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 24, fontWeight: 900, color: "white" }}>{getInitials(user.full_name || "Dr")}</span>}
              </div>
              <label style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid white", fontSize: 11, touchAction: "manipulation" }}>
                +<input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
              </label>
            </div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 900, color: "white", marginBottom: 4 }}>{user.full_name}</p>
              <p style={{ fontSize: 13, color: COLORS.mint, marginBottom: 4 }}>Doctor · DentAI Clinic</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{user.email}</p>
            </div>
            {photoUrl && (
              <button onClick={() => { setPhotoUrl(null); localStorage.removeItem("doctor_photo"); }}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", zIndex: 1, touchAction: "manipulation" }}
              >Remove photo</button>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem", background: COLORS.white, padding: 6, borderRadius: 14, border: `1px solid ${COLORS.border}` }}>
            {(["info", "password"] as const).map((tab) => (
              <button key={tab} onClick={() => { setActiveTab(tab); setInfoError(""); setInfoSuccess(""); setPwError(""); setPwSuccess(""); }}
                style={{ flex: 1, padding: "11px 16px", borderRadius: 10, border: "none", background: activeTab === tab ? COLORS.navy : "transparent", color: activeTab === tab ? "white" : COLORS.navyMid, fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s", touchAction: "manipulation" }}
              >{tab === "info" ? "Personal Info" : "Change Password"}</button>
            ))}
          </div>

          {activeTab === "info" && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.25s ease" }}>
              <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: "1.5rem" }}>Personal Information</h2>
              {infoError   && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: "1rem" }}>{infoError}</div>}
              {infoSuccess && <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: "1rem" }}>✓ {infoSuccess}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input type="text" value={infoForm.full_name}
                    onChange={(e) => { setInfoForm((f) => ({ ...f, full_name: e.target.value })); setInfoFieldErrors((fe) => ({ ...fe, full_name: validateName(e.target.value) })); }}
                    placeholder="Dr. John Smith"
                    style={{ ...inp, border: `1px solid ${infoFieldErrors.full_name ? "#FECACA" : COLORS.border}`, background: infoFieldErrors.full_name ? "#FEF2F2" : COLORS.offWhite }}
                    onFocus={(e) => (e.target.style.borderColor = infoFieldErrors.full_name ? "#DC2626" : COLORS.green)}
                    onBlur={(e) => (e.target.style.borderColor = infoFieldErrors.full_name ? "#FECACA" : COLORS.border)}
                  />
                  <FieldError msg={infoFieldErrors.full_name} />
                </div>
                <div>
                  <label style={lbl}>Email Address</label>
                  <input type="email" value={user.email} disabled style={{ ...inp, background: COLORS.navyLight, color: COLORS.navyMid, cursor: "not-allowed" }} />
                  <p style={{ fontSize: 11, color: COLORS.navyMid, marginTop: 5 }}>Email address cannot be changed.</p>
                </div>
                <div>
                  <label style={lbl}>Phone Number</label>
                  <input type="tel" value={infoForm.phone_number}
                    onChange={(e) => { setInfoForm((f) => ({ ...f, phone_number: e.target.value })); setInfoFieldErrors((fe) => ({ ...fe, phone_number: validatePhone(e.target.value) })); }}
                    placeholder="+961 XX XXX XXX"
                    style={{ ...inp, border: `1px solid ${infoFieldErrors.phone_number ? "#FECACA" : COLORS.border}`, background: infoFieldErrors.phone_number ? "#FEF2F2" : COLORS.offWhite }}
                    onFocus={(e) => (e.target.style.borderColor = infoFieldErrors.phone_number ? "#DC2626" : COLORS.green)}
                    onBlur={(e) => (e.target.style.borderColor = infoFieldErrors.phone_number ? "#FECACA" : COLORS.border)}
                  />
                  <FieldError msg={infoFieldErrors.phone_number} />
                </div>
                <button onClick={handleInfoSave} disabled={infoLoading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: infoLoading ? COLORS.navyLight : COLORS.navy, color: infoLoading ? COLORS.navyMid : "white", borderRadius: 10, border: "none", cursor: infoLoading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, marginTop: 4, touchAction: "manipulation" }}
                >{infoLoading ? "Saving…" : "Save Changes"}</button>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.75rem", animation: "fadeUp 0.25s ease" }}>
              <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: "1.5rem" }}>Change Password</h2>
              {pwError   && <div style={{ padding: "12px 16px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, fontSize: 13, color: "#DC2626", marginBottom: "1rem" }}>{pwError}</div>}
              {pwSuccess && <div style={{ padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, fontSize: 13, color: "#15803D", marginBottom: "1rem" }}>✓ {pwSuccess}</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label style={lbl}>Current Password</label>
                  <PasswordInput value={pwForm.current_password} onChange={(v) => { setPwForm((f) => ({ ...f, current_password: v })); setPwFieldErrors((e) => ({ ...e, current_password: "" })); }} placeholder="Your current password" />
                  <FieldError msg={pwFieldErrors.current_password} />
                </div>
                <div>
                  <label style={lbl}>New Password</label>
                  <PasswordInput value={pwForm.new_password} onChange={(v) => { setPwForm((f) => ({ ...f, new_password: v })); setPwFieldErrors((e) => ({ ...e, new_password: validateNewPassword(v) })); }} placeholder="Min. 6 characters" />
                  <FieldError msg={pwFieldErrors.new_password} />
                  {pwForm.new_password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3].map((level) => {
                          const strength = pwForm.new_password.length < 6 ? 1 : pwForm.new_password.length < 10 ? 2 : 3;
                          const colors = ["#DC2626", "#F59E0B", COLORS.green];
                          return <div key={level} style={{ flex: 1, height: 3, borderRadius: 2, background: level <= strength ? colors[strength - 1] : COLORS.border, transition: "background 0.2s" }} />;
                        })}
                      </div>
                      <p style={{ fontSize: 11, color: COLORS.navyMid }}>{pwForm.new_password.length < 6 ? "Too short" : pwForm.new_password.length < 10 ? "Good" : "Strong password"}</p>
                    </div>
                  )}
                </div>
                <div>
                  <label style={lbl}>Confirm Password</label>
                  <PasswordInput value={pwForm.confirm_password} onChange={(v) => { setPwForm((f) => ({ ...f, confirm_password: v })); setPwFieldErrors((e) => ({ ...e, confirm_password: v !== pwForm.new_password ? "Passwords do not match." : "" })); }} placeholder="Re-enter new password" />
                  <FieldError msg={pwFieldErrors.confirm_password} />
                  {pwForm.confirm_password && !pwFieldErrors.confirm_password && <p style={{ fontSize: 11, color: "#15803D", marginTop: 5 }}>✓ Passwords match</p>}
                </div>
                <button onClick={handlePasswordChange} disabled={pwLoading}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", background: pwLoading ? COLORS.navyLight : COLORS.navy, color: pwLoading ? COLORS.navyMid : "white", borderRadius: 10, border: "none", cursor: pwLoading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, marginTop: 4, touchAction: "manipulation" }}
                >{pwLoading ? "Changing…" : "Change Password"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}