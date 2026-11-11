import { Suspense } from "react";
import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { BookingSuccessClient } from "./BookingSuccessClient";

export const metadata: Metadata = {
  title: "Booking Confirmation",
  description: "Confirming your Medical Complex appointment payment.",
};

type Props = {
  searchParams: Promise<{ reference?: string }>;
};

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { reference } = await searchParams;

  return (
    <Section>
      <Suspense
        fallback={
          <div className="mx-auto max-w-lg rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="animate-pulse-soft text-sm text-muted">Confirming payment…</p>
          </div>
        }
      >
        <BookingSuccessClient reference={reference || ""} />
      </Suspense>
    </Section>
  );
}
