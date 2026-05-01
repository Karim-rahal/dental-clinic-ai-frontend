"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { SERVICE_DOCS, DocSection } from "@/lib/serviceDocs";
import api from "@/lib/api";


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Appointment {
  id: number;
  service: string;
  doctorName: string;
  date: string;        
  status: "pending" | "partial" | "done";
}

interface UploadedFile {
  name: string;
  preview: string | null; 
}

// key = `${appointmentId}_${docItemId}`
type UploadMap = Record<string, UploadedFile>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLORS = {
  green: "#3EB489",
  mint: "#A7E4D8",
  lightMint: "#E6F7F2",
  navy: "#2C3E50",
  navyMid: "rgba(44,62,80,0.5)",
  white: "#FFFFFF",
};

function computeStatus(
  apptId: number,
  service: string,
  uploaded: UploadMap
): "pending" | "partial" | "done" {
  const sections = SERVICE_DOCS[service] ?? [];
  const allItems = sections.flatMap((s) => s.items);
  const doneCount = allItems.filter(
    (item) => !!uploaded[`${apptId}_${item.id}`]
  ).length;
  const requiredItems = sections
    .filter((s) => s.required)
    .flatMap((s) => s.items);
  const allRequiredDone = requiredItems.every(
    (item) => !!uploaded[`${apptId}_${item.id}`]
  );
  if (doneCount === 0) return "pending";
  if (allRequiredDone) return "done";
  return "partial";
}

// ---------------------------------------------------------------------------
// SVG Icon components (no emoji, no external icon lib dependency)
// ---------------------------------------------------------------------------

function XrayIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
      <circle cx="17" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PhotoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="2" y="6" width="20" height="15" rx="2" />
      <circle cx="12" cy="13.5" r="3.5" />
      <path d="M8 6l1.5-3h5L16 6" />
    </svg>
  );
}

function DocIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function UploadIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SectionIcon({ type }: { type: DocSection["iconType"] }) {
  if (type === "xray") return <XrayIcon size={18} />;
  if (type === "photo") return <PhotoIcon size={18} />;
  return <DocIcon size={18} />;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");

  // ------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [uploaded, setUploaded] = useState<UploadMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tracks which doc item key the hidden file input should write to
  const pendingKeyRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------------
  // Load appointments on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    const load = () => {
      api
  .get("/appointments")
  
        .then((res) => {
          const appts: Appointment[] = res.data;
          setAppointments(appts);

          // Pre-select from query param or first appointment
          const targetId = appointmentIdParam
            ? parseInt(appointmentIdParam, 10)
            : appts[0]?.id ?? null;
          setSelectedId(targetId);
        })
        .catch((err) => {
          if (axios.isAxiosError(err)) {
            setError(
              err.response?.data?.message ?? "Failed to load appointments."
            );
          } else {
            setError("Failed to load appointments.");
          }
        })
        .finally(() => setLoading(false));
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------------
  const selectedAppt = appointments.find((a) => a.id === selectedId) ?? null;
  const sections: DocSection[] = selectedAppt
    ? (SERVICE_DOCS[selectedAppt.service] ?? [])
    : [];
  const allItems = sections.flatMap((s) => s.items);
  const uploadedForAppt = allItems.filter(
    (item) => !!uploaded[`${selectedId}_${item.id}`]
  ).length;
  const totalForAppt = allItems.length;
  const pct =
    totalForAppt > 0 ? Math.round((uploadedForAppt / totalForAppt) * 100) : 0;

  const requiredItems = sections
    .filter((s) => s.required)
    .flatMap((s) => s.items);
  const allRequiredDone = requiredItems.every(
    (item) => !!uploaded[`${selectedId}_${item.id}`]
  );

  // ------------------------------------------------------------------
  // File upload handler
  // ------------------------------------------------------------------
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !pendingKeyRef.current) return;

      const key = pendingKeyRef.current;
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setUploaded((prev) => ({
            ...prev,
            [key]: { name: file.name, preview: ev.target?.result as string },
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setUploaded((prev) => ({
          ...prev,
          [key]: { name: file.name, preview: null },
        }));
      }

      // Reset input so same file can be re-selected
      e.target.value = "";
      pendingKeyRef.current = null;
    },
    []
  );

  const triggerUpload = (key: string) => {
    pendingKeyRef.current = key;
    fileInputRef.current?.click();
  };

  const removeFile = (key: string) => {
    setUploaded((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // ------------------------------------------------------------------
  // Submit handler
  // ------------------------------------------------------------------
  const handleSubmit = async () => {
  if (!selectedAppt || !allRequiredDone) return;
  setSubmitting(true);
  // TODO: connect to backend when ready
  // await api.post(`/appointments/${selectedAppt.id}/documents/submit`);
  setTimeout(() => {
    setSubmitSuccess(true);
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === selectedAppt.id ? { ...a, status: "done" } : a
      )
    );
    setSubmitting(false);
  }, 800); 
};
  // ------------------------------------------------------------------
  // Compute live status badge for each appointment card
  // ------------------------------------------------------------------
  const liveStatus = (appt: Appointment): "pending" | "partial" | "done" =>
    computeStatus(appt.id, appt.service, uploaded);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading your appointments…</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.dcm"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* ── Top bar ── */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <Link href="/patient/dashboard" style={styles.backLink}>
            <ArrowLeftIcon size={16} />
            <span>Dashboard</span>
          </Link>
          <div style={styles.logo}>
            Dent<span style={{ color: COLORS.green }}>AI</span>
          </div>
        </div>

        <div style={styles.stepTrail}>
          <span style={styles.stepDone}>Book</span>
          <span style={styles.stepSep}>›</span>
          <span style={styles.stepDone}>Confirm</span>
          <span style={styles.stepSep}>›</span>
          <span style={styles.stepActive}>Upload Documents</span>
          <span style={styles.stepSep}>›</span>
          <span style={styles.stepFuture}>Done</span>
        </div>
      </div>

      {/* ── Global error ── */}
      {error && (
        <div style={styles.errorBanner}>
          <span>{error}</span>
          <button style={styles.errorClose} onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ── Page heading ── */}
      <div style={styles.pageHeading}>
        <h1 style={styles.pageTitle}>Upload your documents</h1>
        <p style={styles.pageSubtitle}>
          Select an appointment below — each service requires different materials
          for your doctor to review before your visit.
        </p>
      </div>

      {/* ── Appointment selector ── */}
      {appointments.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No upcoming appointments found.</p>
          <Link href="/patient/appointments/book" style={styles.bookLink}>
            Book an appointment
          </Link>
        </div>
      ) : (
        <div style={styles.apptGrid}>
          {appointments.map((appt) => {
            const status = liveStatus(appt);
            const isSelected = appt.id === selectedId;
            return (
              <button
                key={appt.id}
                style={{
                  ...styles.apptCard,
                  ...(isSelected ? styles.apptCardSelected : {}),
                }}
                onClick={() => {
                  setSelectedId(appt.id);
                  setSubmitSuccess(false);
                }}
              >
                {/* Selected accent bar */}
                {isSelected && <div style={styles.apptAccentBar} />}

                {/* Status badge */}
                <span
                  style={{
                    ...styles.statusBadge,
                    ...(status === "done"
                      ? styles.statusDone
                      : status === "partial"
                      ? styles.statusPartial
                      : styles.statusPending),
                  }}
                >
                  {status === "done"
                    ? "Complete"
                    : status === "partial"
                    ? "In progress"
                    : "Awaiting upload"}
                </span>

                <div style={styles.servicePill}>{appt.service}</div>
                <div style={styles.apptDoctor}>{appt.doctorName}</div>
                <div style={styles.apptDate}>{appt.date}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Info strip ── */}
      <div style={styles.infoStrip}>
        <ShieldIcon size={14} />
        <span>
          All files are end-to-end encrypted and only accessible by your
          assigned doctor. Accepted formats: JPEG, PNG, DICOM (.dcm), PDF.
        </span>
      </div>

      {/* ── Upload content ── */}
      {selectedAppt && sections.length > 0 && (
        <>
          {/* Progress */}
          <div style={styles.progressWrap}>
            <div style={styles.progressTrack}>
              <div
                style={{ ...styles.progressFill, width: `${pct}%` }}
              />
            </div>
            <p style={styles.progressLabel}>
              <strong>{uploadedForAppt}</strong> of{" "}
              <strong>{totalForAppt}</strong> documents uploaded for{" "}
              <strong>{selectedAppt.service}</strong>
            </p>
          </div>

          {/* Document sections grid */}
          <div style={styles.docGrid}>
            {sections.map((section) => (
              <div key={section.section} style={styles.docSection}>
                {/* Section header */}
                <div style={styles.docSectionHeader}>
                  <div
                    style={{
                      ...styles.docIconWrap,
                      background: section.color,
                      color: section.iconColor,
                    }}
                  >
                    <SectionIcon type={section.iconType} />
                  </div>
                  <div style={styles.docMeta}>
                    <h3 style={styles.docSectionTitle}>{section.section}</h3>
                    <p style={styles.docSectionDesc}>{section.desc}</p>
                  </div>
                  <span
                    style={{
                      ...styles.reqBadge,
                      ...(section.required
                        ? styles.reqBadgeRequired
                        : styles.reqBadgeOptional),
                    }}
                  >
                    {section.required ? "Required" : "Optional"}
                  </span>
                </div>

                {/* Document items */}
                <div style={styles.itemList}>
                  {section.items.map((item) => {
                    const key = `${selectedId}_${item.id}`;
                    const file = uploaded[key];
                    const isUploaded = !!file;

                    return (
                      <div
                        key={item.id}
                        style={{
                          ...styles.docItem,
                          ...(isUploaded ? styles.docItemUploaded : {}),
                        }}
                        onClick={() => !isUploaded && triggerUpload(key)}
                      >
                        {/* Thumbnail */}
                        <div style={styles.thumb}>
                          {isUploaded && file.preview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.preview}
                              alt={file.name}
                              style={styles.thumbImg}
                            />
                          ) : isUploaded ? (
                            <span style={{ color: COLORS.green }}>
                              <CheckIcon size={16} />
                            </span>
                          ) : (
                            <span style={{ opacity: 0.35 }}>
                              <DocIcon size={16} />
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={styles.docItemInfo}>
                          <div style={styles.docItemLabel}>{item.label}</div>
                          <div style={styles.docItemHint}>
                            {isUploaded ? file.name : item.hint}
                          </div>
                        </div>

                        {/* Action */}
                        <div style={styles.docItemAction}>
                          {isUploaded ? (
                            <div style={styles.uploadedActions}>
                              <button
                                style={styles.replaceBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerUpload(key);
                                }}
                              >
                                Replace
                              </button>
                              <button
                                style={styles.removeBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(key);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              style={styles.uploadBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerUpload(key);
                              }}
                            >
                              <UploadIcon size={13} />
                              <span>Upload</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── Submit row ── */}
          {submitSuccess ? (
            <div style={styles.successBanner}>
              <CheckIcon size={16} />
              <span>
               Documents submitted! {selectedAppt.doctorName ?? "Your doctor"}{" "}
              </span>
              <button
                style={styles.dashBtn}
                onClick={() => router.push("/patient/dashboard")}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div style={styles.submitRow}>
              <p style={styles.submitNote}>
                Your doctor will review these files before your appointment. You
                can upload more or replace files at any time from your dashboard.
              </p>
              <button
                style={{
                  ...styles.submitBtn,
                  ...(allRequiredDone && !submitting
                    ? {}
                    : styles.submitBtnDisabled),
                }}
                disabled={!allRequiredDone || submitting}
                onClick={handleSubmit}
              >
                {submitting
                  ? "Submitting…"
                  : allRequiredDone
                  ? "Submit for Review"
                  : "Upload required files first"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Edge case: service not mapped */}
      {selectedAppt && sections.length === 0 && (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>
            No documents are required for{" "}
            <strong>{selectedAppt.service}</strong>. Your doctor will prepare
            everything on the day of your appointment.
          </p>
          <Link href="/patient/dashboard" style={styles.bookLink}>
            Back to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (inline, consistent with existing DentAI color palette)
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#F4F7F6",
    padding: "2rem 1.5rem 4rem",
    fontFamily: "'DM Sans', 'Inter', sans-serif",
  },

  // Loading
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    gap: "1rem",
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: `3px solid ${COLORS.lightMint}`,
    borderTopColor: COLORS.green,
    animation: "spin 0.8s linear infinite",
  },
  loadingText: {
    color: COLORS.navyMid,
    fontSize: 14,
  },

  // Top bar
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2rem",
    flexWrap: "wrap" as const,
    gap: "1rem",
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: COLORS.navyMid,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 500,
    transition: "color 0.15s",
  },
  logo: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.navy,
    letterSpacing: "-0.5px",
  },

  // Step trail
  stepTrail: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    flexWrap: "wrap" as const,
  },
  stepDone: { color: COLORS.green, fontWeight: 500 },
  stepSep: { color: COLORS.navyMid },
  stepActive: { color: COLORS.navy, fontWeight: 600 },
  stepFuture: { color: COLORS.navyMid },

  // Error banner
  errorBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: "#FAECE7",
    border: "0.5px solid #F0997B",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13,
    color: "#993C1D",
    marginBottom: "1.5rem",
  },
  errorClose: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#993C1D",
    fontSize: 14,
    padding: 0,
    flexShrink: 0,
  },

  // Page heading
  pageHeading: { marginBottom: "1.5rem" },
  pageTitle: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 26,
    fontWeight: 700,
    color: COLORS.navy,
    marginBottom: 6,
  },
  pageSubtitle: { fontSize: 14, color: COLORS.navyMid, maxWidth: 600 },

  // Appointment selector grid
  apptGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: "1.5rem",
  },
 apptCard: {
  position: "relative",
  background: COLORS.white,
  borderStyle: "solid",         // split into separate properties
  borderWidth: "0.5px",
  borderColor: "rgba(44,62,80,0.12)",
  borderRadius: 12,
  padding: "1rem 1.25rem",
  cursor: "pointer",
  textAlign: "left",
  transition: "border-color 0.15s",
  overflow: "hidden",
},
apptCardSelected: {
  borderColor: COLORS.green,
  borderWidth: "1.5px",        // now consistent, no shorthand conflict
},
  apptAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    background: COLORS.green,
    borderRadius: "12px 0 0 12px",
  },
  statusBadge: {
    display: "inline-block",
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  statusPending: { background: "#FFF3CD", color: "#8B6800" },
  statusPartial: { background: COLORS.lightMint, color: "#0F6E56" },
  statusDone: { background: COLORS.green, color: COLORS.white },
  servicePill: {
    display: "inline-flex",
    alignItems: "center",
    background: COLORS.lightMint,
    color: "#0F6E56",
    fontSize: 11,
    fontWeight: 500,
    padding: "3px 8px",
    borderRadius: 20,
    marginBottom: 8,
  },
  apptDoctor: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.navy,
    marginBottom: 4,
  },
  apptDate: { fontSize: 12, color: COLORS.navyMid },

  // Info strip
  infoStrip: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: COLORS.lightMint,
    border: `0.5px solid ${COLORS.mint}`,
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 12,
    color: "#0F6E56",
    marginBottom: "1.75rem",
  },

  // Progress
  progressWrap: { marginBottom: "1.5rem" },
  progressTrack: {
    background: "rgba(44,62,80,0.08)",
    borderRadius: 20,
    height: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    background: COLORS.green,
    borderRadius: 20,
    transition: "width 0.4s ease",
  },
  progressLabel: { fontSize: 13, color: COLORS.navyMid },

  // Document sections grid
  docGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 16,
    marginBottom: "2rem",
  },
  docSection: {
    background: COLORS.white,
    border: "0.5px solid rgba(44,62,80,0.12)",
    borderRadius: 12,
    overflow: "hidden",
  },
  docSectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "1rem 1.25rem 0.85rem",
    borderBottom: "0.5px solid rgba(44,62,80,0.08)",
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  docMeta: { flex: 1 },
  docSectionTitle: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.navy,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    marginBottom: 2,
  },
  docSectionDesc: { fontSize: 11, color: COLORS.navyMid },
  reqBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 20,
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
    flexShrink: 0,
  },
  reqBadgeRequired: { background: "#FAECE7", color: "#993C1D" },
  reqBadgeOptional: { background: COLORS.lightMint, color: "#0F6E56" },

  // Document items
  itemList: {
    padding: "0.85rem 1.25rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  docItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    border: "0.5px dashed rgba(44,62,80,0.2)",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.12s, border-color 0.12s",
  },
  docItemUploaded: {
    borderStyle: "solid",
    borderColor: COLORS.green,
    background: COLORS.lightMint,
    cursor: "default",
  },
  thumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
    background: "rgba(44,62,80,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },
  docItemInfo: { flex: 1, minWidth: 0 },
  docItemLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: COLORS.navy,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  docItemHint: {
    fontSize: 11,
    color: COLORS.navyMid,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  docItemAction: { flexShrink: 0 },

  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: 20,
    border: "0.5px solid rgba(44,62,80,0.2)",
    background: "transparent",
    cursor: "pointer",
    color: COLORS.navyMid,
    transition: "all 0.12s",
    fontFamily: "inherit",
  },
  uploadedActions: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  replaceBtn: {
    fontSize: 11,
    fontWeight: 500,
    padding: "4px 9px",
    borderRadius: 20,
    border: `0.5px solid ${COLORS.green}`,
    background: "transparent",
    cursor: "pointer",
    color: COLORS.green,
    fontFamily: "inherit",
  },
  removeBtn: {
    fontSize: 11,
    padding: "4px 7px",
    borderRadius: 20,
    border: "0.5px solid rgba(44,62,80,0.2)",
    background: "transparent",
    cursor: "pointer",
    color: COLORS.navyMid,
    fontFamily: "inherit",
  },

  // Submit row
  submitRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: 16,
    paddingTop: "0.5rem",
  },
  submitNote: {
    fontSize: 13,
    color: COLORS.navyMid,
    maxWidth: 400,
    lineHeight: 1.5,
  },
  submitBtn: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.5px",
    padding: "12px 32px",
    background: COLORS.navy,
    color: COLORS.white,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  submitBtnDisabled: {
    background: "rgba(44,62,80,0.2)",
    color: COLORS.navyMid,
    cursor: "not-allowed",
  },

  // Success banner
  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: COLORS.lightMint,
    border: `0.5px solid ${COLORS.mint}`,
    borderRadius: 10,
    padding: "14px 20px",
    fontSize: 14,
    color: "#0F6E56",
    flexWrap: "wrap" as const,
  },
  dashBtn: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    padding: "8px 20px",
    background: COLORS.navy,
    color: COLORS.white,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginLeft: "auto",
  },

  // Empty / no-service state
  emptyState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: "4rem 0",
    textAlign: "center" as const,
  },
  emptyText: { fontSize: 15, color: COLORS.navyMid },
  bookLink: {
    fontFamily: "'Josefin Sans', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 24px",
    background: COLORS.navy,
    color: COLORS.white,
    borderRadius: 8,
    textDecoration: "none",
  },
};