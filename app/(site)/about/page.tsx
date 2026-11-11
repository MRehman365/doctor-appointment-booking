import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { fetchSettings } from "@/lib/api/site";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Medical Complex and our approach to patient care.",
};

const ABOUT_FALLBACK = "/doctors-9.png";

async function AboutContent() {
  const settings = await fetchSettings().catch(() => null);

  return (
    <>
      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">About Medical Complex</p>
            <h1 className="headline mt-3">
              {settings?.about?.title || "Healthcare that respects your time"}
            </h1>
            <p className="subcopy mt-5">
              {settings?.about?.body ||
                "We combine experienced clinicians with a modern booking experience so patients spend less time waiting and more time getting care."}
            </p>
            <div className="mt-8">
              <Button href="/book" variant="accent" size="lg">
                Book appointment
              </Button>
            </div>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-sm bg-brand-soft">
            <Image
              src={settings?.about?.image || ABOUT_FALLBACK}
              alt="Clinic care"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </Section>

      <Section muted>
        <h2 className="section-title">How visits work</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "1. Book online",
              body: "Pick a doctor, choose a live slot, and pay securely — no account needed.",
            },
            {
              title: "2. Arrive prepared",
              body: "Bring your digital receipt. Reception confirms your Patient ID and queue number.",
            },
            {
              title: "3. See your doctor",
              body: "Clear queues and calm visits, with follow-ups as simple as the first booking.",
            },
          ].map((item) => (
            <div key={item.title} className="card">
              <h3 className="text-lg text-navy">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

export default function AboutPage() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-20">
          <div className="h-40 animate-pulse rounded-sm bg-border" />
        </div>
      }
    >
      <AboutContent />
    </Suspense>
  );
}
