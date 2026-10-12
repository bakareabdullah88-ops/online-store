import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { BagPage } from "@/components/checkout/bag-page";

export const metadata: Metadata = { title: "Bag", robots: { index: false } };

export default function Bag() {
  return (
    <Page>
      <BagPage />
    </Page>
  );
}
