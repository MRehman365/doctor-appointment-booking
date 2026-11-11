import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export function Section({
  children,
  className,
  id,
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  muted?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("py-14 md:py-20", muted && "bg-surface-muted", className)}
    >
      <div className="site-container">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  titleAccent,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "mb-8 max-w-2xl space-y-3",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="section-title">
        {title}
        {titleAccent ? (
          <>
            {" "}
            <span className="text-brand-text">{titleAccent}</span>
          </>
        ) : null}
      </h2>
      {description ? <p className="subcopy">{description}</p> : null}
    </div>
  );
}
