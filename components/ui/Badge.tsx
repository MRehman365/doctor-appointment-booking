import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

type Tone = "brand" | "neutral" | "success" | "warning" | "accent";

const tones: Record<Tone, string> = {
  brand: "bg-brand-soft text-brand-text",
  neutral: "bg-surface-muted text-muted",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-800",
  accent: "bg-accent-soft text-accent-text",
};

export function Badge({
  children,
  tone = "brand",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-medium tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
