import Image from "next/image";
import Link from "next/link";
import type { Doctor } from "@/lib/api/site";
import { Button } from "@/components/ui/Button";
import { LOCAL_MEDIA } from "@/lib/media";

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const image = doctor.profileImage || "";

  return (
    <article className="card card-hover group overflow-hidden p-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-brand-soft">
        {image ? (
          <Image
            src={image}
            alt={doctor.fullName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={LOCAL_MEDIA.logo}
              alt=""
              width={64}
              height={64}
              className="rounded-full"
            />
          </div>
        )}
      </div>
      <div className="space-y-2 p-5">
        <p className="text-sm font-medium text-brand-text">
          {doctor.title || doctor.specialization}
        </p>
        <h3 className="text-xl text-navy">
          <Link href={`/doctors/${doctor.slug}`} className="hover:text-brand-text">
            {doctor.fullName}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
          {doctor.shortDescription ||
            doctor.biography ||
            "Experienced clinician focused on clear, comfortable care."}
        </p>
        <div className="pt-2">
          <Button href={`/book?doctor=${doctor.slug}`} variant="accent" size="sm">
            Book appointment
          </Button>
        </div>
      </div>
    </article>
  );
}
