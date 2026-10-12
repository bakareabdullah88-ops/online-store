import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { RequireAuth } from "@/components/shell/require-auth";
import { OrdersList, OrdersSkeleton } from "@/components/orders/orders-list";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <Page className="container-page max-w-3xl pt-6 md:pt-10">
      <RequireAuth fallback={<OrdersSkeleton />}>
        <OrdersList />
      </RequireAuth>
    </Page>
  );
}
