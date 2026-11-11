"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/format";
import type { Doctor, Service } from "@/lib/api/site";

type Step = "doctor" | "service" | "date" | "time" | "details" | "summary";

type PatientForm = {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: "male" | "female" | "other" | "unspecified";
  reason: string;
  notes: string;
};

const STEPS: Step[] = ["doctor", "service", "date", "time", "details", "summary"];

const STEP_LABELS: Record<Step, string> = {
  doctor: "Doctor",
  service: "Service",
  date: "Date",
  time: "Time",
  details: "Details",
  summary: "Confirm",
};

type Props = {
  doctors: Doctor[];
  initialDoctorSlug?: string;
  initialServiceId?: string;
  initialName?: string;
  initialEmail?: string;
  initialDate?: string;
};

export function BookingWizard({
  doctors,
  initialDoctorSlug,
  initialServiceId,
  initialName,
  initialEmail,
  initialDate,
}: Props) {
  const [step, setStep] = useState<Step>("doctor");
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [service, setService] = useState<Service | null>(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || "");
  const [calendar, setCalendar] = useState<
    Record<string, "available" | "unavailable" | "full" | "past">
  >({});
  const [slots, setSlots] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<PatientForm>({
    fullName: initialName || "",
    email: initialEmail || "",
    phone: "",
    age: "",
    gender: "unspecified",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!initialDoctorSlug || doctors.length === 0) return;
    const match = doctors.find((d) => d.slug === initialDoctorSlug || d._id === initialDoctorSlug);
    if (match) {
      setDoctor(match);
      setStep("service");
    }
  }, [doctors, initialDoctorSlug]);

  useEffect(() => {
    if (!doctor) return;
    let cancelled = false;
    (async () => {
      setLoadingServices(true);
      setError("");
      try {
        const res = await fetch(`/api/doctors/${doctor.slug || doctor._id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load services");
        if (cancelled) return;
        const list = (json.data.services || []) as Service[];
        setServices(list);
        if (initialServiceId) {
          const found = list.find((s) => s._id === initialServiceId);
          if (found) {
            setService(found);
            setStep("date");
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load services");
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctor, initialServiceId]);

  useEffect(() => {
    if (!doctor || !service) return;
    let cancelled = false;
    const from = format(startOfMonth(month), "yyyy-MM-dd");
    const to = format(endOfMonth(month), "yyyy-MM-dd");
    (async () => {
      setLoadingCalendar(true);
      try {
        const res = await fetch(
          `/api/slots?doctorId=${doctor._id}&serviceId=${service._id}&from=${from}&to=${to}`,
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load calendar");
        if (!cancelled) setCalendar(json.data.days || {});
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        if (!cancelled) setLoadingCalendar(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctor, service, month]);

  useEffect(() => {
    if (!doctor || !service || !selectedDate) return;
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      setSlots([]);
      setStartTime("");
      try {
        const res = await fetch(
          `/api/slots?doctorId=${doctor._id}&serviceId=${service._id}&date=${selectedDate}`,
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load slots");
        if (!cancelled) setSlots(json.data.slots || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load slots");
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctor, service, selectedDate]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const stepIndex = STEPS.indexOf(step);

  function goNext() {
    setError("");
    if (step === "doctor" && !doctor) return setError("Please select a doctor");
    if (step === "service" && !service) return setError("Please select a service");
    if (step === "date" && !selectedDate) return setError("Please select a date");
    if (step === "time" && !startTime) return setError("Please select a time");
    if (step === "details") {
      if (!patient.fullName.trim() || patient.fullName.trim().length < 2) {
        return setError("Full name is required");
      }
      if (!patient.email.includes("@")) return setError("Valid email is required");
      if (patient.phone.trim().length < 8) return setError("Valid phone is required");
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    setError("");
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  async function submitBooking() {
    if (!doctor || !service || !selectedDate || !startTime) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor._id,
          serviceId: service._id,
          date: selectedDate,
          startTime,
          patient: {
            fullName: patient.fullName.trim(),
            email: patient.email.trim(),
            phone: patient.phone.trim(),
            age: patient.age ? Number(patient.age) : undefined,
            gender: patient.gender,
            reason: patient.reason.trim() || undefined,
            notes: patient.notes.trim() || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Booking failed");
      const checkoutUrl = json.data.checkoutUrl as string;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }
      throw new Error("Checkout URL missing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
      setSubmitting(false);
    }
  }

  const today = startOfDay(new Date());

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]">
      <div className="border-b border-border bg-surface-muted/50 px-5 py-4 md:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">
              Book appointment
            </p>
            <h1 className="font-display text-2xl text-foreground md:text-3xl">
              {STEP_LABELS[step]}
            </h1>
          </div>
          <Badge tone="neutral">
            Step {stepIndex + 1} of {STEPS.length}
          </Badge>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                i <= stepIndex ? "bg-brand" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      <div className="space-y-6 px-5 py-6 md:px-8 md:py-8">
        {error ? (
          <div className="rounded-xl border border-danger/20 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {step === "doctor" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {doctors.map((d) => (
              <button
                key={d._id}
                type="button"
                onClick={() => {
                  setDoctor(d);
                  setService(null);
                  setServices([]);
                  setSelectedDate("");
                  setStartTime("");
                  setError("");
                }}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  doctor?._id === d._id
                    ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                    : "border-border hover:border-brand/40 hover:bg-surface-muted/60",
                )}
              >
                <p className="font-medium text-foreground">{d.fullName}</p>
                <p className="mt-1 text-sm text-muted">{d.specialization}</p>
                <p className="mt-2 text-xs text-muted">
                  From {formatCurrency(d.consultationFeeFrom || 0)}
                </p>
              </button>
            ))}
            {doctors.length === 0 ? (
              <p className="text-sm text-muted sm:col-span-2">No doctors available right now.</p>
            ) : null}
          </div>
        ) : null}

        {step === "service" ? (
          <div className="space-y-3">
            {loadingServices ? (
              <LoadingRow label="Loading services…" />
            ) : (
              services.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => {
                    setService(s);
                    setSelectedDate("");
                    setStartTime("");
                    setError("");
                  }}
                  className={cn(
                    "flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left transition",
                    service?._id === s._id
                      ? "border-brand bg-brand-soft/60 ring-2 ring-brand/20"
                      : "border-border hover:border-brand/40 hover:bg-surface-muted/60",
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="mt-1 text-sm text-muted">{s.durationMinutes} minutes</p>
                    {s.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{s.description}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-semibold text-foreground">
                    {formatCurrency(s.price, s.currency || "PKR")}
                  </p>
                </button>
              ))
            )}
            {!loadingServices && services.length === 0 ? (
              <p className="text-sm text-muted">No services for this doctor yet.</p>
            ) : null}
          </div>
        ) : null}

        {step === "date" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-surface-muted"
                onClick={() => setMonth((m) => startOfMonth(addDays(m, -1)))}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <p className="font-medium">{format(month, "MMMM yyyy")}</p>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-surface-muted"
                onClick={() => setMonth((m) => startOfMonth(addDays(endOfMonth(m), 1)))}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            {loadingCalendar ? <LoadingRow label="Loading availability…" /> : null}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: days[0]?.getDay() || 0 }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const status = calendar[key] || "unavailable";
                const disabled =
                  isBefore(day, today) ||
                  status === "past" ||
                  status === "unavailable" ||
                  status === "full" ||
                  !isSameMonth(day, month);
                const selected = selectedDate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedDate(key);
                      setStartTime("");
                      setError("");
                    }}
                    className={cn(
                      "aspect-square rounded-xl text-sm transition",
                      selected && "bg-brand font-semibold text-navy",
                      !selected && !disabled && "hover:bg-brand-soft text-foreground",
                      disabled && "cursor-not-allowed text-muted-soft opacity-50",
                      !selected && status === "available" && "bg-brand-soft font-medium text-navy",
                      !selected && status === "full" && "line-through",
                    )}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted">
              Highlighted dates have openings. Unavailable, full, or past days are disabled.
            </p>
          </div>
        ) : null}

        {step === "time" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Available times for {selectedDate ? formatDate(selectedDate) : "—"}
            </p>
            {loadingSlots ? <LoadingRow label="Loading slots…" /> : null}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setStartTime(slot);
                    setError("");
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm transition",
                    startTime === slot
                      ? "border-brand bg-brand font-semibold text-navy"
                      : "border-border hover:border-brand/40 hover:bg-brand-soft/50",
                  )}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
            {!loadingSlots && slots.length === 0 ? (
              <p className="text-sm text-muted">No open slots for this date. Try another day.</p>
            ) : null}
          </div>
        ) : null}

        {step === "details" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Full name"
              name="fullName"
              value={patient.fullName}
              onChange={(e) => setPatient((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={patient.email}
              onChange={(e) => setPatient((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={patient.phone}
              onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))}
              required
            />
            <Input
              label="Age (optional)"
              name="age"
              type="number"
              min={0}
              max={120}
              value={patient.age}
              onChange={(e) => setPatient((p) => ({ ...p, age: e.target.value }))}
            />
            <Select
              label="Gender"
              name="gender"
              value={patient.gender}
              onChange={(e) =>
                setPatient((p) => ({
                  ...p,
                  gender: e.target.value as PatientForm["gender"],
                }))
              }
            >
              <option value="unspecified">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </Select>
            <Input
              label="Reason for visit"
              name="reason"
              value={patient.reason}
              onChange={(e) => setPatient((p) => ({ ...p, reason: e.target.value }))}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Notes (optional)"
                name="notes"
                value={patient.notes}
                onChange={(e) => setPatient((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
        ) : null}

        {step === "summary" ? (
          <div className="space-y-4">
            <SummaryRow label="Doctor" value={doctor?.fullName || "—"} />
            <SummaryRow label="Service" value={service?.name || "—"} />
            <SummaryRow
              label="When"
              value={
                selectedDate && startTime
                  ? `${formatDate(selectedDate)} · ${formatTime(startTime)}`
                  : "—"
              }
            />
            <SummaryRow
              label="Fee"
              value={service ? formatCurrency(service.price, service.currency || "PKR") : "—"}
            />
            <SummaryRow label="Patient" value={patient.fullName} />
            <SummaryRow label="Contact" value={`${patient.email} · ${patient.phone}`} />
            <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-muted">
              You will be redirected to secure checkout. Your slot stays reserved for a short window
              while you complete payment.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={stepIndex === 0 || submitting}
          >
            Back
          </Button>
          {step !== "summary" ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button type="button" onClick={submitBooking} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Redirecting…
                </>
              ) : (
                "Pay & Confirm"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <Loader2 className="animate-spin" size={16} />
      {label}
    </div>
  );
}
