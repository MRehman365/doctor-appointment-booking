"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
  UserRound,
  Clock3,
  ListOrdered,
  FileText,
  X,
  type LucideIcon,
} from "lucide-react";
import { apiFetch, roleHome, type SessionUser } from "@/lib/dashboard/api";
import { cn } from "@/lib/utils/cn";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const ADMIN_NAV: NavItem[] = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/dashboard/admin/patients", label: "Patients", icon: Users },
  { href: "/dashboard/admin/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/admin/staff", label: "Staff", icon: UserRound },
  { href: "/dashboard/admin/content", label: "Content", icon: FileText },
  { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
];

const DOCTOR_NAV: NavItem[] = [
  { href: "/dashboard/doctor", label: "Today", icon: LayoutDashboard },
  { href: "/dashboard/doctor/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/dashboard/doctor/queue", label: "Queue", icon: ListOrdered },
  { href: "/dashboard/doctor/services", label: "Services", icon: ClipboardList },
  { href: "/dashboard/doctor/availability", label: "Availability", icon: Clock3 },
  { href: "/dashboard/doctor/profile", label: "Profile", icon: UserRound },
];

const RECEPTION_NAV: NavItem[] = [
  { href: "/dashboard/reception", label: "Today", icon: LayoutDashboard },
  { href: "/dashboard/reception/check-in", label: "Check-in", icon: ClipboardList },
  { href: "/dashboard/reception/queue", label: "Queue", icon: ListOrdered },
];

function navForRole(role: SessionUser["role"]) {
  if (role === "admin") return ADMIN_NAV;
  if (role === "doctor") return DOCTOR_NAV;
  return RECEPTION_NAV;
}

type DashboardShellProps = {
  user: SessionUser;
  children: ReactNode;
  title?: string;
};

export function DashboardShell({ user, children, title }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const nav = navForRole(user.role);

  async function logout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function isActive(href: string) {
    if (href === roleHome(user.role)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
            <div className="min-w-0">
              <BrandLogo href={roleHome(user.role)} size="sm" showWordmark={false} />
              <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{user.role}</p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1 p-3">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#0F6B5C] text-white shadow-sm shadow-[#0F6B5C]/25"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
            aria-label="Close overlay"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
                  {title || "Dashboard"}
                </h1>
                <p className="hidden text-xs text-slate-500 sm:block">
                  Clinical operations console
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#0F6B5C]/30 hover:text-[#0F6B5C] disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{loggingOut ? "Signing out…" : "Logout"}</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
