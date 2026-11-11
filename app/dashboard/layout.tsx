"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardAuthProvider } from "@/components/dashboard/DashboardAuth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { apiFetch, roleHome, type SessionUser } from "@/lib/dashboard/api";

function titleFromPath(pathname: string) {
  const segment = pathname.split("/").filter(Boolean).pop() || "dashboard";
  if (segment === "admin" || segment === "doctor" || segment === "reception") {
    return "Overview";
  }
  return segment.replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function roleAllowed(pathname: string, role: SessionUser["role"]) {
  if (pathname.startsWith("/dashboard/admin")) return role === "admin";
  if (pathname.startsWith("/dashboard/doctor")) return role === "doctor";
  if (pathname.startsWith("/dashboard/reception")) return role === "receptionist";
  return true;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await apiFetch<SessionUser | null>("/api/auth/me");
        if (cancelled) return;
        if (!session) {
          router.replace("/login");
          return;
        }
        if (!roleAllowed(pathname, session.role)) {
          router.replace(roleHome(session.role));
          return;
        }
        setUser(session);
      } catch {
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F6] text-sm text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  return (
    <DashboardAuthProvider user={user}>
      <DashboardShell user={user} title={titleFromPath(pathname)}>
        {children}
      </DashboardShell>
    </DashboardAuthProvider>
  );
}
