"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Appointment {
  id: string;
  patient_name: string;
  service: string;
  datetime: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  phone_number?: string;
}

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

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", label: "Pending" },
  confirmed: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Confirmed" },
  completed: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", label: "Completed" },
  cancelled: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", label: "Cancelled" },
};

const FILTERS = ["all", "pending", "confirmed", "completed", "cancelled"] as const;
type Filter = typeof FILTERS[number];

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function CalIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function ClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>;
}
function PhoneIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function CheckCircleIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function XCircleIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
function ArrowLeftIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTime(dt: string) {
  return new Date(dt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>((searchParams.get("filter") as Filter) || "all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "completed" | "cancelled"; name: string } | null>(null);

  useEffect(() => {
    api.get("/doctor/appointments")
      .then((res) => setAppointments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const updateStatus = async (id: string, status: "completed" | "cancelled") => {
    setActionLoading(id);
    try {
      await api.patch(`/appointments/${id}/status`, { status });
      setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      showToast(status === "completed" ? "✓ Appointment marked as completed." : "✕ Appointment cancelled.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showToast(err.response?.data?.error || "Action failed. Please try again.");
      } else {
        showToast("Action failed. Please try again.");
      }
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const filtered = appointments
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => {
      const q = search.toLowerCase();
      return !q || a.patient_name.toLowerCase().includes(q) || a.service.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<string, number>);

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
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "0 2rem", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/doctor/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontWeight: 500, fontFamily: "'Josefin Sans', sans-serif", transition: "color 0.15s" }}>
            <ArrowLeftIcon /> Dashboard
          </Link>
          <div style={{ width: 1, height: 20, background: COLORS.border }} />
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy }}>Appointments</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/doctor/patients" style={{ fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontFamily: "'Josefin Sans', sans-serif" }}>Patients →</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.3s ease" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 6 }}>Doctor Portal</p>
          <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 26, fontWeight: 900, color: COLORS.navy, marginBottom: 6 }}>Manage Appointments</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid }}>{appointments.length} total appointments</p>
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap", animation: "fadeUp 0.35s ease" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.navyMid }}><SearchIcon /></span>
            <input
              type="text"
              placeholder="Search by patient or service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 13, color: COLORS.navy, fontFamily: "inherit", outline: "none" }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "9px 14px", borderRadius: 10, border: `1px solid ${filter === f ? COLORS.navy : COLORS.border}`,
                  background: filter === f ? COLORS.navy : COLORS.white,
                  color: filter === f ? "white" : COLORS.navyMid,
                  fontSize: 12, fontWeight: 600, fontFamily: "'Josefin Sans', sans-serif",
                  cursor: "pointer", letterSpacing: "0.04em", textTransform: "capitalize",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                }}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ background: filter === f ? "rgba(255,255,255,0.2)" : COLORS.navyLight, borderRadius: 20, padding: "1px 7px", fontSize: 11 }}>{counts[f]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Appointments list */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.navyMid, padding: "3rem 0", justifyContent: "center", fontSize: 14 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
            Loading appointments…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0", animation: "fadeUp 0.3s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>No appointments found</p>
            <p style={{ fontSize: 13, color: COLORS.navyMid }}>Try adjusting your filters or search.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease" }}>
            {filtered.map((appt, i) => {
              const st = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
              const isPast = new Date(appt.datetime) < new Date();
              const canAct = appt.status !== "completed" && appt.status !== "cancelled";

              return (
                <div
                  key={appt.id}
                  style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: 14, animation: `fadeUp ${0.05 + i * 0.04}s ease`, position: "relative", overflow: "hidden" }}
                >
                  {/* Left accent bar */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: st.color, borderRadius: "14px 0 0 14px" }} />

                  {/* Avatar */}
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.green, flexShrink: 0, marginLeft: 8 }}>
                    {getInitials(appt.patient_name)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, color: COLORS.navy }}>{appt.patient_name}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontFamily: "'Josefin Sans', sans-serif" }}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: COLORS.navy, marginBottom: 4 }}>{appt.service}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}>
                        <CalIcon /> {formatDate(appt.datetime)}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}>
                        <ClockIcon /> {formatTime(appt.datetime)}
                      </span>
                      {appt.phone_number && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}>
                          <PhoneIcon /> {appt.phone_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {canAct && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        disabled={!!actionLoading}
                        onClick={() => setConfirmModal({ id: appt.id, action: "completed", name: appt.patient_name })}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#15803D", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", transition: "all 0.12s" }}
                        title="Mark as completed"
                      >
                        <CheckCircleIcon /> Done
                      </button>
                      <button
                        disabled={!!actionLoading}
                        onClick={() => setConfirmModal({ id: appt.id, action: "cancelled", name: appt.patient_name })}
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", transition: "all 0.12s" }}
                        title="Cancel appointment"
                      >
                        <XCircleIcon /> Cancel
                      </button>
                    </div>
                  )}

                  {actionLoading === appt.id && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmModal(null)}>
          <div style={{ background: COLORS.white, borderRadius: 20, padding: "2rem", maxWidth: 360, width: "90%", animation: "slideIn 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: confirmModal.action === "completed" ? "#F0FDF4" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 22 }}>
              {confirmModal.action === "completed" ? "✓" : "✕"}
            </div>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.navy, textAlign: "center", marginBottom: 8 }}>
              {confirmModal.action === "completed" ? "Mark as Completed?" : "Cancel Appointment?"}
            </h3>
            <p style={{ fontSize: 13, color: COLORS.navyMid, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
              {confirmModal.action === "completed"
                ? `This will mark ${confirmModal.name}'s appointment as completed.`
                : `This will cancel ${confirmModal.name}'s appointment. This cannot be undone.`}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.navyMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>
                Go Back
              </button>
              <button
                onClick={() => updateStatus(confirmModal.id, confirmModal.action)}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: confirmModal.action === "completed" ? COLORS.green : "#B91C1C", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}
              >
                {confirmModal.action === "completed" ? "Confirm Done" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: COLORS.navy, color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, zIndex: 200, animation: "slideIn 0.25s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}