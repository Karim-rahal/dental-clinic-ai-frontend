"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import api from "@/lib/api";
import { SERVICE_DOCS, DocSection } from "@/lib/serviceDocs";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Appointment {
  id: number;
  service: string;
  doctor_name?: string;
  doctorName?: string;
  date?: string;
  datetime?: string;
  status?: string;
}

interface UploadedFile {
  name: string;
  preview: string | null;
}

type UploadMap = Record<string, UploadedFile>;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const COLORS = {
  green: "#3EB489",
  mint: "#A7E4D8",
  lightMint: "#E6F7F2",
  navy: "#2C3E50",
  navyMid: "rgba(44,62,80,0.55)",
  navyLight: "rgba(44,62,80,0.07)",
  white: "#FFFFFF",
  offWhite: "#F7F9F8",
  border: "rgba(44,62,80,0.10)",
};

const SERVICE_META: Record<string, { accent: string; bg: string; tagline: string }> = {
  "Dental Checkup":          { accent: "#3EB489", bg: "#E6F7F2", tagline: "Comprehensive oral examination" },
  "Teeth Cleaning":          { accent: "#5BCFB5", bg: "#E1F9F4", tagline: "Professional scaling & polishing" },
  "Dental Filling":          { accent: "#4A9FD4", bg: "#E6F2FB", tagline: "Composite restoration" },
  "Teeth Whitening":         { accent: "#F0A500", bg: "#FEF6E4", tagline: "Advanced whitening treatment" },
  "Braces Consultation":     { accent: "#9B6FCF", bg: "#F3EEFF", tagline: "Orthodontic assessment" },
  "Root Canal":              { accent: "#E06B6B", bg: "#FEECEC", tagline: "Endodontic therapy" },
  "Root Canal Consultation": { accent: "#E06B6B", bg: "#FEECEC", tagline: "Endodontic assessment" },
};

// ─────────────────────────────────────────────
// Service Illustrations
// ─────────────────────────────────────────────

function ServiceIllustration({ service }: { service: string }) {
  const s = SERVICE_META[service] ?? { accent: COLORS.green, bg: COLORS.lightMint, tagline: "" };

  if (service === "Braces Consultation") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill={s.bg} />
        <rect x="14" y="28" width="36" height="10" rx="5" fill={s.accent} opacity="0.18" />
        {[20, 27, 34, 41].map((x) => (
          <rect key={x} x={x} y="26" width="5" height="14" rx="2.5" fill={s.accent} opacity="0.65" />
        ))}
        <line x1="18" y1="33" x2="46" y2="33" stroke={s.accent} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (service === "Root Canal" || service === "Root Canal Consultation") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill={s.bg} />
        <path d="M26 18 C22 18 18 22 18 28 C18 38 32 46 32 46 C32 46 46 38 46 28 C46 22 42 18 38 18 C35 18 33 20 32 22 C31 20 29 18 26 18Z" fill={s.accent} opacity="0.22" />
        <path d="M28 32 L28 42 M32 30 L32 44 M36 32 L36 42" stroke={s.accent} strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="26" r="4" fill={s.accent} opacity="0.55" />
      </svg>
    );
  }
  if (service === "Teeth Whitening") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill={s.bg} />
        <rect x="16" y="22" width="32" height="22" rx="8" fill={s.accent} opacity="0.13" />
        {[20, 28, 36].map((x) => (
          <rect key={x} x={x} y="24" width="6" height="18" rx="3" fill={s.accent} opacity="0.65" />
        ))}
        <circle cx="48" cy="18" r="4" fill={s.accent} opacity="0.35" />
        <line x1="44" y1="14" x2="46" y2="16" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="52" y1="14" x2="50" y2="16" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="48" y1="10" x2="48" y2="12" stroke={s.accent} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (service === "Dental Filling") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill={s.bg} />
        <rect x="20" y="22" width="24" height="26" rx="6" fill={s.accent} opacity="0.18" />
        <rect x="24" y="28" width="16" height="10" rx="3" fill={s.accent} opacity="0.65" />
        <line x1="32" y1="18" x2="32" y2="22" stroke={s.accent} strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="20" x2="38" y2="23" stroke={s.accent} strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="20" x2="26" y2="23" stroke={s.accent} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (service === "Teeth Cleaning") {
    return (
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="16" fill={s.bg} />
        <rect x="18" y="24" width="28" height="20" rx="6" fill={s.accent} opacity="0.16" />
        {[22, 29, 36].map((x) => (
          <rect key={x} x={x} y="26" width="5" height="16" rx="2.5" fill={s.accent} opacity="0.6" />
        ))}
        <path d="M14 36 Q18 30 22 36 Q26 42 30 36" stroke={s.accent} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="16" fill={s.bg} />
      <path d="M24 18 C20 18 16 22 16 28 C16 36 24 46 32 46 C40 46 48 36 48 28 C48 22 44 18 40 18 C37 18 34.5 20 32 22 C29.5 20 27 18 24 18Z" fill={s.accent} opacity="0.2" />
      <path d="M26 32 L26 40 M32 30 L32 42 M38 32 L38 40" stroke={s.accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="26" r="3.5" fill={s.accent} opacity="0.5" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

const Icon = {
  xray: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
      <circle cx="17" cy="16" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  photo: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="15" rx="2" />
      <circle cx="12" cy="13.5" r="3" />
      <path d="M8 6l1.5-3h5L16 6" />
    </svg>
  ),
  doc: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  upload: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  shield: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  calendar: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  stethoscope: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  arrowLeft: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getDoctorName(appt: Appointment): string {
  return appt.doctor_name ?? appt.doctorName ?? "Your Doctor";
}

function getFormattedDate(appt: Appointment): string {
  const raw = appt.date ?? appt.datetime;
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return raw;
  }
}

function computeStatus(apptId: number, service: string, uploaded: UploadMap): "pending" | "partial" | "done" {
  const sections = SERVICE_DOCS[service] ?? [];
  const allItems = sections.flatMap((s) => s.items);
  const doneCount = allItems.filter((item) => !!uploaded[`${apptId}_${item.id}`]).length;
  const requiredItems = sections.filter((s) => s.required).flatMap((s) => s.items);
  const allReqDone = requiredItems.length > 0 && requiredItems.every((item) => !!uploaded[`${apptId}_${item.id}`]);
  if (doneCount === 0) return "pending";
  if (allReqDone) return "done";
  return "partial";
}

// ─────────────────────────────────────────────
// Inner component (uses useSearchParams)
// ─────────────────────────────────────────────

function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState<UploadMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingKeyRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get("/appointments")
      .then((res) => {
        const appts: Appointment[] = res.data;
        setAppointments(appts);
        const targetId = appointmentIdParam
          ? parseInt(appointmentIdParam, 10)
          : appts[0]?.id ?? null;
        setSelectedId(targetId);
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message ?? "Failed to load appointments.");
        } else {
          setError("Failed to load appointments.");
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedAppt = appointments.find((a) => a.id === selectedId) ?? null;
  const sections: DocSection[] = selectedAppt ? (SERVICE_DOCS[selectedAppt.service] ?? []) : [];
  const allItems = sections.flatMap((s) => s.items);
  const uploadedCount = allItems.filter((item) => !!uploaded[`${selectedId}_${item.id}`]).length;
  const totalCount = allItems.length;
  const pct = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
  const requiredItems = sections.filter((s) => s.required).flatMap((s) => s.items);
  const allRequiredDone = requiredItems.length > 0 && requiredItems.every((item) => !!uploaded[`${selectedId}_${item.id}`]);
  const meta = selectedAppt ? (SERVICE_META[selectedAppt.service] ?? { accent: COLORS.green, bg: COLORS.lightMint, tagline: "" }) : null;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingKeyRef.current) return;
    const key = pendingKeyRef.current;
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploaded((prev) => ({ ...prev, [key]: { name: file.name, preview: ev.target?.result as string } }));
      };
      reader.readAsDataURL(file);
    } else {
      setUploaded((prev) => ({ ...prev, [key]: { name: file.name, preview: null } }));
    }
    e.target.value = "";
    pendingKeyRef.current = null;
  }, []);

  const triggerUpload = (key: string) => {
    pendingKeyRef.current = key;
    fileInputRef.current?.click();
  };

  const removeFile = (key: string) => {
    setUploaded((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleSubmit = async () => {
    if (!selectedAppt || !allRequiredDone) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      setSubmitSuccess(true);
      setAppointments((prev) =>
        prev.map((a) => a.id === selectedAppt.id ? { ...a, status: "done" } : a)
      );
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Submission failed. Please try again.");
      } else {
        setError("Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: COLORS.offWhite, gap: 16 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.75s linear infinite" }} />
        <p style={{ fontSize: 14, color: COLORS.navyMid, fontFamily: "'DM Sans', sans-serif" }}>Loading your appointments…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .appt-tab:hover  { border-color: ${COLORS.green} !important; background: ${COLORS.white} !important; }
        .doc-row:hover   { background: ${COLORS.lightMint} !important; border-color: ${COLORS.green} !important; border-style: solid !important; }
        .icon-btn:hover  { background: ${COLORS.green} !important; color: white !important; border-color: ${COLORS.green} !important; }
        .submit-btn:hover:not(:disabled) { background: ${COLORS.green} !important; }
        .nav-back:hover  { color: ${COLORS.green} !important; }
      `}</style>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.dcm" style={{ display: "none" }} onChange={handleFileChange} />

      <div style={{ padding: "2rem 1.5rem 4rem" }}>

        {/* TOP BAR */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <Link href="/patient/dashboard" className="nav-back" style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.navyMid, textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "color 0.15s" }}>
              {Icon.arrowLeft}
              <span>Dashboard</span>
            </Link>
            <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 22, fontWeight: 700, color: COLORS.navy, letterSpacing: "-0.5px" }}>
              Dent<span style={{ color: COLORS.green }}>AI</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, flexWrap: "wrap" }}>
            <span style={{ color: COLORS.green, fontWeight: 500 }}>Book</span>
            <span style={{ color: COLORS.navyMid }}>›</span>
            <span style={{ color: COLORS.green, fontWeight: 500 }}>Confirm</span>
            <span style={{ color: COLORS.navyMid }}>›</span>
            <span style={{ color: COLORS.navy, fontWeight: 600 }}>Upload Documents</span>
            <span style={{ color: COLORS.navyMid }}>›</span>
            <span style={{ color: COLORS.navyMid }}>Done</span>
          </div>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FEECEC", border: "1px solid #F5C4C4", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, color: "#A32D2D" }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#A32D2D", fontSize: 16, padding: 0 }}>✕</button>
          </div>
        )}

        {/* HERO */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "2.5rem", animation: "fadeUp 0.4s ease" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 10 }}>
              Document Upload Portal
            </p>
            <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 28, fontWeight: 700, color: COLORS.navy, lineHeight: 1.25, marginBottom: 10 }}>
              Upload your clinical documents
            </h1>
            <p style={{ fontSize: 14, color: COLORS.navyMid, maxWidth: 460, lineHeight: 1.75 }}>
              Select an appointment below — each treatment requires specific materials so your
              doctor can prepare a personalised care plan before your visit.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
            {[
              { icon: Icon.shield,      text: "End-to-end encrypted" },
              { icon: Icon.stethoscope, text: "Doctor-eyes only" },
              { icon: Icon.doc,         text: "JPEG · PNG · DICOM · PDF" },
            ].map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.navyMid }}>
                <span style={{ color: COLORS.green }}>{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>
        </div>

        {appointments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontSize: 15, color: COLORS.navyMid, marginBottom: 20 }}>No upcoming appointments found.</p>
            <Link href="/patient/appointments/book" style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "11px 26px", background: COLORS.navy, color: "white", borderRadius: 10, textDecoration: "none" }}>
              Book an Appointment
            </Link>
          </div>
        ) : (
          <>
            {/* APPOINTMENT TABS */}
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, marginBottom: "2rem", scrollbarWidth: "none" }}>
              {appointments.map((appt) => {
                const status = computeStatus(appt.id, appt.service, uploaded);
                const isSelected = appt.id === selectedId;
                const m = SERVICE_META[appt.service] ?? { accent: COLORS.green, bg: COLORS.lightMint };
                return (
                  <button
                    key={appt.id}
                    className="appt-tab"
                    onClick={() => { setSelectedId(appt.id); setSubmitSuccess(false); }}
                    style={{
                      flexShrink: 0, minWidth: 210,
                      background: isSelected ? COLORS.white : "rgba(255,255,255,0.6)",
                      border: isSelected ? `1.5px solid ${m.accent}` : `1px solid ${COLORS.border}`,
                      borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                      textAlign: "left", position: "relative", overflow: "hidden",
                      transition: "all 0.15s",
                      boxShadow: isSelected ? `0 4px 18px rgba(0,0,0,0.07)` : "none",
                    }}
                  >
                    {isSelected && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: m.accent, borderRadius: "14px 14px 0 0" }} />}
                    <div style={{ marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                        textTransform: "uppercase", letterSpacing: "0.4px",
                        background: status === "done" ? m.accent : status === "partial" ? m.bg : COLORS.navyLight,
                        color: status === "done" ? "white" : status === "partial" ? m.accent : COLORS.navyMid,
                      }}>
                        {status === "done" ? "Complete" : status === "partial" ? "In progress" : "Not started"}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>{appt.service}</div>
                    <div style={{ fontSize: 11, color: COLORS.navyMid, display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                      {Icon.stethoscope} {getDoctorName(appt)}
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.navyMid, display: "flex", alignItems: "center", gap: 5 }}>
                      {Icon.calendar} {getFormattedDate(appt)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* MAIN LAYOUT */}
            {selectedAppt && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: "1.5rem", alignItems: "start" }}>

                {/* LEFT COLUMN */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                  {/* Service banner */}
                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", animation: "fadeUp 0.3s ease" }}>
                    <ServiceIllustration service={selectedAppt.service} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: meta?.accent, textTransform: "uppercase", letterSpacing: "0.14em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 5 }}>
                        {meta?.tagline}
                      </p>
                      <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 19, fontWeight: 700, color: COLORS.navy, marginBottom: 5 }}>
                        {selectedAppt.service}
                      </h2>
                      <p style={{ fontSize: 13, color: COLORS.navyMid }}>
                        {getDoctorName(selectedAppt)} · {getFormattedDate(selectedAppt)}
                      </p>
                    </div>
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <svg width="58" height="58" viewBox="0 0 58 58">
                        <circle cx="29" cy="29" r="23" fill="none" stroke={COLORS.navyLight} strokeWidth="5" />
                        <circle cx="29" cy="29" r="23" fill="none" stroke={meta?.accent ?? COLORS.green} strokeWidth="5"
                          strokeDasharray={`${2 * Math.PI * 23}`}
                          strokeDashoffset={`${2 * Math.PI * 23 * (1 - pct / 100)}`}
                          strokeLinecap="round" transform="rotate(-90 29 29)"
                          style={{ transition: "stroke-dashoffset 0.5s ease" }}
                        />
                        <text x="29" y="34" textAnchor="middle" fontSize="12" fontWeight="700" fill={COLORS.navy} fontFamily="'Josefin Sans', sans-serif">{pct}%</text>
                      </svg>
                      <span style={{ fontSize: 10, color: COLORS.navyMid }}>{uploadedCount}/{totalCount} files</span>
                    </div>
                  </div>

                  {/* Document sections */}
                  {sections.length === 0 ? (
                    <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "3rem", textAlign: "center" }}>
                      <p style={{ color: COLORS.navyMid, fontSize: 14 }}>No documents required for this service.</p>
                    </div>
                  ) : sections.map((section, si) => (
                    <div key={section.section} style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden", animation: `fadeUp ${0.3 + si * 0.08}s ease` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem 1.25rem", borderBottom: `1px solid ${COLORS.border}`, background: section.required ? `${section.color}55` : COLORS.offWhite }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: section.color, color: section.iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {section.iconType === "xray" ? Icon.xray : section.iconType === "photo" ? Icon.photo : Icon.doc}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 11, fontWeight: 700, color: COLORS.navy, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{section.section}</div>
                          <div style={{ fontSize: 11, color: COLORS.navyMid }}>{section.desc}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.4px", background: section.required ? "#FEECEC" : COLORS.lightMint, color: section.required ? "#A32D2D" : "#0F6E56", flexShrink: 0 }}>
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
                              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: `1px ${isUploaded ? "solid" : "dashed"} ${isUploaded ? COLORS.green : COLORS.border}`, background: isUploaded ? COLORS.lightMint : "transparent", cursor: isUploaded ? "default" : "pointer", transition: "all 0.12s" }}
                            >
                              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: isUploaded ? (file.preview ? "transparent" : COLORS.lightMint) : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                                {isUploaded && file.preview ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={file.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : isUploaded ? (
                                  <span style={{ color: COLORS.green }}>{Icon.check}</span>
                                ) : (
                                  <span style={{ color: COLORS.navyMid, opacity: 0.4 }}>{Icon.doc}</span>
                                )}
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
                                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); triggerUpload(key); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "5px 12px", borderRadius: 20, border: `1px solid ${COLORS.border}`, background: "transparent", cursor: "pointer", color: COLORS.navyMid, fontFamily: "inherit", transition: "all 0.12s", flexShrink: 0 }}>
                                  {Icon.upload} Upload
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ position: "sticky", top: 24, display: "flex", flexDirection: "column", gap: "1rem" }}>
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
                                {allDone ? Icon.check : <span style={{ fontSize: 9, fontWeight: 700 }}>{done}</span>}
                              </div>
                              <span style={{ fontSize: 12, color: allDone ? COLORS.navy : COLORS.navyMid, fontWeight: allDone ? 500 : 400 }}>{section.section}</span>
                            </div>
                            <span style={{ fontSize: 11, color: COLORS.navyMid, flexShrink: 0 }}>{done}/{section.items.length}</span>
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
                      {!allRequiredDone && requiredItems.length > 0 && (
                        <div style={{ background: "#FEF6E4", border: "1px solid #FAC775", borderRadius: 8, padding: "9px 12px", fontSize: 11, color: "#854F0B", lineHeight: 1.55 }}>
                          {requiredItems.filter((i) => !uploaded[`${selectedId}_${i.id}`]).length} required file(s) still needed.
                        </div>
                      )}
                      {submitSuccess ? (
                        <div style={{ background: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#0F6E56", lineHeight: 1.6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, marginBottom: 4 }}>{Icon.check} Submitted successfully</div>
                          {getDoctorName(selectedAppt)} will review your documents before your appointment.
                        </div>
                      ) : (
                        <button className="submit-btn" disabled={!allRequiredDone || submitting} onClick={handleSubmit}
                          style={{ width: "100%", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "13px 0", background: allRequiredDone && !submitting ? COLORS.navy : COLORS.navyLight, color: allRequiredDone && !submitting ? "white" : COLORS.navyMid, border: "none", borderRadius: 10, cursor: allRequiredDone && !submitting ? "pointer" : "not-allowed", transition: "background 0.15s" }}>
                          {submitting ? "Submitting…" : allRequiredDone ? "Submit for Review" : "Upload required files first"}
                        </button>
                      )}
                      {submitSuccess && (
                        <button onClick={() => router.push("/patient/dashboard")} style={{ width: "100%", fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, padding: "12px 0", background: COLORS.green, color: "white", border: "none", borderRadius: 10, cursor: "pointer" }}>
                          Go to Dashboard
                        </button>
                      )}
                      <p style={{ fontSize: 11, color: COLORS.navyMid, textAlign: "center", lineHeight: 1.6 }}>You can replace or add files at any time from your dashboard.</p>
                    </div>
                  </div>

                  <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1rem 1.25rem" }}>
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: COLORS.green, marginBottom: 8 }}>Tips for better results</p>
                    {["Ensure X-rays are clear and fully in-frame", "Photos should be taken in good natural lighting", "DICOM files are preferred over printed scans", "Label files clearly before uploading"].map((tip, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6, fontSize: 12, color: COLORS.navyMid, lineHeight: 1.5 }}>
                        <span style={{ color: COLORS.green, marginTop: 2, flexShrink: 0 }}>{Icon.check}</span>{tip}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Default export with Suspense boundary
// ─────────────────────────────────────────────

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F9F8" }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E6F7F2", borderTopColor: "#3EB489", animation: "spin 0.7s linear infinite" }} />
      </div>
    }>
      <UploadPageContent />
    </Suspense>
  );
}
