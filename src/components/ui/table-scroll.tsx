import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Horizontal scroller for wide tables on small screens. It is a named,
 * focusable region so keyboard users can scroll it, and `relative` so
 * absolutely positioned children (sr-only labels) stay inside the scroller
 * instead of widening the page.
 */
export function TableScroll({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn("relative overflow-x-auto", className)}
    >
      {children}
    </div>
  );
}
