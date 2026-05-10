"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import api from "@/lib/api";

const COLORS = {
  green:    "#3EB489",
  mint:     "#A7E4D8",
  white:    "#FFFFFF",
  lightMint:"#E6F7F2",
  navy:     "#2C3E50",
  navyMid:  "rgba(44,62,80,0.5)",
  border:   "rgba(44,62,80,0.10)",
  offWhite: "#F7F9FB",
};

const NAV = [
  { id: "home",         label: "Home",         path: "/",                    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dashboard",    label: "Dashboard",    path: "/admin/dashboard",    d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { id: "appointments", label: "Appointments", path: "/admin/appointments", d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "call-logs",    label: "Call Logs",    path: "/admin/call-logs",    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" },
  { id: "callbacks",    label: "Callbacks",    path: "/admin/callbacks",    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92zM17 1l4 4-4 4M21 5H11" },
  { id: "settings",     label: "Settings",     path: "/admin/settings",     d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

const TABS = ["Clinic Info", "Account", "Notifications", "Integrations"];

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
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: checked ? COLORS.green : "rgba(44,62,80,0.15)", position: "relative", transition: "background 0.2s", flexShrink: 0, touchAction: "manipulation" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: COLORS.white, position: "absolute", top: 3, left: checked ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, color: COLORS.navy, boxSizing: "border-box", background: COLORS.white }}
      />
      <button type="button" onMouseDown={(e) => e.preventDefault()} onTouchStart={(e) => e.preventDefault()} onClick={() => setShow((p) => !p)}
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: COLORS.navyMid, padding: 0 }}
      >
        {show
          ? <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          : <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    </div>
  );
}

export default function AdminSettings() {
  const { user: rawUser, logout } = useAuth();
  const router = useRouter();
  const { isMobile, isTablet } = useBreakpoint();

  const [activeNav,      setActiveNav]      = useState("settings");
  const [activeTab,      setActiveTab]      = useState("Clinic Info");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTabOpen,  setMobileTabOpen]  = useState(false);
  const [saved,          setSaved]          = useState(false);
  const [error,          setError]          = useState("");

  const [clinicName,    setClinicName]    = useState("DentAI Clinic");
  const [clinicPhone,   setClinicPhone]   = useState("+961 01 234567");
  const [clinicEmail,   setClinicEmail]   = useState("info@dentai.lb");
  const [clinicAddress, setClinicAddress] = useState("Hamra Street, Beirut, Lebanon");
  const [openTime,      setOpenTime]      = useState("08:00");
  const [closeTime,     setCloseTime]     = useState("18:00");

  const [adminName,        setAdminName]        = useState(rawUser?.name ?? "");
  const [adminEmail,       setAdminEmail]       = useState(rawUser?.email ?? "");
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");

  const [notifications, setNotifications] = useState({
    newAppointment:      true,
    missedCall:          true,
    callbackReminder:    true,
    patientRegistration: false,
    dailySummary:        true,
    emailAlerts:         false,
  });

  const [integrations, setIntegrations] = useState({
    twilioEnabled:  false,
    twilioSid:      "",
    twilioToken:    "",
    twilioPhone:    "",
    aiCallsEnabled: false,
    aiModel:        "claude-sonnet-4-20250514",
  });

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const handleSaveClinic = async (e: React.MouseEvent) => {
    e.preventDefault();
    try { await api.patch("/admin/settings/clinic", { clinicName, clinicPhone, clinicEmail, clinicAddress, openTime, closeTime }); showSaved(); }
    catch (err) { if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Failed to save"); else setError("Failed to save"); }
  };

  const handleChangePassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    try { await api.patch("/admin/settings/password", { currentPassword, newPassword }); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); showSaved(); }
    catch (err) { if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Failed to update password"); else setError("Failed to update password"); }
  };

  const sidebarWidth = isTablet ? 64 : 220;

  const inp: React.CSSProperties  = { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, outline: "none", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, color: COLORS.navy, boxSizing: "border-box", background: COLORS.white };
  const lbl: React.CSSProperties  = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.navyMid, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 6 };
  const sect: React.CSSProperties = { background: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.border}`, marginBottom: 16, overflow: "hidden" };
  const sectHead: React.CSSProperties = { padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}` };
  const sectBody: React.CSSProperties = { padding: "24px" };

  if (!rawUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.offWhite, fontFamily: "'Josefin Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: COLORS.navy, marginBottom: 12 }}>Access Restricted</h2>
          <button onClick={() => router.push("/auth/login")} style={{ background: COLORS.green, color: COLORS.white, border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
        </div>
      </div>
    );
  }

  const TabContent = () => (
    <div>
      {saved && (
        <div style={{ background: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, borderRadius: 10, padding: "12px 18px", marginBottom: 20, color: COLORS.green, fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          Changes saved successfully.
        </div>
      )}
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 18px", marginBottom: 20, color: "#EF4444", fontWeight: 600, fontSize: 13 }}>
          {error}
        </div>
      )}

      {activeTab === "Clinic Info" && (
        <>
          <div style={sect}>
            <div style={sectHead}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>Clinic Details</div>
              <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 3 }}>Update your clinic's public information</div>
            </div>
            <div style={sectBody}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {[
                  { label: "Clinic Name",  val: clinicName,    set: setClinicName    },
                  { label: "Phone",        val: clinicPhone,   set: setClinicPhone   },
                  { label: "Email",        val: clinicEmail,   set: setClinicEmail   },
                  { label: "Address",      val: clinicAddress, set: setClinicAddress },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label style={lbl}>{label}</label>
                    <input value={val} onChange={(e) => set(e.target.value)} style={inp} />
                  </div>
                ))}
                <div>
                  <label style={lbl}>Opening Time</label>
                  <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Closing Time</label>
                  <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} style={inp} />
                </div>
              </div>
              <button onClick={handleSaveClinic} style={{ background: COLORS.navy, color: COLORS.white, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "Account" && (
        <>
          <div style={sect}>
            <div style={sectHead}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>Profile Information</div>
              <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 3 }}>Update your name and email address</div>
            </div>
            <div style={sectBody}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>Full Name</label>
                  <input value={adminName} onChange={(e) => setAdminName(e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Email</label>
                  <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} style={inp} />
                </div>
              </div>
              <button
                onClick={async (e) => { e.preventDefault(); try { await api.patch("/admin/settings/profile", { name: adminName, email: adminEmail }); showSaved(); } catch (err) { if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Failed to update"); } }}
                style={{ background: COLORS.navy, color: COLORS.white, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
              >Save Profile</button>
            </div>
          </div>

          <div style={sect}>
            <div style={sectHead}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>Change Password</div>
              <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 3 }}>Use a strong password you don't use elsewhere</div>
            </div>
            <div style={sectBody}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420, marginBottom: 20 }}>
                <div>
                  <label style={lbl}>Current Password</label>
                  <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Enter current password" />
                </div>
                <div>
                  <label style={lbl}>New Password</label>
                  <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Enter new password" />
                </div>
                <div>
                  <label style={lbl}>Confirm New Password</label>
                  <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Confirm new password" />
                </div>
              </div>
              <button onClick={handleChangePassword} style={{ background: COLORS.navy, color: COLORS.white, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>
                Update Password
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === "Notifications" && (
        <div style={sect}>
          <div style={sectHead}>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>Notification Preferences</div>
            <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 3 }}>Choose what you want to be notified about</div>
          </div>
          <div style={{ padding: "0 24px" }}>
            {[
              { key: "newAppointment",      label: "New Appointment Booked",   desc: "Notify when a patient books a new appointment" },
              { key: "missedCall",          label: "Missed Call Alert",         desc: "Alert when a call is missed" },
              { key: "callbackReminder",    label: "Callback Reminders",        desc: "Remind before scheduled callbacks" },
              { key: "patientRegistration", label: "New Patient Registration",  desc: "Notify when a new patient registers" },
              { key: "dailySummary",        label: "Daily Summary",             desc: "Receive a daily summary of clinic activity" },
              { key: "emailAlerts",         label: "Email Alerts",              desc: "Send notification copies via email" },
            ].map(({ key, label, desc }, i, arr) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: COLORS.navyMid }}>{desc}</div>
                </div>
                <Toggle
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={() => setNotifications((p) => ({ ...p, [key]: !p[key as keyof typeof notifications] }))}
                />
              </div>
            ))}
          </div>
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}` }}>
            <button onClick={() => showSaved()} style={{ background: COLORS.navy, color: COLORS.white, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {activeTab === "Integrations" && (
        <>
          <div style={sect}>
            <div style={{ ...sectHead, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>Twilio — Phone & SMS</div>
                <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 3 }}>Enable automated calling and SMS reminders</div>
              </div>
              <Toggle checked={integrations.twilioEnabled} onChange={() => setIntegrations((p) => ({ ...p, twilioEnabled: !p.twilioEnabled }))} />
            </div>
            {integrations.twilioEnabled && (
              <div style={sectBody}>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <div>
                    <label style={lbl}>Account SID</label>
                    <input value={integrations.twilioSid} onChange={(e) => setIntegrations((p) => ({ ...p, twilioSid: e.target.value }))} placeholder="AC..." style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Auth Token</label>
                    <input type="password" value={integrations.twilioToken} onChange={(e) => setIntegrations((p) => ({ ...p, twilioToken: e.target.value }))} placeholder="••••••••" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Twilio Phone Number</label>
                    <input value={integrations.twilioPhone} onChange={(e) => setIntegrations((p) => ({ ...p, twilioPhone: e.target.value }))} placeholder="+1 555 000 0000" style={inp} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={sect}>
            <div style={{ ...sectHead, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>AI-Powered Call Handling</div>
                <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 3 }}>Let an AI assistant handle incoming calls and schedule appointments</div>
              </div>
              <Toggle checked={integrations.aiCallsEnabled} onChange={() => setIntegrations((p) => ({ ...p, aiCallsEnabled: !p.aiCallsEnabled }))} />
            </div>
            {integrations.aiCallsEnabled && (
              <div style={sectBody}>
                <div style={{ maxWidth: 320 }}>
                  <label style={lbl}>AI Model</label>
                  <select value={integrations.aiModel} onChange={(e) => setIntegrations((p) => ({ ...p, aiModel: e.target.value }))} style={inp}>
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                    <option value="claude-opus-4-20250514">Claude Opus 4 (Advanced)</option>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button onClick={() => showSaved()} style={{ background: COLORS.navy, color: COLORS.white, border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>
            Save Integrations
          </button>
        </>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'Josefin Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 1px 8px rgba(44,62,80,0.06)" }}>
          <button onClick={() => setMobileMenuOpen((v) => !v)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}>
            <div style={{ width: 18, height: 2, background: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 18, height: 2, background: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 12, height: 2, background: COLORS.navy, borderRadius: 2 }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.12em", color: COLORS.navy }}>DentAI</span>
          <div style={{ width: 40 }} />
        </div>
      )}

      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(44,62,80,0.4)", zIndex: 55, top: 56 }} />
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, background: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)", animation: "slideIn 0.2s ease" }}>
            {NAV.map((item) => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); setMobileMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", background: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
              >
                <NavIcon d={item.d} />{item.label}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${COLORS.mint}`, marginTop: 8, paddingTop: 8 }}>
              <button onClick={() => { logout(); router.push("/"); }} style={{ width: "100%", padding: "12px 14px", background: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
            </div>
          </div>
        </>
      )}

      {!isMobile && (
        <aside style={{ width: sidebarWidth, background: COLORS.white, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, boxShadow: "2px 0 12px rgba(44,62,80,0.04)", transition: "width 0.2s ease", overflow: "hidden" }}>
          <div style={{ padding: isTablet ? "24px 0" : "24px 20px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white", flexShrink: 0 }}>A</div>
            {!isTablet && <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>}
          </div>
          <nav style={{ padding: isTablet ? "20px 8px" : "20px 12px", flex: 1, overflowY: "auto" }}>
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Admin Portal</div>}
            {NAV.map((item) => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); }} title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", background: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (activeNav !== item.id) e.currentTarget.style.background = "#F8FFFE"; }}
                onMouseLeave={(e) => { if (activeNav !== item.id) e.currentTarget.style.background = "transparent"; }}
              >
                <NavIcon d={item.d} />
                {!isTablet && item.label}
              </button>
            ))}
          </nav>
          <button onClick={() => { logout(); router.push("/"); }} title={isTablet ? "Sign Out" : undefined}
            style={{ margin: isTablet ? "0 8px 16px" : "0 12px 16px", padding: isTablet ? "12px 0" : "10px", background: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isTablet
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              : "Sign Out"
            }
          </button>
        </aside>
      )}

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, minWidth: 0, paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0, display: "flex", flexDirection: "column" }}>

        {isMobile ? (
          mobileTabOpen ? (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setMobileTabOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: COLORS.green, fontSize: 13, fontWeight: 700, fontFamily: "inherit", touchAction: "manipulation", padding: 0 }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  All settings
                </button>
              </div>
              <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "16px 20px" }}>
                <h1 style={{ fontSize: 20, fontWeight: 900, color: COLORS.navy }}>Settings</h1>
                <p style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 4 }}>{activeTab}</p>
              </div>
              <div style={{ padding: "20px 16px" }}>
                <TabContent />
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto" }}>
              <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "20px" }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.navy }}>Settings</h1>
                <p style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 4 }}>Manage your clinic preferences</p>
              </div>
              <div style={{ padding: "12px 0" }}>
                {TABS.map((tab, i) => (
                  <button key={tab} onClick={() => { setActiveTab(tab); setMobileTabOpen(true); setError(""); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: COLORS.white, border: "none", borderBottom: i < TABS.length - 1 ? `1px solid ${COLORS.border}` : "none", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{tab}</span>
                    <svg width="16" height="16" fill="none" stroke={COLORS.navyMid} strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            </div>
          )
        ) : (
          <>
            <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "0 32px" }}>
              <div style={{ paddingTop: 28, paddingBottom: 0 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.navy, marginBottom: 20 }}>Settings</h1>
                <div style={{ display: "flex", gap: 0 }}>
                  {TABS.map((tab) => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setError(""); }}
                      style={{ padding: "10px 20px", background: "none", border: "none", borderBottom: activeTab === tab ? `2px solid ${COLORS.navy}` : "2px solid transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, color: activeTab === tab ? COLORS.navy : COLORS.navyMid, transition: "all 0.15s", marginBottom: -1, touchAction: "manipulation" }}
                    >{tab}</button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
              <div style={{ maxWidth: 780 }}>
                <TabContent />
              </div>
            </div>
          </>
        )}
      </div>

      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 10px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44 }}
            >
              <NavIcon d={item.d} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}