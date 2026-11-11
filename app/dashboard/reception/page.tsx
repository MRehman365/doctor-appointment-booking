"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ListOrdered, Users } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatCard } from "@/components/dashboard/StatCard";
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
  patientDetails?: { fullName?: string; phone?: string };
  doctor?: { fullName?: string } | string;
  service?: { name?: string } | string;
};

type TodayPayload = {
  date: string;
  stats: {
    totalConfirmed: number;
    checkedIn: number;
    waiting: number;
    inConsultation: number;
    completed: number;
  };
  appointments: Appointment[];
};

export default function ReceptionOverviewPage() {
  const [data, setData] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const payload = await apiFetch<TodayPayload>("/api/reception/today");
      setData(payload);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load today’s overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const columns: Column<Appointment>[] = [
    {
      key: "patient",
      header: "Patient",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.patientDetails?.fullName || "—"}</p>
          <p className="font-mono text-xs text-slate-500">
            {row.appointmentNumber || row._id.slice(-6)}
          </p>
        </div>
      ),
    },
    {
      key: "doctor",
      header: "Doctor",
      render: (row) =>
        typeof row.doctor === "object" && row.doctor ? row.doctor.fullName || "—" : "—",
    },
    {
      key: "time",
      header: "Time",
      render: (row) => `${formatTime(row.startTime)} – ${formatTime(row.endTime)}`,
    },
    {
      key: "queue",
      header: "Queue #",
      render: (row) => row.queueNumber ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  if (loading) return <p className="text-sm text-slate-500">Loading reception board…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Today’s overview</h2>
          <p className="text-sm text-slate-500">{data?.date}</p>
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

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Confirmed today" value={data.stats.totalConfirmed} icon={Users} />
            <StatCard label="Waiting" value={data.stats.waiting} icon={ListOrdered} />
            <StatCard label="In consultation" value={data.stats.inConsultation} icon={Clock3} />
            <StatCard label="Completed" value={data.stats.completed} icon={CheckCircle2} />
          </div>

          <DataTable
            columns={columns}
            rows={data.appointments}
            rowKey={(row) => row._id}
            emptyMessage="No appointments for today"
          />
        </>
      ) : null}
    </div>
  );
}
