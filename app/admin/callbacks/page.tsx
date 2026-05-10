"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";
import { Phone } from "lucide-react";

interface Callback {
  id: string;
  patient_name: string;
  phone: string;
  priority: "urgent" | "normal" | "low";
  status: "pending" | "called" | "completed" | "failed";
  scheduled_for: string;
  requested_at: string;
  reason: string;
  assigned_to?: string;
}

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

const PRIORITY_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  urgent: { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", label: "Urgent" },
  normal: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", label: "Normal" },
  low:    { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", label: "Low"    },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", label: "Pending"   },
  called:    { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "Called"    },
  completed: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", label: "Completed" },
  failed:    { bg: "#FEF2F2", color: "#B91C1C", border: "#FECACA", label: "Failed"    },
};

const STATUS_FILTERS   = ["all", "pending", "called", "completed", "failed"] as const;
const PRIORITY_FILTERS = ["all", "urgent", "normal", "low"] as const;
type StatusFilter   = typeof STATUS_FILTERS[number];
type PriorityFilter = typeof PRIORITY_FILTERS[number];
const PRIORITY_ORDER: Record<string, number> = { urgent: 0, normal: 1, low: 2 };

const NAV = [
    { id: "home",         label: "Home",         path: "/",                    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { id: "dashboard",    label: "Dashboard",    path: "/admin/dashboard",    d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { id: "appointments", label: "Appointments", path: "/admin/appointments", d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
  { id: "call-logs",    label: "Call Logs",    path: "/admin/call-logs",    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" },
  { id: "callbacks",    label: "Callbacks",    path: "/admin/callbacks",    d: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.4 12.17 19.79 19.79 0 01.31 3.54 2 2 0 012.3 1.36h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 9a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92zM17 1l4 4-4 4M21 5H11" },
  { id: "settings",     label: "Settings",     path: "/admin/settings",     d: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
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
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function CalIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}

function PhoneCallIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}

function UserIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function Sidebar({ activeNav, setActiveNav, isMobile, isTablet, logout, router, mobileMenuOpen, setMobileMenuOpen, pendingCount }: {
  activeNav: string; setActiveNav: (v: string) => void;
  isMobile: boolean; isTablet: boolean;
  logout: () => void; router: ReturnType<typeof useRouter>;
  mobileMenuOpen: boolean; setMobileMenuOpen: (v: boolean) => void;
  pendingCount: number;
}) {
  const sidebarWidth = isTablet ? 64 : 240;

  return (
    <>
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 56, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", zIndex: 60, boxShadow: "0 2px 12px rgba(44,62,80,0.06)" }}>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: COLORS.lightMint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer", touchAction: "manipulation" }}>
            <div style={{ width: 18, height: 2, background: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 18, height: 2, background: COLORS.navy, borderRadius: 2 }} />
            <div style={{ width: 12, height: 2, background: COLORS.navy, borderRadius: 2 }} />
          </button>
          <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: "0.12em", color: COLORS.navy }}>DentAI</span>
          <div style={{ width: 40 }} />
        </div>
      )}

      {isMobile && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(44,62,80,0.4)", zIndex: 55, top: 56 }} />
          <div style={{ position: "fixed", top: 56, left: 0, right: 0, background: COLORS.white, zIndex: 56, borderBottom: `1px solid ${COLORS.mint}`, padding: "12px 16px", boxShadow: "0 8px 24px rgba(44,62,80,0.12)", animation: "slideIn 0.2s ease" }}>
            {NAV.map((item) => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); setMobileMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", background: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 14, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 4, touchAction: "manipulation", position: "relative" }}
              >
                <NavIcon d={item.d} />{item.label}
                {item.id === "callbacks" && pendingCount > 0 && (
                  <span style={{ marginLeft: "auto", background: "#EF4444", color: "white", borderRadius: 20, fontSize: 10, padding: "2px 8px", fontWeight: 700 }}>{pendingCount}</span>
                )}
              </button>
            ))}
            <div style={{ borderTop: `1px solid ${COLORS.mint}`, marginTop: 8, paddingTop: 8 }}>
              <button onClick={() => { logout(); router.push("/"); }} style={{ width: "100%", padding: "12px 14px", background: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>Sign Out</button>
            </div>
          </div>
        </>
      )}

      {!isMobile && (
        <aside style={{ width: sidebarWidth, background: COLORS.white, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50, boxShadow: "2px 0 20px rgba(44,62,80,0.04)", transition: "width 0.2s ease", overflow: "hidden" }}>
          <div style={{ padding: isTablet ? "24px 0" : "24px 20px 20px", borderBottom: "1px solid rgba(167,228,216,0.3)", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: "white", flexShrink: 0 }}>A</div>
            {!isTablet && <span style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, fontWeight: 900, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>}
          </div>
          <nav style={{ padding: isTablet ? "20px 8px" : "20px 12px", flex: 1, overflowY: "auto" }}>
            {!isTablet && <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.navyMid, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8, paddingLeft: 8, fontFamily: "'Josefin Sans', sans-serif" }}>Admin Portal</div>}
            {NAV.map((item) => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); }} title={isTablet ? item.label : undefined}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: isTablet ? "center" : "flex-start", gap: isTablet ? 0 : 10, padding: isTablet ? "12px 0" : "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", background: activeNav === item.id ? COLORS.lightMint : "transparent", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontSize: 12, fontWeight: activeNav === item.id ? 700 : 500, marginBottom: 2, transition: "all 0.15s", position: "relative" }}
              >
                <NavIcon d={item.d} />
                {!isTablet && item.label}
                {!isTablet && item.id === "callbacks" && pendingCount > 0 && (
                  <span style={{ marginLeft: "auto", background: "#EF4444", color: "white", borderRadius: 20, fontSize: 9, padding: "2px 7px", fontWeight: 700 }}>{pendingCount}</span>
                )}
                {isTablet && item.id === "callbacks" && pendingCount > 0 && (
                  <div style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                )}
              </button>
            ))}
          </nav>
          <button onClick={() => { logout(); router.push("/"); }} title={isTablet ? "Sign Out" : undefined}
            style={{ margin: isTablet ? "0 8px 16px" : "0 12px 16px", padding: isTablet ? "12px 0" : "10px", background: "transparent", color: "#e05555", border: isTablet ? "none" : "1px solid rgba(224,85,85,0.3)", borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {isTablet
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e05555" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              : "Sign Out"
            }
          </button>
        </aside>
      )}

      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 64, background: COLORS.white, borderTop: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-around", zIndex: 60, boxShadow: "0 -2px 12px rgba(44,62,80,0.08)" }}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); router.push(item.path); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: activeNav === item.id ? COLORS.green : COLORS.navyMid, fontFamily: "inherit", padding: "8px 10px", borderRadius: 10, touchAction: "manipulation", minWidth: 44, minHeight: 44, position: "relative" }}
            >
              <NavIcon d={item.d} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", fontFamily: "'Josefin Sans', sans-serif" }}>{item.label.split(" ")[0]}</span>
              {item.id === "callbacks" && pendingCount > 0 && (
                <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function AdminCallbacksContent() {
  const { user: rawUser, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMobile, isTablet } = useBreakpoint();

  const [callbacks, setCallbacks]         = useState<Callback[]>([]);
  const [loading, setLoading]             = useState(true);
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>((searchParams.get("status") as StatusFilter) || "all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>((searchParams.get("priority") as PriorityFilter) || "all");
  const [search, setSearch]               = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeNav, setActiveNav]         = useState("callbacks");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast]                 = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [confirmModal, setConfirmModal]   = useState<{ id: string; action: Callback["status"]; name: string } | null>(null);
  const [newCb, setNewCb]                 = useState({ patient_name: "", phone: "", scheduled_for: "", priority: "normal", reason: "", assigned_to: "" });

  useEffect(() => {
    api.get("/admin/callbacks")
      .then((res) => setCallbacks(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateStatus = async (id: string, status: Callback["status"]) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/callbacks/${id}/status`, { status });
      setCallbacks((prev) => prev.map((c) => c.id === id ? { ...c, status } : c));
      const msgs: Record<string, string> = { called: "✓ Marked as called.", completed: "✓ Callback completed.", failed: "✕ Marked as failed." };
      showToast(msgs[status] ?? "Updated.");
    } catch (err) {
      if (axios.isAxiosError(err)) showToast(err.response?.data?.error || "Action failed.");
      else showToast("Action failed.");
    } finally {
      setActionLoading(null);
      setConfirmModal(null);
    }
  };

  const handleCreate = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/admin/callbacks", { ...newCb, status: "pending", requested_at: new Date().toISOString() });
      setCallbacks((prev) => [res.data, ...prev]);
      showToast("✓ Callback scheduled.");
    } catch (err) {
      if (axios.isAxiosError(err)) showToast(err.response?.data?.error || "Failed to schedule.");
      else showToast("Failed to schedule.");
    }
    setShowModal(false);
    setNewCb({ patient_name: "", phone: "", scheduled_for: "", priority: "normal", reason: "", assigned_to: "" });
  };

  const filtered = callbacks
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => priorityFilter === "all" || c.priority === priorityFilter)
    .filter((c) => {
      const q = search.toLowerCase();
      return !q || c.patient_name.toLowerCase().includes(q) || c.phone.includes(q) || c.reason.toLowerCase().includes(q);
    })
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const pendingCount = callbacks.filter((c) => c.status === "pending").length;
  const urgentPending = callbacks.filter((c) => c.status === "pending" && c.priority === "urgent").length;

  const counts = {
    total:     callbacks.length,
    pending:   callbacks.filter((c) => c.status === "pending").length,
    called:    callbacks.filter((c) => c.status === "called").length,
    completed: callbacks.filter((c) => c.status === "completed").length,
    failed:    callbacks.filter((c) => c.status === "failed").length,
  };

  const sidebarWidth = isTablet ? 64 : 240;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 13, color: COLORS.navy, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.navyMid, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 6 };

  if (!rawUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.offWhite, fontFamily: "'Josefin Sans', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: COLORS.navy, marginBottom: 12 }}>Access Restricted</h2>
          <Link href="/auth/login" style={{ color: COLORS.green }}>Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700;900&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        * { box-sizing: border-box; }
        .cb-row:hover { background: #F8FFFE !important; }
      `}</style>

      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} isMobile={isMobile} isTablet={isTablet} logout={logout} router={router} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} pendingCount={pendingCount} />

      <div style={{ flex: 1, marginLeft: isMobile ? 0 : sidebarWidth, paddingTop: isMobile ? 56 : 0, paddingBottom: isMobile ? 72 : 0, minWidth: 0 }}>

        <nav style={{ position: "sticky", top: isMobile ? 56 : 0, zIndex: 40, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "0 2rem", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link href="/admin/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontWeight: 500, fontFamily: "'Josefin Sans', sans-serif" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Dashboard
            </Link>
            <div style={{ width: 1, height: 20, background: COLORS.border }} />
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy }}>Callbacks</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: COLORS.navy, color: COLORS.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {!isMobile && "Schedule Callback"}
          </button>
        </nav>

        <div style={{ maxWidth: 960, margin: "0 auto", padding: isMobile ? "1.25rem 1rem 5rem" : "2rem 1.5rem 5rem" }}>

          <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 6 }}>Admin Portal</p>
            <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: isMobile ? 22 : 26, fontWeight: 900, color: COLORS.navy, marginBottom: 6 }}>Callbacks</h2>
            <p style={{ fontSize: 14, color: COLORS.navyMid }}>
              {pendingCount > 0 && <span style={{ color: "#B91C1C", fontWeight: 700 }}>{urgentPending > 0 ? `⚠ ${urgentPending} urgent · ` : ""}</span>}
              {pendingCount} pending callback{pendingCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: "1.5rem", animation: "fadeUp 0.32s ease" }}>
            {[
              { label: "Total",     value: counts.total,     color: COLORS.navy  },
              { label: "Pending",   value: counts.pending,   color: "#C2410C"    },
              { label: "Completed", value: counts.completed, color: "#15803D"    },
              { label: "Failed",    value: counts.failed,    color: "#B91C1C"    },
            ].map((s) => (
              <div key={s.label} style={{ background: COLORS.white, borderRadius: 14, padding: "16px 18px", border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${s.color}` }}>
                <div style={{ fontSize: 10, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: "'Josefin Sans', sans-serif" }}>{loading ? "—" : s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: "1.5rem", flexWrap: "wrap", animation: "fadeUp 0.35s ease" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.navyMid }}><SearchIcon /></span>
              <input type="text" placeholder="Search patient, phone, reason…" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", padding: "11px 14px 11px 38px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 13, color: COLORS.navy, fontFamily: "inherit", outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUS_FILTERS.map((f) => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${statusFilter === f ? COLORS.navy : COLORS.border}`, background: statusFilter === f ? COLORS.navy : COLORS.white, color: statusFilter === f ? "white" : COLORS.navyMid, fontSize: 12, fontWeight: 600, fontFamily: "'Josefin Sans', sans-serif", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", touchAction: "manipulation" }}
                >{f === "all" ? "All Status" : f}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRIORITY_FILTERS.map((f) => (
                <button key={f} onClick={() => setPriorityFilter(f)}
                  style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${priorityFilter === f ? COLORS.navy : COLORS.border}`, background: priorityFilter === f ? COLORS.navy : COLORS.white, color: priorityFilter === f ? "white" : COLORS.navyMid, fontSize: 12, fontWeight: 600, fontFamily: "'Josefin Sans', sans-serif", cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s", touchAction: "manipulation" }}
                >{f === "all" ? "All Priority" : f}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.navyMid, padding: "3rem 0", justifyContent: "center", fontSize: 14 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
              Loading callbacks…
            </div>
          ) : filtered.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "4rem 0", animation: "fadeUp 0.3s ease" }}>
                                    <div
                style={{
                    width: 72,
                    height: 72,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                }}
                >
                <Phone size={34} strokeWidth={1.8} color={COLORS.green} />
                </div>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>No callbacks found</p>
              <p style={{ fontSize: 13, color: COLORS.navyMid }}>Try adjusting your filters or schedule one.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease" }}>
              {filtered.map((cb, i) => {
                const ps = PRIORITY_STYLES[cb.priority] || PRIORITY_STYLES.normal;
                const ss = STATUS_STYLES[cb.status] || STATUS_STYLES.pending;
                const isActive = actionLoading === cb.id;

                return (
                  <div key={cb.id} className="cb-row"
                    style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: isMobile ? "0.9rem 1rem" : "1rem 1.25rem", display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 14, animation: `fadeUp ${0.05 + i * 0.03}s ease`, position: "relative", overflow: "hidden", flexWrap: isMobile ? "wrap" : "nowrap" }}
                  >
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ps.color, borderRadius: "14px 0 0 14px" }} />

                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.green, flexShrink: 0, marginLeft: 8 }}>
                      {getInitials(cb.patient_name)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{cb.patient_name}</p>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`, fontFamily: "'Josefin Sans', sans-serif" }}>{ps.label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, fontFamily: "'Josefin Sans', sans-serif" }}>{ss.label}</span>
                      </div>
                      <p style={{ fontSize: 13, color: COLORS.navy, marginBottom: 4 }}>{cb.reason}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: COLORS.navyMid }}>{cb.phone}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}>
                          <CalIcon /> {formatDateTime(cb.scheduled_for)}
                        </span>
                        {cb.assigned_to && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}>
                            <UserIcon /> {cb.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", marginLeft: isMobile ? 50 : 0, width: isMobile ? "100%" : "auto", alignItems: "center" }}>
                      {isActive
                        ? <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
                        : (
                          <>
                            {cb.status === "pending" && (
                              <>
                                <button
                                  onClick={() => setConfirmModal({ id: cb.id, action: "called", name: cb.patient_name })}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "none", background: COLORS.navy, color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
                                >
                                  <PhoneCallIcon /> Call Now
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ id: cb.id, action: "failed", name: cb.patient_name })}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.white, color: COLORS.navyMid, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
                                >
                                  Mark Failed
                                </button>
                              </>
                            )}
                            {cb.status === "called" && (
                              <button
                                onClick={() => setConfirmModal({ id: cb.id, action: "completed", name: cb.patient_name })}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#15803D", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}
                              >
                                Mark Complete
                              </button>
                            )}
                            {(cb.status === "completed" || cb.status === "failed") && (
                              <span style={{ fontSize: 12, color: COLORS.navyMid, fontStyle: "italic" }}>Closed</span>
                            )}
                          </>
                        )
                      }
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
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: confirmModal.action === "completed" ? "#F0FDF4" : confirmModal.action === "called" ? "#EFF6FF" : "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 22 }}>
              {confirmModal.action === "failed" ? "✕" : "✓"}
            </div>
            <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.navy, textAlign: "center", marginBottom: 8 }}>
              {confirmModal.action === "called" ? "Mark as Called?" : confirmModal.action === "completed" ? "Mark as Completed?" : "Mark as Failed?"}
            </h3>
            <p style={{ fontSize: 13, color: COLORS.navyMid, textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
              {confirmModal.action === "called"
                ? `Confirm you have called ${confirmModal.name}.`
                : confirmModal.action === "completed"
                ? `Mark ${confirmModal.name}'s callback as completed.`
                : `Mark ${confirmModal.name}'s callback as failed.`}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmModal(null)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.navyMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>
                Go Back
              </button>
              <button
                onClick={() => updateStatus(confirmModal.id, confirmModal.action)}
                style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation",
                  background: confirmModal.action === "failed" ? "#B91C1C" : confirmModal.action === "called" ? COLORS.navy : COLORS.green,
                  color: "white",
                }}
              >
                {confirmModal.action === "called" ? "Yes, Called" : confirmModal.action === "completed" ? "Confirm Done" : "Yes, Failed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowModal(false)}>
          <div style={{ background: COLORS.white, borderRadius: 20, padding: "2rem", maxWidth: 420, width: "100%", animation: "slideIn 0.2s ease", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 18, fontWeight: 700, color: COLORS.navy }}>Schedule Callback</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", fontSize: 22, color: COLORS.navyMid, cursor: "pointer", padding: "4px 8px" }}>×</button>
            </div>
            {([
              { label: "Patient Name", key: "patient_name",   type: "text"           },
              { label: "Phone",        key: "phone",          type: "text"           },
              { label: "Scheduled For",key: "scheduled_for",  type: "datetime-local" },
              { label: "Assigned To",  key: "assigned_to",    type: "text"           },
            ] as { label: string; key: keyof typeof newCb; type: string }[]).map(({ label, key, type }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{label}</label>
                <input type={type} value={newCb[key]} onChange={(e) => setNewCb((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Priority</label>
              <select value={newCb.priority} onChange={(e) => setNewCb((p) => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Reason</label>
              <textarea value={newCb.reason} onChange={(e) => setNewCb((p) => ({ ...p, reason: e.target.value }))} rows={3}
                style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.navyMid, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif" }}>Cancel</button>
              <button onClick={handleCreate} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: COLORS.navy, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Josefin Sans', sans-serif", touchAction: "manipulation" }}>Schedule</button>
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

export default function AdminCallbacksPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9F8" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E6F7F2", borderTopColor: "#3EB489", animation: "spin 0.7s linear infinite" }} />
      </div>
    }>
      <AdminCallbacksContent />
    </Suspense>
  );
}