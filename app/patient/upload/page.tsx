"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import axios from "axios";
import { SERVICE_DOCS, DocSection } from "@/lib/serviceDocs";

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

const SERVICE_META: Record<string, { accent: string; bg: string }> = {
  "Dental Checkup":          { accent: "#3EB489", bg: "#E6F7F2" },
  "Teeth Cleaning":          { accent: "#5BCFB5", bg: "#E1F9F4" },
  "Dental Filling":          { accent: "#4A9FD4", bg: "#E6F2FB" },
  "Teeth Whitening":         { accent: "#F0A500", bg: "#FEF6E4" },
  "Braces Consultation":     { accent: "#9B6FCF", bg: "#F3EEFF" },
  "Root Canal":              { accent: "#E06B6B", bg: "#FEECEC" },
  "Root Canal Consultation": { accent: "#E06B6B", bg: "#FEECEC" },
};

interface Appointment { id: number; service: string; doctor_name?: string; doctorName?: string; date?: string; datetime?: string; status?: string; }
interface UploadedFile { name: string; preview: string | null; }
type UploadMap = Record<string, UploadedFile>;

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => { const h = () => setWidth(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: width < 768, isTablet: width >= 768 && width < 1024 };
}

function NavIcon({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

const CheckIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const DocIcon   = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg>;
const ImgIcon   = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const XrayIcon  = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/><circle cx="17" cy="16" r="1.2" fill="currentColor" stroke="none"/></svg>;
const UploadIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;

function getDoctorName(a: Appointment) { return a.doctor_name ?? a.doctorName ?? "Your Doctor"; }
function getFormattedDate(a: Appointment) {
  const raw = a.date ?? a.datetime;
  if (!raw) return "—";
  try { return new Date(raw).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return raw; }
}
function computeStatus(apptId: number, service: string, uploaded: UploadMap): "pending" | "partial" | "done" {
  const sections = SERVICE_DOCS[service] ?? [];
  const allItems = sections.flatMap((s) => s.items);
  const done = allItems.filter((item) => !!uploaded[`${apptId}_${item.id}`]).length;
  const reqItems = sections.filter((s) => s.required).flatMap((s) => s.items);
  if (done === 0) return "pending";
  if (reqItems.length > 0 && reqItems.every((item) => !!uploaded[`${apptId}_${item.id}`])) return "done";
  return "partial";
}

function UploadContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useBreakpoint();

  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [selectedId,    setSelectedId]    = useState<number | null>(null);
 const [uploaded, setUploaded] = useState<UploadMap>(() => {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(`uploads_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
});
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [mobileMenuOpen,setMobileMenuOpen]= useState(false);

  const pendingKeyRef = useRef<string | null>(null);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const sidebarWidth  = isTablet ? 64 : 220;

  useEffect(() => {
    api.get("/appointments").then((r) => {
  const appts: Appointment[] = r.data.filter(
    (a: Appointment) => a.status !== "cancelled"
  );
  setAppointments(appts);
  // Remove uploaded files for appointments no longer in the list
setUploaded((prev) => {
  const validIds = new Set(appts.map((a) => String(a.id)));
  const cleaned: UploadMap = {};
  Object.keys(prev).forEach((key) => {
    const apptId = key.split("_")[0];
    if (validIds.has(apptId)) cleaned[key] = prev[key];
  });
  return cleaned;
});
      const targetId = searchParams.get("appointmentId") ? parseInt(searchParams.get("appointmentId")!, 10) : appts[0]?.id ?? null;
      setSelectedId(targetId);
    }).catch((err) => {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Failed to load appointments.");
      else setError("Failed to load appointments.");
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
  if (!user?.id) return;
  try {
    localStorage.setItem(`uploads_${user.id}`, JSON.stringify(uploaded));
  } catch {}
}, [uploaded, user?.id]);

  const selectedAppt = appointments.find((a) => a.id === selectedId) ?? null;
  const sections: DocSection[] = selectedAppt ? (SERVICE_DOCS[selectedAppt.service] ?? []) : [];
  const allItems      = sections.flatMap((s) => s.items);
  const uploadedCount = allItems.filter((item) => !!uploaded[`${selectedId}_${item.id}`]).length;
  const totalCount    = allItems.length;
  const pct           = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
  const requiredItems = sections.filter((s) => s.required).flatMap((s) => s.items);
  const allReqDone    = requiredItems.length > 0 && requiredItems.every((item) => !!uploaded[`${selectedId}_${item.id}`]);
  const meta          = selectedAppt ? (SERVICE_META[selectedAppt.service] ?? { accent: COLORS.green, bg: COLORS.lightMint }) : null;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingKeyRef.current) return;
    const key = pendingKeyRef.current;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploaded((p) => ({ ...p, [key]: { name: file.name, preview: ev.target?.result as string } }));
      reader.readAsDataURL(file);
    } else {
      setUploaded((p) => ({ ...p, [key]: { name: file.name, preview: null } }));
    }
    e.target.value = ""; pendingKeyRef.current = null;
  }, []);

  const triggerUpload = (key: string) => { pendingKeyRef.current = key; fileInputRef.current?.click(); };
  const removeFile    = (key: string) => setUploaded((p) => { const n = { ...p }; delete n[key]; return n; });

  const handleSubmit = async () => {
    if (!selectedAppt || !allReqDone) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setSubmitSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err)) setError(err.response?.data?.message ?? "Submission failed.");
      else setError("Submission failed.");
    } finally { setSubmitting(false); }
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.offWhite, gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.75s linear infinite" }} />
        <p style={{ fontSize: 14, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif" }}>Loading your appointments…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform:rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        .doc-row:hover { background: ${COLORS.lightMint} !important; border-color: ${COLORS.green} !important; }
        .icon-btn:hover { background: ${COLORS.green} !important; color: white !important; border-color: ${COLORS.green} !important; }
        .appt-tab:hover { border-color: ${COLORS.green} !important; }
      `}</style>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.dcm" style={{ display: "none" }} onChange={handleFileChange} />

      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 2px 12px rgba(44,62,80,0.06)" }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", backgroundColor: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}>
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} /><div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} /><div style={{ width: 12, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
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
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "upload" ? COLORS.lightMint : "transparent", color: item.id === "upload" ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: item.id === "upload" ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
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
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Patient Portal</div>}
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => router.push(item.path)} title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "upload" ? COLORS.lightMint : "transparent", color: item.id === "upload" ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: item.id === "upload" ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (item.id !== "upload") e.currentTarget.style.backgroundColor = "#F8FFFE"; }}
                onMouseLeave={(e) => { if (item.id !== "upload") e.currentTarget.style.backgroundColor = "transparent"; }}
              ><NavIcon d={item.icon} />{!isTablet && item.label}</button>
            ))}
          </div>
          {!isTablet && (
            <div style={{ padding: 16, borderTop: "1px solid rgba(167,228,216,0.3)" }}>
              <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", backgroundColor: COLORS.green, opacity: 0.15, bottom: -20, right: -20 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 9, color: "rgba(167,228,216,0.7)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Patient Portal</div>
                  <button onClick={() => router.push("/patient/book")} style={{ width: "100%", padding: 8, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>+ New Appointment</button>
                </div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); router.push("/"); }} title={isTablet ? "Sign Out" : undefined}
            style={{ margin: isTablet ? "0 8px 16px" : "0 12px 16px", padding: isTablet ? "12px 0" : "10px", backgroundColor: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}
          >{isTablet ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> : "Sign Out"}</button>
        </div>
      )}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.path)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: item.id === "upload" ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 6px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44 }}>
              <NavIcon d={item.icon} /><span style={{ fontSize: 8, fontWeight: 700, fontFamily: "'Josefin Sans', sans-serif" }}>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0, minWidth: 0 }}>
        <div style={{ padding: isMobile ? "1.25rem 1rem 5rem" : "2rem 1.5rem 5rem" }}>

          {error && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FEECEC", border: "1px solid #F5C4C4", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, color: "#A32D2D" }}>
              <span>{error}</span>
              <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A32D2D", fontSize: 16, padding: 0 }}>✕</button>
            </div>
          )}

          <div style={{ marginBottom: "2rem", animation: "fadeUp 0.4s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 10 }}>Document Upload Portal</p>
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: COLORS.navy, lineHeight: 1.25, marginBottom: 10 }}>Upload your clinical documents</h1>
            <p style={{ fontSize: 14, color: COLORS.navyMid, maxWidth: 460, lineHeight: 1.75 }}>Select an appointment below — each treatment requires specific materials so your doctor can prepare.</p>
          </div>

          {appointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p style={{ fontSize: 15, color: COLORS.navyMid, marginBottom: 20 }}>No upcoming appointments found.</p>
              <button onClick={() => router.push("/patient/book")} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "11px 26px", background: COLORS.navy, color: "white", borderRadius: 10, border: "none", cursor: "pointer" }}>Book an Appointment</button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: "2rem", scrollbarWidth: "none" }}>
                {appointments.map((appt) => {
                  const status  = computeStatus(appt.id, appt.service, uploaded);
                  const isSel   = appt.id === selectedId;
                  const m       = SERVICE_META[appt.service] ?? { accent: COLORS.green, bg: COLORS.lightMint };
                  return (
                    <button key={appt.id} className="appt-tab" onClick={() => { setSelectedId(appt.id); setSubmitSuccess(false); }}
                      style={{ flexShrink: 0, minWidth: isMobile ? 180 : 210, background: isSel ? COLORS.white : "rgba(255,255,255,0.6)", border: isSel ? `1.5px solid ${m.accent}` : `1px solid ${COLORS.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", transition: "all 0.15s", boxShadow: isSel ? "0 4px 18px rgba(0,0,0,0.07)" : "none", touchAction: "manipulation" }}
                    >
                      {isSel && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.accent, borderRadius: "14px 14px 0 0" }} />}
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", background: status === "done" ? m.accent : status === "partial" ? m.bg : COLORS.navyLight, color: status === "done" ? "white" : status === "partial" ? m.accent : COLORS.navyMid }}>
                          {status === "done" ? "Complete" : status === "partial" ? "In progress" : "Not started"}
                        </span>
                      </div>
                      <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>{appt.service}</div>
                      <div style={{ fontSize: 11, color: COLORS.navyMid }}>{getDoctorName(appt)}</div>
                      <div style={{ fontSize: 11, color: COLORS.navyMid }}>{getFormattedDate(appt)}</div>
                    </button>
                  );
                })}
              </div>

              {selectedAppt && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: "1.5rem", alignItems: "start" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", animation: "fadeUp 0.3s ease", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: meta?.accent, textTransform: "uppercase", letterSpacing: "0.14em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 5 }}>Upload Documents</p>
                        <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 19, fontWeight: 700, color: COLORS.navy, marginBottom: 5 }}>{selectedAppt.service}</h2>
                        <p style={{ fontSize: 13, color: COLORS.navyMid }}>{getDoctorName(selectedAppt)} · {getFormattedDate(selectedAppt)}</p>
                      </div>
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <svg width="58" height="58" viewBox="0 0 58 58">
                          <circle cx="29" cy="29" r="23" fill="none" stroke={COLORS.navyLight} strokeWidth="5" />
                          <circle cx="29" cy="29" r="23" fill="none" stroke={meta?.accent ?? COLORS.green} strokeWidth="5"
                            strokeDasharray={`${2 * Math.PI * 23}`} strokeDashoffset={`${2 * Math.PI * 23 * (1 - pct / 100)}`}
                            strokeLinecap="round" transform="rotate(-90 29 29)" style={{ transition: "stroke-dashoffset 0.5s ease" }}
                          />
                          <text x="29" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={COLORS.navy} fontFamily="'Josefin Sans', sans-serif">{pct}%</text>
                        </svg>
                        <span style={{ fontSize: 10, color: COLORS.navyMid }}>{uploadedCount}/{totalCount} files</span>
                      </div>
                    </div>

                    {sections.length === 0 ? (
                      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "3rem", textAlign: "center" }}>
                        <p style={{ color: COLORS.navyMid, fontSize: 14 }}>No documents required for this service.</p>
                      </div>
                    ) : sections.map((section, si) => (
                      <div key={section.section} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden", animation: `fadeUp ${0.3 + si * 0.08}s ease` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.25rem", borderBottom: `1px solid ${COLORS.border}`, background: section.required ? `${section.color}55` : COLORS.offWhite }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: section.color, color: section.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {section.iconType === "xray" ? XrayIcon : section.iconType === "photo" ? ImgIcon : DocIcon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 11, fontWeight: 700, color: COLORS.navy, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{section.section}</div>
                            <div style={{ fontSize: 11, color: COLORS.navyMid }}>{section.desc}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", background: section.required ? "#FEECEC" : COLORS.lightMint, color: section.required ? "#A32D2D" : "#0F6E56", flexShrink: 0 }}>
                            {section.required ? "Required" : "Optional"}
                          </span>
                        </div>
                        <div style={{ padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: 6 }}>
                          {section.items.map((item) => {
                            const key = `${selectedId}_${item.id}`;
                            const file = uploaded[key];
                            const isUploaded = !!file;
                            return (
                              <div key={item.id} className="doc-row" onClick={() => !isUploaded && triggerUpload(key)}
                                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: `1px ${isUploaded ? "solid" : "dashed"} ${isUploaded ? COLORS.green : COLORS.border}`, background: isUploaded ? COLORS.lightMint : "transparent", cursor: isUploaded ? "default" : "pointer", transition: "all 0.12s", flexWrap: isMobile ? "wrap" : "nowrap" }}
                              >
                                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: isUploaded ? (file.preview ? "transparent" : COLORS.lightMint) : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                  {isUploaded && file.preview
                                    ? <img src={file.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : isUploaded ? <span style={{ color: COLORS.green }}>{CheckIcon}</span>
                                    : <span style={{ color: COLORS.navyMid, opacity: 0.4 }}>{DocIcon}</span>
                                  }
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                                  <div style={{ fontSize: 11, color: COLORS.navyMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{isUploaded ? file.name : item.hint}</div>
                                </div>
                                {isUploaded ? (
                                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                    <button className="icon-btn" onClick={(e) => { e.stopPropagation(); triggerUpload(key); }} style={{ fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 20, border: `1px solid ${COLORS.green}`, background: "transparent", cursor: "pointer", color: COLORS.green, fontFamily: "inherit", transition: "all 0.12s" }}>Replace</button>
                                    <button onClick={(e) => { e.stopPropagation(); removeFile(key); }} style={{ fontSize: 11, padding: "4px 8px", borderRadius: 20, border: `1px solid ${COLORS.border}`, background: "transparent", cursor: "pointer", color: COLORS.navyMid, fontFamily: "inherit" }}>✕</button>
                                  </div>
                                ) : (
                                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); triggerUpload(key); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 20, border: `1px solid ${COLORS.border}`, background: "transparent", cursor: "pointer", color: COLORS.navyMid, fontFamily: "inherit", transition: "all 0.12s", flexShrink: 0, touchAction: "manipulation" }}>
                                    {UploadIcon} Upload
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ position: isMobile ? "static" : "sticky", top: 24, display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ padding: "1.1rem 1.25rem", borderBottom: `1px solid ${COLORS.border}`, background: meta?.bg ?? COLORS.lightMint }}>
                        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: meta?.accent ?? COLORS.green, marginBottom: 4 }}>Upload Summary</p>
                        <p style={{ fontSize: 13, color: COLORS.navy, fontWeight: 600 }}>{selectedAppt.service}</p>
                      </div>
                      <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 10 }}>
                        {sections.map((section) => {
                          const done = section.items.filter((item) => !!uploaded[`${selectedId}_${item.id}`]).length;
                          const allDone = done === section.items.length;
                          return (
                            <div key={section.section} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: allDone ? COLORS.green : COLORS.navyLight, color: allDone ? "white" : COLORS.navyMid, transition: "all 0.2s" }}>
                                  {allDone ? CheckIcon : <span style={{ fontSize: 9, fontWeight: 700 }}>{done}</span>}
                                </div>
                                <span style={{ fontSize: 12, color: allDone ? COLORS.navy : COLORS.navyMid }}>{section.section}</span>
                              </div>
                              <span style={{ fontSize: 11, color: COLORS.navyMid }}>{done}/{section.items.length}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ padding: "0 1.25rem 1.1rem" }}>
                        <div style={{ background: COLORS.navyLight, borderRadius: 20, height: 5, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: meta?.accent ?? COLORS.green, borderRadius: 20, transition: "width 0.4s ease" }} />
                        </div>
                        <p style={{ fontSize: 11, color: COLORS.navyMid, marginTop: 6 }}>{uploadedCount} of {totalCount} documents uploaded</p>
                      </div>
                      <div style={{ padding: "0 1.25rem 1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
                        {!allReqDone && requiredItems.length > 0 && (
                          <div style={{ background: "#FEF6E4", border: "1px solid #FAC775", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "#854F0B", lineHeight: 1.55 }}>
                            {requiredItems.filter((i) => !uploaded[`${selectedId}_${i.id}`]).length} required file(s) still needed.
                          </div>
                        )}
                        {submitSuccess ? (
                          <div style={{ background: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#0F6E56", lineHeight: 1.6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 4 }}>{CheckIcon} Submitted successfully</div>
                            Your doctor will review your documents before your appointment.
                          </div>
                        ) : (
                          <button disabled={!allReqDone || submitting} onClick={handleSubmit}
                            style={{ width: "100%", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "13px 0", background: allReqDone && !submitting ? COLORS.navy : COLORS.navyLight, color: allReqDone && !submitting ? "white" : COLORS.navyMid, border: "none", borderRadius: 10, cursor: allReqDone && !submitting ? "pointer" : "not-allowed", transition: "background 0.15s", touchAction: "manipulation" }}>
                            {submitting ? "Submitting…" : allReqDone ? "Submit for Review" : "Upload required files first"}
                          </button>
                        )}
                        {submitSuccess && (
                          <button onClick={() => router.push("/patient/dashboard")} style={{ width: "100%", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "12px 0", background: COLORS.green, color: "white", border: "none", borderRadius: 10, cursor: "pointer", touchAction: "manipulation" }}>Go to Dashboard</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9F8" }}><div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E6F7F2", borderTopColor: "#3EB489", animation: "spin 0.7s linear infinite" }} /></div>}>
      <UploadContent />
    </Suspense>
  );
}