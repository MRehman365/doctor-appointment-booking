"use client";

import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { apiFetch } from "@/lib/dashboard/api";
import { formatDate } from "@/lib/utils/format";

type Patient = {
  _id: string;
  patientId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  gender?: string;
  createdAt?: string;
};

const columns: Column<Patient>[] = [
  {
    key: "id",
    header: "Patient ID",
    render: (row) => <span className="font-mono text-xs">{row.patientId || "—"}</span>,
  },
  {
    key: "name",
    header: "Name",
    render: (row) => <span className="font-medium text-slate-900">{row.fullName}</span>,
  },
  { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
  { key: "email", header: "Email", render: (row) => row.email || "—" },
  { key: "gender", header: "Gender", render: (row) => row.gender || "—" },
  {
    key: "created",
    header: "Registered",
    render: (row) => (row.createdAt ? formatDate(row.createdAt, "dd MMM yyyy") : "—"),
  },
];

export default function AdminPatientsPage() {
  const [q, setQ] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(search = q) {
    setLoading(true);
    try {
      const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : "";
      const data = await apiFetch<Patient[]>(`/api/patients${query}`);
      setPatients(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    void load(q);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Patients</h2>
        <p className="text-sm text-slate-500">Search by ID, name, phone, or email</p>
      </div>

      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patients…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0F6B5C] focus:ring-2 focus:ring-[#0F6B5C]/20"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-[#0F6B5C] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

      {error ? <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-500">Loading patients…</p>
      ) : (
        <DataTable columns={columns} rows={patients} rowKey={(row) => row._id} />
      )}
    </div>
  );
}
