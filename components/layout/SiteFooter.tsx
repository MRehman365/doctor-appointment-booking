import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { SocialLinks } from "@/components/layout/SocialLinks";
import type { ClinicSettings } from "@/lib/api/site";
import { CONTACT } from "@/lib/contact";

const links = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/doctors", label: "Doctors" },
  { href: "/contact", label: "Contact" },
  { href: "/book", label: "Book appointment" },
];

export function SiteFooter({ settings }: { settings?: ClinicSettings | null }) {
  const clinicName = settings?.clinicName || "Medical Complex";

  return (
    <footer className="mt-auto bg-navy text-white">
      <div className="site-container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div className="space-y-4">
          <BrandLogo size="lg" inverted />
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            Simple online booking with verified appointments, clear queues, and care that respects
            your time.
          </p>
          <SocialLinks className="pt-1" />
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Explore</h4>
          <ul className="space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-white/80 transition-colors hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Visit</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-brand" />
              {settings?.address || CONTACT.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone size={15} className="shrink-0 text-brand" />
              {settings?.phone || CONTACT.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="shrink-0 text-brand" />
              {settings?.email || CONTACT.email}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="site-container py-4 text-xs text-white/70">
          © {clinicName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
