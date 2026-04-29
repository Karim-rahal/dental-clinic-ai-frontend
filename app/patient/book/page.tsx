"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const SERVICES = [
  "Dental Checkup",
  "Teeth Cleaning",
  "Dental Filling",
  "Teeth Whitening",
  "Braces Consultation",
  "Root Canal Consultation",
];

interface Doctor {
  id: string;
  full_name: string;
}

export default function BookPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [form, setForm] = useState({
    service: "",
    doctor_id: "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get("/doctors").then((res) => setDoctors(res.data)).catch(() => {});
  }, []);

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

  const handleSubmit = async () => {
    setError("");
    if (!form.service || !form.doctor_id || !form.date || !form.time) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const datetime = new Date(`${form.date}T${form.time}:00`).toISOString();
      await api.post("/appointments", {
        patient_name: user?.full_name,
        phone_number: user?.phone_number || "",
        service: form.service,
        datetime,
        doctor_id: form.doctor_id,
      });
      setSuccess(true);
      setTimeout(() => router.push("/patient/appointments"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  const formatTime = (time: string) => {
    const [hour] = time.split(":");
    const h = parseInt(hour);
    return h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h - 12}:00 PM`;
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦷</span>
          <span className="text-lg font-bold text-blue-600">DentAI</span>
        </div>
        <button
          onClick={() => router.push("/patient/dashboard")}
          className="text-sm text-gray-500 hover:text-blue-600 transition"
        >
          Back to Dashboard
        </button>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Book an Appointment</h1>
        <p className="text-sm text-gray-500 mb-8">Choose your service, doctor, and preferred time</p>

        {success && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl">
            Appointment booked successfully! Redirecting...
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* SERVICE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="">Select a service</option>
              {SERVICES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* DOCTOR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value, time: "" })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
            >
              <option value="">Select a doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>

          {/* DATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
            <input
              type="date"
              min={today}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, time: "" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* TIME SLOTS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
            {!form.doctor_id || !form.date ? (
              <p className="text-sm text-gray-400">Select a doctor and date first</p>
            ) : slotsLoading ? (
              <p className="text-sm text-gray-400">Loading slots...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-red-400">No available slots for this day</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setForm((f) => ({ ...f, time: slot }))}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition ${
                      form.time === slot
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                    }`}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PATIENT INFO */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Name:</span> {user?.full_name}</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || success}
            className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>

        </div>
      </div>
    </main>
  );
}