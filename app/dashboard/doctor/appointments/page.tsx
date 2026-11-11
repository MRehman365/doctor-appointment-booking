"use client";

import { FormEvent, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatCurrency, formatTime } from "@/lib/utils/format";

type Appointment = {
  _id: string;
  appointmentNumber?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  fee: number;
  currency?: string;
  patientDetails?: { fullName?: string; phone?: string; reason?: string };
  service?: { name?: string } | string;
};

export default function DoctorAppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      if (status) params.set("status", status);
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
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(null);
    }
  }

  const columns: Column<Appointment>[] = [
    {
      key: "patient",
      header: "Patient",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.patientDetails?.fullName || "—"}</p>
          <p className="text-xs text-slate-500">{row.appointmentNumber || row._id.slice(-6)}</p>
        </div>
      ),
    },
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
      key: "service",
      header: "Service",
      render: (row) =>
        typeof row.service === "object" && row.service ? row.service.name || "—" : "—",
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
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
          value={row.status}
          disabled={updating === row._id}
          onChange={(e) => void updateStatus(row._id, e.target.value)}
        >
          {[
            "confirmed",
            "checked_in",
            "in_consultation",
            "completed",
            "no_show",
            "cancelled",
          ].map((s) => (
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
        <h2 className="text-lg font-semibold text-slate-900">My appointments</h2>
        <p className="text-sm text-slate-500">Scoped automatically to your doctor profile</p>
      </div>

      <form onSubmit={onFilter} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
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
          {[
            "confirmed",
            "checked_in",
            "in_consultation",
            "completed",
            "cancelled",
            "no_show",
          ].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-full bg-[#0F6B5C] px-4 py-2 text-sm font-semibold text-white">
          Apply
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
