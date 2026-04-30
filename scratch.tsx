"use client";

import { useRouter } from "next/navigation";

const services = [
  { icon: "🦷", title: "Dental Checkup" },
  { icon: "✨", title: "Teeth Cleaning" },
  { icon: "🔧", title: "Dental Filling" },
  { icon: "💎", title: "Teeth Whitening" },
  { icon: "😁", title: "Braces Consultation" },
  { icon: "🩺", title: "Root Canal Consultation" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="tooth">🦷</span>
          <span className="text-xl font-bold text-blue-600">DentAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <a href="#services" className="hover:text-blue-600 transition">Services</a>
          <a href="#about" className="hover:text-blue-600 transition">About</a>
          <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            Login
          </button>
          <button
            onClick={() => router.push("/auth/register")}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Register
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 bg-gradient-to-b from-blue-50 to-white">
        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-4 py-1 rounded-full mb-6">
          AI-Powered Dental Care
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-5xl">
          Your Smile,{" "}
          <span className="text-blue-600">Managed by AI</span>
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl">
          Book appointments, get reminders, and speak to our AI receptionist — all in one place. Bright Smile Dental Clinic, Hamra, Beirut.
        </p>
        <div className="flex gap-4 mt-10">
          <button
            onClick={() => router.push("/auth/register")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md"
          >
            Book an Appointment
          </button>
          
            <a href="tel:+15186346766"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Call Our Agent
          </a>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Services</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md hover:border-blue-100 transition bg-white"
            >
              <span className="text-4xl mb-3" role="img" aria-label={service.title}>
                {service.icon}
              </span>
              <span className="text-sm font-semibold text-gray-700">{service.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-blue-50 px-6 py-20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Our Clinic</h2>
            <p className="text-gray-500 leading-relaxed">
              Bright Smile Dental Clinic is located in the heart of Hamra, Beirut. We combine modern dental care with AI technology to give you the best experience — from booking to treatment.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-600">
              <li>Hamra Main Street, Beirut, Lebanon</li>
              <li>Mon–Fri: 9:00 AM – 5:00 PM</li>
              <li>+961 70 000 000</li>
            </ul>
          </div>
          <div className="flex-1 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-3xl">
              AI
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">AI Receptionist</h3>
            <p className="mt-2 text-sm text-gray-500">
              Our AI agent answers calls 24/7, books appointments, and handles reschedules — in Lebanese Arabic.
            </p>
            
            <a  href="tel:+15186346766"
              className="mt-6 inline-block px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition"
            >
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="px-6 py-10 border-t border-gray-100 text-center text-sm text-gray-400">
        <p>2026 DentAI — Bright Smile Dental Clinic. Built by Karim Rahal &amp; Sarah Dhainy, LAU.</p>
      </footer>

    </main>
  );
}