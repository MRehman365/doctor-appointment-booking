"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { apiFetch, roleHome, type SessionUser } from "@/lib/dashboard/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await apiFetch<SessionUser | null>("/api/auth/me");
        if (!cancelled && session?.role) {
          router.replace(roleHome(session.role));
          return;
        }
      } catch {
        // stay on login
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{
        role: SessionUser["role"];
        name: string;
        email: string;
        doctorId: string | null;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.replace(roleHome(data.role));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F6] text-sm text-slate-500">
        Checking session…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F7F6]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,107,92,0.12),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(15,107,92,0.08),_transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-[#19c2d8]/30 shadow-lg">
            <Image src="/logo.png" alt="Medical Complex" fill className="object-cover" priority />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Staff sign in</h1>
          <p className="mt-2 text-sm text-slate-500">
            Access the admin, doctor, or reception console
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
        >
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
              placeholder="you@clinic.com"
            />
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0F6B5C]/30 transition hover:bg-[#0c584b] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
