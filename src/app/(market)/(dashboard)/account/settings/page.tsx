import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { SettingsView } from "@/components/account/settings";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function Route() {
  return (
    <Page>
      <SettingsView />
    </Page>
  );
}
