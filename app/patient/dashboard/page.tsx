"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

interface Appointment {
  id: number;
  service: string;
  datetime: string;
  status: string;
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const formatDateTime = (datetime: string) => {
    const d = new Date(datetime);
    return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦷</span>
          <span className="text-lg font-bold text-blue-600">DentAI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hello, {user?.full_name}</span>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* WELCOME */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name}</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your appointments and dental records</p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Total Appointments</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{appointments.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {appointments.filter(a => a.status === "scheduled").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-3xl font-bold text-yellow-500 mt-1">
              {appointments.filter(a => a.status === "pending").length}
            </p>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/patient/book")}
            className="bg-blue-600 text-white rounded-2xl p-5 text-left hover:bg-blue-700 transition shadow-sm"
          >
            <p className="text-lg font-semibold">Book Appointment</p>
            <p className="text-sm text-blue-100 mt-1">Schedule a new visit</p>
          </button>
          <button
            onClick={() => router.push("/patient/appointments")}
            className="bg-white text-gray-800 rounded-2xl p-5 text-left border border-gray-100 hover:shadow-md transition"
          >
            <p className="text-lg font-semibold">My Appointments</p>
            <p className="text-sm text-gray-500 mt-1">View and manage bookings</p>
          </button>
          <a
            href="tel:+15186346766"
            className="bg-white text-gray-800 rounded-2xl p-5 text-left border border-gray-100 hover:shadow-md transition block"
          >
            <p className="text-lg font-semibold">Call AI Agent</p>
            <p className="text-sm text-gray-500 mt-1">Speak to our AI receptionist</p>
          </a>
        </div>

        {/* RECENT APPOINTMENTS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Appointments</h2>
            <button
              onClick={() => router.push("/patient/appointments")}
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Loading...</div>
          ) : appointments.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-gray-400 text-sm">No appointments yet</p>
              <button
                onClick={() => router.push("/patient/book")}
                className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition"
              >
                Book your first appointment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {appointments.map((apt) => {
                const { date, time } = formatDateTime(apt.datetime);
                return (
                  <div key={apt.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{apt.service}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{date} at {time}</p>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}