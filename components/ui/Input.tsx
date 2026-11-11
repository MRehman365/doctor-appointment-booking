import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

const fieldClass =
  "w-full rounded-sm border border-border-strong bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition placeholder:text-muted-soft focus:border-brand-text focus:ring-2 focus:ring-brand/25";

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-navy">{label}</span> : null}
      <input id={inputId} className={cn(fieldClass, error && "border-danger", className)} {...props} />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-navy">{label}</span> : null}
      <textarea
        id={inputId}
        className={cn(fieldClass, "min-h-28 resize-y", error && "border-danger", className)}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({
  label,
  hint,
  error,
  className,
  id,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const inputId = id || props.name;
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-medium text-navy">{label}</span> : null}
      <select
        id={inputId}
        className={cn(fieldClass, error && "border-danger", className)}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
