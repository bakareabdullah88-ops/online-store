import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/page-header";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { StudioAnalytics } from "@/components/studio/analytics";

export const metadata: Metadata = { title: "Analytics", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <Suspense fallback={<DashboardSkeleton />}>
        <StudioAnalytics />
      </Suspense>
    </Page>
  );
}
