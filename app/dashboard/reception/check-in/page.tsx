"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatTime } from "@/lib/utils/format";

type CheckedIn = {
  _id: string;
  appointmentNumber?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  queueNumber?: number;
  patientDetails?: { fullName?: string; phone?: string; email?: string };
  doctor?: { fullName?: string; specialization?: string } | string;
  service?: { name?: string } | string;
  patient?: { patientId?: string; fullName?: string } | null;
  payment?: { status?: string; reference?: string; amount?: number } | null;
};

export default function ReceptionCheckInPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CheckedIn | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch<CheckedIn>("/api/reception/check-in", {
        method: "POST",
        body: JSON.stringify({ query: query.trim() }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Patient check-in</h2>
        <p className="text-sm text-slate-500">
          Search by appointment #, patient ID, phone, email, or receipt token
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5"
      >
        <label className="block text-sm font-medium text-slate-700">
          Lookup
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="APT-… / phone / patient ID"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </div>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Checking in…" : "Check in patient"}
        </button>
      </form>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      {result ? (
        <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Check-in successful</h3>
            <StatusBadge status={result.status} />
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Patient</dt>
              <dd className="font-medium text-slate-900">
                {result.patientDetails?.fullName ||
                  (typeof result.patient === "object" ? result.patient?.fullName : null) ||
                  "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Appointment</dt>
              <dd className="font-mono text-slate-900">
                {result.appointmentNumber || result._id.slice(-6)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Doctor</dt>
              <dd className="text-slate-900">
                {typeof result.doctor === "object" && result.doctor
                  ? result.doctor.fullName
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Queue #</dt>
              <dd className="font-semibold text-[#0F6B5C]">{result.queueNumber ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Schedule</dt>
              <dd className="text-slate-900">
                {result.date} · {formatTime(result.startTime)} – {formatTime(result.endTime)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Service</dt>
              <dd className="text-slate-900">
                {typeof result.service === "object" && result.service
                  ? result.service.name
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
