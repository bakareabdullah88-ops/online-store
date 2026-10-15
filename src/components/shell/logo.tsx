import Link from "next/link";
import { KamplugTile, KamplugWordmark } from "@/components/app/kamplug-mark";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

/** The Kamplug lock-up: green K tile and the "kamplug" wordmark. */
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
      <KamplugTile className="size-8" />
      <KamplugWordmark className="text-[23px]" />
      {suffix && <span className="ml-1 eyebrow text-muted">{suffix}</span>}
    </Link>
  );
}
