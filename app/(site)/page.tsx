import Image from "next/image";
import { Suspense } from "react";
import { CalendarCheck2, CreditCard, ShieldCheck, Stethoscope } from "lucide-react";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { HomeBookingForm } from "@/components/home/HomeBookingForm";
import { ServicesSlider } from "@/components/services/ServicesSlider";
import { Button } from "@/components/ui/Button";
import {
  getHomeDoctorAvailability,
  getHomeDoctors,
  getHomeServices,
  getHomeSettings,
} from "@/lib/api/site-data";
import { CONTACT } from "@/lib/contact";
import { LOCAL_MEDIA } from "@/lib/media";

const HOURS = [
  { day: "Monday – Friday", time: "9AM – 9PM" },
  { day: "Saturday", time: "10AM – 4PM" },
  { day: "Sunday", time: "Closed" },
];

const STEPS = [
  {
    title: "Choose your doctor",
    desc: "Browse specialists and pick the one that fits your need.",
    Icon: Stethoscope,
  },
  {
    title: "Pick a live time slot",
    desc: "See real availability and reserve the exact time you want.",
    Icon: CalendarCheck2,
  },
  {
    title: "Confirm and pay online",
    desc: "Clear pricing, secure payment, and no account needed.",
    Icon: CreditCard,
  },
  {
    title: "Show your receipt",
    desc: "Arrive with your Patient ID and queue number, and walk straight in.",
    Icon: ShieldCheck,
  },
];
function HomeFallback() {
  return (
    <div className="site-container py-24">
      <div className="h-10 w-72 animate-pulse rounded-sm bg-border" />
      <div className="mt-6 h-40 w-full max-w-xl animate-pulse rounded-sm bg-border" />
    </div>
  );
}

async function HomeContent() {
  const [settings, doctors, services, availability] = await Promise.all([
    getHomeSettings().catch(() => null),
    getHomeDoctors().catch(() => []),
    getHomeServices().catch(() => []),
    getHomeDoctorAvailability().catch(() => []),
  ]);

  const clinic = settings?.clinicName || "Medical Complex";
  const phone = settings?.phone || CONTACT.phone;
  const email = settings?.email || CONTACT.email;
  const address = settings?.address || CONTACT.address;

  return (
    <>
      {/* Hero */}
      <section className="bg-surface-muted">
        <div className="site-container grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="eyebrow animate-fade-up">{clinic}</p>
            <h1 className="headline animate-fade-up delay-1 mt-3">
              Book your doctor visit online, without the wait.
            </h1>
            <p className="subcopy animate-fade-up delay-2 mt-5">
              Choose a specialist, pick a live time slot, and confirm online. Arrive with your
              receipt and queue number ready.
            </p>
            <div className="animate-fade-up delay-3 mt-8 flex flex-wrap gap-3">
              <Button href="/book" size="lg" variant="accent">
                Book appointment
              </Button>
              <Button href="/doctors" size="lg" variant="outline">
                Meet our doctors
              </Button>
            </div>
          </div>

          <div className="animate-fade-in mx-auto w-full max-w-[440px]">
            <div className="relative aspect-[4/5]">
              <Image
                src={LOCAL_MEDIA.heroDoctor}
                alt="Clinic doctor"
                fill
                priority
                className="object-contain object-bottom"
                sizes="(max-width: 1024px) 90vw, 440px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24">
        <div className="site-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title mt-2">Your visit in four simple steps</h2>
            <p className="mt-4 max-w-md text-muted">
              No phone calls, no waiting in line to book. Choose a time that suits you and we
              take care of the rest.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/book" variant="accent">
                Start booking
              </Button>
              <Button href="/doctors" variant="outline">
                See doctors
              </Button>
            </div>
          </div>

          <ol className="relative">
            <span
              aria-hidden
              className="absolute bottom-6 left-[21px] top-6 w-px bg-border"
            />
            {STEPS.map(({ title, desc, Icon }, i) => (
              <li key={title} className="relative flex gap-5 pb-8 last:pb-0">
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-base font-bold text-navy ring-4 ring-white">
                  {i + 1}
                </span>
                <div className="flex flex-1 items-start justify-between gap-4 rounded-sm border border-border bg-white p-5 transition-colors hover:border-brand">
                  <div>
                    <h3 className="text-lg text-navy">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
                  </div>
                  <Icon className="mt-0.5 shrink-0 text-brand-text" size={24} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      {/* Services */}
      <section className="bg-surface-muted py-16 md:py-24">
        <div className="site-container">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">What we offer</p>
              <h2 className="section-title mt-2">Our services</h2>
              <p className="mt-3 text-muted">
                Transparent prices and fixed visit times. Pick a service and book it in a few steps.
              </p>
            </div>
            <Button href="/services" variant="outline" className="self-start md:self-auto">
              View all services
            </Button>
          </div>

          {services.length > 0 ? <ServicesSlider services={services} /> : null}
          {services.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Services will appear here once published.</p>
          ) : null}
        </div>
      </section>
      {/* Doctors */}
      <section className="py-14 md:py-20">
        <div className="site-container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Our doctors</h2>
              <p className="mt-2 text-muted">
                Specialists for consultations, follow-ups, and planned visits.
              </p>
            </div>
            <Button href="/doctors" variant="outline">
              View all doctors
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
          {doctors.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Doctors will appear here once published.</p>
          ) : null}
        </div>
      </section>

      {/* Availability */}
      <section className="bg-surface-muted py-14 md:py-20">
        <div className="site-container">
          <div className="mb-8 max-w-xl">
            <h2 className="section-title">Doctor availability</h2>
            <p className="mt-2 text-muted">Weekly hours. Book an exact time online.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {availability.map((row) => (
              <div key={row.doctorId} className="card">
                <p className="text-sm font-medium text-brand-text">{row.specialization}</p>
                <h3 className="mt-1 text-xl text-navy">{row.fullName}</h3>
                {row.hasSchedule ? (
                  <ul className="mt-4 divide-y divide-border">
                    {row.weekly.map(
                      (day: { day: string; dayOfWeek: number; ranges: string }) => (
                        <li
                          key={`${row.doctorId}-${day.dayOfWeek}`}
                          className="flex justify-between gap-3 py-2 text-sm"
                        >
                          <span className="font-medium text-navy">{day.day}</span>
                          <span className="text-muted">{day.ranges}</span>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">Schedule coming soon.</p>
                )}
                <Button
                  href={`/book?doctor=${row.slug}`}
                  variant="accent"
                  size="sm"
                  className="mt-5"
                >
                  Book this doctor
                </Button>
              </div>
            ))}
          </div>
          {availability.length === 0 ? (
            <p className="text-sm text-muted">Schedules will appear here once published.</p>
          ) : null}
        </div>
      </section>

      {/* Book + visit */}
      <section className="py-14 md:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-2">
          <div className="card">
            <h2 className="section-title">Book a visit</h2>
            <p className="subcopy mt-2">
              Tell us who you need and when. We&apos;ll continue to service selection and payment.
            </p>
            <div className="mt-6">
              <HomeBookingForm doctors={doctors} variant="light" />
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Visit us</h2>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="text-sm font-semibold text-brand-text">Address</dt>
                <dd className="mt-1 text-navy">{address}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-text">Phone</dt>
                <dd className="mt-1 text-navy">{phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-text">Email</dt>
                <dd className="mt-1 text-navy">{email}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-brand-text">Clinic hours</dt>
                <dd className="mt-2 max-w-sm">
                  {HOURS.map((row) => (
                    <div key={row.day} className="hours-row text-sm">
                      <span className="font-medium text-navy">{row.day}</span>
                      <span className="text-muted">{row.time}</span>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
