"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { Bell } from "lucide-react";

const COLORS = {
  green: "#3EB489",
  mint: "#A7E4D8",
  white: "#FFFFFF",
  lightMint: "#E6F7F2",
  navy: "#2C3E50",
  navyMid: "rgba(44,62,80,0.5)",
};

interface Appointment {
  id: number;
  patient_name: string;
  service: string;
  datetime: string;
  status: string;
  phone_number?: string;
}

function ToothIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 8c.2 1 1 1 1.5 0L9 17h6l.5 4c.5 1 1.3 1 1.5 0l1-8c.5-1.5 1-3 1-5 0-3-3-6-7-6z" />
    </svg>
  );
}

function MiniCalendar({ appointments, onSelectDate }: { appointments: Appointment[]; onSelectDate: (date: Date | null) => void }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<number>(today.getDate());
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = current.toLocaleString("default", { month: "long" });

  const apptDays = new Set(
    appointments.map((a) => {
      const d = new Date(a.datetime);
      if (d.getFullYear() === year && d.getMonth() === month) return d.getDate();
      return null;
    }).filter(Boolean)
  );

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (d: number) => d === selected && !isToday(d);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.navyMid, letterSpacing: "0.12em", textTransform: "uppercase" }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.navy }}>{monthName}, {today.getDate()}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelected(0); }} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.mint}`, background: "none", cursor: "pointer", fontSize: 13, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelected(0); }} style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.mint}`, background: "none", cursor: "pointer", fontSize: 13, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 4, marginTop: 12 }}>
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: COLORS.navyMid, fontWeight: 700, letterSpacing: "0.06em", paddingBottom: 6 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {days.map((d, i) => (
          <div key={i}
            onClick={() => {
              if (!d) return;
              setSelected(d);
              onSelectDate(new Date(year, month, d));
            }}
            style={{
              textAlign: "center", padding: "5px 0", borderRadius: 7, fontSize: 12,
              fontWeight: d && (isToday(d) || isSelected(d)) ? 900 : 400,
              backgroundColor: d && isToday(d) ? COLORS.green : d && isSelected(d) ? COLORS.navy : "transparent",
              color: d && (isToday(d) || isSelected(d)) ? "white" : d ? COLORS.navy : "transparent",
              cursor: d ? "pointer" : "default", position: "relative", transition: "all 0.15s",
            }}
          >
            {d}
            {d && apptDays.has(d) && !isToday(d) && !isSelected(d) && (
              <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", backgroundColor: COLORS.green }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentChart({ appointments }: { appointments: Appointment[] }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const counts = Array(12).fill(0);
  appointments.forEach((a) => { const m = new Date(a.datetime).getMonth(); counts[m]++; });
  const max = Math.max(...counts, 1);
  const thisYear = new Date().getFullYear();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.navy }}>Appointments</div>
          <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 2 }}>{appointments.length} appointments this year</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.green }} />
          <span style={{ fontSize: 11, color: COLORS.navyMid }}>{thisYear}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
        {counts.map((c, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(c / max) * 64}px` }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [notes, setNotes] = useState(["Review patient X-rays", "Confirm tomorrow's schedule", "Update treatment notes"]);
  const [newNote, setNewNote] = useState("");
  const [checkedNotes, setCheckedNotes] = useState<number[]>([]);
  const [photoModal, setPhotoModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const filteredAppointments = selectedDate
    ? appointments.filter((a) => {
        const d = new Date(a.datetime);
        return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
      })
    : [];

  useEffect(() => {
    api.get("/doctor/appointments")                          // ← doctor endpoint
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    const saved = localStorage.getItem("doctor_photo");     // ← doctor key
    setTimeout(() => { if (saved) setPhotoUrl(saved); }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const savePhoto = (url: string) => { setPhotoUrl(url); localStorage.setItem("doctor_photo", url); };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please upload a valid image"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setPhotoUrl(null);
      setTimeout(() => { setPhotoUrl(url); localStorage.setItem("doctor_photo", url); }, 50);
      e.target.value = "";
      setTimeout(() => closePhotoModal(), 500);
    };
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
  };

  const closePhotoModal = () => {
    setPhotoModal(false); setCameraActive(false); setCameraError("");
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  };

  const removePhoto = () => { setPhotoUrl(null); localStorage.removeItem("doctor_photo"); closePhotoModal(); };

  const formatDateTime = (datetime: string) => {
    const d = new Date(datetime);
    return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "scheduled":
      case "confirmed":  return { bg: "rgba(62,180,137,0.1)",  color: COLORS.green, border: `1px solid ${COLORS.mint}` };
      case "pending":    return { bg: "rgba(245,158,11,0.1)",  color: "#d97706",    border: "1px solid rgba(245,158,11,0.3)" };
      case "cancelled":  return { bg: "rgba(224,85,85,0.08)",  color: "#e05555",    border: "1px solid rgba(224,85,85,0.3)" };
      case "completed":  return { bg: "rgba(62,180,137,0.08)", color: COLORS.green, border: `1px solid ${COLORS.mint}` };
      default:           return { bg: COLORS.lightMint, color: COLORS.navyMid, border: `1px solid ${COLORS.mint}` };
    }
  };

  const initials = user?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const todayStr     = new Date().toDateString();
  const todayAppts   = appointments.filter((a) => new Date(a.datetime).toDateString() === todayStr);
  const pendingAppts = appointments.filter((a) => a.status === "pending");
  const upcoming     = appointments.filter((a) => new Date(a.datetime) > new Date() && a.status !== "cancelled");

  // ── Photo Modal (identical to patient) ────────────────────────────────
  const PhotoModal = (
    <AnimatePresence>
      {photoModal && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePhotoModal}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.5)", zIndex: 1000, backdropFilter: "blur(4px)" }}
          />
          <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: "32px", width: 360, boxShadow: "0 24px 60px rgba(44,62,80,0.2)", pointerEvents: "all", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: COLORS.navy }}>Profile Photo</h3>
                <button onClick={closePhotoModal} style={{ background: "none", border: "none", fontSize: 22, color: COLORS.navyMid, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
                <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.lightMint, border: `3px solid ${COLORS.mint}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: COLORS.green, marginBottom: 10, flexShrink: 0 }}>
                  {photoUrl ? <img key={photoUrl} src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials}
                </div>
                <span style={{ fontSize: 12, color: COLORS.navyMid }}>{user?.full_name}</span>
              </div>
              {cameraActive && (
                <div style={{ marginBottom: 16 }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, backgroundColor: "#000" }} />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={takePhoto}
                    style={{ width: "100%", marginTop: 10, padding: "12px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.1em" }}
                  >Take Photo</motion.button>
                  <button onClick={() => { setCameraActive(false); if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } }}
                    style={{ width: "100%", marginTop: 8, padding: "10px", backgroundColor: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.mint}`, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >Cancel Camera</button>
                </div>
              )}
              {cameraError && <div style={{ padding: "10px 14px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 12, marginBottom: 16 }}>{cameraError}</div>}
              {!cameraActive && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ padding: "13px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.08em" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload from Device
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCamera}
                    style={{ padding: "13px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: "0.08em" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Take Photo with Camera
                  </motion.button>
                  {photoUrl && (
                    <button onClick={removePhoto} style={{ padding: "11px", backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em" }}>Remove Photo</button>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp,image/svg+xml" style={{ display: "none" }} onChange={handleFileUpload} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: COLORS.lightMint, fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: "60px 48px", textAlign: "center", maxWidth: 420, boxShadow: "0 8px 40px rgba(62,180,137,0.1)", border: `1px solid ${COLORS.mint}` }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 900, color: COLORS.navy, marginBottom: 12 }}>Access Restricted</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid, lineHeight: 1.7, marginBottom: 32 }}>Sign in to view your dashboard.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push("/auth/login")}
              style={{ width: "100%", padding: "14px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}
            >Sign In</motion.button>
            <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 11, color: COLORS.navyMid, cursor: "pointer", fontFamily: "inherit" }}>← Back to Home</button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ── Doctor nav ─────────────────────────────────────────────────────────
  const navItems = [
    { id: "home",         label: "Home",         path: "/",                    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
    { id: "dashboard",    label: "Dashboard",    path: "/doctor/dashboard",    icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
    { id: "appointments", label: "Appointments", path: "/doctor/appointments", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
    { id: "patients",     label: "Patients",     path: "/doctor/patients",     icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
    { id: "profile",      label: "Profile",   path: "/doctor/profile",      icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  ];

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#F4F7FA", fontFamily: "'Josefin Sans', sans-serif", display: "flex" }}>
      {PhotoModal}

      {/* ── LEFT SIDEBAR ── */}
      <div style={{ width: 220, backgroundColor: COLORS.white, borderRight: "1px solid rgba(167,228,216,0.3)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, boxShadow: "2px 0 20px rgba(44,62,80,0.04)" }}>
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(167,228,216,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white" }}>D</div>
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
          </div>
        </div>

        <div style={{ padding: "20px 12px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Doctor Portal</div>
          {navItems.map((item) => (
            <button key={item.id}
              onClick={() => { setActiveNav(item.id); router.push(item.path); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (activeNav !== item.id) e.currentTarget.style.backgroundColor = "#F8FFFE"; }}
              onMouseLeave={(e) => { if (activeNav !== item.id) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </div>

        {/* Promo card */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(167,228,216,0.3)" }}>
          <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: "16px", position: "relative", overflow: "hidden" }}>
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ repeat: Infinity, duration: 5 }}
              style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -20, right: -20, pointerEvents: "none" }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 9, color: "rgba(167,228,216,0.7)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Your Schedule.</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 12, lineHeight: 1.5 }}>{todayAppts.length} appointment{todayAppts.length !== 1 ? "s" : ""} today.</div>
              <button onClick={() => router.push("/doctor/appointments")}
                style={{ width: "100%", padding: "8px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}
              >View All →</button>
            </div>
          </div>
        </div>

        <button onClick={logout} style={{ margin: "0 12px 16px", padding: "10px", backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>
          Sign Out
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: 220, flex: 1, display: "flex", minHeight: "100vh" }}>
        <div style={{ flex: 1, padding: "28px 24px", overflowY: "auto" }}>

          {/* Top bar */}
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
                <button onClick={() => setPhotoModal(true)} style={{ background: "none", border: "none", fontSize: 9, color: COLORS.green, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Change photo</button>
              </div>
              <div
                onClick={() => router.push("/doctor/appointments")}
                style={{ position: "relative", cursor: "pointer", display: "flex", alignItems: "center", transition: "transform 0.2s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Bell size={22} color="#3EB489" />
                {pendingAppts.length > 0 && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, backgroundColor: "red", borderRadius: "50%" }} />
                )}
              </div>
            </div>
          </div>

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: "24px", marginBottom: 20, boxShadow: "0 2px 16px rgba(44,62,80,0.05)", border: "1px solid rgba(167,228,216,0.2)" }}
          >
            {loading ? <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMid, fontSize: 13 }}>Loading...</div> : <AppointmentChart appointments={appointments} />}
          </motion.div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Total Appointments", value: loading ? "—" : appointments.length, color: COLORS.navy,  bg: COLORS.lightMint,          icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.navy}  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
              { label: "Today",              value: loading ? "—" : todayAppts.length,   color: COLORS.green, bg: "rgba(62,180,137,0.1)",     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 8c.2 1 1 1 1.5 0L9 17h6l.5 4c.5 1 1.3 1 1.5 0l1-8c.5-1.5 1-3 1-5 0-3-3-6-7-6z"/></svg> },
              { label: "Pending",            value: loading ? "—" : pendingAppts.length, color: "#d97706",    bg: "rgba(245,158,11,0.1)",     icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706"    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: "24px", border: "1px solid rgba(167,228,216,0.3)", boxShadow: "0 2px 16px rgba(62,180,137,0.06)" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{stat.icon}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: 8 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: COLORS.navyMid, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Notes + Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: "20px", border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)" }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy, marginBottom: 16 }}>Notes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                {notes.map((note, i) => (
                  <div key={i} onClick={() => setCheckedNotes(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${checkedNotes.includes(i) ? COLORS.green : COLORS.mint}`, backgroundColor: checkedNotes.includes(i) ? COLORS.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                      {checkedNotes.includes(i) && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <span style={{ fontSize: 12, color: checkedNotes.includes(i) ? COLORS.navyMid : COLORS.navy, textDecoration: checkedNotes.includes(i) ? "line-through" : "none", transition: "all 0.2s" }}>{note}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={newNote} onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && newNote.trim()) { setNotes(prev => [...prev, newNote.trim()]); setNewNote(""); } }}
                  placeholder="Add a note..."
                  style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.mint}`, fontSize: 12, color: COLORS.navy, fontFamily: "inherit", outline: "none", backgroundColor: COLORS.lightMint }}
                />
                <button onClick={() => { if (newNote.trim()) { setNotes(prev => [...prev, newNote.trim()]); setNewNote(""); } }}
                  style={{ padding: "8px 14px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+</button>
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
                ].map((action) => (
                  <button key={action.label} onClick={() => router.push(action.path)}
                    style={{ padding: "10px 14px", backgroundColor: "transparent", border: "1px solid rgba(167,228,216,0.4)", borderRadius: 10, fontSize: 12, fontWeight: 700, color: action.color, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = COLORS.lightMint; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                  >{action.label} →</button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: 280, backgroundColor: COLORS.white, borderLeft: "1px solid rgba(167,228,216,0.3)", padding: "28px 20px", overflowY: "auto", boxShadow: "-2px 0 20px rgba(44,62,80,0.03)" }}>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 24 }}>
            <MiniCalendar appointments={appointments} onSelectDate={setSelectedDate} />
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
                {selectedDate ? `Appointments on ${selectedDate.toDateString()}` : "Select a date"}
              </div>
              {selectedDate && filteredAppointments.length === 0 && <div style={{ fontSize: 12, color: COLORS.navyMid }}>No appointments on this day</div>}
              {filteredAppointments.map((apt) => {
                const { time } = formatDateTime(apt.datetime);
                return (
                  <div key={apt.id} style={{ padding: "10px", borderRadius: 10, backgroundColor: COLORS.lightMint, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{apt.patient_name}</div>
                    <div style={{ fontSize: 11, color: COLORS.navyMid }}>{apt.service} · {time}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Upcoming</div>
            {loading ? <div style={{ fontSize: 12, color: COLORS.navyMid, padding: "12px 0" }}>Loading...</div>
              : upcoming.length === 0 ? <div style={{ fontSize: 12, color: COLORS.navyMid, padding: "12px 0" }}>No upcoming appointments</div>
              : upcoming.slice(0, 3).map((apt) => {
                  const { date, time } = formatDateTime(apt.datetime);
                  return (
                    <motion.div key={apt.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      style={{ backgroundColor: COLORS.lightMint, borderRadius: 14, padding: "14px", marginBottom: 10, border: `1px solid ${COLORS.mint}` }}
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

          {/* Recent */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy }}>Recent</div>
              <button onClick={() => router.push("/doctor/appointments")} style={{ fontSize: 10, color: COLORS.green, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.08em" }}>See more</button>
            </div>
            <div style={{ fontSize: 11, color: COLORS.navyMid, marginBottom: 12 }}>All recent appointments</div>
            {loading ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div> : appointments.slice(0, 4).map((apt) => {
              const s = getStatusStyle(apt.status);
              const { date } = formatDateTime(apt.datetime);
              return (
                <div key={apt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(167,228,216,0.3)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><ToothIcon size={14} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.patient_name}</div>
                    <div style={{ fontSize: 10, color: COLORS.navyMid }}>{apt.service} · {date}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999, backgroundColor: s.bg, color: s.color, border: s.border, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{apt.status}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Doctor info card */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
            style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: "18px", marginTop: 20, position: "relative", overflow: "hidden" }}
          >
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.16, 0.08] }} transition={{ repeat: Infinity, duration: 6 }}
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
              style={{ width: "100%", marginTop: 14, padding: "9px", backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", position: "relative", zIndex: 1 }}
            >View Profile →</button>
          </motion.div>
        </div>
      </div>
    </main>
  );
}