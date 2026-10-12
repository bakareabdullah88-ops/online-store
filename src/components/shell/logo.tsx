import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

/** Wordmark: the name in the display face with a small mode-aware dot. */
export function Logo({
  className,
  href = "/",
  suffix,
}: {
  className?: string;
  href?: string;
  suffix?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-baseline gap-1.5 rounded-xs", className)}
      aria-label={`${brand.name} home`}
    >
      <span className="font-display text-[1.75rem] leading-none tracking-[-0.02em] text-ink">
        {brand.name}
      </span>
      <span
        className="size-1.5 translate-y-[-2px] rounded-full bg-accent transition-transform duration-300 group-hover:scale-150"
        aria-hidden
      />
      {suffix && <span className="ml-1 eyebrow text-muted">{suffix}</span>}
    </Link>
  );
}
