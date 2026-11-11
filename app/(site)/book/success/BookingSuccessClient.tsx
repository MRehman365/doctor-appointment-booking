"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/format";

type VerifyState =
  | { status: "polling" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      paymentStatus: string;
      appointmentStatus?: string;
      receiptToken?: string;
      appointment?: any;
    };

export function BookingSuccessClient({ reference }: { reference: string }) {
  const [state, setState] = useState<VerifyState>(
    reference ? { status: "polling" } : { status: "error", message: "Missing payment reference." },
  );

  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/payments/verify?reference=${encodeURIComponent(reference)}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Verification failed");

        const paymentStatus = json.data.paymentStatus as string;
        if (paymentStatus === "paid" || paymentStatus === "completed" || paymentStatus === "success") {
          if (!cancelled) {
            setState({
              status: "ready",
              paymentStatus,
              appointmentStatus: json.data.appointmentStatus,
              receiptToken: json.data.receiptToken,
              appointment: json.data.appointment,
            });
          }
          return;
        }

        if (paymentStatus === "failed" || paymentStatus === "expired" || paymentStatus === "cancelled") {
          if (!cancelled) {
            setState({
              status: "error",
              message: `Payment ${paymentStatus}. Please try booking again.`,
            });
          }
          return;
        }

        if (attempts < 20) {
          setTimeout(poll, 2000);
        } else if (!cancelled) {
          setState({
            status: "ready",
            paymentStatus,
            appointmentStatus: json.data.appointmentStatus,
            receiptToken: json.data.receiptToken,
            appointment: json.data.appointment,
          });
        }
      } catch (e) {
        if (attempts < 8) {
          setTimeout(poll, 2500);
        } else if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Could not verify payment",
          });
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (state.status === "polling") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-soft)]">
        <Loader2 className="mx-auto animate-spin text-brand" size={28} />
        <h1 className="mt-4 font-display text-2xl">Confirming your payment</h1>
        <p className="mt-2 text-sm text-muted">
          Please wait a moment while we finalize your appointment.
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center shadow-[var(--shadow-soft)]">
        <XCircle className="mx-auto text-danger" size={28} />
        <h1 className="mt-4 font-display text-2xl">Payment not confirmed</h1>
        <p className="mt-2 text-sm text-muted">{state.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/book">Try again</Button>
          <Button href="/contact" variant="outline">
            Contact clinic
          </Button>
        </div>
      </div>
    );
  }

  const ready = state as Extract<VerifyState, { status: "ready" }>;
  const apt = ready.appointment;
  const doctorName = apt?.doctor?.fullName || apt?.doctor || "Your doctor";
  const serviceName = apt?.service?.name || apt?.service || "Consultation";
  const confirmed =
    ready.paymentStatus === "paid" ||
    ready.appointmentStatus === "confirmed" ||
    Boolean(ready.receiptToken);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-soft)]">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-success" size={32} />
        <h1 className="mt-4 font-display text-3xl">
          {confirmed ? "Appointment confirmed" : "Payment received"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {confirmed
            ? "Your visit is booked. Save your receipt for check-in."
            : "We are still finalizing confirmation. Keep this page or check your email shortly."}
        </p>
      </div>

      <dl className="mt-8 space-y-3 text-sm">
        <Row label="Doctor" value={String(doctorName)} />
        <Row label="Service" value={String(serviceName)} />
        {apt?.date ? (
          <Row
            label="When"
            value={`${formatDate(apt.date)}${apt.startTime ? ` · ${formatTime(apt.startTime)}` : ""}`}
          />
        ) : null}
        {apt?.appointmentNumber ? (
          <Row label="Appointment #" value={apt.appointmentNumber} />
        ) : null}
        {apt?.queueNumber != null ? <Row label="Queue" value={String(apt.queueNumber)} /> : null}
        {apt?.fee != null ? (
          <Row label="Paid" value={formatCurrency(apt.fee, apt.currency || "PKR")} />
        ) : null}
        <Row label="Reference" value={reference} />
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {ready.receiptToken ? (
          <Button href={`/receipt/${ready.receiptToken}`}>View receipt</Button>
        ) : null}
        <Button href="/book" variant="outline">
          Book another
        </Button>
        <Link href="/" className="text-center text-sm font-medium text-brand-text hover:underline sm:self-center">
          Back home
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
