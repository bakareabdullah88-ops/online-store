"use client";

import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/shell/require-auth";
import { AppBackdrop } from "./backdrop";
import { MobileNav } from "./mobile-nav";
import { MobileTopBar } from "./mobile-top-bar";
import { TopNav } from "./top-nav";

/** Neutral frame shown while the session loads. */
function ShellSkeleton() {
  return (
    <div className="min-h-dvh" aria-busy="true" aria-label="Loading">
      <AppBackdrop />
      <div className="px-3 pt-3 md:px-6">
        <Skeleton className="mx-auto h-14 max-w-[1400px] md:h-16" rounded="lg" />
      </div>
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
 * Signed-in frame: a tinted, drifting backdrop, a floating glass top bar on
 * tablets and up, and a top bar plus floating pill nav on phones.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <RequireAuth fallback={<ShellSkeleton />}>
        <div className="relative min-h-dvh">
          <AppBackdrop />
          <TopNav />
          <MobileTopBar />
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
          <MobileNav />
        </div>
      </RequireAuth>
    </Suspense>
  );
}
