"use client";

import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/shell/require-auth";
import { AppBackdrop } from "./backdrop";
import { MobileTopBar } from "./mobile-top-bar";
import { TopNav } from "./top-nav";

/** Neutral frame shown while the session loads. */
function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-[var(--app-bg)]" aria-busy="true" aria-label="Loading">
      <AppBackdrop />
      <div className="h-14 border-b border-line bg-surface md:h-16" />
      <div className="mx-auto max-w-[1400px] px-4 pt-8 md:px-6">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" rounded="lg" />
          ))}
        </div>
        <Skeleton className="mt-4 h-72 w-full" rounded="lg" />
      </div>
    </div>
  );
}

/**
 * Signed-in frame: one flat page colour (content sits directly on it, set
 * apart by thin grey lines rather than boxes), a full-width top bar on tablets and
 * up, and on phones a top bar whose menu opens a sidebar.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <RequireAuth fallback={<ShellSkeleton />}>
        <div className="relative min-h-dvh bg-[var(--app-bg)] [--canvas:var(--app-bg)]">
          <AppBackdrop />
          <TopNav />
          <MobileTopBar />
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
