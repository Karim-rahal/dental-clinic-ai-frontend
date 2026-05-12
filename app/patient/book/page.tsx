"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const COLORS = {
  green:    "#3EB489", mint: "#A7E4D8", lightMint: "#E6F7F2",
  navy:     "#2C3E50", navyMid: "rgba(44,62,80,0.55)", navyLight: "rgba(44,62,80,0.07)",
  white:    "#FFFFFF", offWhite: "#F7F9F8", border: "rgba(44,62,80,0.10)",
};

const NAV_ITEMS = [
  { id: "home",         label: "Home",         path: "/",                     icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dashboard",    label: "Dashboard",    path: "/patient/dashboard",    icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { id: "appointments", label: "Appointments", path: "/patient/appointments", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "book",         label: "Book Visit",   path: "/patient/book",         icon: "M12 5v14M5 12h14" },
  { id: "upload",       label: "Upload X-Rays",path: "/patient/upload",       icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" },
  { id: "profile",      label: "Profile",      path: "/patient/profile",      icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

const SERVICES = [
  { id: "Dental Checkup",          accent: "#3EB489", desc: "Full oral exam & digital X-rays" },
  { id: "Teeth Cleaning",          accent: "#5BCFB5", desc: "Professional scaling & polishing" },
  { id: "Dental Filling",          accent: "#4A9FD4", desc: "Tooth-coloured composite fillings" },
  { id: "Teeth Whitening",         accent: "#F0A500", desc: "Up to 8 shades brighter in one session" },
  { id: "Braces Consultation",     accent: "#9B6FCF", desc: "Orthodontic planning & aligner assessment" },
  { id: "Root Canal Consultation", accent: "#E06B6B", desc: "Pain-free endodontic therapy" },
];

interface Doctor { id: string; full_name: string; }

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => { const h = () => setWidth(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: width < 768, isTablet: width >= 768 && width < 1024 };
}

function NavIcon({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function CheckIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>; }

function StepBar({ step }: { step: number }) {
  const steps = ["Service", "Doctor & Date", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "2rem" }}>
      {steps.map((label, i) => {
        const num = i + 1, done = num < step, active = num === step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: done ? COLORS.green : active ? COLORS.navy : COLORS.navyLight, color: done || active ? "white" : COLORS.navyMid, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "'Josefin Sans', sans-serif", transition: "all 0.25s" }}>
                {done ? <CheckIcon /> : num}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? COLORS.navy : COLORS.navyMid, whiteSpace: "nowrap", fontFamily: "'Josefin Sans', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 1.5, background: done ? COLORS.green : COLORS.border, margin: "0 8px", marginBottom: 22, transition: "background 0.25s" }} />}
          </div>
        );
      })}
    </div>
  );
}

function formatTime(time: string) { const [h] = time.split(":"); const hr = parseInt(h); return hr < 12 ? `${hr}:00 AM` : hr === 12 ? "12:00 PM" : `${hr - 12}:00 PM`; }

function BookSidebar({ isMobile, isTablet, sidebarWidth, mobileMenuOpen, setMobileMenuOpen, logout, router }: {
  isMobile: boolean; isTablet: boolean; sidebarWidth: number;
  mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
  logout: () => void; router: ReturnType<typeof useRouter>;
}) {
  return (
    <>
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 2px 12px rgba(44,62,80,0.06)" }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", backgroundColor: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}>
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} /><div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} /><div style={{ width: 12, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
          </button>
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: "0.12em", color: COLORS.navy }}>BrightSmile</span>
          <div style={{ width: 40 }} />
        </div>
      )}
      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.4)", zIndex: 55, top: 56 }} />
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, backgroundColor: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)" }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "book" ? COLORS.lightMint : "transparent", color: item.id === "book" ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: item.id === "book" ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
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
            {!isTablet && <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>BrightSmile</span>}
          </div>
          <div style={{ padding: isTablet ? "20px 8px" : "20px 12px", flex: 1, overflowY: "auto" }}>
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Patient Portal</div>}
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => router.push(item.path)} title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "book" ? COLORS.lightMint : "transparent", color: item.id === "book" ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: item.id === "book" ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (item.id !== "book") e.currentTarget.style.backgroundColor = "#F8FFFE"; }}
                onMouseLeave={(e) => { if (item.id !== "book") e.currentTarget.style.backgroundColor = "transparent"; }}
              ><NavIcon d={item.icon} />{!isTablet && item.label}</button>
            ))}
          </div>
          <button onClick={() => { logout(); router.push("/"); }} title={isTablet ? "Sign Out" : undefined}
            style={{ margin: isTablet ? "0 8px 16px" : "0 12px 16px", padding: isTablet ? "12px 0" : "10px", backgroundColor: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}
          >{isTablet ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> : "Sign Out"}</button>
        </div>
      )}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: item.id === "book" ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 6px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44 }}>
              <NavIcon d={item.icon} /><span style={{ fontSize: 8, fontWeight: 700, fontFamily: "'Josefin Sans', sans-serif" }}>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function BookContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useBreakpoint();

  const [step,          setStep]          = useState(1);
  const [doctors,       setDoctors]       = useState<Doctor[]>([]);
  const [slots,         setSlots]         = useState<string[]>([]);
  const [phoneNumber,   setPhoneNumber]   = useState<string>(() => user?.phone_number || "");
  const [form,          setForm]          = useState({ service: "", doctor_id: "", date: "", time: "" });
  const [loading,       setLoading]       = useState(false);
  const [slotsLoading,  setSlotsLoading]  = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState(false);
  const [mobileMenuOpen,setMobileMenuOpen]= useState(false);

  const sidebarWidth = isTablet ? 64 : 220;
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { api.get("/doctors").then((r) => setDoctors(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (!user?.phone_number) {
      api.get("/me").then((r) => { if (r.data?.phone_number) setPhoneNumber(r.data.phone_number); }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!form.doctor_id || !form.date) return;
    let cancelled = false;
    const id = setTimeout(() => { if (!cancelled) setSlotsLoading(true); }, 0);
    api.get(`/doctors/${form.doctor_id}/slots?date=${form.date}`)
      .then((r) => { if (!cancelled) { setSlotsLoading(false); setSlots(r.data.slots || []); } })
      .catch(() => { if (!cancelled) { setSlotsLoading(false); setSlots([]); } });
    return () => { cancelled = true; clearTimeout(id); };
  }, [form.doctor_id, form.date]);

  const selectedService = SERVICES.find((s) => s.id === form.service);
  const selectedDoctor  = doctors.find((d) => d.id === form.doctor_id);

  const handleSubmit = async () => {
    setError("");
    if (!form.service || !form.doctor_id || !form.date || !form.time) { setError("Please fill in all fields."); return; }
    if (!phoneNumber) { setError("Your account has no phone number. Please update your profile first."); return; }
    setLoading(true);
    try {
      await api.post("/appointments", { patient_name: user?.full_name, phone_number: phoneNumber, service: form.service, datetime: new Date(`${form.date}T${form.time}:00`).toISOString(), doctor_id: form.doctor_id });
      setSuccess(true);
      setTimeout(() => router.push("/patient/appointments"), 2200);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || "Booking failed. Please try again.");
      } else setError("Booking failed. Please try again.");
    } finally { setLoading(false); }
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

  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.offWhite, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } @keyframes scaleIn { from { transform:scale(0.7); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease", maxWidth: 400, padding: "2rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", animation: "scaleIn 0.4s ease" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 24, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>Appointment Booked!</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid, lineHeight: 1.7 }}>Your <strong>{form.service}</strong> appointment with <strong>{selectedDoctor?.full_name}</strong> has been confirmed.</p>
          <p style={{ fontSize: 13, color: COLORS.navyMid, marginTop: 8 }}>Redirecting to your appointments…</p>
        </div>
      </div>
    );
  }

  const sect: React.CSSProperties = { background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1.25rem", marginBottom: "1rem" };
  const sectLbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 12, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        * { box-sizing: border-box; }
        .svc-card:hover  { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
        .slot-btn:hover:not(.active) { border-color: ${COLORS.green} !important; color: ${COLORS.green} !important; }
        .doc-opt:hover { border-color: ${COLORS.green} !important; }
      `}</style>

      <BookSidebar isMobile={isMobile} isTablet={isTablet} sidebarWidth={sidebarWidth} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} logout={logout} router={router} />

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0, minWidth: 0 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "1.25rem 1rem 5rem" : "2rem 1.5rem 5rem" }}>

          <div style={{ marginBottom: "2rem", animation: "fadeUp 0.35s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>Online Booking</p>
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>Book an Appointment</h1>
            <p style={{ fontSize: 14, color: COLORS.navyMid }}>Choose your service, preferred doctor, and a time that works for you.</p>
          </div>

          <StepBar step={step} />

          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FEECEC", border: "1px solid #F5C4C4", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, color: "#A32D2D" }}>
              <span>{error}</span>
              <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#A32D2D", fontSize: 16, padding: 0 }}>✕</button>
            </div>
          )}

          {step === 1 && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "'Josefin Sans', sans-serif" }}>Select a service</p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: "2rem" }}>
                {SERVICES.map((s) => {
                  const isSel = form.service === s.id;
                  return (
                    <button key={s.id} className="svc-card" onClick={() => setForm((f) => ({ ...f, service: s.id }))}
                      style={{ textAlign: "left", background: isSel ? s.accent + "14" : COLORS.white, border: `1.5px solid ${isSel ? s.accent : COLORS.border}`, borderRadius: 14, padding: "1rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit", boxShadow: isSel ? `0 4px 18px ${s.accent}22` : "none" }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: isSel ? s.accent + "25" : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", backgroundColor: s.accent, opacity: isSel ? 1 : 0.5 }} />
                      </div>
                      <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>{s.id}</div>
                      <div style={{ fontSize: 11, color: COLORS.navyMid, lineHeight: 1.5 }}>{s.desc}</div>
                      {isSel && <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: s.accent }}><CheckIcon /> Selected</div>}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button disabled={!form.service} onClick={() => setStep(2)}
                  style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "13px 32px", background: form.service ? COLORS.navy : COLORS.navyLight, color: form.service ? "white" : COLORS.navyMid, border: "none", borderRadius: 10, cursor: form.service ? "pointer" : "not-allowed", transition: "background 0.15s", touchAction: "manipulation" }}
                >Continue →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              {selectedService && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: "1.5rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: selectedService.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: selectedService.accent }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif" }}>{selectedService.id}</div>
                    <div style={{ fontSize: 11, color: COLORS.navyMid }}>{selectedService.desc}</div>
                  </div>
                  <button onClick={() => setStep(1)} style={{ fontSize: 11, color: COLORS.green, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Change</button>
                </div>
              )}

              <div style={sect}>
                <label style={sectLbl}>Preferred Doctor</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {doctors.length === 0 ? <p style={{ fontSize: 13, color: COLORS.navyMid }}>Loading doctors…</p>
                    : doctors.map((d) => {
                      const isSel = form.doctor_id === d.id;
                      return (
                        <button key={d.id} className="doc-opt" onClick={() => setForm((f) => ({ ...f, doctor_id: d.id, time: "" }))}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderRadius: 10, fontFamily: "inherit", border: `1.5px solid ${isSel ? COLORS.green : COLORS.border}`, background: isSel ? COLORS.lightMint : "transparent", cursor: "pointer", transition: "all 0.12s", touchAction: "manipulation" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: isSel ? COLORS.green : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isSel ? "white" : COLORS.navyMid, fontFamily: "'Josefin Sans', sans-serif", flexShrink: 0 }}>
                              {d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>{d.full_name}</span>
                          </div>
                          {isSel && <span style={{ color: COLORS.green }}><CheckIcon /></span>}
                        </button>
                      );
                    })
                  }
                </div>
              </div>

              <div style={sect}>
                <label style={sectLbl}>Preferred Date</label>
                <input type="date" min={today} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, time: "" }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.navy, fontFamily: "inherit", background: COLORS.offWhite, outline: "none" }}
                />
              </div>

              <div style={sect}>
                <label style={sectLbl}>Available Time Slots</label>
                {!form.doctor_id || !form.date ? <p style={{ fontSize: 13, color: COLORS.navyMid }}>Select a doctor and date first.</p>
                  : slotsLoading ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} /><span style={{ fontSize: 13, color: COLORS.navyMid }}>Loading slots…</span></div>
                  : slots.length === 0 ? <p style={{ fontSize: 13, color: "#A32D2D" }}>No available slots. Try another date.</p>
                  : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 }}>
                      {slots.map((slot) => {
                        const isActive = form.time === slot;
                        return (
                          <button key={slot} className={`slot-btn${isActive ? " active" : ""}`} onClick={() => setForm((f) => ({ ...f, time: slot }))}
                            style={{ padding: "9px 6px", borderRadius: 8, border: `1.5px solid ${isActive ? COLORS.green : COLORS.border}`, background: isActive ? COLORS.green : "transparent", color: isActive ? "white" : COLORS.navy, fontSize: 12, fontWeight: isActive ? 700 : 500, fontFamily: "'Josefin Sans', sans-serif", cursor: "pointer", transition: "all 0.12s", touchAction: "manipulation" }}
                          >{formatTime(slot)}</button>
                        );
                      })}
                    </div>
                  )
                }
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <button onClick={() => setStep(1)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 24px", background: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: "pointer" }}>← Back</button>
                <button disabled={!form.doctor_id || !form.date || !form.time} onClick={() => setStep(3)}
                  style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "12px 32px", background: form.doctor_id && form.date && form.time ? COLORS.navy : COLORS.navyLight, color: form.doctor_id && form.date && form.time ? "white" : COLORS.navyMid, border: "none", borderRadius: 10, cursor: form.doctor_id && form.date && form.time ? "pointer" : "not-allowed", transition: "background 0.15s", touchAction: "manipulation" }}>Review Booking →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "'Josefin Sans', sans-serif" }}>Review your booking</p>
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden", marginBottom: "1.25rem" }}>
                {selectedService && (
                  <div style={{ padding: "1.25rem 1.5rem", background: selectedService.accent + "12", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: selectedService.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: selectedService.accent }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: selectedService.accent, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 3 }}>Service</p>
                      <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.navy }}>{selectedService.id}</p>
                      <p style={{ fontSize: 12, color: COLORS.navyMid }}>{selectedService.desc}</p>
                    </div>
                  </div>
                )}
                <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Doctor",  value: selectedDoctor?.full_name ?? "—" },
                    { label: "Date",    value: form.date ? new Date(form.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—" },
                    { label: "Time",    value: form.time ? formatTime(form.time) : "—" },
                    { label: "Patient", value: user?.full_name ?? "—" },
                    { label: "Phone",   value: phoneNumber || "No phone number on file" },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Josefin Sans', sans-serif", minWidth: 70 }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, borderRadius: 10, padding: "11px 14px", fontSize: 12, color: "#0F6E56", marginBottom: "1.5rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
                You will receive a confirmation shortly. You can upload required documents from your dashboard after booking.
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <button onClick={() => setStep(2)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 24px", background: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: "pointer" }}>← Back</button>
                <button disabled={loading} onClick={handleSubmit}
                  style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "13px 36px", background: loading ? COLORS.navyLight : COLORS.navy, color: loading ? COLORS.navyMid : "white", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s", touchAction: "manipulation" }}
                >{loading ? "Confirming…" : "Confirm Booking"}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9F8" }}><div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E6F7F2", borderTopColor: "#3EB489" }} /></div>}>
      <BookContent />
    </Suspense>
  );
}