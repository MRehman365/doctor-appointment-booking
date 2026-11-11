"use client";

import { FormEvent, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/DashboardAuth";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { apiFetch } from "@/lib/dashboard/api";
import { formatCurrency } from "@/lib/utils/format";

type Service = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive?: boolean;
  showOnWebsite?: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  durationMinutes: "30",
  showOnWebsite: true,
};

export default function DoctorServicesPage() {
  const { doctorId } = useDashboardAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    if (!doctorId) return;
    setLoading(true);
    try {
      const data = await apiFetch<Service[]>(`/api/services?doctorId=${doctorId}`);
      setServices(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load services");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!doctorId) return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
        showOnWebsite: form.showOnWebsite,
      };
      if (editingId) {
        await apiFetch(`/api/services/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Service updated");
      } else {
        await apiFetch("/api/services", {
          method: "POST",
          body: JSON.stringify({ ...payload, doctorId }),
        });
        setMessage("Service created");
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function removeService(id: string) {
    try {
      await apiFetch(`/api/services/${id}`, { method: "DELETE" });
      setMessage("Service deactivated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const columns: Column<Service>[] = [
    {
      key: "name",
      header: "Service",
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          <p className="line-clamp-1 text-xs text-slate-500">{row.description || "—"}</p>
        </div>
      ),
    },
    { key: "duration", header: "Duration", render: (row) => `${row.durationMinutes} min` },
    { key: "price", header: "Price", render: (row) => formatCurrency(row.price) },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.isActive === false ? "inactive" : "active"} />,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs font-medium text-[#0F6B5C] hover:underline"
            onClick={() => {
              setEditingId(row._id);
              setForm({
                name: row.name,
                description: row.description || "",
                price: String(row.price),
                durationMinutes: String(row.durationMinutes),
                showOnWebsite: row.showOnWebsite ?? true,
              });
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs font-medium text-rose-600 hover:underline"
            onClick={() => void removeService(row._id)}
          >
            Deactivate
          </button>
        </div>
      ),
    },
  ];

  if (!doctorId) {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
        No doctor profile linked to this account.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Services</h2>
        <p className="text-sm text-slate-500">Manage consultation offerings and pricing</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
      >
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Description
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Price
          <input
            required
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Duration (minutes)
          <input
            required
            type="number"
            min={5}
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.showOnWebsite}
            onChange={(e) => setForm((f) => ({ ...f, showOnWebsite: e.target.checked }))}
          />
          Show on website
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Update service" : "Add service"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{message}</p>
      ) : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading services…</p>
      ) : (
        <DataTable columns={columns} rows={services} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
