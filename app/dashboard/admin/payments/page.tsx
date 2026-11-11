"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StatCard } from "@/components/dashboard/StatCard";
import { apiFetch } from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/utils/format";

type Appointment = {
  _id: string;
  appointmentNumber?: string;
  date: string;
  fee: number;
  currency?: string;
  status: string;
  patientDetails?: { fullName?: string; email?: string };
  doctor?: { fullName?: string } | string;
  payment?: {
    status?: string;
    reference?: string;
    amount?: number;
  } | null;
};

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Appointment[]>("/api/appointments");
        setRows(data.filter((a) => a.payment));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payments");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.payment?.status === filter);
  }, [rows, filter]);

  const paidTotal = rows
    .filter((r) => r.payment?.status === "paid")
    .reduce((sum, r) => sum + (r.payment?.amount ?? r.fee ?? 0), 0);

  const pendingCount = rows.filter((r) => r.payment?.status === "pending").length;

  const columns: Column<Appointment>[] = [
    {
      key: "ref",
      header: "Reference",
      render: (row) => (
        <div>
          <p className="font-mono text-xs">{row.payment?.reference || "—"}</p>
          <p className="text-xs text-slate-500">{row.appointmentNumber || row._id.slice(-6)}</p>
        </div>
      ),
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patientDetails?.fullName || "—",
    },
    {
      key: "doctor",
      header: "Doctor",
      render: (row) =>
        typeof row.doctor === "object" && row.doctor ? row.doctor.fullName || "—" : "—",
    },
    { key: "date", header: "Date", render: (row) => row.date },
    {
      key: "amount",
      header: "Amount",
      render: (row) =>
        formatCurrency(row.payment?.amount ?? row.fee, row.currency || "PKR"),
    },
    {
      key: "status",
      header: "Payment",
      render: (row) => <StatusBadge status={row.payment?.status || "pending"} />,
    },
    {
      key: "appt",
      header: "Appointment",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Payments</h2>
        <p className="text-sm text-slate-500">Payment info from booked appointments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Paid total" value={formatCurrency(paidTotal)} />
        <StatCard label="Pending payments" value={pendingCount} />
        <StatCard label="Records" value={rows.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "paid", "pending", "failed", "refunded"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              filter === s
                ? "bg-[#0F6B5C] text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Loading payments…</p>
      ) : (
        <DataTable columns={columns} rows={filtered} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
