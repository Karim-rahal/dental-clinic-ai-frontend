"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import api from "@/lib/api";

const COLORS = {
  green:    "#3EB489",
  mint:     "#A7E4D8",
  white:    "#FFFFFF",
  lightMint:"#E6F7F2",
  navy:     "#2C3E50",
  navyMid:  "rgba(44,62,80,0.5)",
};

interface Stats {
  total_patients:         number;
  appointments_today:     number;
  pending_callbacks:      number;
  missed_calls_today:     number;
  calls_today:            number;
  completed_appointments: number;
}
interface Appointment {
  id: number; patient_name: string; service: string;
  datetime: string; status: string; doctor_name: string;
}
interface CallLog {
  id: number; caller_name: string; phone: string;
  direction: "inbound" | "outbound"; duration: string;
  status: "completed" | "missed" | "voicemail"; created_at: string;
}
interface Callback {
  id: number; patient_name: string; phone: string;
  priority: "urgent" | "normal" | "low";
  status: "pending" | "called" | "completed" | "failed";
  scheduled_for: string; reason: string;
}
interface Activity {
  id: number; type: "appointment" | "call" | "callback" | "patient";
  message: string; created_at: string;
}
interface AdminUser {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

const NAV = [
    { id: "home",         label: "Home",         path: "/",                    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dashboard",    label: "Dashboard",    path: "/admin/dashboard",    d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { id: "appointments", label: "Appointments", path: "/admin/appointments", d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "call-logs",    label: "Call Logs",    path: "/admin/call-logs",    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" },
  { id: "callbacks",    label: "Callbacks",    path: "/admin/callbacks",    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92zM17 1l4 4-4 4M21 5H11" },
  { id: "settings",     label: "Settings",     path: "/admin/settings",     d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
];

function formatDT(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}
function apptStatusStyle(status: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    confirmed: { bg: "rgba(62,180,137,0.1)",  color: COLORS.green, border: `1px solid ${COLORS.mint}` },
    scheduled: { bg: "rgba(62,180,137,0.1)",  color: COLORS.green, border: `1px solid ${COLORS.mint}` },
    pending:   { bg: "rgba(245,158,11,0.1)",  color: "#d97706",    border: "1px solid rgba(245,158,11,0.3)" },
    cancelled: { bg: "rgba(224,85,85,0.08)",  color: "#e05555",    border: "1px solid rgba(224,85,85,0.3)" },
    completed: { bg: "rgba(62,180,137,0.08)", color: COLORS.green, border: `1px solid ${COLORS.mint}` },
  };
  return map[status] ?? { bg: COLORS.lightMint, color: COLORS.navyMid, border: `1px solid ${COLORS.mint}` };
}
function callbackPriorityColor(p: string) {
  return p === "urgent" ? "#EF4444" : p === "normal" ? "#F59E0B" : COLORS.green;
}

function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isLaptop: width >= 1024,
    width,
  };
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function MiniCalendar({ appointments, onSelectDate }: {
  appointments: Appointment[];
  onSelectDate: (d: Date | null) => void;
}) {
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
      return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
    }).filter(Boolean) as number[]
  );

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const isToday    = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isSelected = (d: number) => d === selected && !isToday(d);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <div>
          <div style={{ fontSize: 10, color: COLORS.navyMid, letterSpacing: "0.12em", textTransform: "uppercase" }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.navy }}>{monthName}, {today.getDate()}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setCurrent(new Date(year, month - 1, 1)); setSelected(0); }}
            style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${COLORS.mint}`, background: "none", cursor: "pointer", fontSize: 16, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>‹</button>
          <button onClick={() => { setCurrent(new Date(year, month + 1, 1)); setSelected(0); }}
            style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${COLORS.mint}`, background: "none", cursor: "pointer", fontSize: 16, color: COLORS.navy, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "manipulation" }}>›</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginTop: 12, marginBottom: 4 }}>
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: COLORS.navyMid, fontWeight: 700, letterSpacing: "0.06em", paddingBottom: 6 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {cells.map((d, i) => (
          <div key={i}
            onClick={() => { if (!d) return; setSelected(d); onSelectDate(new Date(year, month, d)); }}
            style={{
              textAlign: "center", padding: "6px 0", borderRadius: 7, fontSize: 13,
              cursor: d ? "pointer" : "default", touchAction: "manipulation",
              fontWeight: d && (isToday(d) || isSelected(d)) ? 900 : 400,
              backgroundColor: d && isToday(d) ? COLORS.green : d && isSelected(d) ? COLORS.navy : "transparent",
              color: d && (isToday(d) || isSelected(d)) ? "white" : d ? COLORS.navy : "transparent",
              position: "relative", transition: "all 0.15s",

              minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center",
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
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const counts = Array(12).fill(0);
  appointments.forEach((a) => { counts[new Date(a.datetime).getMonth()]++; });
  const max = Math.max(...counts, 1);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.navy }}>Appointments</div>
          <div style={{ fontSize: 12, color: COLORS.navyMid, marginTop: 2 }}>{appointments.length} total this year</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: COLORS.green }} />
          <span style={{ fontSize: 11, color: COLORS.navyMid }}>{new Date().getFullYear()}</span>
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

function CallDonut({ logs }: { logs: CallLog[] }) {
  const inbound  = logs.filter((l) => l.direction === "inbound").length;
  const outbound = logs.filter((l) => l.direction === "outbound").length;
  const missed   = logs.filter((l) => l.status === "missed").length;
  const total    = inbound + outbound || 1;
  const inPct    = (inbound / total) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ width: 72, height: 72, borderRadius: "50%", flexShrink: 0, background: `conic-gradient(${COLORS.green} 0% ${inPct}%, ${COLORS.mint} ${inPct}% 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: COLORS.navy }}>{total}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Inbound",  value: inbound,  color: COLORS.green },
          { label: "Outbound", value: outbound, color: COLORS.mint  },
          { label: "Missed",   value: missed,   color: "#EF4444"    },
        ].map((row) => (
          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: row.color }} />
            <span style={{ fontSize: 11, color: COLORS.navy, fontWeight: 700 }}>{row.label}</span>
            <span style={{ fontSize: 11, color: COLORS.navyMid }}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightPanelContent({
  appointments, callLogs, selectedDate, calendarAppts,
  loading, setSelectedDate, router,
  user, photoUrl, setPhotoModal,
}: {
  appointments: Appointment[]; callLogs: CallLog[];
  selectedDate: Date | null; calendarAppts: Appointment[];
  loading: boolean; setSelectedDate: (d: Date | null) => void;
  router: ReturnType<typeof useRouter>;
  user: AdminUser | null; photoUrl: string | null;
  setPhotoModal: (v: boolean) => void;
}) {
  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "A";
  return (
    <>
      
      <div style={{ marginBottom: 24 }}>
        <MiniCalendar appointments={appointments} onSelectDate={setSelectedDate} />
        {selectedDate && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              {selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </div>
            {calendarAppts.length === 0
              ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>No appointments</div>
              : calendarAppts.map((a) => {
                  const { time } = formatDT(a.datetime);
                  const s = apptStatusStyle(a.status);
                  return (
                    <div key={a.id} style={{ padding: 10, borderRadius: 10, backgroundColor: COLORS.lightMint, marginBottom: 8, border: `1px solid ${COLORS.mint}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{a.patient_name}</div>
                      <div style={{ fontSize: 10, color: COLORS.navyMid }}>{a.service} · {time}</div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, backgroundColor: s.bg, color: s.color, border: s.border, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4, display: "inline-block" }}>{a.status}</span>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Upcoming</div>
        {loading
          ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div>
          : appointments.filter((a) => new Date(a.datetime) > new Date() && a.status !== "cancelled").slice(0, 4).map((a) => {
              const { date, time } = formatDT(a.datetime);
              return (
                <div key={a.id} style={{ backgroundColor: COLORS.lightMint, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${COLORS.mint}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy }}>{a.patient_name}</div>
                  <div style={{ fontSize: 10, color: COLORS.navyMid, marginTop: 2 }}>{a.service}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: COLORS.navyMid }}>{date}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.green }}>{time}</span>
                  </div>
                </div>
              );
            })
        }
      </div>

      
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy }}>Recent Calls</div>
          <button onClick={() => router.push("/admin/call-logs")} style={{ fontSize: 10, color: COLORS.green, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, touchAction: "manipulation" }}>See more</button>
        </div>
        {loading
          ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div>
          : callLogs.slice(0, 5).map((log) => {
              const dirColor    = log.direction === "inbound" ? COLORS.green : "#3B82F6";
              const statusColor = log.status === "missed" ? "#EF4444" : log.status === "voicemail" ? "#F59E0B" : COLORS.green;
              const { date, time } = formatDT(log.created_at);
              return (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(167,228,216,0.3)" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: `${dirColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={dirColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                      {log.direction === "outbound" && <><polyline points="17 1 21 5 17 9" /><line x1="21" y1="5" x2="11" y2="5" /></>}
                      {log.direction === "inbound"  && <><polyline points="17 9 21 5 17 1" /><line x1="21" y1="5" x2="11" y2="5" /></>}
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.caller_name}</div>
                    <div style={{ fontSize: 10, color: COLORS.navyMid }}>{date} · {time} · {log.duration}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 999, backgroundColor: `${statusColor}15`, color: statusColor, textTransform: "uppercase", whiteSpace: "nowrap" }}>{log.status}</span>
                </div>
              );
            })
        }
      </div>

      
      <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 18, position: "relative", overflow: "hidden" }}>
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.16, 0.08] }} transition={{ repeat: Infinity, duration: 6 }}
          style={{ position: "absolute", width: 100, height: 100, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -30, right: -20, pointerEvents: "none" }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 12, alignItems: "center" }}>
          <div onClick={() => setPhotoModal(true)} style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "white", cursor: "pointer", flexShrink: 0, border: "2px solid rgba(167,228,216,0.3)", touchAction: "manipulation" }}>
            {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "white" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{user?.email}</div>
            <div style={{ marginTop: 6, display: "inline-block", backgroundColor: "rgba(62,180,137,0.25)", color: COLORS.mint, borderRadius: 20, fontSize: 9, padding: "2px 8px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Administrator</div>
          </div>
        </div>
        <button onClick={() => router.push("/admin/settings")}
          style={{ width: "100%", marginTop: 14, padding: 9, backgroundColor: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", position: "relative", zIndex: 1, touchAction: "manipulation" }}
        >Settings →</button>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const { user: rawUser, logout } = useAuth();
  const user = rawUser as AdminUser | null;
  const router           = useRouter();
  const { isMobile, isTablet, isLaptop } = useBreakpoint();

  const [activeNav, setActiveNav]       = useState("dashboard");
  const [drawerOpen, setDrawerOpen]     = useState(false); // mobile right drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // mobile top-left menu

  const [stats,        setStats]        = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [callLogs,     setCallLogs]     = useState<CallLog[]>([]);
  const [callbacks,    setCallbacks]    = useState<Callback[]>([]);
  const [activity,     setActivity]     = useState<Activity[]>([]);
  const [loading,      setLoading]      = useState(true);

  const [selectedDate,  setSelectedDate]  = useState<Date | null>(null);

  const calendarAppts = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter((a) => {
      const d = new Date(a.datetime);
      return (
        d.getDate()     === selectedDate.getDate()     &&
        d.getMonth()    === selectedDate.getMonth()    &&
        d.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate, appointments]);

  const [photoUrl,     setPhotoUrl]     = useState<string | null>(null);
  const [photoModal,   setPhotoModal]   = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError,  setCameraError]  = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const streamRef    = useRef<MediaStream | null>(null);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      try {
        const [s, a, cl, cb, act] = await Promise.all([
          api.get<Stats>("/admin/stats"),
          api.get<Appointment[]>("/admin/appointments"),
          api.get<CallLog[]>("/admin/call-logs"),
          api.get<Callback[]>("/admin/callbacks"),
          api.get<Activity[]>("/admin/activity"),
        ]);
        setStats(s.data);
        setAppointments(a.data);
        setCallLogs(cl.data);
        setCallbacks(cb.data);
        setActivity(act.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
      
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLaptop) {
      const id = setTimeout(() => {
        setDrawerOpen(false);
        setMobileMenuOpen(false);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isLaptop]);
  useEffect(() => {
  if (!user?.id) return;
  const saved = localStorage.getItem(`photo_${user.id}`);
  setTimeout(() => setPhotoUrl(saved), 0);
}, [user?.id]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dy > 60) return; // vertical scroll, ignore
    if (dx < -60 && !drawerOpen) setDrawerOpen(true);   // swipe left → open right drawer
    if (dx > 60  && drawerOpen)  setDrawerOpen(false);  // swipe right → close drawer
    if (dx > 60  && mobileMenuOpen) setMobileMenuOpen(false);
  }, [drawerOpen, mobileMenuOpen]);

  const savePhoto = (url: string) => { setPhotoUrl(url); localStorage.setItem(`photo_${user?.id}`, url); };
  const closePhotoModal = useCallback(() => {
    setPhotoModal(false); setCameraActive(false); setCameraError("");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);
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
    canvas.width  = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    savePhoto(canvas.toDataURL("image/jpeg"));
    closePhotoModal();
  };
  const removePhoto = () => { setPhotoUrl(null); localStorage.removeItem(`photo_${user?.id}`); closePhotoModal(); };

  const initials         = user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "A";
  const pendingCallbacks = callbacks.filter((c) => c.status === "pending");
  const urgentCallbacks  = pendingCallbacks.filter((c) => c.priority === "urgent");

  if (!user) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: COLORS.lightMint, fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: "48px 32px", textAlign: "center", maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(62,180,137,0.1)", border: `1px solid ${COLORS.mint}` }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 900, color: COLORS.navy, marginBottom: 12 }}>Access Restricted</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid, lineHeight: 1.7, marginBottom: 32 }}>Admin login required.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push("/auth/login")}
            style={{ width: "100%", padding: "14px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
          >Sign In</motion.button>
        </motion.div>
      </main>
    );
  }

  const PhotoModal = (
    <AnimatePresence>
      {photoModal && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closePhotoModal}
            style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.5)", zIndex: 1000, backdropFilter: "blur(4px)" }}
          />
          <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", padding: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 24px 60px rgba(44,62,80,0.2)", pointerEvents: "all", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: COLORS.navy }}>Profile Photo</h3>
                <button onClick={closePhotoModal} style={{ background: "none", border: "none", fontSize: 24, color: COLORS.navyMid, cursor: "pointer", touchAction: "manipulation", padding: "4px 8px" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
                <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.lightMint, border: `3px solid ${COLORS.mint}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 900, color: COLORS.green, marginBottom: 10 }}>
                  {photoUrl ? <img key={photoUrl} src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                </div>
                <span style={{ fontSize: 12, color: COLORS.navyMid }}>{user?.name}</span>
              </div>
              {cameraActive && (
                <div style={{ marginBottom: 16 }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 12, backgroundColor: "#000" }} />
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={takePhoto}
                    style={{ width: "100%", marginTop: 10, padding: 14, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >Take Photo</motion.button>
                  <button onClick={() => { setCameraActive(false); streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; }}
                    style={{ width: "100%", marginTop: 8, padding: 12, backgroundColor: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.mint}`, borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
                  >Cancel Camera</button>
                </div>
              )}
              {cameraError && <div style={{ padding: "10px 14px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, color: "#DC2626", fontSize: 12, marginBottom: 16 }}>{cameraError}</div>}
              {!cameraActive && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ padding: 14, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    Upload from Device
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openCamera}
                    style={{ padding: 14, backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, touchAction: "manipulation" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Take Photo with Camera
                  </motion.button>
                  {photoUrl && (
                    <button onClick={removePhoto} style={{ padding: 12, backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>Remove Photo</button>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  const STAT_CARDS = [
    { label: "Total Patients",     value: stats?.total_patients,     color: COLORS.navy,  bg: COLORS.lightMint,      d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
    { label: "Appts Today",        value: stats?.appointments_today, color: COLORS.green, bg: "rgba(62,180,137,0.1)", d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
    { label: "Pending Callbacks",  value: stats?.pending_callbacks,  color: "#d97706",    bg: "rgba(245,158,11,0.1)", d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92zM17 1l4 4-4 4M21 5H11" },
    { label: "Calls Today",        value: stats?.calls_today,        color: "#3B82F6",    bg: "rgba(59,130,246,0.1)", d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" },
  ];

  const sidebarWidth = isTablet ? 64 : 220;

  return (
    <main
      style={{ minHeight: "100vh", backgroundColor: "#F4F7FA", fontFamily: "'Josefin Sans', sans-serif", display: "flex" }}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      {PhotoModal}

      
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, backgroundColor: COLORS.white, borderBottom: "1px solid rgba(167,228,216,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 2px 12px rgba(44,62,80,0.06)" }}>
          
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{ width: 40, height: 40, borderRadius: 10, border: "none", backgroundColor: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}
          >
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 18, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 12, height: 2, backgroundColor: COLORS.navy, borderRadius: 2 }} />
          </button>
          
          <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.15em", color: COLORS.navy }}>DentAI</span>
          
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => router.push("/admin/callbacks")} style={{ position: "relative", cursor: "pointer", touchAction: "manipulation" }}>
              <Bell size={20} color={COLORS.green} />
              {pendingCallbacks.length > 0 && (
                <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, backgroundColor: urgentCallbacks.length > 0 ? "#EF4444" : "#F59E0B", borderRadius: "50%" }} />
              )}
            </div>
            <div onClick={() => setPhotoModal(true)} style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", backgroundColor: COLORS.mint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: COLORS.green, cursor: "pointer", touchAction: "manipulation" }}>
              {photoUrl ? <img src={photoUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
          </div>
        </div>
      )}

      
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.4)", zIndex: 55, top: 56 }}
            />
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              style={{ position: "fixed", top: 56, left: 0, right: 0, backgroundColor: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)" }}
            >
              {NAV.map((item) => (
                <button key={item.id}
                  onClick={() => { setActiveNav(item.id); router.push(item.path); setMobileMenuOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
                >
                  <NavIcon d={item.d} />
                  {item.label}
                  {item.id === "callbacks" && pendingCallbacks.length > 0 && (
                    <span style={{ marginLeft: "auto", backgroundColor: urgentCallbacks.length > 0 ? "#EF4444" : "#F59E0B", color: "white", borderRadius: 20, fontSize: 10, padding: "2px 8px", fontWeight: 700 }}>{pendingCallbacks.length}</span>
                  )}
                </button>
              ))}
              <div style={{ borderTop: `1px solid ${COLORS.mint}`, marginTop: 8, paddingTop: 8 }}>
                <button onClick={() => { logout(); router.push("/"); }} style={{ width: "100%", padding: "12px 14px", backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}>Sign Out</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      
      {!isMobile && (
        <div style={{ width: sidebarWidth, backgroundColor: COLORS.white, borderRight: "1px solid rgba(167,228,216,0.3)", display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50, boxShadow: "2px 0 20px rgba(44,62,80,0.04)", transition: "width 0.2s ease", overflow: "hidden" }}>

          
          <div style={{ padding: isTablet ? "24px 0" : "24px 20px 20px", borderBottom: "1px solid rgba(167,228,216,0.3)", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white", flexShrink: 0 }}>A</div>
            {!isTablet && <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>}
          </div>

          
          <div style={{ padding: isTablet ? "20px 8px" : "20px 12px", flex: 1, overflowY: "auto" }}>
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(167,228,216,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8 }}>Admin Portal</div>}
            {NAV.map((item) => (
              <button key={item.id}
                onClick={() => { setActiveNav(item.id); router.push(item.path); }}
                title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", backgroundColor: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 2, transition: "all 0.15s", position: "relative" }}
                onMouseEnter={(e) => { if (activeNav !== item.id) e.currentTarget.style.backgroundColor = "rgba(62,180,137,0.12)"; }}
                onMouseLeave={(e) => { if (activeNav !== item.id) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <NavIcon d={item.d} />
                {!isTablet && item.label}
                {!isTablet && item.id === "callbacks" && pendingCallbacks.length > 0 && (
                  <span style={{ marginLeft: "auto", backgroundColor: urgentCallbacks.length > 0 ? "#EF4444" : "#F59E0B", color: "white", borderRadius: 20, fontSize: 9, padding: "2px 7px", fontWeight: 700 }}>{pendingCallbacks.length}</span>
                )}
                
                {isTablet && item.id === "callbacks" && pendingCallbacks.length > 0 && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", backgroundColor: urgentCallbacks.length > 0 ? "#EF4444" : "#F59E0B" }} />
                )}
              </button>
            ))}
          </div>

          
          {!isTablet && (
            <div style={{ padding: 16, borderTop: "1px solid rgba(167,228,216,0.3)" }}>
              <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ repeat: Infinity, duration: 5 }}
                  style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", backgroundColor: COLORS.green, bottom: -20, right: -20, pointerEvents: "none" }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 9, color: "rgba(167,228,216,0.7)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Today at a glance</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 4, lineHeight: 1.6 }}>{loading ? "—" : stats?.appointments_today ?? 0} appts today</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 12, lineHeight: 1.6 }}>{loading ? "—" : stats?.missed_calls_today ?? 0} missed calls</div>
                  <button onClick={() => router.push("/admin/appointments")} style={{ width: "100%", padding: 8, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}>View all →</button>
                </div>
              </div>
            </div>
          )}

          
          <div style={{ padding: isTablet ? "8px" : "0 12px 16px" }}>
            <button onClick={logout}
              title={isTablet ? "Sign Out" : undefined}
              style={{ width: "100%", padding: isTablet ? "12px 0" : "10px", backgroundColor: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: isTablet ? undefined : "uppercase", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {isTablet
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                : "Sign Out"
              }
            </button>
          </div>
        </div>
      )}

      
      <div style={{
        marginLeft: isMobile ? 0 : sidebarWidth,
        flex: 1,
        display: "flex",
        minHeight: "100vh",
        paddingTop: isMobile ? 56 : 0,         // room for mobile top bar
        paddingBottom: isMobile ? 72 : 0,       // room for mobile bottom nav
      }}>

        
        <div style={{ flex: 1, padding: isMobile ? "20px 16px" : "28px 24px", overflowY: "auto", minWidth: 0 }}>

          
          {!isMobile && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Admin Portal</div>
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
                <div onClick={() => router.push("/admin/callbacks")}
                  style={{ position: "relative", cursor: "pointer", transition: "transform 0.2s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Bell size={22} color={COLORS.green} />
                  {pendingCallbacks.length > 0 && (
                    <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, backgroundColor: urgentCallbacks.length > 0 ? "#EF4444" : "#F59E0B", borderRadius: "50%" }} />
                  )}
                </div>
              </div>
            </div>
          )}

          
          {isMobile && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: COLORS.navyMid, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Admin Portal</div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: COLORS.navy }}>Dashboard</h1>
            </div>
          )}

          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: isMobile ? 16 : 24, marginBottom: 16, boxShadow: "0 2px 16px rgba(44,62,80,0.05)", border: "1px solid rgba(167,228,216,0.2)" }}
          >
            {loading
              ? <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMid, fontSize: 13 }}>Loading chart...</div>
              : <AppointmentChart appointments={appointments} />
            }
          </motion.div>

          
          <div style={{ display: "grid", gridTemplateColumns: isLaptop ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {STAT_CARDS.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                style={{ backgroundColor: COLORS.white, borderRadius: 20, padding: isMobile ? 16 : 20, border: "1px solid rgba(167,228,216,0.3)", boxShadow: "0 2px 16px rgba(62,180,137,0.06)" }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.d} /></svg>
                </div>
                <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>{loading ? "—" : s.value ?? 0}</div>
                <div style={{ fontSize: 9, color: COLORS.navyMid, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: isMobile ? 16 : 20, border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)" }}
            >
              <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy, marginBottom: 16 }}>Call Distribution</div>
              {loading
                ? <div style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMid, fontSize: 13 }}>Loading...</div>
                : <CallDonut logs={callLogs} />
              }
              <button onClick={() => router.push("/admin/call-logs")}
                style={{ width: "100%", marginTop: 16, padding: 10, backgroundColor: "transparent", border: `1px solid ${COLORS.mint}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: COLORS.green, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
              >View all call logs →</button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: isMobile ? 16 : 20, border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy }}>Pending Callbacks</div>
                {urgentCallbacks.length > 0 && (
                  <span style={{ backgroundColor: "#FEF2F2", color: "#EF4444", borderRadius: 20, fontSize: 9, padding: "3px 8px", fontWeight: 700 }}>{urgentCallbacks.length} URGENT</span>
                )}
              </div>
              {loading
                ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div>
                : pendingCallbacks.length === 0
                  ? <div style={{ fontSize: 12, color: COLORS.navyMid, padding: "12px 0" }}>No pending callbacks.</div>
                  : pendingCallbacks.slice(0, 3).map((cb) => (
                      <div key={cb.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(167,228,216,0.3)" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: callbackPriorityColor(cb.priority), flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cb.patient_name}</div>
                          <div style={{ fontSize: 10, color: COLORS.navyMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cb.reason}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: callbackPriorityColor(cb.priority), textTransform: "uppercase", flexShrink: 0 }}>{cb.priority}</span>
                      </div>
                    ))
              }
              <button onClick={() => router.push("/admin/callbacks")}
                style={{ width: "100%", marginTop: 12, padding: 10, backgroundColor: "transparent", border: `1px solid ${COLORS.mint}`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: COLORS.green, cursor: "pointer", fontFamily: "inherit", touchAction: "manipulation" }}
              >Manage callbacks →</button>
            </motion.div>
          </div>

          
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: isMobile ? 16 : 20, border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)", marginBottom: 16 }}
          >
            <div style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy, marginBottom: 14 }}>Recent Activity</div>
            {loading
              ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>Loading...</div>
              : activity.length === 0
                ? <div style={{ fontSize: 12, color: COLORS.navyMid }}>No recent activity.</div>
                : activity.slice(0, 6).map((act, i) => {
                    const dotColor = ({ appointment: COLORS.green, call: "#3B82F6", callback: "#F59E0B", patient: COLORS.navy } as Record<string, string>)[act.type] ?? COLORS.navyMid;
                    const { date, time } = formatDT(act.created_at);
                    return (
                      <div key={act.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", borderBottom: i < Math.min(activity.length, 6) - 1 ? "1px solid rgba(167,228,216,0.3)" : "none" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dotColor, marginTop: 4, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: COLORS.navy, fontWeight: 600 }}>{act.message}</div>
                          <div style={{ fontSize: 10, color: COLORS.navyMid, marginTop: 2 }}>{date} · {time}</div>
                        </div>
                      </div>
                    );
                  })
            }
          </motion.div>

          
          {isMobile && (
            <div style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: 16, border: "1px solid rgba(167,228,216,0.25)", boxShadow: "0 2px 12px rgba(44,62,80,0.04)" }}>
              <RightPanelContent
                appointments={appointments} callLogs={callLogs}
                selectedDate={selectedDate} calendarAppts={calendarAppts}
                loading={loading} setSelectedDate={setSelectedDate}
                router={router} user={user}
                photoUrl={photoUrl} setPhotoModal={setPhotoModal}
              />
            </div>
          )}
        </div>

        
        {isLaptop && (
          <div style={{ width: 280, backgroundColor: COLORS.white, borderLeft: "1px solid rgba(167,228,216,0.3)", padding: "28px 20px", overflowY: "auto", boxShadow: "-2px 0 20px rgba(44,62,80,0.03)" }}>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <RightPanelContent
                appointments={appointments} callLogs={callLogs}
                selectedDate={selectedDate} calendarAppts={calendarAppts}
                loading={loading} setSelectedDate={setSelectedDate}
                router={router} user={user}
                photoUrl={photoUrl} setPhotoModal={setPhotoModal}
              />
            </motion.div>
          </div>
        )}

        
        {isTablet && (
          <AnimatePresence>
            {drawerOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, backgroundColor: "rgba(44,62,80,0.3)", zIndex: 70 }}
                />
                <motion.div
                  initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 300, backgroundColor: COLORS.white, zIndex: 71, padding: "28px 20px", overflowY: "auto", boxShadow: "-4px 0 24px rgba(44,62,80,0.12)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: COLORS.navy }}>Overview</span>
                    <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", fontSize: 22, color: COLORS.navyMid, cursor: "pointer", padding: "4px 8px" }}>×</button>
                  </div>
                  <RightPanelContent
                    appointments={appointments} callLogs={callLogs}
                    selectedDate={selectedDate} calendarAppts={calendarAppts}
                    loading={loading} setSelectedDate={setSelectedDate}
                    router={router} user={user}
                    photoUrl={photoUrl} setPhotoModal={setPhotoModal}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        )}
      </div>

      
      {isTablet && (
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setDrawerOpen((v) => !v)}
          style={{ position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", backgroundColor: COLORS.navy, border: "none", color: "white", cursor: "pointer", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(44,62,80,0.25)", touchAction: "manipulation" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </motion.button>
      )}

      
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: COLORS.white, borderTop: "1px solid rgba(167,228,216,0.3)", display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV.slice(0, 5).map((item) => (
            <button key={item.id}
              onClick={() => { setActiveNav(item.id); router.push(item.path); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 10px", borderRadius: 10, position: "relative", touchAction: "manipulation", minWidth: 44, minHeight: 44 }}
            >
              <NavIcon d={item.d} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em" }}>{item.label.split(" ")[0]}</span>
              {item.id === "callbacks" && pendingCallbacks.length > 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", backgroundColor: urgentCallbacks.length > 0 ? "#EF4444" : "#F59E0B" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}