import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioCustomers } from "@/components/studio/customers";

export const metadata: Metadata = { title: "Customers" };

export default function Route() {
  return (
    <Page>
      <StudioCustomers />
    </Page>
  );
}
