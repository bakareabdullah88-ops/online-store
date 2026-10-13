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
        compact ? "gap-3 py-8" : "card gap-4 px-6 py-14 md:py-16",
        className,
      )}
    >
      <span className="relative">
        <span
          className="absolute inset-x-4 inset-y-2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--chart-blue)_22%,transparent),transparent)] blur-xl"
          aria-hidden
        />
        <Illustration
          name={illustration}
          className={cn(
            "relative animate-[float_5s_ease-in-out_infinite]",
            compact ? "w-32" : "w-44",
          )}
        />
      </span>
      <div className="max-w-sm">
        <h2
          className={cn(
            "font-bold tracking-[-0.02em] text-ink",
            compact ? "text-title-lg" : "text-[22px] md:text-[24px]",
          )}
        >
          {title}
        </h2>
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
