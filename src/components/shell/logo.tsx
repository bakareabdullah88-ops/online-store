import Link from "next/link";
import { KamplugWordmark } from "@/components/app/kamplug-mark";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

/** The Kamplug wordmark: plain text, "kam" in ink and "plug" in cobalt. */
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
      <KamplugWordmark className="text-[26px]" />
      {suffix && <span className="ml-1 eyebrow text-muted">{suffix}</span>}
    </Link>
  );
}
