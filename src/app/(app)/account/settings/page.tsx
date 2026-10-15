import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { SettingsView } from "@/components/account/settings";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <Suspense>
        <SettingsView />
      </Suspense>
    </Page>
  );
}
