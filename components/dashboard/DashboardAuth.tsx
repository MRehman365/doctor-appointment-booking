"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SessionUser } from "@/lib/dashboard/api";

const DashboardAuthContext = createContext<SessionUser | null>(null);

export function DashboardAuthProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return (
    <DashboardAuthContext.Provider value={user}>{children}</DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const ctx = useContext(DashboardAuthContext);
  if (!ctx) throw new Error("useDashboardAuth must be used within DashboardAuthProvider");
  return ctx;
}
