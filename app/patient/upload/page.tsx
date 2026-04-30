"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const COLORS = {
  green: "#3EB489",
  mint: "#A7E4D8",
  white: "#FFFFFF",
  lightMint: "#E6F7F2",
  navy: "#2C3E50",
  navyMid: "rgba(44,62,80,0.5)",
};

interface UploadedFile {
  id: number;
  name: string;
  size: string;
  preview: string;
  status: "uploading" | "done" | "error";
  progress: number;
}

export default function UploadPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const idRef = useRef(0);

  const processFiles = (rawFiles: FileList) => {
    const newFiles: UploadedFile[] = Array.from(rawFiles).map((f) => ({
      id: idRef.current++,
      name: f.name,
      size: (f.size / 1024).toFixed(0) + " KB",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
      status: "uploading",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload progress
    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress: 100, status: "done" } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, progress } : f
            )
          );
        }
      }, 200);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFiles(e.target.files);
  };

  const removeFile = (id: number) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

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

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 40 }}>
          <span style={{ color: COLORS.green, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Patient Portal</span>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: COLORS.navy, marginTop: 8, marginBottom: 8 }}>Upload X-Rays</h1>
          <p style={{ color: COLORS.navyMid, fontSize: 14, lineHeight: 1.7 }}>Upload your dental X-rays and images securely. Our doctors will review them before your appointment.</p>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
         onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); }}
onDragLeave={(_e: React.DragEvent<HTMLDivElement>) => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            backgroundColor: dragging ? "rgba(62,180,137,0.08)" : COLORS.white,
            border: `2px dashed ${dragging ? COLORS.green : COLORS.mint}`,
            borderRadius: 24,
            padding: "60px 40px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.3s",
            marginBottom: 32,
            boxShadow: dragging ? "0 0 0 4px rgba(62,180,137,0.1)" : "none",
          }}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.dcm" style={{ display: "none" }} onChange={handleFileInput} />

          <motion.div
            animate={{ scale: dragging ? 1.1 : 1, rotate: dragging ? 5 : 0 }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 56, marginBottom: 20 }}
          >
            🦷
          </motion.div>

          <h3 style={{ fontSize: 20, fontWeight: 900, color: COLORS.navy, marginBottom: 10 }}>
            {dragging ? "Drop your files here!" : "Drag & Drop X-Rays Here"}
          </h3>
          <p style={{ color: COLORS.navyMid, fontSize: 13, marginBottom: 24 }}>
            or click to browse — supports JPG, PNG, PDF, DICOM
          </p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", backgroundColor: COLORS.green, color: "white", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Browse Files
          </div>
        </motion.div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 16, letterSpacing: "0.05em" }}>
                Uploaded Files ({files.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, border: `1px solid ${file.status === "done" ? COLORS.mint : "rgba(167,228,216,0.3)"}`, boxShadow: "0 2px 12px rgba(62,180,137,0.06)" }}
                  >
                    {/* Preview or icon */}
                    <div style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: COLORS.lightMint, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 24 }}>📄</span>
                      )}
                    </div>

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: COLORS.navyMid, marginBottom: 8 }}>{file.size}</div>
                      {/* Progress bar */}
                      <div style={{ height: 4, backgroundColor: COLORS.lightMint, borderRadius: 2, overflow: "hidden" }}>
                        <motion.div
                          animate={{ width: `${file.progress}%` }}
                          transition={{ duration: 0.3 }}
                          style={{ height: "100%", backgroundColor: file.status === "done" ? COLORS.green : COLORS.mint, borderRadius: 2 }}
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      {file.status === "done" ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14 }}>✓</motion.div>
                      ) : (
                        <div style={{ fontSize: 12, color: COLORS.navyMid }}>{Math.round(file.progress)}%</div>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFile(file.id)}
                      style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(224,85,85,0.3)", backgroundColor: "transparent", color: "#e05555", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Submit all */}
              {files.every((f) => f.status === "done") && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 24, textAlign: "center" }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push("/patient/dashboard")}
                    style={{ padding: "14px 40px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 999, fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(62,180,137,0.35)" }}
                  >
                    Done — Go to Dashboard
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info cards */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 40 }}>
          {[
            { icon: "🔒", title: "Secure Upload", desc: "All files are encrypted and stored safely" },
            { icon: "👨‍⚕️", title: "Doctor Review", desc: "Your doctor reviews before your visit" },
            { icon: "📱", title: "Any Format", desc: "JPG, PNG, PDF and DICOM supported" },
          ].map((card) => (
            <div key={card.title} style={{ backgroundColor: COLORS.white, borderRadius: 16, padding: "20px 18px", border: "1px solid rgba(167,228,216,0.4)", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: COLORS.navyMid, lineHeight: 1.6 }}>{card.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}