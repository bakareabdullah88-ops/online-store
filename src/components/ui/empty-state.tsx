import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Illustration, type IllustrationName } from "@/components/art/illustrations";

export function EmptyState({
  illustration,
  title,
  body,
  action,
  secondary,
  className,
  compact,
}: {
  illustration: IllustrationName;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "gap-3 py-8" : "gap-4 py-14 md:py-20",
        className,
      )}
    >
      <Illustration name={illustration} className={compact ? "w-32" : "w-44"} />
      <div className="max-w-sm">
        <h2 className={cn("font-display text-ink", compact ? "text-title-lg" : "text-display-sm")}>{title}</h2>
        {body && <p className="mt-2 text-body text-muted">{body}</p>}
      </div>
      {(action || secondary) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
}
