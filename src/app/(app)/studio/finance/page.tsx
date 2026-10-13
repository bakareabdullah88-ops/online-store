import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { StudioFinance } from "@/components/studio/finance";

export const metadata: Metadata = { title: "Finance", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <StudioFinance />
    </Page>
  );
}
