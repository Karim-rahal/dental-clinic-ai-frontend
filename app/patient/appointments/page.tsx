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
  doctor_id: string;
  booked_via: string;
}

export default function AppointmentsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    setCancelling(id);
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-green-100 text-green-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "completed": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const formatDateTime = (datetime: string) => {
    const d = new Date(datetime);
    return {
      date: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
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
          <button
            onClick={() => router.push("/patient/dashboard")}
            className="text-sm text-gray-500 hover:text-blue-600 transition"
          >
            Dashboard
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-sm text-gray-500 mt-1">View and manage your bookings</p>
          </div>
          <button
            onClick={() => router.push("/patient/book")}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Book New
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">No appointments yet</p>
            <button
              onClick={() => router.push("/patient/book")}
              className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 transition"
            >
              Book your first appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
              const { date, time } = formatDateTime(apt.datetime);
              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{apt.service}</p>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                      {apt.booked_via === "phone" && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          via call
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{date} at {time}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                      <>
                        <button
                          onClick={() => router.push("/patient/book")}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancelling === apt.id}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {cancelling === apt.id ? "Cancelling..." : "Cancel"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}