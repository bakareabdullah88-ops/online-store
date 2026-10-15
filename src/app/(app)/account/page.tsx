import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { BuyerHome } from "@/components/account/home";
import { DashboardSkeleton } from "@/components/dash/skeleton";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

/** The buyer's dashboard: spending, what's on the way and what to do next. */
export default function AccountRoute() {
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
