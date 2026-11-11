"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/dashboard/api";

type Faq = { question: string; answer: string };
type Settings = {
  clinicName?: string;
  hero?: {
    heading?: string;
    description?: string;
    image?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  about?: {
    title?: string;
    body?: string;
    image?: string;
  };
  faqs?: Faq[];
};

export default function AdminContentPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<Settings>("/api/admin/settings");
        setSettings({
          ...data,
          faqs: data.faqs?.length ? data.faqs : [{ question: "", answer: "" }],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
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
      const faqs = (settings.faqs || []).filter((f) => f.question.trim() && f.answer.trim());
      const data = await apiFetch<Settings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          hero: settings.hero,
          about: settings.about,
          faqs,
        }),
      });
      setSettings({
        ...data,
        faqs: data.faqs?.length ? data.faqs : [{ question: "", answer: "" }],
      });
      setMessage("Website content saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading content…</p>;
  if (!settings) {
    return <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error || "No settings"}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Website content</h2>
        <p className="text-sm text-slate-500">Edit hero, about, and FAQ sections</p>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Hero</h3>
        {(
          [
            ["heading", "Heading"],
            ["description", "Description"],
            ["image", "Image URL"],
            ["ctaLabel", "CTA label"],
            ["ctaHref", "CTA link"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm font-medium text-slate-700">
            {label}
            {key === "description" ? (
              <textarea
                rows={3}
                value={settings.hero?.[key] || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s!,
                    hero: { ...s!.hero, [key]: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
              />
            ) : (
              <input
                value={settings.hero?.[key] || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s!,
                    hero: { ...s!.hero, [key]: e.target.value },
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
              />
            )}
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">About</h3>
        <label className="block text-sm font-medium text-slate-700">
          Title
          <input
            value={settings.about?.title || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s!,
                about: { ...s!.about, title: e.target.value },
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Body
          <textarea
            rows={4}
            value={settings.about?.body || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s!,
                about: { ...s!.about, body: e.target.value },
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Image URL
          <input
            value={settings.about?.image || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s!,
                about: { ...s!.about, image: e.target.value },
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-slate-900">FAQs</h3>
          <button
            type="button"
            onClick={() =>
              setSettings((s) => ({
                ...s!,
                faqs: [...(s!.faqs || []), { question: "", answer: "" }],
              }))
            }
            className="text-sm font-medium text-[#0F6B5C] hover:underline"
          >
            Add FAQ
          </button>
        </div>
        {(settings.faqs || []).map((faq, index) => (
          <div key={index} className="grid gap-2 rounded-xl border border-slate-100 p-3">
            <input
              placeholder="Question"
              value={faq.question}
              onChange={(e) =>
                setSettings((s) => {
                  const faqs = [...(s!.faqs || [])];
                  faqs[index] = { ...faqs[index], question: e.target.value };
                  return { ...s!, faqs };
                })
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
            <textarea
              placeholder="Answer"
              rows={2}
              value={faq.answer}
              onChange={(e) =>
                setSettings((s) => {
                  const faqs = [...(s!.faqs || [])];
                  faqs[index] = { ...faqs[index], answer: e.target.value };
                  return { ...s!, faqs };
                })
              }
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </div>
        ))}
      </section>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save content"}
      </button>
    </form>
  );
}
