import { MarkStrokes } from "@/lib/brand-mark";
import { cn } from "@/lib/cn";

/** The K-with-a-plug mark in the current text colour. */
export function KamplugMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-6", className)} aria-hidden>
      <MarkStrokes color="currentColor" />
    </svg>
  );
}

/** The mark on its green tile, as on the app icon. */
export function KamplugTile({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[25%] bg-brand text-white",
        className,
      )}
      aria-hidden
    >
      <KamplugMark className={cn("size-[78%]", markClassName)} />
    </span>
  );
}

/** "kamplug" set as the wordmark: lowercase, tight, with "plug" in the brand colour. */
export function KamplugWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "leading-none font-extrabold tracking-[-0.055em] text-ink lowercase",
        className,
      )}
    >
      kam<span className="text-brand-ink">plug</span>
    </span>
  );
}
