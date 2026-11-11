import { Suspense } from "react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { ServiceCard } from "@/components/services/ServiceCard";
import { getHomeServices } from "@/lib/api/site-data";

export const metadata: Metadata = {
  title: "Services",
  description: "Browse Medical Complex services and book online.",
};

async function ServicesContent() {
  const services = await getHomeServices().catch(() => []);

  return (
    <>
      <section className="border-b border-border bg-surface-muted py-12 md:py-16">
        <div className="site-container max-w-3xl">
          <p className="eyebrow">Care menu</p>
          <h1 className="headline mt-3">Services</h1>
          <p className="subcopy mt-4">
            Consultations and clinic services you can book online in a few steps.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="site-container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service._id} service={service} />
            ))}
          </div>
          {services.length === 0 ? (
            <p className="py-8 text-sm text-muted">No services published yet.</p>
          ) : null}

          <div className="mt-10">
            <Button href="/book" variant="accent" size="lg">
              Book appointment
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-20">
          <div className="h-40 animate-pulse rounded-sm bg-border" />
        </div>
      }
    >
      <ServicesContent />
    </Suspense>
  );
}
