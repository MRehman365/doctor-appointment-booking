"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/dashboard/api";

type Settings = {
  clinicName?: string;
  tagline?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  mapEmbedUrl?: string;
  timezone?: string;
  currency?: string;
  cancellationPolicy?: string;
  refundPolicy?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Settings>("/api/admin/settings");
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      const {
        clinicName,
        tagline,
        logo,
        address,
        phone,
        email,
        website,
        mapEmbedUrl,
        timezone,
        currency,
        cancellationPolicy,
        refundPolicy,
        social,
      } = settings;
      const data = await apiFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          clinicName,
          tagline,
          logo,
          address,
          phone,
          email,
          website,
          mapEmbedUrl,
          timezone,
          currency,
          cancellationPolicy,
          refundPolicy,
          social,
        }),
      });
      setSettings(data);
      setMessage("Clinic settings saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading settings…</p>;
  if (!settings) {
    return <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error || "No settings"}</p>;
  }

  const fields: Array<[keyof Settings, string]> = [
    ["clinicName", "Clinic name"],
    ["tagline", "Tagline"],
    ["logo", "Logo URL"],
    ["address", "Address"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["website", "Website"],
    ["mapEmbedUrl", "Map embed URL"],
    ["timezone", "Timezone"],
    ["currency", "Currency"],
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Clinic settings</h2>
        <p className="text-sm text-slate-500">Contact details, policies, and social links</p>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="text-sm font-medium text-slate-700">
            {label}
            <input
              value={(settings[key] as string) || ""}
              onChange={(e) => setSettings((s) => ({ ...s!, [key]: e.target.value }))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </label>
        ))}
      </section>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <h3 className="font-semibold text-slate-900 sm:col-span-2">Social</h3>
        {(["facebook", "instagram", "twitter", "linkedin"] as const).map((key) => (
          <label key={key} className="text-sm font-medium capitalize text-slate-700">
            {key}
            <input
              value={settings.social?.[key] || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s!,
                  social: { ...s!.social, [key]: e.target.value },
                }))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-sm font-medium text-slate-700">
          Cancellation policy
          <textarea
            rows={3}
            value={settings.cancellationPolicy || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s!, cancellationPolicy: e.target.value }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Refund policy
          <textarea
            rows={3}
            value={settings.refundPolicy || ""}
            onChange={(e) => setSettings((s) => ({ ...s!, refundPolicy: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
