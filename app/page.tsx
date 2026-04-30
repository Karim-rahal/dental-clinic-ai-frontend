"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import "./globals.css";

const COLORS = {
  green: "#3EB489",
  mint: "#A7E4D8",
  white: "#FFFFFF",
  lightMint: "#E6F7F2",
  navy: "#2C3E50",
  navyMid: "rgba(44,62,80,0.5)",
};

const SERVICES = [
  { num: "01", title: "Dental Checkup", desc: "Comprehensive oral examination with digital X-rays and personalized treatment planning.", accent: "#3EB489" },
  { num: "02", title: "Teeth Cleaning", desc: "Professional scaling and polishing to remove plaque, tartar, and surface stains.", accent: "#A7E4D8" },
  { num: "03", title: "Dental Filling", desc: "Tooth-colored composite fillings that restore function and blend seamlessly.", accent: "#3EB489" },
  { num: "04", title: "Teeth Whitening", desc: "Advanced whitening treatment delivering up to 8 shades brighter in one session.", accent: "#A7E4D8" },
  { num: "05", title: "Braces Consultation", desc: "Personalized orthodontic assessment for traditional braces or clear aligners.", accent: "#3EB489" },
  { num: "06", title: "Root Canal", desc: "Pain-free endodontic therapy to save your natural tooth and relieve discomfort.", accent: "#A7E4D8" },
];

const DOCTORS = [
  { name: "Dr. Lara Khoury", title: "General Dentist", specialty: "Checkup, Cleaning, Filling", days: "Mon - Thu", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=600&fit=crop&crop=top" },
  { name: "Dr. Omar Nassar", title: "Cosmetic Dentist", specialty: "Whitening, Veneers", days: "Mon, Wed, Fri", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=600&fit=crop&crop=top" },
  { name: "Dr. Sara Haddad", title: "Orthodontist", specialty: "Braces, Aligners", days: "Tue, Thu", image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=600&fit=crop&crop=top" },
  { name: "Dr. Karim Sleiman", title: "Endodontist", specialty: "Root Canal, Pain Relief", days: "Mon - Fri", image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=600&fit=crop&crop=top" },
];

const STATS = [
  { value: 2400, label: "Patients Treated", suffix: "+" },
  { value: 98, label: "Satisfaction Rate", suffix: "%" },
  { value: 12, label: "Years of Excellence", suffix: "+" },
  { value: 4, label: "Expert Doctors", suffix: "" },
];

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, 20);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Interpolate between yellow-stained and pure white based on clean percent
function toothColor(clean: number): string {
  // 0% = yellowy stained, 100% = bright white
  const r = Math.round(210 + (255 - 210) * (clean / 100));
  const g = Math.round(195 + (255 - 195) * (clean / 100));
  const b = Math.round(120 + (255 - 120) * (clean / 100));
  return `rgb(${r},${g},${b})`;
}

function stainOpacity(clean: number): number {
  return Math.max(0, 1 - clean / 60);
}

interface Sparkle { id: number; x: number; y: number; }
interface BrushStroke { x: number; y: number; age: number; }

function TeethBrushHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<BrushStroke[]>([]);
  const animFrame = useRef<number>(0);
  const lastPos = useRef({ x: 0, y: 0 });
  const prevPos = useRef({ x: 0, y: 0 });
  const [cleanPercent, setCleanPercent] = useState(0);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [brushAngle, setBrushAngle] = useState(0);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [showMessage, setShowMessage] = useState(false);
  const sparkleId = useRef(0);

  useEffect(() => {
    if (cleanPercent >= 100 && !showMessage) {
      setTimeout(() => setShowMessage(true), 400);
    }
  }, [cleanPercent, showMessage]);

  const spawnSparkles = useCallback((x: number, y: number) => {
    const newOnes = Array.from({ length: 4 }, () => ({
      id: sparkleId.current++,
      x: x + (Math.random() - 0.5) * 80,
      y: y + (Math.random() - 0.5) * 50,
    }));
    setSparkles((prev) => [...prev.slice(-16), ...newOnes]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newOnes.find((n) => n.id === s.id)));
    }, 800);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      strokes.current.forEach((stroke) => {
        const alpha = Math.max(0, 1 - stroke.age / 60);
        const radius = 14 + (60 - stroke.age) * 0.2;
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(stroke.x, stroke.y, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(62,180,137,${alpha * 0.35})`;
        ctx.fill();
      });
      strokes.current = strokes.current.map((s) => ({ ...s, age: s.age + 1 })).filter((s) => s.age < 60);
      animFrame.current = requestAnimationFrame(draw);
    };
    animFrame.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrame.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - prevPos.current.x;
    const dy = y - prevPos.current.y;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      setBrushAngle(Math.atan2(dy, dx) * (180 / Math.PI) + 90);
    }
    prevPos.current = { x, y };
    setMousePos({ x, y });
    // Teeth area: roughly center of the SVG mouth
    const teethX1 = 60, teethX2 = 400, teethY1 = 160, teethY2 = 310;
    if (x > teethX1 && x < teethX2 && y > teethY1 && y < teethY2) {
      const dist = Math.sqrt((x - lastPos.current.x) ** 2 + (y - lastPos.current.y) ** 2);
      if (dist > 6) {
        strokes.current.push({ x, y, age: 0 });
        lastPos.current = { x, y };
        if (Math.random() < 0.3) spawnSparkles(x, y);
        setCleanPercent((p) => Math.min(100, p + 1.2));
      }
    }
  }, [spawnSparkles]);

  const handleMouseLeave = () => setMousePos({ x: -200, y: -200 });

  const tColor = toothColor(cleanPercent);
  const stainOp = stainOpacity(cleanPercent);

  // Upper teeth positions
  const upperTeeth = [
    { x: 82, w: 26, h: 44, rx: 6 },
    { x: 112, w: 30, h: 50, rx: 6 },
    { x: 146, w: 34, h: 54, rx: 7 },
    { x: 184, w: 34, h: 54, rx: 7 },
    { x: 222, w: 30, h: 50, rx: 6 },
    { x: 256, w: 26, h: 44, rx: 6 },
  ];

  const lowerTeeth = [
    { x: 90, w: 24, h: 38, rx: 5 },
    { x: 118, w: 28, h: 44, rx: 6 },
    { x: 150, w: 32, h: 46, rx: 6 },
    { x: 186, w: 32, h: 46, rx: 6 },
    { x: 222, w: 28, h: 44, rx: 6 },
    { x: 254, w: 24, h: 38, rx: 5 },
  ];

  return (
    <div style={{ position: "relative", width: 460, margin: "0 auto" }}>
      {/* Outer glow */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.4, 0.15] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
        style={{ position: "absolute", inset: -30, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,180,137,0.25) 0%, transparent 65%)", pointerEvents: "none" }}
      />

      {/* Main interactive container */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: "relative", borderRadius: 32, overflow: "hidden", boxShadow: "0 30px 80px rgba(62,180,137,0.2), 0 0 0 2px rgba(167,228,216,0.35)", cursor: "none", userSelect: "none", backgroundColor: "#fdf8f0" }}
      >
        {/* SVG Mouth */}
        <svg width="460" height="400" viewBox="0 0 360 400" style={{ display: "block" }}>
          {/* Background skin tone */}
          <rect width="360" height="400" fill="#fdf8f0" />

          {/* Face subtle blush/cheeks */}
          <ellipse cx="60" cy="220" rx="40" ry="25" fill="rgba(255,180,160,0.12)" />
          <ellipse cx="300" cy="220" rx="40" ry="25" fill="rgba(255,180,160,0.12)" />

          {/* Upper lip */}
          <path
            d="M60 170 Q90 145 130 155 Q160 145 180 150 Q200 145 230 155 Q270 145 300 170 Q270 180 230 175 Q200 185 180 182 Q160 185 130 175 Q90 180 60 170 Z"
            fill="#c47060"
          />
          {/* Upper lip highlight */}
          <path d="M120 158 Q180 148 240 158" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />

          {/* Lower lip */}
          <path
            d="M60 170 Q90 180 130 175 Q160 185 180 182 Q200 185 230 175 Q270 180 300 170 Q290 210 250 225 Q215 235 180 236 Q145 235 110 225 Q70 210 60 170 Z"
            fill="#d4806e"
          />
          {/* Lower lip highlight */}
          <ellipse cx="180" cy="210" rx="50" ry="14" fill="rgba(255,255,255,0.12)" />

          {/* Mouth interior (FIXED) */}
<path
  d="M70 175 Q180 160 290 175 Q280 235 240 255 Q210 265 180 268 Q150 265 120 255 Q80 235 70 175 Z"
  fill="#140606"
/>

{/* Tongue */}
<ellipse cx="180" cy="240" rx="55" ry="24" fill="#d07070" />

{/* Clip path (ADD THIS ONCE inside svg) */}
<defs>
  <clipPath id="mouthClip">
    <path d="M70 175 Q180 160 290 175 Q280 235 240 255 Q210 265 180 268 Q150 265 120 255 Q80 235 70 175 Z" />
  </clipPath>
</defs>

{/* Teeth INSIDE mouth */}
<g clipPath="url(#mouthClip)">
  {/* Upper teeth */}
  {upperTeeth.map((t, i) => (
    <rect
      key={`ut-${i}`}
      x={t.x}
      y={168}
      width={t.w * 0.9}
      height={t.h * 0.75}
      rx={t.rx}
      fill={tColor}
    />
  ))}

  {/* Lower teeth */}
  {lowerTeeth.map((t, i) => (
    <rect
      key={`lt-${i}`}
      x={t.x}
      y={250}
      width={t.w * 0.9}
      height={t.h * 0.7}
      rx={t.rx}
      fill={tColor}
    />
  ))}
</g>

{/* Gum line */}
<path
  d="M80 170 Q180 165 280 170"
  stroke="rgba(200,120,110,0.5)"
  strokeWidth="1.2"
  fill="none"
/>

          
          {/* Gum line upper */}
          <path d="M75 172 Q180 168 285 172" stroke="rgba(200,120,110,0.4)" strokeWidth="1.5" fill="none" />

          {/* Lip corners */}
          <circle cx="60" cy="170" r="5" fill="#b86858" />
          <circle cx="300" cy="170" r="5" fill="#b86858" />

          {/* Smile wrinkle lines */}
          <path d="M55 165 Q40 180 50 200" stroke="rgba(180,130,110,0.2)" strokeWidth="1.5" fill="none" />
          <path d="M305 165 Q320 180 310 200" stroke="rgba(180,130,110,0.2)" strokeWidth="1.5" fill="none" />

          {/* Sparkle stars when cleaning */}
          {cleanPercent > 20 && cleanPercent < 100 && (
            <>
              <motion.text animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} x="50" y="150" fontSize="16" fill={COLORS.green} textAnchor="middle">✦</motion.text>
              <motion.text animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }} x="310" y="145" fontSize="12" fill={COLORS.mint} textAnchor="middle">✦</motion.text>
              <motion.text animate={{ opacity: [0, 1, 0], y: [0, -8, -16] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.8 }} x="180" y="140" fontSize="14" fill={COLORS.green} textAnchor="middle">★</motion.text>
            </>
          )}

          {/* 100% done sparkle burst */}
          {cleanPercent >= 100 && (
            <>
              {[30, 90, 150, 210, 270, 330].map((angle, i) => (
                <motion.circle
                  key={angle}
                  initial={{ r: 0, opacity: 1, cx: 180, cy: 200 }}
                  animate={{ r: 8, opacity: 0, cx: 180 + Math.cos(angle * Math.PI / 180) * 80, cy: 200 + Math.sin(angle * Math.PI / 180) * 60 }}
                  transition={{ duration: 0.8, delay: i * 0.06 }}
                  fill={COLORS.green}
                />
              ))}
            </>
          )}
        </svg>

        {/* Canvas foam overlay */}
        <canvas
          ref={canvasRef}
          width={460}
          height={400}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        />

        {/* Toothbrush cursor */}
        <div
          style={{
            position: "absolute", left: 0, top: 0,
            pointerEvents: "none", zIndex: 20,
            transform: `translate(${mousePos.x - 12}px, ${mousePos.y - 60}px) rotate(${brushAngle}deg)`,
            transition: "transform 0.04s linear",
          }}
        >
          <svg width="28" height="110" viewBox="0 0 28 110" fill="none">
            {/* Handle */}
            <rect x="10" y="35" width="8" height="65" rx="4" fill="#3EB489" />
            <rect x="11" y="40" width="3" height="55" rx="2" fill="rgba(255,255,255,0.35)" />
            {/* Grip lines */}
            <rect x="10" y="70" width="8" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
            <rect x="10" y="78" width="8" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
            <rect x="10" y="86" width="8" height="3" rx="1.5" fill="rgba(255,255,255,0.2)" />
            {/* Neck */}
            <rect x="11" y="22" width="6" height="15" rx="3" fill="#2C3E50" />
            {/* Head */}
            <rect x="5" y="2" width="18" height="22" rx="5" fill="#2C3E50" />
            {/* Bristles */}
            <rect x="6" y="0" width="2.5" height="10" rx="1.2" fill="white" />
            <rect x="9.5" y="0" width="2.5" height="11" rx="1.2" fill="white" />
            <rect x="13" y="0" width="2.5" height="10" rx="1.2" fill="white" />
            <rect x="16.5" y="0" width="2.5" height="11" rx="1.2" fill="white" />
            <rect x="20" y="0" width="2.5" height="10" rx="1.2" fill="white" />
            {/* Bristle color tips */}
            <rect x="6" y="0" width="2.5" height="4" rx="1.2" fill="#A7E4D8" />
            <rect x="9.5" y="0" width="2.5" height="4" rx="1.2" fill="#3EB489" />
            <rect x="13" y="0" width="2.5" height="4" rx="1.2" fill="#A7E4D8" />
            <rect x="16.5" y="0" width="2.5" height="4" rx="1.2" fill="#3EB489" />
            <rect x="20" y="0" width="2.5" height="4" rx="1.2" fill="#A7E4D8" />
            {/* Toothpaste foam drop */}
            <ellipse cx="13" cy="11" rx="5" ry="3" fill="rgba(255,255,255,0.7)" />
          </svg>
        </div>

        {/* Sparkle effects */}
        {sparkles.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 1, scale: 0, x: s.x, y: s.y }}
            animate={{ opacity: 0, scale: 1.5, y: s.y - 35 }}
            transition={{ duration: 0.8 }}
            style={{ position: "absolute", pointerEvents: "none", fontSize: 16, color: COLORS.green, fontWeight: 900 }}
          >
            ✦
          </motion.div>
        ))}

        {/* Progress bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px", background: "linear-gradient(to top, rgba(44,62,80,0.9) 0%, transparent 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <span style={{ color: "white", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {cleanPercent === 0 ? "Brush the teeth!" : cleanPercent >= 100 ? "Perfectly clean!" : `Cleaning... ${Math.round(cleanPercent)}%`}
            </span>
            {cleanPercent > 0 && cleanPercent < 100 && (
              <span style={{ color: COLORS.mint, fontSize: 11, fontWeight: 600 }}>{Math.round(cleanPercent)}%</span>
            )}
            {cleanPercent >= 100 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: COLORS.mint, fontSize: 12, fontWeight: 900 }}>Spotless!</motion.span>
            )}
          </div>
          <div style={{ height: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 3, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${cleanPercent}%` }}
              transition={{ duration: 0.3 }}
              style={{ height: "100%", borderRadius: 3, background: `linear-gradient(to right, #A7E4D8, #3EB489)`, boxShadow: "0 0 10px rgba(62,180,137,0.7)" }}
            />
          </div>
        </div>

        {/* Initial hint */}
        {cleanPercent === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ position: "absolute", top: "22%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}
              style={{ backgroundColor: "rgba(62,180,137,0.92)", color: "white", borderRadius: 14, padding: "11px 22px", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", boxShadow: "0 8px 24px rgba(62,180,137,0.4)" }}
            >
              Move mouse to brush!
            </motion.div>
          </motion.div>
        )}

        {/* Done message */}
        <AnimatePresence>
          {showMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{
                position: "absolute", inset: 0,
                backgroundColor: "rgba(230,247,242,0.96)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: "32px",
                borderRadius: 32,
              }}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                style={{ fontSize: 52, marginBottom: 16 }}
              >
                ✦
              </motion.div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: COLORS.navy, lineHeight: 1.2, marginBottom: 12 }}>
                Don&apos;t change your smile.
              </h3>
              <p style={{ fontSize: 15, color: COLORS.navyMid, lineHeight: 1.7, maxWidth: 300, marginBottom: 20 }}>
                Your smile is already beautiful. Keep it that way — with the{" "}
                <span style={{ color: COLORS.green, fontWeight: 700 }}>right care, with us.</span>
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setCleanPercent(0); setShowMessage(false); setSparkles([]); strokes.current = []; }}
                style={{ padding: "10px 24px", backgroundColor: COLORS.green, color: "white", border: "none", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit" }}
              >
                Brush again
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating badges */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
        style={{ position: "absolute", bottom: -10, right: -30, zIndex: 20, backgroundColor: COLORS.navy, color: "white", borderRadius: 18, padding: "14px 20px", boxShadow: "0 16px 40px rgba(44,62,80,0.3)", minWidth: 130 }}
      >
        <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>AI Agent</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>24/7 Live</div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
        style={{ position: "absolute", top: 10, left: -40, zIndex: 20, backgroundColor: COLORS.green, color: "white", borderRadius: 18, padding: "14px 20px", boxShadow: "0 16px 40px rgba(62,180,137,0.4)", minWidth: 130 }}
      >
        <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Happy Patients</div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>2,400+</div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1.5 }}
        style={{ position: "absolute", top: "45%", right: -50, zIndex: 20, backgroundColor: COLORS.white, borderRadius: 18, padding: "12px 18px", boxShadow: "0 12px 30px rgba(62,180,137,0.2)", border: "1px solid #A7E4D8" }}
      >
        <div style={{ color: "#FFC107", fontSize: 16, marginBottom: 2 }}>★★★★★</div>
        <div style={{ color: COLORS.navy, fontSize: 13, fontWeight: 900 }}>5.0 Rating</div>
      </motion.div>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: typeof DOCTORS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ flex: "0 0 260px", cursor: "pointer" }}>
      <div style={{ position: "relative", height: 340, overflow: "hidden", borderRadius: 20, marginBottom: 20 }}>
        <img src={doctor.image} alt={doctor.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", transition: "transform 0.5s ease", transform: hovered ? "scale(1.08)" : "scale(1)", borderRadius: 20 }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(230,247,242,0.95) 0%, transparent 100%)", borderRadius: "0 0 20px 20px" }} />
        <div style={{ position: "absolute", top: 14, right: 14, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, backgroundColor: "rgba(255,255,255,0.92)", boxShadow: "0 2px 12px rgba(62,180,137,0.2)" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.green }} />
          <span style={{ color: COLORS.green, fontSize: 11, fontWeight: 700 }}>{doctor.days}</span>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "0 8px" }}>
        <div style={{ color: COLORS.green, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>{doctor.title}</div>
        <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, color: hovered ? COLORS.green : COLORS.navy, transition: "color 0.3s" }}>{doctor.name}</h3>
        <p style={{ color: COLORS.navyMid, fontSize: 13 }}>{doctor.specialty}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", dragFree: true });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => setActiveIndex(emblaApi.selectedScrollSnap()));
    const auto = setInterval(() => emblaApi.scrollNext(), 4500);
    return () => clearInterval(auto);
  }, [emblaApi]);

  return (
    <main style={{ fontFamily: "'Josefin Sans', sans-serif", backgroundColor: COLORS.white, color: COLORS.navy, overflowX: "hidden" }}>

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 56px", borderBottom: "1px solid rgba(167,228,216,0.35)", backdropFilter: "blur(20px)", backgroundColor: "rgba(255,255,255,0.93)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "white" }}>D</div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
        </div>
        <div style={{ display: "flex", gap: 36, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: COLORS.navy,fontWeight: 700 }}>
          <a href="#services" style={{ color: "inherit", textDecoration: "none" }} className="nav-link">Services</a>
          <a href="#doctors" style={{ color: "inherit", textDecoration: "none" }} className="nav-link">Doctors</a>
          <a href="#about" style={{ color: "inherit", textDecoration: "none" }} className="nav-link">About</a>
          <a href="#contact" style={{ color: "inherit", textDecoration: "none" }} className="nav-link">Contact</a>
        </div>
        <div style={{ display: "flex", gap: 10, fontWeight: 700 }}>
          <button onClick={() => router.push("/auth/login")} style={{ padding: "9px 22px", fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: COLORS.navy, border: "1px solid #A7E4D8", borderRadius: 999, background: "transparent", cursor: "pointer", fontFamily: "inherit" }} >Login</button>
          <button onClick={() => router.push("/auth/register")} style={{ padding: "9px 22px", fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: "white", backgroundColor: COLORS.green, border: "none", borderRadius: 999, cursor: "pointer", fontFamily: "inherit" }}>Register</button>
        </div>
      </motion.nav>

      {/* HERO */}
      <section style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", padding: "120px 80px 80px", gap: 80, maxWidth: 1300, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, border: "1px solid #A7E4D8", backgroundColor: COLORS.lightMint, color: COLORS.green, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 32 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: COLORS.green, display: "inline-block" }} />
            AI-Powered Dental Care - Beirut
          </motion.div>

          <h1 style={{ fontSize: "clamp(48px, 5vw, 78px)", fontWeight: 900, lineHeight: 1.0, marginBottom: 24, letterSpacing: "-0.02em", color: COLORS.navy }}>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ display: "block" }}>YOUR SMILE</motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ display: "block", color: COLORS.green }}>REIMAGINED</motion.span>
            <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ display: "block", color: COLORS.mint }}>BY AI</motion.span>
          </h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} style={{ color: COLORS.navyMid, fontSize: 17, lineHeight: 1.85, marginBottom: 44, maxWidth: 480 }}>
            Book appointments, consult our AI receptionist, and experience world-class dental care at Bright Smile Clinic, Hamra.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/auth/register")} style={{ padding: "16px 36px", backgroundColor: COLORS.green, color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 12px 32px rgba(62,180,137,0.35)" }}>
              Book Appointment
            </button>
            <a href="tel:+15186346766" style={{ padding: "16px 36px", border: "1px solid #A7E4D8", color: COLORS.navy, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 999, textDecoration: "none", display: "inline-block" }}>
              Call AI Agent
            </a>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
          <TeethBrushHero />
        </motion.div>
      </section>

      {/* STATS */}
      <section style={{ padding: "60px 48px", backgroundColor: COLORS.navy }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}>
          {STATS.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: COLORS.mint }}>
                <CountUp target={stat.value} suffix={stat.suffix} />
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 8 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "120px 48px", maxWidth: 1300, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 72 }}>
          <span style={{ color: COLORS.green, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>What We Offer</span>
          <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, marginTop: 12, lineHeight: 1.05, color: COLORS.navy }}>
            WORLD-CLASS<br />
            <span style={{ color: COLORS.mint }}>DENTAL SERVICES</span>
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(62,180,137,0.15)" }}
              style={{ padding: "36px 32px", borderRadius: 20, border: "1px solid #E6F7F2", backgroundColor: COLORS.white, transition: "all 0.3s", cursor: "pointer" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.lightMint, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: service.accent }} />
                </div>
                <span style={{ fontSize: 13, color: "rgba(44,62,80,0.2)", fontWeight: 700 }}>{service.num}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12, color: COLORS.navy }}>{service.title}</h3>
              <p style={{ color: COLORS.navyMid, fontSize: 14, lineHeight: 1.75 }}>{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DOCTORS */}
      <section id="doctors" style={{ padding: "120px 48px", backgroundColor: COLORS.lightMint }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 72, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <div>
              <span style={{ color: COLORS.green, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>Our Team</span>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900, marginTop: 12, lineHeight: 1.05, color: COLORS.navy }}>
                MEET THE<br />
                <span style={{ color: COLORS.green }}>SPECIALISTS</span>
              </h2>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => emblaApi?.scrollPrev()} style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #A7E4D8", background: COLORS.white, color: COLORS.navy, cursor: "pointer", fontSize: 18, fontFamily: "inherit" }}>&lt;</button>
              <button onClick={() => emblaApi?.scrollNext()} style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #A7E4D8", background: COLORS.white, color: COLORS.navy, cursor: "pointer", fontSize: 18, fontFamily: "inherit" }}>&gt;</button>
            </div>
          </motion.div>
          <div style={{ overflow: "hidden" }} ref={emblaRef}>
            <div style={{ display: "flex", gap: 32 }}>
              {DOCTORS.map((doctor, i) => (
                <motion.div key={doctor.name} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                  <DoctorCard doctor={doctor} />
                </motion.div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 36 }}>
            {DOCTORS.map((_, i) => (
              <button key={i} onClick={() => emblaApi?.scrollTo(i)} style={{ height: 4, width: activeIndex === i ? 32 : 8, borderRadius: 2, backgroundColor: activeIndex === i ? COLORS.green : COLORS.mint, border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 }} />
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: "120px 48px", maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span style={{ color: COLORS.green, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700 }}>The Technology</span>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 900, marginTop: 12, lineHeight: 1.1, marginBottom: 28, color: COLORS.navy }}>
              AN AI THAT<br />
              <span style={{ color: COLORS.green }}>NEVER SLEEPS</span>
            </h2>
            <p style={{ color: COLORS.navyMid, lineHeight: 1.85, marginBottom: 36, fontSize: 16 }}>
              Our AI receptionist answers calls 24/7 in Lebanese Arabic. It books appointments, handles reschedules, and connects you to our team when needed.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {["Speaks Lebanese Arabic dialect", "Books and manages appointments via voice", "Available 24 hours, 7 days a week", "Transfers to human staff when needed"].map((item, i) => (
                <motion.div key={item} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 15, color: COLORS.navy }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: COLORS.lightMint, border: "1px solid #A7E4D8", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.green, fontSize: 11, flexShrink: 0, fontWeight: 700 }}>✓</div>
                  {item}
                </motion.div>
              ))}
            </div>
            <a href="tel:+15186346766" style={{ marginTop: 44, display: "inline-block", padding: "16px 36px", backgroundColor: COLORS.green, color: "white", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: 999, textDecoration: "none", boxShadow: "0 12px 32px rgba(62,180,137,0.35)" }}>
              Call Now
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div style={{ backgroundColor: COLORS.lightMint, borderRadius: 32, padding: 48, border: "1px solid #A7E4D8" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} style={{ width: 100, height: 100, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 16px 40px rgba(62,180,137,0.4)" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "white" }}>AI</span>
                </motion.div>
                <div style={{ fontWeight: 900, fontSize: 22, color: COLORS.navy }}>AI Receptionist</div>
                <div style={{ color: COLORS.navyMid, fontSize: 14, marginTop: 4 }}>Always Available</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[{ label: "Calls Answered", value: "1,240+" }, { label: "Appointments Booked", value: "890+" }, { label: "Avg Response Time", value: "2 sec" }].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", backgroundColor: COLORS.white, borderRadius: 14, border: "1px solid #A7E4D8" }}>
                    <span style={{ color: COLORS.navyMid, fontSize: 13 }}>{item.label}</span>
                    <span style={{ color: COLORS.green, fontWeight: 900, fontSize: 16 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 48px", backgroundColor: COLORS.navy, textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 900, lineHeight: 1.0, marginBottom: 24, color: "white", letterSpacing: "-0.02em" }}>
            READY FOR A<br />
            <span style={{ color: COLORS.mint }}>BRIGHTER SMILE?</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 44, fontSize: 18, lineHeight: 1.7 }}>
            Join hundreds of patients who trust Bright Smile Dental Clinic.
          </p>
          <button onClick={() => router.push("/auth/register")} style={{ padding: "20px 52px", backgroundColor: COLORS.green, color: "white", fontSize: 12, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 16px 40px rgba(62,180,137,0.4)" }}>
            Get Started Today
          </button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer id="contact" style={{ borderTop: "1px solid #E6F7F2", padding: "48px 56px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: COLORS.green, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>D</div>
            <span style={{ fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: COLORS.navy }}>DentAI</span>
          </div>
          <div style={{ color: COLORS.navyMid, fontSize: 12, textAlign: "center", lineHeight: 1.8 }}>
            Hamra Main Street, Beirut - Mon-Fri 9AM-5PM - +961 70 000 000
          </div>
          <div style={{ color: "rgba(44,62,80,0.3)", fontSize: 12 }}>
            2026 DentAI - Karim Rahal &amp; Sarah Dhainy - LAU
          </div>
        </div>
      </footer>
    </main>
  );
}