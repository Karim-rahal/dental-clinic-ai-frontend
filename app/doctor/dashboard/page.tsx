"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Bell } from "lucide-react";

const COLORS = {
  green:    "#3EB489",
  mint:     "#A7E4D8",
  white:    "#FFFFFF",
  lightMint:"#E6F7F2",
  navy:     "#2C3E50",
  navyMid:  "rgba(44,62,80,0.5)",
  border:   "rgba(44,62,80,0.10)",
  offWhite: "#F4F7FA",
};

interface Appointment {
  id: number;
  patient_name: string;
  service: string;
  datetime: string;
  status: string;
  phone_number?: string;
}

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
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function ToothIcon({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 8c.2 1 1 1 1.5 0L9 17h6l.5 4c.5 1 1.3 1 1.5 0l1-8c.5-1.5 1-3 1-5 0-3-3-6-7-6z" /></svg>;
}

function MiniCalendar({ appointments, onSelectDate }: { appointments: Appointment[]; onSelectDate: (d: Date | null) => void }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<number>(today.getDate());
  const year = current.getFullYear(), month = current.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleString("default", { month: "long" });
  const apptDays = new Set(appointments.map((a) => { const d = new Date(a.datetime); return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null; }).filter(Boolean));
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSel = (d: number) => d === selected && !isToday(d);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.navyMid, letterSpacing: "0.12em", textTransform: "uppercase" }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.navy }}>{monthName}, {today.getDate()}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelected(0); }} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.mint}`, background: "none", cursor: "pointer", fontSize: 13, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>‹</button>
          <button onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelected(0); }} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.mint}`, background: "none", cursor: "pointer", fontSize: 13, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>›</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4, marginTop: 12 }}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 9, color: COLORS.navyMid, fontWeight: 700, paddingBottom: 6 }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => (
          <div key={i} onClick={() => { if (!d) return; setSelected(d); onSelectDate(new Date(year, month, d)); }}
            style={{ textAlign: "center", padding: "5px 0", borderRadius: 7, fontSize: 12, fontWeight: d && (isToday(d) || isSel(d)) ? 900 : 400, backgroundColor: d && isToday(d) ? COLORS.green : d && isSel(d) ? COLORS.navy : "transparent", color: d && (isToday(d) || isSel(d)) ? "white" : d ? COLORS.navy : "transparent", cursor: d ? "pointer" : "default", position: "relative", transition: "all 0.15s", touchAction: "manipulation" }}
          >
            {d}
            {d && apptDays.has(d) && !isToday(d) && !isSel(d) && <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", backgroundColor: COLORS.green }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentChart({ appointments }: { appointments: Appointment[] }) {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const counts = Array(12).fill(0);
  appointments.forEach((a) => { counts[new Date(a.datetime).getMonth()]++; });
  const max = Math.max(...counts, 1);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.navy }}>Appointments</div>
          <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 2 }}>{appointments.length} this year</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.green }} />
          <span style={{ fontSize: 11, color: COLORS.navyMid }}>{new Date().getFullYear()}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
        {counts.map((c, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div initial={{ height: 0 }} animate={{ height: `${(c / max) * 64}px` }} transition={{ delay: i * 0.04, duration: 0.4 }}
              style={{ width: "100%", borderRadius: 4, backgroundColor: i === new Date().getMonth() ? COLORS.green : COLORS.lightMint, minHeight: 4 }}
            />
            <div style={{ fontSize: 8, color: COLORS.navyMid }}>{months[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isMobile, isTablet } = useBreakpoint();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
 const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeNav,    setActiveNav]    = useState("dashboard");
  const [notes,        setNotes]        = useState(["Review patient X-rays", "Confirm tomorrow's schedule", "Update treatment notes"]);
  const [newNote,      setNewNote]      = useState("");
  const [checkedNotes, setCheckedNotes] = useState<number[]>([]);
  const [photoModal,   setPhotoModal]   = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  const sidebarWidth = isTablet ? 64 : 220;

  const filteredAppts = selectedDate
    ? appointments.filter((a) => { const d = new Date(a.datetime); return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear(); })
    : [];

  useEffect(() => {
    api.get("/doctor/appointments").then((r) => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
  if (!user?.id) return;
  const saved = localStorage.getItem(`photo_${user.id}`);
  setTimeout(() => setPhotoUrl(saved), 0);
}, [user?.id]);

 const savePhoto = (url: string) => { setPhotoUrl(url); localStorage.setItem(`photo_${user?.id}`, url); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => { savePhoto(reader.result as string); e.target.value = ""; setTimeout(closePhotoModal, 500); };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setCameraError(""); setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCameraError("Camera access denied."); setCameraActive(false); }
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    savePhoto(canvas.toDataURL("image/jpeg"));
    closePhotoModal();
  };

  const closePhotoModal = () => {
    setPhotoModal(false); setCameraActive(false); setCameraError("");
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null;
  };

 const removePhoto = () => { setPhotoUrl(null); localStorage.removeItem(`photo_${user?.id}`); closePhotoModal(); };

  const fmt = (dt: string) => {
    const d = new Date(dt);
    return { date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) };
  };

  const getStatusStyle = (status: string) => {
    if (status === "confirmed" || status === "scheduled") return { bg: "rgba(62,180,137,0.1)", color: COLORS.green, border: `1px solid ${COLORS.mint}` };
    if (status === "pending")   return { bg: "rgba(245,158,11,0.1)",  color: "#d97706",    border: "1px solid rgba(245,158,11,0.3)" };
    if (status === "cancelled") return { bg: "rgba(224,85,85,0.08)",  color: "#e05555",    border: "1px solid rgba(224,85,85,0.3)" };
    if (status === "completed") return { bg: "rgba(62,180,137,0.08)", color: COLORS.green, border: `1px solid ${COLORS.mint}` };
    return { bg: COLORS.lightMint, color: COLORS.navyMid, border: `1px solid ${COLORS.mint}` };
  };

  const initials  = user?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const todayStr  = new Date().toDateString();
  const todayAppts   = appointments.filter((a) => new Date(a.datetime).toDateString() === todayStr);
  const pendingAppts = appointments.filter((a) => a.status === "pending");
  const upcoming     = appointments.filter((a) => new Date(a.datetime) > new Date() && a.status !== "cancelled");

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: COLORS.lightMint, fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: "48px 32px", textAlign: "center", maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(62,180,137,0.1)", border: `1px solid ${COLORS.mint}` }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 900, color: COLORS.navy, marginBottom: 12 }}>Access Restricted</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid, lineHeight: 1.7, marginBottom: 32 }}>Sign in to view your dashboard.</p>
          <button onClick={() => router.push("/auth/login")} style={{ width: "100%", padding: "14px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, color: COLORS.navyMid, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>← Back to Home</button>
        </motion.div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: COLORS.offWhite, fontFamily: "'Josefin Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes slideIn { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>

      {/* Photo Modal */}
      <AnimatePresence>
        {photoModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePhotoModal}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.5)", zIndex: 1000, backdropFilter: "blur(4px)" }}
            />
            <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: 16 }}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 24px 60px rgba(44,62,80,0.2)", pointerEvents: "all", maxHeight: "90vh", overflowY: "auto" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: COLORS.navy }}>Profile Photo</h3>
                  <button onClick={closePhotoModal} style={{ background: "none", border: "none", fontSize: 24, color: COLORS.navyMid, cursor: "pointer", padding: "4px 8px" }}>×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
                  <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.lightMint, border: `3px solid ${COLORS.mint}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: COLORS.green, marginBottom: 10 }}>
                    {photoUrl ? <img key={photoUrl} src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.navyMid }}>{user?.full_name}</span>
                </div>
                {cameraActive && (
                  <div style={{ marginBottom: 16 }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, backgroundColor: "#000" }} />
                    <button onClick={takePhoto} style={{ width: "100%", marginTop: 10, padding: 14, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>Take Photo</button>
                    <button onClick={() => { setCameraActive(false); streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; }}
                      style={{ width: "100%", marginTop: 8, padding: 12, backgroundColor: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.mint}`, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancel Camera</button>
                  </div>
                )}
                {cameraError && <div style={{ padding: "10px 14px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 12, marginBottom: 16 }}>{cameraError}</div>}
                {!cameraActive && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      style={{ padding: 14, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload from Device
                    </button>
                    <button onClick={openCamera} style={{ padding: 14, backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Take Photo with Camera
                    </button>
                    {photoUrl && <button onClick={removePhoto} style={{ padding: 12, backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>Remove Photo</button>}
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Top Bar */}
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 2px 12px rgba(44,62,80,0.06)" }}>
          <button onClick={() => setMobileMenuOpen((v) => !v)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", backgroundColor: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}>
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 12, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.15em", color: COLORS.navy }}>DentAI</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => router.push("/doctor/appointments")} style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={20} color={COLORS.green} />
              {pendingAppts.length > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, backgroundColor: "red", borderRadius: "50%" }} />}
            </div>
            <div onClick={() => setPhotoModal(true)} style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.mint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: COLORS.green, cursor: "pointer", touchAction: "manipulation" }}>
              {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.4)", zIndex: 55, top: 56 }}
            />
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              style={{ position: "fixed", top: 56, left: 0, right: 0, backgroundColor: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)" }}
            >
              {NAV_ITEMS.map((item) => (
                <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); setMobileMenuOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
                ><NavIcon d={item.icon} />{item.label}</button>
              ))}
              <div style={{ borderTop: `1px solid ${COLORS.mint}`, marginTop: 8, paddingTop: 8 }}>
                <button onClick={() => { logout(); router.push("/"); }} style={{ width: "100%", padding: "12px 14px", backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Sign Out</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop/Tablet Sidebar */}
      {!isMobile && (
        <div style={{ width: sidebarWidth, backgroundColor: COLORS.white, borderRight: "1px solid rgba(167,228,216,0.3)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, boxShadow: "2px 0 20px rgba(44,62,80,0.04)", transition: "width 0.2s ease", overflow: "hidden" }}>
          <div style={{ padding: isTablet ? "24px 0" : "24px 20px 20px", borderBottom: "1px solid rgba(167,228,216,0.3)", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white", flexShrink: 0 }}>D</div>
            {!isTablet && <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>}
          </div>
          <div style={{ padding: isTablet ? "20px 8px" : "20px 12px", flex: 1, overflowY: "auto" }}>
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Doctor Portal</div>}
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); }} title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (activeNav !== item.id) e.currentTarget.style.backgroundColor = "#F8FFFE"; }}
                onMouseLeave={(e) => { if (activeNav !== item.id) e.currentTarget.style.backgroundColor = "transparent"; }}
              ><NavIcon d={item.icon} />{!isTablet && item.label}</button>
            ))}
          </div>
          {!isTablet && (
            <div style={{ padding: 16, borderTop: "1px solid rgba(167,228,216,0.3)" }}>
              <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
                <motion.div animate={{ scale: [1,1.1,1], opacity: [0.1,0.2,0.1] }} transition={{ repeat: Infinity, duration: 5 }}
                  style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -20, right: -20, pointerEvents: "none" }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 9, color: "rgba(167,228,216,0.7)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Your Schedule.</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 12, lineHeight: 1.5 }}>{todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""} today.</div>
                  <button onClick={() => router.push("/doctor/appointments")} style={{ width: "100%", padding: 8, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>View All →</button>
                </div>
              </div>
            </div>
          )}
          <button onClick={logout} title={isTablet ? "Sign Out" : undefined}
            style={{ margin: isTablet ? "0 8px 16px" : "0 12px 16px", padding: isTablet ? "12px 0" : "10px", backgroundColor: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isTablet ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> : "Sign Out"}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, display: "flex", minHeight: "100vh", paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0 }}>
        <div style={{ flex: 1, padding: isMobile ? "20px 16px" : "28px 24px", overflowY: "auto" }}>

          {/* Desktop Top Bar */}
          {!isMobile && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Doctor Portal</div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: COLORS.navy }}>Dashboard</h1>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <motion.div whileHover={{ scale: 1.05 }} onClick={() => setPhotoModal(true)}
                    style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.mint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: COLORS.green, cursor: "pointer", border: `2px solid ${COLORS.mint}` }}
                  >
                    {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                  </motion.div>
                  <button onClick={() => setPhotoModal(true)} style={{ background: "none", border: "none", fontSize: 9, color: COLORS.green, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, whiteSpace: "nowrap" }}>Change photo</button>
                </div>
                <div onClick={() => router.push("/doctor/appointments")} style={{ position: "relative", cursor: "pointer" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Bell size={22} color={COLORS.green} />
                  {pendingAppts.length > 0 && <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, backgroundColor: "red", borderRadius: "50%" }} />}
                </div>
              </div>
            </div>
          )}

          {/* Mobile heading */}
          {isMobile && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 11, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Doctor Portal</div><h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.navy }}>Dashboard</h1></div>}

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: isMobile ? 16 : 24, marginBottom: 16, boxShadow: "0 2px 16px rgba(44,62,80,0.05)", border: "1px solid rgba(167,228,216,0.2)" }}
          >
            {loading ? <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMid, fontSize: 13 }}>Loading...</div> : <AppointmentChart appointments={appointments} />}
          </motion.div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Total",   value: appointments.length, color: COLORS.navy,  bg: COLORS.lightMint,         icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
              { label: "Today",   value: todayAppts.length,   color: COLORS.green, bg: "rgba(62,180,137,0.1)",   icon: "M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 8c.2 1 1 1 1.5 0L9 17h6l.5 4c.5 1 1.3 1 1.5 0l1-8c.5-1.5 1-3 1-5 0-3-3-6-7-6z" },
              { label: "Pending", value: pendingAppts.length, color: "#d97706",    bg: "rgba(245,158,11,0.1)",   icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0M12 7v5l3 3" },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: isMobile ? 14 : 20, border: "1px solid rgba(167,228,216,0.3)", boxShadow: "0 2px 16px rgba(62,180,137,0.06)" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round"><path d={s.icon} /></svg>
                </div>
                <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>{loading ? "—" : s.value}</div>
                <div style={{ fontSize: 9, color: COLORS.navyMid, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Notes + Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: "20px", border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)" }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy, marginBottom: 16 }}>Notes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {notes.map((note, i) => (
                  <div key={i} onClick={() => setCheckedNotes((p) => p.includes(i) ? p.filter((x) => x !== i) : [...p, i])} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", touchAction: "manipulation" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${checkedNotes.includes(i) ? COLORS.green : COLORS.mint}`, backgroundColor: checkedNotes.includes(i) ? COLORS.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      {checkedNotes.includes(i) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize: 12, color: checkedNotes.includes(i) ? COLORS.navyMid : COLORS.navy, textDecoration: checkedNotes.includes(i) ? "line-through" : "none", transition: "all 0.2s" }}>{note}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newNote.trim()) { setNotes((p) => [...p, newNote.trim()]); setNewNote(""); } }}
                  placeholder="Add a note..." style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.mint}`, fontSize: 12, color: COLORS.navy, fontFamily: "inherit", outline: "none", backgroundColor: COLORS.lightMint }}
                />
                <button onClick={() => { if (newNote.trim()) { setNotes((p) => [...p, newNote.trim()]); setNewNote(""); } }}
                  style={{ padding: "8px 14px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>+</button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: "20px", border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)" }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy, marginBottom: 16 }}>Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "View All Appointments", path: "/doctor/appointments", color: COLORS.green },
                  { label: "Patient Records",        path: "/doctor/patients",     color: COLORS.navy },
                  { label: "My Profile",             path: "/doctor/profile",      color: "#6366f1" },
                ].map((a) => (
                  <button key={a.label} onClick={() => router.push(a.path)}
                    style={{ padding: "10px 14px", backgroundColor: "transparent", border: "1px solid rgba(167,228,216,0.4)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: a.color, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s", touchAction: "manipulation" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.lightMint)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >{a.label} →</button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Mobile Calendar (inline) */}
          {isMobile && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 16, border: "1px solid rgba(167,228,216,0.25)", marginTop: 14 }}
            >
              <MiniCalendar appointments={appointments} onSelectDate={setSelectedDate} />
              {selectedDate && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, marginBottom: 8 }}>{selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                  {filteredAppts.length === 0
                    ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>No appointments</div>
                    : filteredAppts.map((a) => { const { time } = fmt(a.datetime); return (
                        <div key={a.id} style={{ padding: 10, borderRadius: 10, backgroundColor: COLORS.lightMint, marginBottom: 8, border: `1px solid ${COLORS.mint}` }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{a.patient_name}</div>
                          <div style={{ fontSize: 10, color: COLORS.navyMid }}>{a.service} · {time}</div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Desktop Right Panel */}
        {!isMobile && (
          <div style={{ width: 280, backgroundColor: COLORS.white, borderLeft: "1px solid rgba(167,228,216,0.3)", padding: "28px 20px", overflowY: "auto", boxShadow: "-2px 0 20px rgba(44,62,80,0.03)", flexShrink: 0 }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 24 }}>
              <MiniCalendar appointments={appointments} onSelectDate={setSelectedDate} />
              {selectedDate && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, marginBottom: 8 }}>{selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                  {filteredAppts.length === 0
                    ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>No appointments</div>
                    : filteredAppts.map((a) => { const { time } = fmt(a.datetime); return (
                        <div key={a.id} style={{ padding: 10, borderRadius: 10, backgroundColor: COLORS.lightMint, marginBottom: 8, border: `1px solid ${COLORS.mint}` }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{a.patient_name}</div>
                          <div style={{ fontSize: 10, color: COLORS.navyMid }}>{a.service} · {time}</div>
                        </div>
                      );
                    })
                  }
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Upcoming</div>
              {loading ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div>
                : upcoming.length === 0 ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>No upcoming appointments</div>
                : upcoming.slice(0, 3).map((apt) => {
                    const { date, time } = fmt(apt.datetime);
                    return (
                      <motion.div key={apt.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                        style={{ backgroundColor: COLORS.lightMint, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${COLORS.mint}` }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "white", flexShrink: 0 }}><ToothIcon size={16} /></div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{apt.patient_name}</div>
                            <div style={{ fontSize: 10, color: COLORS.navyMid }}>{apt.service}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 11, color: COLORS.navyMid }}>{date}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.green }}>{time}</span>
                        </div>
                      </motion.div>
                    );
                  })
              }
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy }}>Recent</div>
                <button onClick={() => router.push("/doctor/appointments")} style={{ fontSize: 10, color: COLORS.green, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>See more</button>
              </div>
              {loading ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div>
                : appointments.slice(0, 4).map((apt) => {
                    const s = getStatusStyle(apt.status);
                    const { date } = fmt(apt.datetime);
                    return (
                      <div key={apt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(167,228,216,0.3)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ToothIcon size={14} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.patient_name}</div>
                          <div style={{ fontSize: 10, color: COLORS.navyMid }}>{apt.service} · {date}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999, backgroundColor: s.bg, color: s.color, border: s.border, textTransform: "uppercase", whiteSpace: "nowrap" }}>{apt.status}</span>
                      </div>
                    );
                  })
              }
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 18, marginTop: 20, position: "relative", overflow: "hidden" }}
            >
              <motion.div animate={{ scale: [1,1.1,1], opacity: [0.08,0.16,0.08] }} transition={{ repeat: Infinity, duration: 6 }}
                style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -30, right: -20, pointerEvents: "none" }}
              />
              <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 12, alignItems: "center" }}>
                <div onClick={() => setPhotoModal(true)} style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "white", cursor: "pointer", flexShrink: 0, border: "2px solid rgba(167,228,216,0.3)" }}>
                  {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "white" }}>Dr. {user?.full_name}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{user?.email}</div>
                  {user?.phone_number && <div style={{ fontSize: 10, color: "rgba(167,228,216,0.7)", marginTop: 2 }}>{user.phone_number}</div>}
                </div>
              </div>
              <button onClick={() => router.push("/doctor/profile")}
                style={{ width: "100%", marginTop: 14, padding: 9, backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", position: "relative", zIndex: 1 }}
              >View Profile →</button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 6px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44 }}
            >
              <NavIcon d={item.icon} />
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.04em" }}>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}