import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { AccountOverview } from "@/components/account/overview";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default function Route() {
  return (
    <Page>
      <AccountOverview />
    </Page>
  );
}
