"use client";

import { Suspense, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/shell/require-auth";
import { MobileNav } from "./mobile-nav";
import { MobileTopBar } from "./mobile-top-bar";
import { Rail } from "./rail";
import { Sidebar } from "./sidebar";

/** Neutral frame shown while the session loads. */
function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh" aria-busy="true" aria-label="Loading">
      <div className="hidden w-(--rail-w) flex-col items-center gap-4 py-4 lg:flex">
        <Skeleton className="size-12" rounded="lg" />
        <Skeleton className="size-12" rounded="lg" />
        <Skeleton className="size-12" rounded="lg" />
      </div>
      <div className="hidden w-(--sidebar-w) flex-col gap-2 py-5 pr-3 lg:flex">
        <Skeleton className="mb-4 h-10 w-40" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
      <div className="flex-1 lg:py-3 lg:pr-3">
        <div className="h-full min-h-dvh bg-surface p-6 lg:min-h-0 lg:rounded-[28px] lg:ring-1 lg:ring-line">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Signed-in app frame (image 2): workspace rail, contextual sidebar and a
 * rounded white panel for the page. On phones: top bar and floating nav.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellSkeleton />}>
      <RequireAuth fallback={<ShellSkeleton />}>
        <div className="flex min-h-dvh">
          <Rail />
          <Suspense fallback={<div className="hidden w-(--sidebar-w) shrink-0 lg:block" />}>
            <Sidebar />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col lg:py-3 lg:pr-3">
            <MobileTopBar />
            <div className="relative flex-1 bg-surface lg:min-h-[calc(100dvh-24px)] lg:rounded-[28px] lg:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_30px_-12px_rgb(0_0_0/0.08)] lg:ring-1 lg:ring-line">
              {children}
            </div>
            <MobileNav />
          </div>
        </div>
      </RequireAuth>
    </Suspense>
  );
}
