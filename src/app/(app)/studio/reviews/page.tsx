import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/page-header";
import { StudioReviews } from "@/components/studio/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Route() {
  return (
    <Page className={pagePad}>
      <StudioReviews />
    </Page>
  );
}
