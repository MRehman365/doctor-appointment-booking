import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { formatCurrency } from "@/lib/utils/format";
import { fetchDoctor } from "@/lib/api/site";

const FALLBACK =
  "/people-01.jpg";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { doctor } = await fetchDoctor(slug);
    return {
      title: doctor.fullName,
      description: doctor.shortDescription || `${doctor.specialization} at Medical Complex`,
    };
  } catch {
    return { title: "Doctor" };
  }
}

async function DoctorDetail({ params }: Props) {
  const { slug } = await params;
  let data;
  try {
    data = await fetchDoctor(slug);
  } catch {
    notFound();
  }

  const { doctor, services } = data;
  const image = doctor.profileImage || FALLBACK;

  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-muted">
          <Image src={image} alt={doctor.fullName} fill className="object-cover" sizes="40vw" />
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <Badge>{doctor.specialization}</Badge>
            <h1 className="headline text-[clamp(2rem,3.5vw,2.75rem)]">{doctor.fullName}</h1>
            <p className="text-muted">
              {doctor.title || "Consultant"}
              {doctor.experienceYears ? ` · ${doctor.experienceYears}+ years experience` : ""}
            </p>
          </div>
          {doctor.shortDescription ? (
            <p className="text-base leading-relaxed text-muted">{doctor.shortDescription}</p>
          ) : null}
          {doctor.biography ? (
            <div className="space-y-2">
              <h2 className="font-display text-2xl">About</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                {doctor.biography}
              </p>
            </div>
          ) : null}
          {doctor.qualifications && doctor.qualifications.length > 0 ? (
            <div>
              <h2 className="mb-2 font-display text-2xl">Qualifications</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">
                {doctor.qualifications.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {doctor.languages && doctor.languages.length > 0 ? (
            <p className="text-sm text-muted">Languages: {doctor.languages.join(", ")}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <p className="text-sm text-muted">
              Consultations from{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(doctor.consultationFeeFrom || 0)}
              </span>
            </p>
            <Button href={`/book?doctor=${doctor.slug}`}>Book Appointment</Button>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="font-display text-3xl text-foreground">Services</h2>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
          {services.map((service) => (
            <div
              key={service._id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">{service.name}</p>
                <p className="text-sm text-muted">{service.durationMinutes} minutes</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {formatCurrency(service.price, service.currency || "PKR")}
                </span>
                <Button
                  href={`/book?doctor=${doctor.slug}&service=${service._id}`}
                  variant="accent"
                  size="sm"
                >
                  Book now
                </Button>
              </div>
            </div>
          ))}
          {services.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted">No services listed for this doctor.</p>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export default function DoctorPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <Section>
          <div className="h-64 animate-pulse rounded-2xl bg-border" />
        </Section>
      }
    >
      <DoctorDetail params={params} />
    </Suspense>
  );
}
