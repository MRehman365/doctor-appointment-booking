"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, PhoneCall } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatTime } from "@/lib/utils/format";

type Doctor = {
  _id: string;
  fullName: string;
  specialization?: string;
};

type Appointment = {
  _id: string;
  appointmentNumber?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  queueNumber?: number;
  queueOrder?: number;
  patientDetails?: { fullName?: string; phone?: string };
  doctor?: { _id?: string; fullName?: string } | string;
  service?: { name?: string } | string;
};

type TodayPayload = {
  date: string;
  appointments: Appointment[];
};

export default function ReceptionQueuePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadDoctors() {
    const data = await apiFetch<Doctor[]>("/api/doctors");
    setDoctors(data);
    if (!doctorId && data[0]?._id) setDoctorId(data[0]._id);
  }

  async function loadQueue(selectedDoctor = doctorId, selectedDate = date) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedDoctor) params.set("doctorId", selectedDoctor);
      const payload = await apiFetch<TodayPayload>(`/api/reception/today?${params.toString()}`);
      const waiting = payload.appointments
        .filter((a) =>
          ["confirmed", "checked_in", "in_consultation"].includes(a.status),
        )
        .sort(
          (a, b) =>
            (a.queueOrder || a.queueNumber || 999) - (b.queueOrder || b.queueNumber || 999) ||
            a.startTime.localeCompare(b.startTime),
        );
      setRows(waiting);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadDoctors();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load doctors");
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (doctorId) void loadQueue(doctorId, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);

  const waitingOnly = useMemo(
    () => rows.filter((r) => r.status === "checked_in"),
    [rows],
  );

  async function reorder(orderedIds: string[]) {
    if (!doctorId) return;
    setBusy(true);
    try {
      await apiFetch("/api/queue/reorder", {
        method: "POST",
        body: JSON.stringify({
          doctorId,
          date,
          orderedAppointmentIds: orderedIds,
        }),
      });
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const ids = rows.map((r) => r._id);
    const index = ids.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const copy = [...ids];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    await reorder(copy);
  }

  async function updateStatus(id: string, status: string) {
    setBusy(true);
    try {
      await apiFetch(`/api/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  async function callNext() {
    const next = waitingOnly[0];
    if (!next) {
      setError("No checked-in patients waiting");
      return;
    }
    await updateStatus(next._id, "in_consultation");
  }

  const columns: Column<Appointment>[] = [
    {
      key: "queue",
      header: "Order",
      render: (row) => (
        <span className="font-semibold text-[#0F6B5C]">
          #{row.queueOrder ?? row.queueNumber ?? "—"}
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
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void move(row._id, -1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void move(row._id, 1)}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            aria-label="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          {row.status === "confirmed" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateStatus(row._id, "checked_in")}
              className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              Check in
            </button>
          ) : null}
          {row.status === "checked_in" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateStatus(row._id, "in_consultation")}
              className="rounded-full bg-[#0F6B5C] px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              Call
            </button>
          ) : null}
          {row.status === "in_consultation" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void updateStatus(row._id, "completed")}
              className="rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Doctor-wise queue</h2>
          <p className="text-sm text-slate-500">Call next, reorder, and update statuses</p>
        </div>
        <button
          type="button"
          disabled={busy || waitingOnly.length === 0}
          onClick={() => void callNext()}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <PhoneCall className="h-4 w-4" />
          Call next
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Doctor
          <select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          >
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.fullName}
                {d.specialization ? ` · ${d.specialization}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
      </div>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading queue…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row._id}
          emptyMessage="No patients in this doctor’s queue"
        />
      )}
    </div>
  );
}
