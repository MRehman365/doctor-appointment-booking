"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, ListOrdered, Wallet } from "lucide-react";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuth";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatCard } from "@/components/dashboard/StatCard";
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
  queueNumber?: number;
  queueOrder?: number;
  patientDetails?: { fullName?: string; phone?: string };
  service?: { name?: string } | string;
  payment?: { status?: string; amount?: number } | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DoctorOverviewPage() {
  const { doctorId } = useDashboardAuth();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = todayISO();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Appointment[]>(`/api/appointments?date=${today}`);
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load today's schedule");
      } finally {
        setLoading(false);
      }
    })();
  }, [today, doctorId]);

  const stats = useMemo(() => {
    const active = rows.filter((r) =>
      ["confirmed", "checked_in", "in_consultation", "completed"].includes(r.status),
    );
    const waiting = rows.filter((r) => r.status === "checked_in");
    const completed = rows.filter((r) => r.status === "completed");
    const revenue = rows
      .filter((r) => r.payment?.status === "paid" || r.status === "completed")
      .reduce((sum, r) => sum + (r.payment?.amount ?? r.fee ?? 0), 0);
    return {
      total: active.length,
      waiting: waiting.length,
      completed: completed.length,
      revenue,
    };
  }, [rows]);

  const queue = [...rows]
    .filter((r) => ["checked_in", "in_consultation"].includes(r.status))
    .sort((a, b) => (a.queueOrder || a.queueNumber || 0) - (b.queueOrder || b.queueNumber || 0));

  const columns: Column<Appointment>[] = [
    {
      key: "time",
      header: "Time",
      render: (row) => `${formatTime(row.startTime)} – ${formatTime(row.endTime)}`,
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
      key: "service",
      header: "Service",
      render: (row) =>
        typeof row.service === "object" && row.service ? row.service.name || "—" : "—",
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

  if (loading) return <p className="text-sm text-slate-500">Loading today’s board…</p>;

  return (
    <div className="space-y-6">
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's appointments" value={stats.total} icon={CalendarDays} />
        <StatCard label="Waiting queue" value={stats.waiting} icon={ListOrdered} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} />
        <StatCard label="Revenue today" value={formatCurrency(stats.revenue)} icon={Wallet} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Live queue</h2>
        <DataTable
          columns={columns}
          rows={queue}
          rowKey={(row) => row._id}
          emptyMessage="No patients waiting"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Today’s appointments</h2>
        <DataTable columns={columns} rows={rows} rowKey={(row) => row._id} />
      </section>
    </div>
  );
}
