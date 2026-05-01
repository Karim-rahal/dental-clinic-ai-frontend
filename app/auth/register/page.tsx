"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";

const COLORS = {
  green: "#3EB489",
  mint: "#A7E4D8",
  white: "#FFFFFF",
  lightMint: "#E6F7F2",
  navy: "#2C3E50",
  navyMid: "rgba(44,62,80,0.5)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 18px",
  borderRadius: 14,
  border: "1.5px solid #E6F7F2",
  backgroundColor: COLORS.lightMint,
  fontSize: 14,
  color: COLORS.navy,
  fontFamily: "'Josefin Sans', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: COLORS.navy,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: 7,
};

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, paddingRight: 48 }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
        onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")}
      />
      <button
  type="button"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => setShow((prev) => !prev)}
  style={{
    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer",
    color: COLORS.navyMid, padding: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
  }}
>
  {show ? <EyeOffIcon /> : <EyeIcon />}
</button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        full_name: form.name,
        email: form.email,
        phone_number: form.phone,
        password: form.password,
        role: "patient",
      });
      router.push("/auth/login");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.response?.data?.error || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        fontFamily: "'Josefin Sans', sans-serif",
        minHeight: "100vh",
        backgroundColor: COLORS.white,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        overflow: "hidden",
      }}
    >
      {/* LEFT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundColor: COLORS.navy,
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center", padding: "60px 56px", position: "relative", overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
          style={{
            position: "absolute", width: 450, height: 450, borderRadius: "50%",
            backgroundColor: COLORS.green, bottom: -120, right: -120, pointerEvents: "none",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.07, 0.15, 0.07] }}
          transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 3 }}
          style={{
            position: "absolute", width: 280, height: 280, borderRadius: "50%",
            backgroundColor: COLORS.mint, top: -60, left: -60, pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 380 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", delay: 0.2 }}
            style={{
              width: 72, height: 72, borderRadius: "50%", backgroundColor: COLORS.green,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 32px", boxShadow: "0 16px 48px rgba(62,180,137,0.45)",
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 900, color: "white" }}>D</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: 42, fontWeight: 900, color: "white", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 20 }}
          >
            JOIN BRIGHT<br />
            <span style={{ color: COLORS.mint }}>SMILE</span><br />
            DENTAL CLINIC
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.8, marginBottom: 48 }}
          >
            Create your account in seconds and start managing your dental health with AI-powered support.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ display: "flex", gap: 24, justifyContent: "center" }}
          >
            {[{ value: "2,400+", label: "Patients" }, { value: "98%", label: "Satisfaction" }, { value: "24/7", label: "AI Support" }].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.mint }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* RIGHT PANEL */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          alignItems: "center", padding: "48px 64px", backgroundColor: COLORS.white,
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ marginBottom: 32 }}>
        
            <h2 style={{ fontSize: 30, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, marginBottom: 8 }}>Create your account</h2>
            <p style={{ color: COLORS.navyMid, fontSize: 14 }}>Join hundreds of patients at Bright Smile Clinic</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 20, padding: "12px 16px", backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA", borderRadius: 12, color: "#DC2626", fontSize: 13,
              }}
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: "flex", flexDirection: "column", gap: 15 }}
          >
            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                placeholder="Karim Rahal"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input
                type="tel"
                placeholder="+961 70 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                onBlur={(e) => (e.target.style.borderColor = "#E6F7F2")}
              />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <PasswordInput
                value={form.password}
                onChange={(val) => setForm({ ...form, password: val })}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <PasswordInput
                value={form.confirmPassword}
                onChange={(val) => setForm({ ...form, confirmPassword: val })}
              />
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 16px 40px rgba(62,180,137,0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%", padding: "16px", backgroundColor: loading ? COLORS.mint : COLORS.green,
                color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em",
                textTransform: "uppercase", borderRadius: 14, border: "none",
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Josefin Sans', sans-serif",
                boxShadow: "0 8px 24px rgba(62,180,137,0.3)", marginTop: 4,
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </motion.button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ textAlign: "center", marginTop: 24 }}>
            <p style={{ fontSize: 13, color: COLORS.navyMid, marginBottom: 12 }}>
              Already have an account?{" "}
              <span onClick={() => router.push("/auth/login")} style={{ color: COLORS.green, fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                Sign In
              </span>
            </p>
            <span
  onClick={() => router.push("/")}
  style={{
    position: "fixed",
    top: 28,
    left: 32,
    fontSize: 14,
    fontWeight: 700,
    color: "white",
    cursor: "pointer",
    letterSpacing: "0.08em",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}
>
  ← Back Home
</span>
          </motion.div>
        </div>
      </motion.div>
    </main>
  );
}