"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "14px 48px 14px 18px", borderRadius: 14,
          border: `1px solid ${COLORS.mint}`, fontSize: 14, color: COLORS.navy,
          fontFamily: "'Josefin Sans', sans-serif", outline: "none",
          backgroundColor: COLORS.white, boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
        onBlur={(e) => (e.target.style.borderColor = COLORS.mint)}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
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

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
  });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSaveInfo = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await api.patch("/me", { full_name: form.full_name, phone_number: form.phone_number });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
      } else {
        setMessage({ type: "error", text: "Failed to update profile." });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setSaving(true);
    try {
      await api.patch("/me", { current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage({ type: "error", text: err.response?.data?.message || "Current password is incorrect." });
      } else {
        setMessage({ type: "error", text: "Current password is incorrect." });
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: COLORS.lightMint, fontFamily: "'Josefin Sans', sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: COLORS.white, borderBottom: "1px solid rgba(167,228,216,0.4)", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 20px rgba(62,180,137,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white" }}>D</div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.push("/patient/dashboard")} style={{ fontSize: 12, color: COLORS.navyMid, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.1em", textTransform: "uppercase" }}>Dashboard</button>
          <button onClick={logout} style={{ padding: "8px 20px", fontSize: 11, color: "#e05555", border: "1px solid #e05555", borderRadius: 999, background: "transparent", cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.1em", textTransform: "uppercase" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>

        {/* Profile header card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: "36px 40px", marginBottom: 24, display: "flex", alignItems: "center", gap: 24, boxShadow: "0 4px 24px rgba(62,180,137,0.08)", border: "1px solid rgba(167,228,216,0.3)" }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{ width: 88, height: 88, borderRadius: "50%", backgroundColor: COLORS.lightMint, border: `3px solid ${COLORS.mint}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: COLORS.green, flexShrink: 0 }}
          >
            {initials}
          </motion.div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: COLORS.navy, marginBottom: 4 }}>{user?.full_name}</h1>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, backgroundColor: COLORS.lightMint, border: `1px solid ${COLORS.mint}` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.green }} />
              <span style={{ color: COLORS.green, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>{user?.role}</span>
            </div>
            <p style={{color: COLORS.navyMid, fontSize: 16, marginTop: 8 }}>{user?.email}</p>
          </div>
        </motion.div>

        {/* Tabs card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ backgroundColor: COLORS.white, borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 24px rgba(62,180,137,0.08)", border: "1px solid rgba(167,228,216,0.3)" }}
        >
          {/* Tab headers */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(167,228,216,0.4)" }}>
            {[{ key: "info", label: "Personal Info" }, { key: "password", label: "Change Password" }].map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key as "info" | "password"); setMessage(null); }}
                style={{
                  flex: 1, padding: "18px 24px", fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  backgroundColor: activeTab === tab.key ? COLORS.navy : COLORS.white,
                  color: activeTab === tab.key ? COLORS.white : COLORS.navyMid,
                  borderBottom: activeTab === tab.key ? `2px solid ${COLORS.green}` : "2px solid transparent",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: "36px 40px" }}>

            {/* Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{
                    padding: "12px 18px", borderRadius: 12, marginBottom: 24, fontSize: 13, fontWeight: 600,
                    backgroundColor: message.type === "success" ? "rgba(62,180,137,0.1)" : "rgba(224,85,85,0.08)",
                    color: message.type === "success" ? COLORS.green : "#e05555",
                    border: `1px solid ${message.type === "success" ? COLORS.mint : "rgba(224,85,85,0.3)"}`,
                  }}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Personal Info Tab */}
            {activeTab === "info" && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.navyMid, marginBottom: 8 }}>Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.mint}`, fontSize: 14, color: COLORS.navy, fontFamily: "inherit", outline: "none", backgroundColor: COLORS.white, boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                    onBlur={(e) => (e.target.style.borderColor = COLORS.mint)}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.navyMid, marginBottom: 8 }}>Email</label>
                  <input
                    value={form.email}
                    disabled
                    style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: "1px solid rgba(167,228,216,0.4)", fontSize: 14, color: COLORS.navyMid, fontFamily: "inherit", outline: "none", backgroundColor: COLORS.lightMint, boxSizing: "border-box", cursor: "not-allowed" }}
                  />
                  <p style={{ fontSize: 11, color: COLORS.navyMid, marginTop: 4 }}>Email cannot be changed</p>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.navyMid, marginBottom: 8 }}>Phone Number</label>
                  <input
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    placeholder="+961 70 000 000"
                    style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `1px solid ${COLORS.mint}`, fontSize: 14, color: COLORS.navy, fontFamily: "inherit", outline: "none", backgroundColor: COLORS.white, boxSizing: "border-box" }}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.green)}
                    onBlur={(e) => (e.target.style.borderColor = COLORS.mint)}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSaveInfo}
                  disabled={saving}
                  style={{ padding: "14px 32px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", alignSelf: "flex-start", boxShadow: "0 8px 24px rgba(62,180,137,0.3)", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </motion.button>
              </motion.div>
            )}

            {/* Change Password Tab */}
            {activeTab === "password" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.navyMid, marginBottom: 8 }}>Current Password</label>
                  <PasswordInput
                    value={passwordForm.current_password}
                    onChange={(val) => setPasswordForm({ ...passwordForm, current_password: val })}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.navyMid, marginBottom: 8 }}>New Password</label>
                  <PasswordInput
                    value={passwordForm.new_password}
                    onChange={(val) => setPasswordForm({ ...passwordForm, new_password: val })}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.navyMid, marginBottom: 8 }}>Confirm New Password</label>
                  <PasswordInput
                    value={passwordForm.confirm_password}
                    onChange={(val) => setPasswordForm({ ...passwordForm, confirm_password: val })}
                    placeholder="Confirm new password"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleChangePassword}
                  disabled={saving}
                  style={{ padding: "14px 32px", backgroundColor: COLORS.navy, color: "white", border: "none", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", alignSelf: "flex-start", boxShadow: "0 8px 24px rgba(44,62,80,0.2)", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Changing..." : "Change Password"}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          style={{ backgroundColor: COLORS.white, borderRadius: 24, padding: "28px 40px", marginTop: 24, border: "1px solid rgba(224,85,85,0.2)", boxShadow: "0 4px 24px rgba(224,85,85,0.04)" }}
        >
          
          <p style={{ fontSize: 13, color: COLORS.navyMid, marginBottom: 16 }}>Sign out of your DentAI account on this device.</p>
          <button
            onClick={logout}
            style={{ padding: "10px 24px", backgroundColor: "transparent", color: "#e05555", border: "1px solid rgba(224,85,85,0.4)", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    </main>
  );
}