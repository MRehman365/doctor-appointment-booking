import { Suspense } from "react";
import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { getHomeDoctors } from "@/lib/api/site-data";

export const metadata: Metadata = {
  title: "Book Appointment",
  description: "Book a Medical Complex appointment online — no login required.",
};

type Props = {
  searchParams: Promise<{
    doctor?: string;
    service?: string;
    name?: string;
    email?: string;
    date?: string;
  }>;
};

async function BookContent({ searchParams }: Props) {
  const { doctor, service, name, email, date } = await searchParams;
  const doctors = await getHomeDoctors().catch(() => []);

  return (
    <section className="bg-surface-muted py-12 md:py-16">
      <div className="site-container">
        <div className="mb-8 max-w-xl">
          <p className="eyebrow">Booking</p>
          <h1 className="headline mt-3">Book appointment</h1>
          <p className="mt-4 subcopy">
            Select a doctor and time, enter your details, then complete payment — no account needed.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <BookingWizard
            doctors={doctors}
            initialDoctorSlug={doctor}
            initialServiceId={service}
            initialName={name}
            initialEmail={email}
            initialDate={date}
          />
        </div>
      </div>
    </section>
  );
}

export default function BookPage({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <section className="py-20">
          <div className="site-container">
            <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-border" />
          </div>
        </section>
      }
    >
      <BookContent searchParams={searchParams} />
    </Suspense>
  );
}
