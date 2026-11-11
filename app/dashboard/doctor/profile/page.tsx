"use client";

import { FormEvent, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuth";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { apiFetch } from "@/lib/dashboard/api";

type Doctor = {
  _id: string;
  fullName: string;
  title?: string;
  specialization: string;
  qualifications?: string[];
  experienceYears?: number;
  biography?: string;
  shortDescription?: string;
  languages?: string[];
  profileImage?: string;
  clinicLocation?: string;
  contactEmail?: string;
  contactPhone?: string;
  consultationFeeFrom?: number;
  bufferMinutes?: number;
  maxDailyAppointments?: number;
  defaultSlotDuration?: number;
};

export default function DoctorProfilePage() {
  const { doctorId } = useDashboardAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await apiFetch<{ doctor: Doctor }>(`/api/doctors/${doctorId}`);
        setDoctor(data.doctor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!doctor || !doctorId) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiFetch<Doctor>(`/api/doctors/${doctorId}`, {
        method: "PATCH",
        body: JSON.stringify({
          fullName: doctor.fullName,
          title: doctor.title,
          specialization: doctor.specialization,
          qualifications: doctor.qualifications,
          experienceYears: doctor.experienceYears,
          biography: doctor.biography,
          shortDescription: doctor.shortDescription,
          languages: doctor.languages,
          profileImage: doctor.profileImage,
          clinicLocation: doctor.clinicLocation,
          contactEmail: doctor.contactEmail,
          contactPhone: doctor.contactPhone,
          consultationFeeFrom: doctor.consultationFeeFrom,
          bufferMinutes: doctor.bufferMinutes,
          maxDailyAppointments: doctor.maxDailyAppointments,
          defaultSlotDuration: doctor.defaultSlotDuration,
        }),
      });
      setDoctor(updated);
      setMessage("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  if (!doctorId) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
        No doctor profile linked to this account.
      </p>
    );
  }

  if (loading) return <p className="text-sm text-slate-500">Loading profile…</p>;
  if (!doctor) {
    return <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error || "Not found"}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">My profile</h2>
        <p className="text-sm text-slate-500">Public clinician details shown on the booking site</p>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <ImageUpload
            label="Profile photo"
            value={doctor.profileImage || ""}
            onChange={(url) => setDoctor((d) => (d ? { ...d, profileImage: url } : d))}
          />
        </div>
        {(
          [
            ["fullName", "Full name", "text"],
            ["title", "Title", "text"],
            ["specialization", "Specialization", "text"],
            ["experienceYears", "Experience (years)", "number"],
            ["contactEmail", "Contact email", "email"],
            ["contactPhone", "Contact phone", "text"],
            ["clinicLocation", "Clinic location", "text"],
            ["consultationFeeFrom", "Fee from", "number"],
            ["bufferMinutes", "Buffer minutes", "number"],
            ["maxDailyAppointments", "Max daily appointments", "number"],
            ["defaultSlotDuration", "Default slot duration", "number"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="text-sm font-medium text-slate-700">
            {label}
            <input
              type={type}
              value={doctor[key] ?? ""}
              onChange={(e) =>
                setDoctor((d) =>
                  d
                    ? {
                        ...d,
                        [key]:
                          type === "number"
                            ? e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                            : e.target.value,
                      }
                    : d,
                )
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
          </label>
        ))}

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Languages (comma separated)
          <input
            value={(doctor.languages || []).join(", ")}
            onChange={(e) =>
              setDoctor((d) =>
                d
                  ? {
                      ...d,
                      languages: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }
                  : d,
              )
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Qualifications (comma separated)
          <input
            value={(doctor.qualifications || []).join(", ")}
            onChange={(e) =>
              setDoctor((d) =>
                d
                  ? {
                      ...d,
                      qualifications: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }
                  : d,
              )
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Short description
          <textarea
            rows={2}
            value={doctor.shortDescription || ""}
            onChange={(e) => setDoctor((d) => (d ? { ...d, shortDescription: e.target.value } : d))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Biography
          <textarea
            rows={5}
            value={doctor.biography || ""}
            onChange={(e) => setDoctor((d) => (d ? { ...d, biography: e.target.value } : d))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
