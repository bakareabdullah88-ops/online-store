import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { FollowingView } from "@/components/account/saved";

export const metadata: Metadata = { title: "Following", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <FollowingView />
    </Page>
  );
}
