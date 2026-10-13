import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { MembersView } from "@/components/account/members";

export const metadata: Metadata = { title: "Members", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <MembersView />
    </Page>
  );
}
