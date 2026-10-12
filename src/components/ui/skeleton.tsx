import { cn } from "@/lib/cn";

/**
 * Skeleton block with a subtle shimmer. Compose these to mirror the real layout
 * exactly; never use a generic stack of grey bars.
 */
export function Skeleton({
  className,
  rounded = "sm",
}: {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full" | "none";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block overflow-hidden bg-skeleton",
        rounded === "sm" && "rounded-sm",
        rounded === "md" && "rounded-md",
        rounded === "lg" && "rounded-lg",
        rounded === "full" && "rounded-full",
        className,
      )}
    >
      <span className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-(--skeleton-shine) to-transparent" />
    </span>
  );
}

/** Text-line skeleton sized to the surrounding type style. */
export function SkeletonText({
  lines = 1,
  className,
  lastWidth = "60%",
}: {
  lines?: number;
  className?: string;
  lastWidth?: string;
}) {
  return (
    <span aria-hidden className={cn("flex flex-col gap-[0.45em] py-[0.2em]", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} style={{ width: i === lines - 1 && lines > 1 ? lastWidth : "100%" }}>
          <Skeleton className="h-[0.8em]" />
        </span>
      ))}
    </span>
  );
}

export function LoadingRegion({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
