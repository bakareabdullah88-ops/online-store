import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { WishlistView } from "@/components/account/saved";

export const metadata: Metadata = { title: "Saved", robots: { index: false } };

export default function Route() {
  return (
    <Page>
      <WishlistView />
    </Page>
  );
}
