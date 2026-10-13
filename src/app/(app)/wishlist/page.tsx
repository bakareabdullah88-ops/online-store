import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { WishlistView } from "@/components/account/saved";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <WishlistView />
    </Page>
  );
}
