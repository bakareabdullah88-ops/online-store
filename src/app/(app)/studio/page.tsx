import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { ShopPerformance } from "@/components/studio/performance";
import { DashboardSkeleton } from "@/components/dash/skeleton";

export const metadata: Metadata = { title: "Performance", robots: { index: false } };

export default function StudioPage() {
  return (
    <Page>
      <Suspense
        fallback={
          <div className="p-8">
            <DashboardSkeleton />
          </div>
        }
      >
        <ShopPerformance />
      </Suspense>
    </Page>
  );
}
