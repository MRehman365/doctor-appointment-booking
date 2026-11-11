"use client";

import { FormEvent, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";

type Staff = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "receptionist";
  phone?: string;
  isActive?: boolean;
  doctorProfile?: { fullName?: string; specialization?: string } | null;
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "receptionist" as "admin" | "receptionist",
  phone: "",
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Staff[]>("/api/admin/staff");
      setStaff(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await apiFetch("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      setMessage("Staff account created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create staff");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    try {
      await apiFetch("/api/admin/staff", {
        method: "PATCH",
        body: JSON.stringify({ userId, isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  const columns: Column<Staff>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => <StatusBadge status={row.role} />,
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || "—",
    },
    {
      key: "doctor",
      header: "Doctor profile",
      render: (row) => row.doctorProfile?.fullName || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.isActive === false ? "inactive" : "active"} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => void toggleActive(row._id, row.isActive === false)}
          className="text-xs font-medium text-[#0F6B5C] hover:underline"
        >
          {row.isActive === false ? "Activate" : "Deactivate"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Staff accounts</h2>
        <p className="text-sm text-slate-500">
          Create <strong>Reception</strong> or additional <strong>Admin</strong> logins. Doctor
          accounts are created under Doctors.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-slate-700">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Role
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                role: e.target.value as "admin" | "receptionist",
              }))
            }
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          >
            <option value="receptionist">Receptionist</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create staff"}
          </button>
        </div>
      </form>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading staff…</p>
      ) : (
        <DataTable columns={columns} rows={staff} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
