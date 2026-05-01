"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Appointment {
  id: number;
  service: string;
  datetime: string;
  status: string;
  doctor_id: string;
  doctor_name?: string;
  booked_via: string;
}

type FilterTab = "upcoming" | "pending" | "past" | "cancelled";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

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

const SERVICE_META: Record<string, { accent: string; bg: string }> = {
  "Dental Checkup":            { accent: "#3EB489", bg: "#E6F7F2" },
  "Teeth Cleaning":            { accent: "#5BCFB5", bg: "#E1F9F4" },
  "Dental Filling":            { accent: "#4A9FD4", bg: "#E6F2FB" },
  "Teeth Whitening":           { accent: "#F0A500", bg: "#FEF6E4" },
  "Braces Consultation":       { accent: "#9B6FCF", bg: "#F3EEFF" },
  "Root Canal":                { accent: "#E06B6B", bg: "#FEECEC" },
  "Root Canal Consultation":   { accent: "#E06B6B", bg: "#FEECEC" },
};

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  scheduled: { bg: "#E6F7F2", color: "#0F6E56", label: "Scheduled" },
  pending:   { bg: "#FEF6E4", color: "#854F0B", label: "Pending"   },
  cancelled: { bg: "#FEECEC", color: "#A32D2D", label: "Cancelled" },
  completed: { bg: "#E6F2FB", color: "#185FA5", label: "Completed" },
};

const TABS: { id: FilterTab; label: string }[] = [
  { id: "upcoming",  label: "Upcoming"  },
  { id: "pending",   label: "Pending"   },
  { id: "past",      label: "Past"      },
  { id: "cancelled", label: "Cancelled" },
];

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function StethoscopeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parseDate(datetime: string) {
  const d = new Date(datetime);
  return {
    dayName:  d.toLocaleDateString("en-US", { weekday: "short" }),
    day:      d.getDate(),
    month:    d.toLocaleDateString("en-US", { month: "long" }),
    monthYear:d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    time:     d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    isoDate:  d.toISOString().split("T")[0],
  };
}

function isToday(datetime: string) {
  const today = new Date().toISOString().split("T")[0];
  return new Date(datetime).toISOString().split("T")[0] === today;
}

function groupByDate(appointments: Appointment[]) {
  const groups: Record<string, Appointment[]> = {};
  for (const appt of appointments) {
    const { isoDate } = parseDate(appt.datetime);
    if (!groups[isoDate]) groups[isoDate] = [];
    groups[isoDate].push(appt);
  }
  return groups;
}

function filterAppointments(appointments: Appointment[], tab: FilterTab): Appointment[] {
  const now = new Date();
  return appointments.filter((a) => {
    const d = new Date(a.datetime);
    if (tab === "upcoming")  return a.status !== "cancelled" && d >= now;
    if (tab === "pending")   return a.status === "pending";
    if (tab === "past")      return a.status !== "cancelled" && d < now;
    if (tab === "cancelled") return a.status === "cancelled";
    return true;
  });
}

// ─────────────────────────────────────────────
// Dropdown menu component
// ─────────────────────────────────────────────

function ActionMenu({
  appt,
  onCancel,
  onReschedule,
  onUpload,
  cancelling,
}: {
  appt: Appointment;
  onCancel: (id: number) => void;
  onReschedule: (id: number) => void;
  onUpload: (id: number) => void;
  cancelling: number | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const menuItems = [
    {
      icon: <UploadIcon />,
      label: "Upload Documents",
      color: COLORS.navy,
      onClick: () => { onUpload(appt.id); setOpen(false); },
    },
    {
      icon: <ClockIcon />,
      label: "Reschedule",
      color: COLORS.navy,
      onClick: () => { onReschedule(appt.id); setOpen(false); },
    },
    {
      icon: <span style={{ fontSize: 11 }}>✕</span>,
      label: cancelling === appt.id ? "Cancelling…" : "Cancel Appointment",
      color: "#A32D2D",
      onClick: () => { onCancel(appt.id); setOpen(false); },
    },
  ];

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 14px",
          borderRadius: 8,
          border: `1px solid ${open ? COLORS.navy : COLORS.border}`,
          background: open ? COLORS.navy : COLORS.white,
          color: open ? COLORS.white : COLORS.navy,
          fontSize: 12, fontWeight: 600,
          fontFamily: "'Josefin Sans', sans-serif",
          cursor: "pointer", transition: "all 0.15s",
          letterSpacing: "0.03em",
        }}
      >
        Actions {open ? <ChevronUp /> : <ChevronDown />}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(44,62,80,0.12)",
          minWidth: 200, zIndex: 100,
          overflow: "hidden",
          animation: "fadeUp 0.15s ease",
        }}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px",
                background: "transparent",
                border: "none",
                borderBottom: i < menuItems.length - 1 ? `1px solid ${COLORS.border}` : "none",
                cursor: "pointer", textAlign: "left",
                fontSize: 13, color: item.color,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.offWhite)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ color: item.color, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function AppointmentsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");

  useEffect(() => {
    api.get("/appointments")
      .then((res) => setAppointments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(null);
    }
  };

  const handleReschedule = (id: number) => {
    router.push(`/patient/book?reschedule=${id}`);
  };

  const handleUpload = (id: number) => {
    router.push(`/patient/upload?appointmentId=${id}`);
  };

  const filtered = filterAppointments(appointments, activeTab);
  const grouped  = groupByDate(filtered);
  const sortedDates = Object.keys(grouped).sort();

  // Tab counts
  const counts: Record<FilterTab, number> = {
    upcoming:  filterAppointments(appointments, "upcoming").length,
    pending:   filterAppointments(appointments, "pending").length,
    past:      filterAppointments(appointments, "past").length,
    cancelled: filterAppointments(appointments, "cancelled").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tab-btn:hover:not(.tab-active) { color: ${COLORS.navy} !important; background: ${COLORS.navyLight} !important; }
        .nav-back:hover { color: ${COLORS.green} !important; }
        .appt-row:hover { box-shadow: 0 4px 20px rgba(44,62,80,0.08) !important; }
        .book-btn:hover { background: ${COLORS.green} !important; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "0 2rem", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "white", fontFamily: "'Josefin Sans', sans-serif" }}>D</div>
            <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.navyMid }}>
            <span style={{ color: COLORS.green, fontWeight: 600 }}>Patient Portal</span>
            <span style={{ opacity: 0.35 }}>›</span>
            <span>My Appointments</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link href="/patient/dashboard" className="nav-back" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}>
            <ArrowLeftIcon /> Dashboard
          </Link>
          <button onClick={logout} style={{ fontSize: 12, fontWeight: 500, color: "#A32D2D", background: "#FEECEC", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", animation: "fadeUp 0.35s ease" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>
              Patient Portal
            </p>
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 28, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>
              My Appointments
            </h1>
            <p style={{ fontSize: 14, color: COLORS.navyMid }}>
              View, manage and upload documents for your bookings.
            </p>
          </div>
          <button
            className="book-btn"
            onClick={() => router.push("/patient/book")}
            style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "12px 24px", background: COLORS.navy, color: "white", border: "none", borderRadius: 10, cursor: "pointer", transition: "background 0.15s", flexShrink: 0 }}
          >
            + Book New
          </button>
        </div>

        {/* ── FILTER TABS ── */}
        <div style={{ display: "flex", gap: 4, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 5, marginBottom: "2rem", width: "fit-content" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "tab-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px",
                  borderRadius: 9,
                  border: "none",
                  background: isActive ? COLORS.navy : "transparent",
                  color: isActive ? "white" : COLORS.navyMid,
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  fontFamily: "'Josefin Sans', sans-serif",
                  cursor: "pointer", transition: "all 0.15s",
                  letterSpacing: "0.02em",
                }}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", borderRadius: 20,
                    background: isActive ? "rgba(255,255,255,0.2)" : COLORS.navyLight,
                    color: isActive ? "white" : COLORS.navyMid,
                  }}>
                    {counts[tab.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── CONTENT ── */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 0", gap: 12 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2.5px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: 14, color: COLORS.navyMid }}>Loading appointments…</span>
          </div>
        ) : sortedDates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 0", animation: "fadeUp 0.3s ease" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: COLORS.navy, marginBottom: 6 }}>No {activeTab} appointments</p>
            <p style={{ fontSize: 13, color: COLORS.navyMid, marginBottom: 20 }}>
              {activeTab === "upcoming" ? "Book your first appointment to get started." : `Nothing here yet.`}
            </p>
            {activeTab === "upcoming" && (
              <button
                onClick={() => router.push("/patient/book")}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "11px 26px", background: COLORS.navy, color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}
              >
                Book an Appointment
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", animation: "fadeUp 0.3s ease" }}>
            {sortedDates.map((isoDate) => {
              const dayAppts = grouped[isoDate];
              const sample   = parseDate(dayAppts[0].datetime);
              const todayMark = isToday(dayAppts[0].datetime);

              return (
                <div key={isoDate}>
                  {/* Month header — show when month changes */}
                  <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: "0.85rem" }}>
                    {sample.monthYear}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {dayAppts.map((appt, idx) => {
                      const dt      = parseDate(appt.datetime);
                      const meta    = SERVICE_META[appt.service] ?? { accent: COLORS.green, bg: COLORS.lightMint };
                      const statusM = STATUS_META[appt.status]   ?? { bg: COLORS.navyLight, color: COLORS.navyMid, label: appt.status };
                      const canAct  = appt.status !== "cancelled" && appt.status !== "completed";

                      return (
                        <div
                          key={appt.id}
                          className="appt-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0,
                            background: COLORS.white,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 14,
                            transition: "box-shadow 0.15s",
                          }}
                        >
                          {/* Left: Date block */}
                          <div style={{
                            width: 80, flexShrink: 0,
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            padding: "1.25rem 0",
                            borderRight: `1px solid ${COLORS.border}`,
                            background: todayMark && idx === 0 ? COLORS.lightMint : "transparent",
                          }}>
                            <span style={{
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontSize: 11, fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: todayMark ? COLORS.green : COLORS.navyMid,
                              marginBottom: 4,
                            }}>
                              {dt.dayName}
                            </span>
                            <span style={{
                              fontFamily: "'Josefin Sans', sans-serif",
                              fontSize: 30, fontWeight: 700, lineHeight: 1,
                              color: todayMark ? COLORS.green : COLORS.navy,
                            }}>
                              {dt.day}
                            </span>
                          </div>

                          {/* Middle: appointment info */}
                          <div style={{ flex: 1, padding: "1.1rem 1.25rem", minWidth: 0 }}>
                            {/* Service name + status + via-call badge */}
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                              {/* Service accent dot */}
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.accent, flexShrink: 0 }} />
                              <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, color: COLORS.navy }}>
                                {appt.service}
                              </span>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.4px", background: statusM.bg, color: statusM.color }}>
                                {statusM.label}
                              </span>
                              {appt.booked_via === "phone" && (
                                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#F3EEFF", color: "#6B46B0" }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.55 5.55l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                  </svg>
                                  via call
                                </span>
                              )}
                            </div>

                            {/* Time + doctor */}
                            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.navyMid }}>
                                <ClockIcon /> {dt.time}
                              </span>
                              {appt.doctor_name && (
                                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: COLORS.navyMid }}>
                                  <StethoscopeIcon /> {appt.doctor_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: actions */}
                          <div style={{ padding: "0 1.25rem", flexShrink: 0 }}>
                            {canAct ? (
                              <ActionMenu
                                appt={appt}
                                onCancel={handleCancel}
                                onReschedule={handleReschedule}
                                onUpload={handleUpload}
                                cancelling={cancelling}
                              />
                            ) : (
                              <span style={{ fontSize: 12, color: COLORS.navyMid, fontStyle: "italic" }}>
                                {appt.status === "completed" ? "Completed" : "Cancelled"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}