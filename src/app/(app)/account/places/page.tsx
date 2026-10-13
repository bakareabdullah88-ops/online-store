import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/page-header";
import { PlacesView } from "@/components/account/places";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <PlacesView />
    </Page>
  );
}
