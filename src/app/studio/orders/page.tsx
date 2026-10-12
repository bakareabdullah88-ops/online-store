import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { OrdersBoard } from "@/components/studio/orders-board";
import { StudioSkeleton } from "@/components/studio/studio-shell";

export const metadata: Metadata = { title: "Orders" };

export default function Route() {
  return (
    <Page>
      <Suspense fallback={<StudioSkeleton />}>
        <OrdersBoard />
      </Suspense>
    </Page>
  );
}
