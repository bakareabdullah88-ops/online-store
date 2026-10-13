import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { OrdersList } from "@/components/orders/orders-list";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function OrdersPage() {
  return (
    <Page className={pagePad}>
      <OrdersList />
    </Page>
  );
}
