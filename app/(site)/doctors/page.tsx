import { Suspense } from "react";
import type { Metadata } from "next";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { Button } from "@/components/ui/Button";
import { getHomeDoctors } from "@/lib/api/site-data";

export const metadata: Metadata = {
  title: "Doctors",
  description: "Meet the Medical Complex doctors.",
};

async function DoctorsContent() {
  const doctors = await getHomeDoctors().catch(() => []);

  return (
    <>
      <section className="border-b border-border bg-surface-muted py-12 md:py-16">
        <div className="site-container max-w-3xl">
          <p className="eyebrow">Our team</p>
          <h1 className="headline mt-3">Our doctors</h1>
          <p className="subcopy mt-4">
            A focused clinical team for consultations, follow-ups, and planned care.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="site-container grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor._id} doctor={doctor} />
          ))}
        </div>
        {doctors.length === 0 ? (
          <div className="site-container mt-8 text-sm text-muted">No doctors published yet.</div>
        ) : null}
        <div className="site-container mt-10">
          <Button href="/book" variant="accent" size="lg">
            Book appointment
          </Button>
        </div>
      </section>
    </>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-20">
          <div className="h-40 animate-pulse rounded-sm bg-border" />
        </div>
      }
    >
      <DoctorsContent />
    </Suspense>
  );
}
