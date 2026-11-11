import { cn } from "@/lib/utils/cn";

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  checked_in: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  in_consultation: "bg-violet-50 text-violet-800 ring-violet-200",
  completed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
  no_show: "bg-orange-50 text-orange-800 ring-orange-200",
  expired: "bg-slate-100 text-slate-600 ring-slate-200",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
  refunded: "bg-slate-100 text-slate-600 ring-slate-200",
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  admin: "bg-[#0F6B5C]/10 text-[#0F6B5C] ring-[#0F6B5C]/20",
  doctor: "bg-sky-50 text-sky-800 ring-sky-200",
  receptionist: "bg-indigo-50 text-indigo-800 ring-indigo-200",
};

function labelize(status: string) {
  return status.replaceAll("_", " ");
}

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
        STATUS_STYLES[key] || "bg-slate-100 text-slate-700 ring-slate-200",
        className,
      )}
    >
      {labelize(status)}
    </span>
  );
}
