"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Doctor {
  id: string;
  full_name: string;
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

const SERVICES = [
  { id: "Dental Checkup",        icon: "M24 18C20 18 16 22 16 28C16 36 24 46 32 46C40 46 48 36 48 28C48 22 44 18 40 18C37 18 34.5 20 32 22C29.5 20 27 18 24 18Z", accent: "#3EB489", desc: "Full oral exam & digital X-rays" },
  { id: "Teeth Cleaning",        icon: "M18 24h28v20a6 6 0 0 1-6 6H24a6 6 0 0 1-6-6V24zM22 24V18a10 10 0 0 1 20 0v6", accent: "#5BCFB5", desc: "Scaling, polishing & stain removal" },
  { id: "Dental Filling",        icon: "M20 22h24v26a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6V22zM24 28h16v10H24z", accent: "#4A9FD4", desc: "Tooth-coloured composite fillings" },
  { id: "Teeth Whitening",       icon: "M16 22h32v22a8 8 0 0 1-8 8H24a8 8 0 0 1-8-8V22zM20 24v18M28 24v18M36 24v18", accent: "#F0A500", desc: "Up to 8 shades brighter in one session" },
  { id: "Braces Consultation",   icon: "M14 28h36v10a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V28zM20 26V24M27 26V24M34 26V24M41 26V24M14 33h36", accent: "#9B6FCF", desc: "Orthodontic planning & aligner assessment" },
  { id: "Root Canal Consultation", icon: "M26 18C22 18 18 22 18 28C18 38 32 46 32 46C32 46 46 38 46 28C46 22 42 18 38 18C35 18 33 20 32 22C31 20 29 18 26 18ZM28 32L28 42M32 30L32 44M36 32L36 42", accent: "#E06B6B", desc: "Pain-free endodontic therapy" },
];

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTime(time: string) {
  const [hour] = time.split(":");
  const h = parseInt(hour);
  return h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
}

// ─────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────

function StepBar({ step }: { step: number }) {
  const steps = ["Service", "Doctor & Date", "Confirm"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "2.5rem" }}>
      {steps.map((label, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: done ? COLORS.green : active ? COLORS.navy : COLORS.navyLight,
                color: done || active ? "white" : COLORS.navyMid,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                fontFamily: "'Josefin Sans', sans-serif",
                transition: "all 0.25s",
              }}>
                {done ? <CheckIcon /> : num}
              </div>
              <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? COLORS.navy : COLORS.navyMid, whiteSpace: "nowrap", fontFamily: "'Josefin Sans', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: done ? COLORS.green : COLORS.border, margin: "0 8px", marginBottom: 22, transition: "background 0.25s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function BookPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [form, setForm] = useState({ service: "", doctor_id: "", date: "", time: "" });
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/doctors").then((res) => setDoctors(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.phone_number) {
      api.get("/me").then((res) => { if (res.data?.phone_number) setPhoneNumber(res.data.phone_number); }).catch(() => {});
    } else {
      setPhoneNumber(user.phone_number);
    }
  }, [user]);

  useEffect(() => {
    if (!form.doctor_id || !form.date) return;
    setSlotsLoading(true);
    setSlots([]);
    api
      .get(`/doctors/${form.doctor_id}/slots?date=${form.date}`)
      .then((res) => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [form.doctor_id, form.date]);

  const today = new Date().toISOString().split("T")[0];

  const selectedService = SERVICES.find((s) => s.id === form.service);
  const selectedDoctor  = doctors.find((d) => d.id === form.doctor_id);

  const handleSubmit = async () => {
    setError("");
    if (!form.service || !form.doctor_id || !form.date || !form.time) {
      setError("Please fill in all fields.");
      return;
    }
    if (!phoneNumber) {
      setError("Your account has no phone number. Please update your profile first.");
      return;
    }
    setLoading(true);
    try {
      const datetime = new Date(`${form.date}T${form.time}:00`).toISOString();
      await api.post("/appointments", {
        patient_name: user?.full_name,
        phone_number: phoneNumber,
        service: form.service,
        datetime,
        doctor_id: form.doctor_id,
      });
      setSuccess(true);
      setTimeout(() => router.push("/patient/appointments"), 2200);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || "Booking failed. Please try again.");
      } else {
        setError("Booking failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.offWhite, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap'); @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } } @keyframes scaleIn { from { transform:scale(0.7); opacity:0; } to { transform:scale(1); opacity:1; } }`}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease", maxWidth: 400, padding: "2rem" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", animation: "scaleIn 0.4s ease" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h2 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 24, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>Appointment Booked!</h2>
          <p style={{ fontSize: 14, color: COLORS.navyMid, lineHeight: 1.7, marginBottom: 6 }}>
            Your <strong>{form.service}</strong> appointment with <strong>{selectedDoctor?.full_name}</strong> has been confirmed.
          </p>
          <p style={{ fontSize: 13, color: COLORS.navyMid }}>Redirecting to your appointments…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.offWhite, fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .service-card:hover  { border-color: var(--accent) !important; background: var(--bg) !important; }
        .slot-btn:hover:not(.slot-active) { border-color: ${COLORS.green} !important; color: ${COLORS.green} !important; }
        .nav-back:hover { color: ${COLORS.green} !important; }
        .next-btn:hover:not(:disabled) { background: ${COLORS.green} !important; }
        .doctor-opt:hover { border-color: ${COLORS.green} !important; }
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
            <span>Book Appointment</span>
          </div>
        </div>
        <Link href="/patient/dashboard" className="nav-back" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: COLORS.navyMid, textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}>
          <ArrowLeftIcon /> Dashboard
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>

        {/* ── HEADING ── */}
        <div style={{ marginBottom: "2rem", animation: "fadeUp 0.35s ease" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.green, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 8 }}>
            Online Booking
          </p>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 28, fontWeight: 700, color: COLORS.navy, marginBottom: 8 }}>
            Book an Appointment
          </h1>
          <p style={{ fontSize: 14, color: COLORS.navyMid }}>
            Choose your service, preferred doctor, and a time that works for you.
          </p>
        </div>

        {/* ── STEP BAR ── */}
        <StepBar step={step} />

        {/* ── ERROR ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FEECEC", border: "1px solid #F5C4C4", borderRadius: 10, padding: "12px 16px", marginBottom: "1.5rem", fontSize: 13, color: "#A32D2D" }}>
            <span>{error}</span>
            <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#A32D2D", fontSize: 16, padding: 0 }}>✕</button>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 1 — Service selection
        ════════════════════════════════ */}
        {step === 1 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "'Josefin Sans', sans-serif" }}>
              Select a service
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: "2rem" }}>
              {SERVICES.map((s) => {
                const isSelected = form.service === s.id;
                return (
                  <button
                    key={s.id}
                    className="service-card"
                    onClick={() => setForm((f) => ({ ...f, service: s.id }))}
                    // @ts-expect-error CSS custom property
                    style={{ "--accent": s.accent, "--bg": s.accent + "12",
                      textAlign: "left", background: isSelected ? s.accent + "14" : COLORS.white,
                      border: `1.5px solid ${isSelected ? s.accent : COLORS.border}`,
                      borderRadius: 14, padding: "1.1rem 1.1rem 1rem",
                      cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                      boxShadow: isSelected ? `0 4px 18px ${s.accent}22` : "none",
                    }}
                  >
                    {/* Mini SVG tooth illustration */}
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? s.accent + "25" : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                      <svg width="22" height="22" viewBox="0 0 64 64" fill="none" stroke={isSelected ? s.accent : COLORS.navyMid} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={s.icon} />
                      </svg>
                    </div>
                    <div style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 5 }}>{s.id}</div>
                    <div style={{ fontSize: 11, color: COLORS.navyMid, lineHeight: 1.5 }}>{s.desc}</div>
                    {isSelected && (
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: s.accent }}>
                        <CheckIcon /> Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className="next-btn"
                disabled={!form.service}
                onClick={() => setStep(2)}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "13px 32px", background: form.service ? COLORS.navy : COLORS.navyLight, color: form.service ? "white" : COLORS.navyMid, border: "none", borderRadius: 10, cursor: form.service ? "pointer" : "not-allowed", transition: "background 0.15s" }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 2 — Doctor, Date & Time
        ════════════════════════════════ */}
        {step === 2 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>

            {/* Selected service recap */}
            {selectedService && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: "1.5rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: selectedService.accent + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 64 64" fill="none" stroke={selectedService.accent} strokeWidth="2.5" strokeLinecap="round">
                    <path d={selectedService.icon} />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, fontFamily: "'Josefin Sans', sans-serif" }}>{selectedService.id}</div>
                  <div style={{ fontSize: 11, color: COLORS.navyMid }}>{selectedService.desc}</div>
                </div>
                <button onClick={() => setStep(1)} style={{ fontSize: 11, color: COLORS.green, background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>Change</button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Doctor */}
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1.25rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 12 }}>
                  <UserIcon /> Preferred Doctor
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {doctors.length === 0 ? (
                    <p style={{ fontSize: 13, color: COLORS.navyMid }}>Loading doctors…</p>
                  ) : doctors.map((d) => {
                    const isSelected = form.doctor_id === d.id;
                    return (
                      <button
                        key={d.id}
                        className="doctor-opt"
                        onClick={() => setForm((f) => ({ ...f, doctor_id: d.id, time: "" }))}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "11px 14px", borderRadius: 10, fontFamily: "inherit",
                          border: `1.5px solid ${isSelected ? COLORS.green : COLORS.border}`,
                          background: isSelected ? COLORS.lightMint : "transparent",
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: isSelected ? COLORS.green : COLORS.navyLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: isSelected ? "white" : COLORS.navyMid, fontFamily: "'Josefin Sans', sans-serif", flexShrink: 0 }}>
                            {d.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>{d.full_name}</span>
                        </div>
                        {isSelected && <span style={{ color: COLORS.green }}><CheckIcon /></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1.25rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 12 }}>
                  <CalendarIcon /> Preferred Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, time: "" }))}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13, color: COLORS.navy, fontFamily: "inherit", background: COLORS.offWhite, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {/* Time slots */}
              <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1.25rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'Josefin Sans', sans-serif", marginBottom: 12 }}>
                  <ClockIcon /> Available Time Slots
                </label>

                {!form.doctor_id || !form.date ? (
                  <p style={{ fontSize: 13, color: COLORS.navyMid, padding: "8px 0" }}>Select a doctor and date first.</p>
                ) : slotsLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${COLORS.lightMint}`, borderTopColor: COLORS.green, animation: "spin 0.7s linear infinite" }} />
                    <span style={{ fontSize: 13, color: COLORS.navyMid }}>Loading available slots…</span>
                  </div>
                ) : slots.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#A32D2D", padding: "8px 0" }}>No available slots for this day. Try another date.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                    {slots.map((slot) => {
                      const isActive = form.time === slot;
                      return (
                        <button
                          key={slot}
                          className={`slot-btn ${isActive ? "slot-active" : ""}`}
                          onClick={() => setForm((f) => ({ ...f, time: slot }))}
                          style={{
                            padding: "9px 6px",
                            borderRadius: 8,
                            border: `1.5px solid ${isActive ? COLORS.green : COLORS.border}`,
                            background: isActive ? COLORS.green : "transparent",
                            color: isActive ? "white" : COLORS.navy,
                            fontSize: 12, fontWeight: isActive ? 700 : 500,
                            fontFamily: "'Josefin Sans', sans-serif",
                            cursor: "pointer", transition: "all 0.12s",
                          }}
                        >
                          {formatTime(slot)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 24px", background: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: "pointer" }}>
                ← Back
              </button>
              <button
                className="next-btn"
                disabled={!form.doctor_id || !form.date || !form.time}
                onClick={() => setStep(3)}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "12px 32px", background: form.doctor_id && form.date && form.time ? COLORS.navy : COLORS.navyLight, color: form.doctor_id && form.date && form.time ? "white" : COLORS.navyMid, border: "none", borderRadius: 10, cursor: form.doctor_id && form.date && form.time ? "pointer" : "not-allowed", transition: "background 0.15s" }}
              >
                Review Booking →
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════
            STEP 3 — Review & Confirm
        ════════════════════════════════ */}
        {step === 3 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem", fontFamily: "'Josefin Sans', sans-serif" }}>
              Review your booking
            </p>

            {/* Summary card */}
            <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden", marginBottom: "1.25rem" }}>

              {/* Service header */}
              {selectedService && (
                <div style={{ padding: "1.25rem 1.5rem", background: selectedService.accent + "12", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: selectedService.accent + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 64 64" fill="none" stroke={selectedService.accent} strokeWidth="2.5" strokeLinecap="round">
                      <path d={selectedService.icon} />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: selectedService.accent, fontFamily: "'Josefin Sans', sans-serif", marginBottom: 3 }}>Service</p>
                    <p style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.navy }}>{selectedService.id}</p>
                    <p style={{ fontSize: 12, color: COLORS.navyMid }}>{selectedService.desc}</p>
                  </div>
                </div>
              )}

              {/* Details grid */}
              <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Doctor",   icon: <UserIcon />,     value: selectedDoctor?.full_name ?? "—" },
                  { label: "Date",     icon: <CalendarIcon />, value: form.date ? new Date(form.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "—" },
                  { label: "Time",     icon: <ClockIcon />,    value: form.time ? formatTime(form.time) : "—" },
                  { label: "Patient",  icon: <UserIcon />,     value: user?.full_name ?? "—" },
                  { label: "Phone",    icon: <UserIcon />,     value: phoneNumber || "No phone number on file" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 90, paddingTop: 1 }}>
                      <span style={{ color: COLORS.green }}>{row.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.navyMid, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Josefin Sans', sans-serif" }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info notice */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.lightMint, border: `1px solid ${COLORS.mint}`, borderRadius: 10, padding: "11px 14px", fontSize: 12, color: "#0F6E56", marginBottom: "1.5rem" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>
              You will receive a confirmation shortly. You can upload required documents from your dashboard after booking.
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: "12px 24px", background: "transparent", color: COLORS.navyMid, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: "pointer" }}>
                ← Back
              </button>
              <button
                className="next-btn"
                disabled={loading}
                onClick={handleSubmit}
                style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", padding: "13px 36px", background: loading ? COLORS.navyLight : COLORS.navy, color: loading ? COLORS.navyMid : "white", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
              >
                {loading ? "Confirming…" : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}