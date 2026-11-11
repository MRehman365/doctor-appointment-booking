import { Suspense } from "react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { fetchSettings } from "@/lib/api/site";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Medical Complex for appointments and enquiries.",
};

const HOURS = [
  { day: "Monday – Friday", time: "9AM – 9PM" },
  { day: "Saturday", time: "10AM – 4PM" },
  { day: "Sunday", time: "Closed" },
];

async function ContactContent() {
  const settings = await fetchSettings().catch(() => null);

  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Reach us</p>
          <h1 className="headline mt-3">Contact</h1>
          <p className="subcopy mt-4">
            Questions about bookings, directions, or your visit — we&apos;re here to help.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="card">
              <p className="text-sm font-semibold text-brand-text">Phone</p>
              <p className="mt-1 text-navy">{settings?.phone || CONTACT.phone}</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-brand-text">WhatsApp</p>
              <p className="mt-1 text-navy">{CONTACT.whatsappLabel}</p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-brand-text">Email</p>
              <p className="mt-1 text-navy">
                {settings?.email || CONTACT.email}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-brand-text">Address</p>
              <p className="mt-1 text-navy">
                {settings?.address || CONTACT.address}
              </p>
            </div>
            <div className="card">
              <p className="text-sm font-semibold text-brand-text">Hours</p>
              <div className="mt-2 max-w-sm">
                {HOURS.map((row) => (
                  <div key={row.day} className="hours-row text-sm">
                    <span className="font-medium text-navy">{row.day}</span>
                    <span className="text-muted">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button href="/book" variant="accent" size="lg">
              Book appointment
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-border bg-surface-muted">
          {settings?.mapEmbedUrl || CONTACT.mapEmbedUrl ? (
            <iframe
              title="Clinic map"
              src={settings?.mapEmbedUrl || CONTACT.mapEmbedUrl}
              className="h-[520px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          ) : (
            <div className="flex h-[520px] items-center justify-center px-6 text-center text-sm text-muted">
              Map embed will appear here once configured in clinic settings.
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-20">
          <div className="h-40 animate-pulse rounded-sm bg-border" />
        </div>
      }
    >
      <ContactContent />
    </Suspense>
  );
}
