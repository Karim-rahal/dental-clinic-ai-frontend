"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface PatientFile {
  id: string;
  filename: string;
  file_url: string;
  uploaded_at: string;
  file_type?: string;
}

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  files: PatientFile[];
  last_appointment?: string;
  appointment_count?: number;
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

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function ArrowLeftIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function SearchIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function FileIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function ImageIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
}
function DownloadIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function ChevronDownIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function PhoneIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function EmailIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function EyeIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function isImage(filename: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
}
function getFileExt(filename: string) {
  return filename.split(".").pop()?.toUpperCase() || "FILE";
}

// ─────────────────────────────────────────────
// File card
// ─────────────────────────────────────────────

function FileCard({ file, onPreview }: { file: PatientFile; onPreview: (f: PatientFile) => void }) {
  const img = isImage(file.filename);
  return (
    <div style={{ background: COLORS.offWhite, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: img ? COLORS.lightMint : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", color: img ? COLORS.green : COLORS.navyMid, flexShrink: 0, overflow: "hidden" }}>
        {img && file.file_url
          ? <img src={file.file_url} alt={file.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : img ? <ImageIcon /> : <FileIcon />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 12, fontWeight: 600, color: COLORS.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.filename}</p>
        <p style={{ fontSize: 11, color: COLORS.navyMid }}>{getFileExt(file.filename)} · {formatDate(file.uploaded_at)}</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {img && (
          <button onClick={() => onPreview(file)} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMid }} title="Preview">
            <EyeIcon />
          </button>
        )}
        <a href={file.file_url} download={file.filename} target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${COLORS.border}`, background: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navyMid, textDecoration: "none" }} title="Download">
          <DownloadIcon />
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Patient row
// ─────────────────────────────────────────────

function PatientRow({ patient }: { patient: Patient }) {
  const [expanded, setExpanded] = useState(false);
  const [preview, setPreview] = useState<PatientFile | null>(null);

  const avatarColors = ["#3EB489", "#4A9FD4", "#9B6FCF", "#F59E0B", "#E06B6B"];
  const color = avatarColors[patient.full_name.charCodeAt(0) % avatarColors.length];

  return (
    <>
      <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden", transition: "box-shadow 0.15s" }}>
        {/* Patient header row */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.25rem", cursor: "pointer" }}
          onClick={() => setExpanded((e) => !e)}
        >
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
            {getInitials(patient.full_name)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 14, fontWeight: 700, color: COLORS.navy, marginBottom: 3 }}>{patient.full_name}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}><EmailIcon /> {patient.email}</span>
              {patient.phone_number && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.navyMid }}><PhoneIcon /> {patient.phone_number}</span>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 18, fontWeight: 900, color: COLORS.navy }}>{patient.files?.length || 0}</p>
              <p style={{ fontSize: 10, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.08em" }}>Files</p>
            </div>
            {patient.appointment_count !== undefined && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 18, fontWeight: 900, color: COLORS.navy }}>{patient.appointment_count}</p>
                <p style={{ fontSize: 10, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.08em" }}>Visits</p>
              </div>
            )}
            {patient.last_appointment && (
              <div style={{ textAlign: "right", display: "none" }}>
                <p style={{ fontSize: 11, color: COLORS.navyMid }}>Last visit</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif" }}>{formatDate(patient.last_appointment)}</p>
              </div>
            )}
            <div style={{ color: COLORS.navyMid, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* Expanded files */}
        {expanded && (
          <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "1rem 1.25rem", background: COLORS.offWhite }}>
            {!patient.files || patient.files.length === 0 ? (
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <p style={{ fontSize: 13, color: COLORS.navyMid }}>No files uploaded by this patient yet.</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 10 }}>
                  Uploaded Files ({patient.files.length})
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                  {patient.files.map((f) => (
                    <FileCard key={f.id} file={f} onPreview={setPreview} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Image preview modal */}
      {preview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }} onClick={() => setPreview(null)}>
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <img src={preview.file_url} alt={preview.filename} style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 12, objectFit: "contain", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
            <div style={{ marginTop: 12, textAlign: "center" }}>
              <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{preview.filename}</p>
            </div>
            <button onClick={() => setPreview(null)} style={{ position: "absolute", top: -12, right: -12, width: 32, height: 32, borderRadius: "50%", background: "white", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.navy, fontWeight: 700 }}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function DoctorPatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/doctor/patients")
      .then((res) => setPatients(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.full_name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
  });

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
        @keyframes spin { to { transform:rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: COLORS.white, borderBottom: `1px solid ${COLORS.border}`, padding: "0 2rem", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/doctor/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontWeight: 500, fontFamily: "'Josefin Sans', sans-serif" }}>
            <ArrowLeftIcon /> Dashboard
          </Link>
          <div style={{ width: 1, height: 20, background: COLORS.border }} />
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy }}>Patients & Files</h1>
        </div>
        <Link href="/doctor/appointments" style={{ fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontFamily: "'Josefin Sans', sans-serif" }}>Appointments →</Link>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.75rem", animation: "fadeUp 0.3s ease" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 6 }}>Doctor Portal</p>
          <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 26, fontWeight: 900, color: COLORS.navy, marginBottom: 6 }}>Patient Records</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid }}>{patients.length} patient{patients.length !== 1 ? "s" : ""} · Click a row to view uploaded files</p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "1.5rem", animation: "fadeUp 0.35s ease" }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.navyMid }}><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 42px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: COLORS.white, fontSize: 14, color: COLORS.navy, fontFamily: "inherit", outline: "none" }}
          />
        </div>

        {/* Patient list */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.navyMid, padding: "4rem 0", justifyContent: "center", fontSize: 14 }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
            Loading patients…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>No patients found</p>
            <p style={{ fontSize: 13, color: COLORS.navyMid }}>Try a different search.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.4s ease" }}>
            {filtered.map((p) => <PatientRow key={p.id} patient={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}