"use client";

import { useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatTime } from "@/lib/utils/format";

type Appointment = {
  _id: string;
  appointmentNumber?: string;
  startTime: string;
  endTime: string;
  status: string;
  queueNumber?: number;
  queueOrder?: number;
  patientDetails?: { fullName?: string; phone?: string };
  service?: { name?: string } | string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DoctorQueuePage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = todayISO();

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Appointment[]>(`/api/appointments?date=${today}`);
      const queue = data
        .filter((r) =>
          ["confirmed", "checked_in", "in_consultation", "completed"].includes(r.status),
        )
        .sort(
          (a, b) =>
            (a.queueOrder || a.queueNumber || 999) - (b.queueOrder || b.queueNumber || 999) ||
            a.startTime.localeCompare(b.startTime),
        );
      setRows(queue);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<Appointment>[] = [
    {
      key: "queue",
      header: "Queue",
      render: (row) => (
        <span className="font-semibold text-[#0F6B5C]">
          #{row.queueNumber ?? row.queueOrder ?? "—"}
        </span>
      ),
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.patientDetails?.fullName || "—"}</p>
          <p className="text-xs text-slate-500">{row.patientDetails?.phone || "—"}</p>
        </div>
      ),
    },
    {
      key: "time",
      header: "Slot",
      render: (row) => `${formatTime(row.startTime)} – ${formatTime(row.endTime)}`,
    },
    {
      key: "service",
      header: "Service",
      render: (row) =>
        typeof row.service === "object" && row.service ? row.service.name || "—" : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status === "checked_in" || row.status === "confirmed" ? (
            <button
              type="button"
              disabled={busyId === row._id}
              onClick={() => void setStatus(row._id, "in_consultation")}
              className="rounded-full bg-[#0F6B5C] px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Start consult
            </button>
          ) : null}
          {row.status === "in_consultation" ? (
            <button
              type="button"
              disabled={busyId === row._id}
              onClick={() => void setStatus(row._id, "completed")}
              className="rounded-full bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              Complete
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Today’s queue</h2>
          <p className="text-sm text-slate-500">{today}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Loading queue…</p>
      ) : (
        <DataTable columns={columns} rows={rows} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
