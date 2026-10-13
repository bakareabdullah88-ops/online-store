import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { OrdersBoard } from "@/components/studio/orders-board";
import { DashboardSkeleton as StudioSkeleton } from "@/components/dash/skeleton";

export const metadata: Metadata = { title: "Orders" };

export default function Route() {
  return (
    <Page className={pagePad}>
      <Suspense fallback={<StudioSkeleton />}>
        <OrdersBoard />
      </Suspense>
    </Page>
  );
}
