"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { apiFetch } from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/utils/format";

type DoctorPerf = {
  doctorName: string;
  specialization: string;
  appointments: number;
  revenue: number;
};

type Stats = {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  todayBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  completedAppointments: number;
  doctorPerformance: DoctorPerf[];
};

const columns: Column<DoctorPerf>[] = [
  {
    key: "doctor",
    header: "Doctor",
    render: (row) => (
      <div>
        <p className="font-medium text-slate-900">{row.doctorName}</p>
        <p className="text-xs text-slate-500">{row.specialization}</p>
      </div>
    ),
  },
  {
    key: "appointments",
    header: "Appointments",
    render: (row) => row.appointments,
  },
  {
    key: "revenue",
    header: "Revenue",
    render: (row) => formatCurrency(row.revenue),
  },
];

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Stats>("/api/admin/stats");
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading clinic stats…</p>;
  }

  if (error || !stats) {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || "No data"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active doctors" value={stats.totalDoctors} icon={Stethoscope} />
        <StatCard label="Patients" value={stats.totalPatients} icon={Users} />
        <StatCard label="Today's bookings" value={stats.todayBookings} icon={CalendarDays} />
        <StatCard
          label="Total revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={Wallet}
        />
        <StatCard label="All appointments" value={stats.totalAppointments} icon={CalendarDays} />
        <StatCard label="Completed" value={stats.completedAppointments} icon={CheckCircle2} />
        <StatCard label="Pending payments" value={stats.pendingPayments} icon={CreditCard} />
      </div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Doctor performance</h2>
            <p className="text-sm text-slate-500">Top doctors by confirmed activity</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          rows={stats.doctorPerformance}
          rowKey={(row) => `${row.doctorName}-${row.specialization}`}
          emptyMessage="No performance data yet"
        />
      </section>
    </div>
  );
}
