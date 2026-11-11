import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Props = {
  href?: string;
  className?: string;
  imgClassName?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
};

const sizes = {
  sm: { box: "h-9 w-9", img: 36, text: "text-base" },
  md: { box: "h-10 w-10", img: 40, text: "text-lg" },
  lg: { box: "h-12 w-12", img: 48, text: "text-xl" },
};

export function BrandLogo({
  href = "/",
  className,
  imgClassName,
  showWordmark = true,
  size = "md",
  inverted = false,
}: Props) {
  const s = sizes[size];

  const content = (
    <>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-white",
          s.box,
          imgClassName,
        )}
      >
        <Image
          src="/logo.png"
          alt="Medical Complex"
          width={s.img}
          height={s.img}
          className="h-full w-full object-cover"
          priority
        />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-semibold leading-tight tracking-tight",
            s.text,
            inverted ? "text-white" : "text-navy",
          )}
        >
          Medical <span className={inverted ? "text-brand" : "text-brand-text"}>Complex</span>
        </span>
      ) : null}
    </>
  );

  if (!href) {
    return <span className={cn("inline-flex items-center gap-3", className)}>{content}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)}>
      {content}
    </Link>
  );
}
