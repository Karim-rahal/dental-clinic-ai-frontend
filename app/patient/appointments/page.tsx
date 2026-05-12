"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

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

const NAV_ITEMS = [
  { id: "home",         label: "Home",         path: "/",                       icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dashboard",    label: "Dashboard",    path: "/patient/dashboard",      icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { id: "appointments", label: "Appointments", path: "/patient/appointments",   icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "book",         label: "Book Visit",   path: "/patient/book",           icon: "M12 5v14M5 12h14" },
  { id: "upload",       label: "Upload X-Rays",path: "/patient/upload",         icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" },
  { id: "profile",      label: "Profile",      path: "/patient/profile",        icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
];

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", label: "Pending"   },
  scheduled: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Scheduled" },
  completed: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", label: "Completed" },
  cancelled: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", label: "Cancelled" },
};

const FILTERS = ["all","pending","scheduled","completed","cancelled"] as const;
type Filter = typeof FILTERS[number];

interface Appointment {
  id: number;
  service: string;
  datetime: string;
  status: string;
  doctor_name?: string;
  phone_number?: string;
}

function useBreakpoint() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => { const h = () => setWidth(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: width < 768, isTablet: width >= 768 && width < 1024 };
}

function NavIcon({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

function Sidebar({ isMobile, isTablet, logout, router, mobileMenuOpen, setMobileMenuOpen }: {
  isMobile: boolean; isTablet: boolean; logout: () => void; router: ReturnType<typeof useRouter>;
  mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
}) {
  const sidebarWidth = isTablet ? 64 : 220;
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
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, backgroundColor: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)", animation: "slideIn 0.2s ease" }}>
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "appointments" ? COLORS.lightMint : "transparent", color: item.id === "appointments" ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: item.id === "appointments" ? 700 : 500, marginBottom: 4, touchAction: "manipulation" }}
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
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", backgroundColor: item.id === "appointments" ? COLORS.lightMint : "transparent", color: item.id === "appointments" ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: item.id === "appointments" ? 700 : 500, marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (item.id !== "appointments") e.currentTarget.style.backgroundColor = "#F8FFFE"; }}
                onMouseLeave={(e) => { if (item.id !== "appointments") e.currentTarget.style.backgroundColor = "transparent"; }}
              ><NavIcon d={item.icon} />{!isTablet && item.label}</button>
            ))}
          </div>
          {!isTablet && (
            <div style={{ padding: 16, borderTop: "1px solid rgba(167,228,216,0.3)" }}>
              <div style={{ backgroundColor: COLORS.navy, borderRadius: 16, padding: 16, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", backgroundColor: COLORS.green, opacity: 0.15, bottom: -20, right: -20 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 9, color: "rgba(167,228,216,0.7)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Book online.</div>
                  <button onClick={() => router.push("/patient/book")} style={{ width: "100%", padding: 8, backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>+ New Appointment</button>
                </div>
              </div>
            </div>
          )}
          <button onClick={() => { logout(); router.push("/"); }} title={isTablet ? "Sign Out" : undefined}
            style={{ margin: isTablet ? "0 8px 16px" : "0 12px 16px", padding: isTablet ? "12px 0" : "10px", backgroundColor: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isTablet ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> : "Sign Out"}
          </button>
        </div>
      )}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, backgroundColor: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => router.push(item.path)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: item.id === "appointments" ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 6px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44 }}
            >
              <NavIcon d={item.icon} />
              <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.04em", fontFamily: "'Josefin Sans', sans-serif" }}>{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function AppointmentsContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useBreakpoint();

  const [appointments, setAppointments]     = useState<Appointment[]>([]);
  const [loading, setLoading]               = useState(true);
  const [filter, setFilter]                 = useState<Filter>((searchParams.get("filter") as Filter) || "all");
  const [search, setSearch]                 = useState("");
  const [cancelling, setCancelling]         = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast]                   = useState("");
  const [confirmModal, setConfirmModal]     = useState<{ id: number; name: string } | null>(null);

  const sidebarWidth = isTablet ? 64 : 220;

  useEffect(() => {
    api.get("/appointments").then((r) => setAppointments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleCancel = async (id: number) => {
    setCancelling(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((p) => p.map((a) => a.id === id ? { ...a, status: "cancelled" } : a));
      showToast("Appointment cancelled.");
    } catch { showToast("Failed to cancel. Please try again."); }
    finally { setCancelling(null); setConfirmModal(null); }
  };

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "all" ? appointments.length : appointments.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  const filtered = appointments
    .filter((a) => filter === "all" || a.status === filter)
    .filter((a) => { const q = search.toLowerCase(); return !q || a.service.toLowerCase().includes(q) || (a.doctor_name || "").toLowerCase().includes(q); })
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const fmt = (dt: string) => {
    const d = new Date(dt);
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    };
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

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

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        * { box-sizing: border-box; }
        .appt-row:hover { background: #F8FFFE !important; }
      `}</style>

      <Sidebar isMobile={isMobile} isTablet={isTablet} logout={logout} router={router} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0, minWidth: 0 }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "1.25rem 1rem 5rem" : "2rem 1.5rem 5rem" }}>

          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "1.75rem", animation: "fadeUp 0.3s ease" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 6 }}>Patient Portal</p>
              <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 900, color: COLORS.navy, marginBottom: 4 }}>My Appointments</h2>
              <p style={{ fontSize: 14, color: COLORS.navyMid }}>{appointments.length} total appointments</p>
            </div>
            <button onClick={() => router.push("/patient/book")}
              style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "11px 22px", background: COLORS.navy, color: "white", border: "none", borderRadius: 10, cursor: "pointer", flexShrink: 0, touchAction: "manipulation" }}
            >+ Book New</button>
          </div>

          <div style={{ display: "flex", gap: 4, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 5, marginBottom: "1.5rem", width: "fit-content", maxWidth: "100%", overflowX: "auto" }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, border: "none", background: filter === f ? COLORS.navy : "transparent", color: filter === f ? "white" : COLORS.navyMid, fontSize: 12, fontWeight: filter === f ? 700 : 500, fontFamily: "'Josefin Sans', sans-serif", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", touchAction: "manipulation" }}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                {counts[f] > 0 && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: filter === f ? "rgba(255,255,255,0.2)" : COLORS.navyLight, color: filter === f ? "white" : COLORS.navyMid }}>{counts[f]}</span>}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={COLORS.navyMid} strokeWidth="1.8" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search by service or doctor…" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 13, color: COLORS.navy, fontFamily: "inherit", outline: "none" }}
            />
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.navyMid, padding: "3rem 0", justifyContent: "center", fontSize: 14 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
              Loading appointments…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 0", animation: "fadeUp 0.3s ease" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>No appointments found</p>
              <p style={{ fontSize: 13, color: COLORS.navyMid, marginBottom: 20 }}>Try adjusting your filters.</p>
              {filter === "all" && <button onClick={() => router.push("/patient/book")} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "11px 26px", background: COLORS.navy, color: "white", border: "none", borderRadius: 10, cursor: "pointer", touchAction: "manipulation" }}>Book an Appointment</button>}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease" }}>
              {filtered.map((appt, i) => {
                const st = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;
                const canAct = appt.status !== "cancelled" && appt.status !== "completed";
                const { date, time } = fmt(appt.datetime);
                return (
                  <div key={appt.id} className="appt-row"
                    style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden", animation: `fadeUp ${0.05 + i * 0.04}s ease`, position: "relative" }}
                  >
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: st.color, borderRadius: "14px 0 0 14px" }} />
                    <div style={{ padding: isMobile ? "14px 14px 14px 18px" : "16px 20px 16px 22px", display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 14, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.green, flexShrink: 0 }}>
                        {getInitials(appt.service)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                          <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{appt.service}</p>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontFamily: "'Josefin Sans', sans-serif" }}>{st.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: COLORS.navyMid }}>{date} · {time}</span>
                          {appt.doctor_name && <span style={{ fontSize: 12, color: COLORS.navyMid }}>{appt.doctor_name}</span>}
                        </div>
                      </div>
                      {canAct && (
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", marginLeft: isMobile ? 50 : 0, width: isMobile ? "100%" : "auto" }}>
                          <button onClick={() => router.push(`/patient/book?reschedule=${appt.id}`)}
                            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.navy, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
                          >Reschedule</button>
                          <button onClick={() => setConfirmModal({ id: appt.id, name: appt.service })} disabled={cancelling === appt.id}
                            style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #FECACA", background: "#FEF2F2", color: "#B91C1C", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
                          >Cancel</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {confirmModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setConfirmModal(null)}>
          <div style={{ background: COLORS.white, borderRadius: 20, padding: "2rem", maxWidth: 360, width: "100%", animation: "slideIn 0.2s ease" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 22 }}>✕</div>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.navy, textAlign: "center", marginBottom: 8 }}>Cancel Appointment?</h3>
            <p style={{ fontSize: 13, color: COLORS.navyMid, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>This will cancel your <strong>{confirmModal.name}</strong> appointment. This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.navyMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>Go Back</button>
              <button onClick={() => handleCancel(confirmModal.id)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: "#B91C1C", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? 80 : 32, left: "50%", transform: "translateX(-50%)", background: COLORS.navy, color: "white", padding: "12px 24px", borderRadius: 12, fontSize: 13, fontFamily: "'Josefin Sans', sans-serif", fontWeight: 600, zIndex: 300, animation: "slideIn 0.25s ease", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9F8" }}><div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E6F7F2", borderTopColor: "#3EB489" }} /></div>}>
      <AppointmentsContent />
    </Suspense>
  );
}