import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { OrderDetail, OrderDetailSkeleton } from "@/components/orders/order-detail";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

export default function OrderPage() {
  return (
    <Page>
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetail />
      </Suspense>
    </Page>
  );
}
