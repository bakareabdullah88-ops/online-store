import { cn } from "@/lib/cn";

/** The K mark used on the rail, icons and favicon. */
export function KamplugMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-6", className)} aria-hidden>
      <path
        d="M20 14 V50 M20 34 L40 14 M27 28 L42 50"
        stroke="currentColor"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="48" cy="46" r="5" fill="var(--chart-blue-2)" />
    </svg>
  );
}
