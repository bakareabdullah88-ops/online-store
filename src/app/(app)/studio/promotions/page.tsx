import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/page-header";
import { StudioPromotions } from "@/components/studio/promotions";

export const metadata: Metadata = { title: "Promotions" };

export default function Route() {
  return (
    <Page className={pagePad}>
      <StudioPromotions />
    </Page>
  );
}
