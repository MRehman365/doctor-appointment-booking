"use client";

import { FormEvent, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuth";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { apiFetch } from "@/lib/dashboard/api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DaySchedule = {
  dayOfWeek: number;
  isAvailable: boolean;
  ranges: Array<{ start: string; end: string }>;
  breaks?: Array<{ start: string; end: string }>;
};

type Exception = {
  _id: string;
  date: string;
  type: string;
  reason?: string;
};

type AvailabilityPayload = {
  availability: {
    weekly?: DaySchedule[];
    timezone?: string;
    bufferMinutes?: number;
    maxDailyAppointments?: number;
  } | null;
  exceptions: Exception[];
};

function defaultWeekly(): DaySchedule[] {
  return DAYS.map((_, dayOfWeek) => ({
    dayOfWeek,
    isAvailable: dayOfWeek >= 1 && dayOfWeek <= 5,
    ranges: dayOfWeek >= 1 && dayOfWeek <= 5 ? [{ start: "09:00", end: "17:00" }] : [],
    breaks: [],
  }));
}

export default function DoctorAvailabilityPage() {
  const { doctorId } = useDashboardAuth();
  const [weekly, setWeekly] = useState<DaySchedule[]>(defaultWeekly());
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [maxDailyAppointments, setMaxDailyAppointments] = useState(40);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [exceptionForm, setExceptionForm] = useState({
    date: "",
    type: "holiday",
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!doctorId) return;
    setLoading(true);
    try {
      const data = await apiFetch<AvailabilityPayload>(
        `/api/availability?doctorId=${doctorId}`,
      );
      const incoming = data.availability?.weekly?.length
        ? data.availability.weekly
        : defaultWeekly();
      const byDay = new Map(incoming.map((d) => [d.dayOfWeek, d]));
      setWeekly(
        DAYS.map((_, dayOfWeek) =>
          byDay.get(dayOfWeek) || {
            dayOfWeek,
            isAvailable: false,
            ranges: [],
            breaks: [],
          },
        ),
      );
      setTimezone(data.availability?.timezone || "Asia/Karachi");
      setBufferMinutes(data.availability?.bufferMinutes ?? 0);
      setMaxDailyAppointments(data.availability?.maxDailyAppointments ?? 40);
      setExceptions(data.exceptions || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  async function saveWeekly(e: FormEvent) {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/api/availability", {
        method: "PUT",
        body: JSON.stringify({
          doctorId,
          timezone,
          bufferMinutes,
          maxDailyAppointments,
          weekly,
        }),
      });
      setMessage("Weekly schedule saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addException(e: FormEvent) {
    e.preventDefault();
    if (!doctorId) return;
    try {
      await apiFetch("/api/availability", {
        method: "POST",
        body: JSON.stringify({
          doctorId,
          date: exceptionForm.date,
          type: exceptionForm.type,
          reason: exceptionForm.reason,
        }),
      });
      setExceptionForm({ date: "", type: "holiday", reason: "" });
      setMessage("Exception saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exception save failed");
    }
  }

  async function removeException(date: string) {
    if (!doctorId) return;
    try {
      await apiFetch(
        `/api/availability?doctorId=${doctorId}&date=${encodeURIComponent(date)}`,
        { method: "DELETE" },
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const exceptionColumns: Column<Exception>[] = [
    { key: "date", header: "Date", render: (row) => row.date },
    { key: "type", header: "Type", render: (row) => row.type },
    { key: "reason", header: "Reason", render: (row) => row.reason || "—" },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          className="text-xs font-medium text-rose-600 hover:underline"
          onClick={() => void removeException(row.date)}
        >
          Remove
        </button>
      ),
    },
  ];

  if (!doctorId) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
        No doctor profile linked to this account.
      </p>
    );
  }

  if (loading) return <p className="text-sm text-slate-500">Loading availability…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
        <p className="text-sm text-slate-500">Weekly hours and date-specific exceptions</p>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <form onSubmit={saveWeekly} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700">
            Timezone
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Buffer (min)
            <input
              type="number"
              min={0}
              value={bufferMinutes}
              onChange={(e) => setBufferMinutes(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Max daily appointments
            <input
              type="number"
              min={1}
              value={maxDailyAppointments}
              onChange={(e) => setMaxDailyAppointments(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </label>
        </div>

        <div className="space-y-3">
          {weekly.map((day, index) => (
            <div
              key={day.dayOfWeek}
              className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[140px_1fr_1fr_auto]"
            >
              <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={day.isAvailable}
                  onChange={(e) =>
                    setWeekly((prev) => {
                      const next = [...prev];
                      next[index] = {
                        ...next[index],
                        isAvailable: e.target.checked,
                        ranges:
                          e.target.checked && !next[index].ranges.length
                            ? [{ start: "09:00", end: "17:00" }]
                            : next[index].ranges,
                      };
                      return next;
                    })
                  }
                />
                {DAYS[day.dayOfWeek]}
              </label>
              <input
                type="time"
                disabled={!day.isAvailable}
                value={day.ranges[0]?.start || "09:00"}
                onChange={(e) =>
                  setWeekly((prev) => {
                    const next = [...prev];
                    const range = next[index].ranges[0] || { start: "09:00", end: "17:00" };
                    next[index] = {
                      ...next[index],
                      ranges: [{ ...range, start: e.target.value }],
                    };
                    return next;
                  })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              />
              <input
                type="time"
                disabled={!day.isAvailable}
                value={day.ranges[0]?.end || "17:00"}
                onChange={(e) =>
                  setWeekly((prev) => {
                    const next = [...prev];
                    const range = next[index].ranges[0] || { start: "09:00", end: "17:00" };
                    next[index] = {
                      ...next[index],
                      ranges: [{ ...range, end: e.target.value }],
                    };
                    return next;
                  })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              />
              <span className="self-center text-xs text-slate-400">Hours</span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save weekly schedule"}
        </button>
      </form>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Date exceptions</h3>
        <form
          onSubmit={addException}
          className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
        >
          <input
            type="date"
            required
            value={exceptionForm.date}
            onChange={(e) => setExceptionForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            value={exceptionForm.type}
            onChange={(e) => setExceptionForm((f) => ({ ...f, type: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="holiday">Holiday</option>
            <option value="blocked">Blocked</option>
            <option value="special">Special</option>
            <option value="unavailable">Unavailable</option>
          </select>
          <input
            placeholder="Reason"
            value={exceptionForm.reason}
            onChange={(e) => setExceptionForm((f) => ({ ...f, reason: e.target.value }))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-full bg-[#0F6B5C] px-4 py-2 text-sm font-semibold text-white">
            Add exception
          </button>
        </form>
        <DataTable
          columns={exceptionColumns}
          rows={exceptions}
          rowKey={(row) => row._id}
          emptyMessage="No exceptions"
        />
      </section>
    </div>
  );
}
