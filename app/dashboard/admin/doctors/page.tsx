"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { ImageUpload } from "@/components/dashboard/ImageUpload";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/utils/format";

type Doctor = {
  _id: string;
  fullName: string;
  specialization: string;
  title?: string;
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
  isActive?: boolean;
  isFeatured?: boolean;
};

type FormState = {
  email: string;
  password: string;
  fullName: string;
  title: string;
  specialization: string;
  experienceYears: string;
  qualifications: string;
  languages: string;
  contactPhone: string;
  contactEmail: string;
  clinicLocation: string;
  consultationFeeFrom: string;
  shortDescription: string;
  biography: string;
  profileImage: string;
  isFeatured: boolean;
  isActive: boolean;
};

const emptyForm: FormState = {
  email: "",
  password: "",
  fullName: "",
  title: "Consultant",
  specialization: "",
  experienceYears: "",
  qualifications: "",
  languages: "English",
  contactPhone: "",
  contactEmail: "",
  clinicLocation: "",
  consultationFeeFrom: "",
  shortDescription: "",
  biography: "",
  profileImage: "",
  isFeatured: false,
  isActive: true,
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20";

const splitList = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function toForm(doctor: Doctor): FormState {
  return {
    ...emptyForm,
    fullName: doctor.fullName,
    title: doctor.title || "Consultant",
    specialization: doctor.specialization,
    experienceYears: doctor.experienceYears ? String(doctor.experienceYears) : "",
    qualifications: (doctor.qualifications || []).join(", "),
    languages: (doctor.languages || []).join(", "),
    contactPhone: doctor.contactPhone || "",
    contactEmail: doctor.contactEmail || "",
    clinicLocation: doctor.clinicLocation || "",
    consultationFeeFrom: doctor.consultationFeeFrom ? String(doctor.consultationFeeFrom) : "",
    shortDescription: doctor.shortDescription || "",
    biography: doctor.biography || "",
    profileImage: doctor.profileImage || "",
    isFeatured: Boolean(doctor.isFeatured),
    isActive: doctor.isActive !== false,
  };
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Doctor[]>("/api/doctors?all=1");
      setDoctors(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
    setError("");
    setMessage("");
  }

  function openEdit(doctor: Doctor) {
    setEditingId(doctor._id);
    setForm(toForm(doctor));
    setOpen(true);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const profile = {
      fullName: form.fullName.trim(),
      title: form.title.trim() || "Consultant",
      specialization: form.specialization.trim(),
      experienceYears: form.experienceYears ? Number(form.experienceYears) : 0,
      qualifications: splitList(form.qualifications),
      languages: splitList(form.languages),
      contactPhone: form.contactPhone.trim(),
      clinicLocation: form.clinicLocation.trim(),
      consultationFeeFrom: form.consultationFeeFrom ? Number(form.consultationFeeFrom) : 0,
      shortDescription: form.shortDescription.trim(),
      biography: form.biography.trim(),
      profileImage: form.profileImage,
      isFeatured: form.isFeatured,
    };

    try {
      if (editingId) {
        await apiFetch(`/api/doctors/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...profile,
            contactEmail: form.contactEmail.trim(),
            isActive: form.isActive,
          }),
        });
        setMessage("Doctor updated");
      } else {
        await apiFetch("/api/doctors", {
          method: "POST",
          body: JSON.stringify({
            ...profile,
            email: form.email.trim(),
            password: form.password,
            contactEmail: form.contactEmail.trim() || form.email.trim(),
          }),
        });
        setMessage("Doctor created. They can now sign in with the email and password you set.");
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save doctor");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Doctor>[] = [
    {
      key: "name",
      header: "Doctor",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
            {row.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.profileImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500">
                {row.fullName.slice(0, 1)}
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900">{row.fullName}</p>
            <p className="text-xs text-slate-500">{row.title || "Consultant"}</p>
          </div>
        </div>
      ),
    },
    { key: "spec", header: "Specialization", render: (row) => row.specialization },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div className="text-xs">
          <p>{row.contactEmail || "—"}</p>
          <p className="text-slate-500">{row.contactPhone || "—"}</p>
        </div>
      ),
    },
    {
      key: "fee",
      header: "From",
      render: (row) => formatCurrency(row.consultationFeeFrom || 0),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={row.isActive === false ? "inactive" : "active"} />
          {row.isFeatured ? (
            <span className="rounded-sm bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              Featured
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => openEdit(row)}
          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-slate-700">
        Create a <strong>doctor login</strong> here (email + password) together with the full public
        profile and photo. The doctor can then sign in at{" "}
        <code className="rounded bg-white px-1">/login</code> to manage services, availability, and
        appointments.
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Doctors</h2>
          <p className="text-sm text-slate-500">Manage clinician profiles and portal accounts</p>
        </div>
        <button
          type="button"
          onClick={open ? closeForm : openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#0F6B5C]/25"
        >
          <Plus className="h-4 w-4" />
          {open ? "Close form" : "Add doctor"}
        </button>
      </div>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-800">{error}</p> : null}

      {open ? (
        <form
          onSubmit={onSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <h3 className="text-base font-semibold text-slate-900">
            {editingId ? "Edit doctor" : "New doctor"}
          </h3>

          <ImageUpload
            label="Profile photo"
            value={form.profileImage}
            onChange={(url) => set("profileImage", url)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Full name *
              <input
                required
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Specialization *
              <input
                required
                value={form.specialization}
                onChange={(e) => set("specialization", e.target.value)}
                className={inputClass}
              />
            </label>

            {!editingId ? (
              <>
                <label className="text-sm font-medium text-slate-700">
                  Login email *
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Temporary password * (min 8 characters)
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    className={inputClass}
                  />
                </label>
              </>
            ) : null}

            <label className="text-sm font-medium text-slate-700">
              Title
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Experience (years)
              <input
                type="number"
                min={0}
                value={form.experienceYears}
                onChange={(e) => set("experienceYears", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input
                value={form.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Public email
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
                placeholder={editingId ? "" : "Defaults to login email"}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Clinic location
              <input
                value={form.clinicLocation}
                onChange={(e) => set("clinicLocation", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Consultation fee from (PKR)
              <input
                type="number"
                min={0}
                value={form.consultationFeeFrom}
                onChange={(e) => set("consultationFeeFrom", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Qualifications (comma separated)
              <input
                value={form.qualifications}
                onChange={(e) => set("qualifications", e.target.value)}
                placeholder="MBBS, FCPS"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Languages (comma separated)
              <input
                value={form.languages}
                onChange={(e) => set("languages", e.target.value)}
                placeholder="English, Urdu"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Short description
              <textarea
                rows={2}
                value={form.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
              Biography
              <textarea
                rows={5}
                value={form.biography}
                onChange={(e) => set("biography", e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
              />
              Featured on homepage
            </label>
            {editingId ? (
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => set("isActive", e.target.checked)}
                />
                Active (visible for booking)
              </label>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0F6B5C] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Save changes" : "Create doctor"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading doctors…</p>
      ) : (
        <DataTable columns={columns} rows={doctors} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
