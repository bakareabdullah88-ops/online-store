import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { OrdersList } from "@/components/orders/orders-list";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <Page className="max-w-3xl">
      <OrdersList />
    </Page>
  );
}
