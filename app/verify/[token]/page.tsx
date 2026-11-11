import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { fetchVerification } from "@/lib/api/site";
import { formatDate, formatTime } from "@/lib/utils/format";

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: "Verify Appointment",
  description: "Public verification for Medical Complex appointments",
};

async function VerifyBody({ token }: { token: string }) {
  let data;
  try {
    data = await fetchVerification(token);
  } catch {
    notFound();
  }

  if (!data.valid) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text">
              Verification
            </p>
            <Badge tone="success">Valid</Badge>
          </div>
          <h1 className="mt-4 font-display text-3xl text-foreground">Appointment verified</h1>
          <p className="mt-2 text-sm text-muted">
            This booking is recognized by Medical Complex systems.
          </p>

          <dl className="mt-8 space-y-3 text-sm">
            <Row label="Appointment #" value={data.appointmentNumber || "—"} />
            <Row
              label="Queue"
              value={
                data.queueNumber != null ? String(data.queueNumber).padStart(3, "0") : "—"
              }
            />
            <Row label="Patient ID" value={data.patientId || "—"} />
            <Row label="Patient" value={data.patientName || "—"} />
            <Row label="Doctor" value={data.doctor || "—"} />
            <Row
              label="When"
              value={
                data.date
                  ? `${formatDate(data.date)}${data.startTime ? ` · ${formatTime(data.startTime)}` : ""}`
                  : "—"
              }
            />
            <Row label="Status" value={(data.status || "—").replaceAll("_", " ")} />
            <Row
              label="Payment"
              value={(data.paymentStatus || "—").replaceAll("_", " ")}
            />
          </dl>

          <div className="mt-8">
            <Button href="/" variant="outline">
              Back to Medical Complex
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium capitalize text-foreground">{value}</dd>
    </div>
  );
}

export default async function VerifyPage({ params }: Props) {
  const { token } = await params;
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-muted">
          Verifying…
        </div>
      }
    >
      <VerifyBody token={token} />
    </Suspense>
  );
}
