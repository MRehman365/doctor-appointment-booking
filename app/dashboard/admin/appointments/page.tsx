"use client";

import { FormEvent, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatCurrency, formatTime } from "@/lib/utils/format";

const STATUSES = [
  "",
  "pending_payment",
  "confirmed",
  "checked_in",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show",
  "expired",
] as const;

type Appointment = {
  _id: string;
  appointmentNumber?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  fee: number;
  currency?: string;
  patientDetails?: { fullName?: string; phone?: string };
  doctor?: { fullName?: string } | string;
  service?: { name?: string } | string;
  payment?: { status?: string; amount?: number } | null;
};

function doctorName(row: Appointment) {
  return typeof row.doctor === "object" && row.doctor ? row.doctor.fullName || "—" : "—";
}

function serviceName(row: Appointment) {
  return typeof row.service === "object" && row.service ? row.service.name || "—" : "—";
}

export default function AdminAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load(filters?: { status?: string; date?: string; q?: string }) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const s = filters?.status ?? status;
      const d = filters?.date ?? date;
      const query = filters?.q ?? q;
      if (s) params.set("status", s);
      if (d) params.set("date", d);
      if (query.trim()) params.set("q", query.trim());
      const data = await apiFetch<Appointment[]>(`/api/appointments?${params.toString()}`);
      setRows(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  async function updateStatus(id: string, next: string) {
    setUpdating(id);
    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setUpdating(null);
    }
  }

  const columns: Column<Appointment>[] = [
    {
      key: "appt",
      header: "Appointment",
      render: (row) => (
        <div>
          <p className="font-mono text-xs text-slate-500">{row.appointmentNumber || row._id.slice(-6)}</p>
          <p className="font-medium text-slate-900">{row.patientDetails?.fullName || "—"}</p>
        </div>
      ),
    },
    { key: "doctor", header: "Doctor", render: doctorName },
    { key: "service", header: "Service", render: serviceName },
    {
      key: "when",
      header: "Schedule",
      render: (row) => (
        <div>
          <p>{row.date}</p>
          <p className="text-xs text-slate-500">
            {formatTime(row.startTime)} – {formatTime(row.endTime)}
          </p>
        </div>
      ),
    },
    {
      key: "fee",
      header: "Fee",
      render: (row) => formatCurrency(row.fee, row.currency || "PKR"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Update",
      render: (row) => (
        <select
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-[#0F6B5C]"
          value={row.status}
          disabled={updating === row._id}
          onChange={(e) => void updateStatus(row._id, e.target.value)}
        >
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
        <p className="text-sm text-slate-500">Filter and update clinic appointments</p>
      </div>

      <form
        onSubmit={onFilter}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name / phone / #"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-full bg-[#0F6B5C] px-4 py-2 text-sm font-semibold text-white"
        >
          Apply filters
        </button>
      </form>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Loading appointments…</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
