import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/page-header";
import { NotificationsView } from "@/components/account/notifications";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <NotificationsView />
    </Page>
  );
}
