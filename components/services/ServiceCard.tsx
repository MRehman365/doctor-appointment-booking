import Image from "next/image";
import { Clock, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import type { Doctor, Service } from "@/lib/api/site";

export function ServiceCard({ service }: { service: Service }) {
  const doctor =
    service.doctor && typeof service.doctor === "object" ? (service.doctor as Doctor) : null;

  const bookHref = doctor
    ? `/book?doctor=${doctor.slug}&service=${service._id}`
    : `/book?service=${service._id}`;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-sm border border-border bg-white transition-colors duration-200 hover:border-brand">
      {/* Media */}
      {service.image ? (
        <div className="relative aspect-[16/9] bg-brand-soft">
          <Image
            src={service.image}
            alt={service.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      ) : (
        <div className="flex h-24 items-center bg-brand-soft px-6">
          <span className="grid h-12 w-12 place-items-center rounded-sm bg-white text-brand-text">
            <Stethoscope size={24} />
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        {doctor?.specialization ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-text">
            {doctor.specialization}
          </p>
        ) : null}
        <h3 className="mt-1.5 text-xl text-navy">{service.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
          {service.description || "Professional clinical care tailored to your visit."}
        </p>

        {doctor ? (
          <div className="mt-4 flex items-center gap-2.5">
            <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-brand-soft">
              {doctor.profileImage ? (
                <Image
                  src={doctor.profileImage}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-xs font-semibold text-brand-text">
                  {doctor.fullName.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="text-sm font-medium text-navy">{doctor.fullName}</span>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-6 flex flex-1 items-end justify-between gap-3 border-t border-border pt-4">
          <div>
            <p className="text-lg font-semibold text-navy">
              {formatCurrency(service.price, service.currency || "PKR")}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
              <Clock size={13} />
              {service.durationMinutes} min
            </p>
          </div>
          <Button href={bookHref} variant="accent" size="sm">
            Book now
          </Button>
        </div>
      </div>
    </article>
  );
}
