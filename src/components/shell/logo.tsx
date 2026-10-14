import Link from "next/link";
import { KamplugMark } from "@/components/app/kamplug-mark";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

/** Mark tile plus the name. */
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
      className={cn("group inline-flex items-center gap-2 rounded-xs", className)}
      aria-label={`${brand.name} home`}
    >
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary shadow-sm">
        <KamplugMark className="size-[18px]" />
      </span>
      <span className="text-[22px] leading-none font-bold tracking-[-0.03em] text-ink">
        {brand.name}
      </span>
      {suffix && <span className="ml-1 eyebrow text-muted">{suffix}</span>}
    </Link>
  );
}
