import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { BuyerHome } from "@/components/account/home";
import { DashboardSkeleton } from "@/components/dash/skeleton";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default function HomeRoute() {
  return (
    <Page>
      <Suspense
        fallback={
          <div className="p-8">
            <DashboardSkeleton />
          </div>
        }
      >
        <BuyerHome />
      </Suspense>
    </Page>
  );
}
