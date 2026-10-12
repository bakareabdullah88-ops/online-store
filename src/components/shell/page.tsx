import { ViewTransition, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page wrapper: route-level view transition (fade + rise) and the main landmark.
 * Each page renders exactly one of these.
 */
export function Page({ children, className, id = "main" }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <main id={id} tabIndex={-1} className={cn("outline-none", className)}>
        {children}
      </main>
    </ViewTransition>
  );
}

export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed top-2 left-2 z-(--z-skip) -translate-y-20 rounded-md bg-primary px-4 py-2.5 text-small font-medium text-on-primary shadow-lg transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}
