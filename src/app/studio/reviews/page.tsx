import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioReviews } from "@/components/studio/reviews";

export const metadata: Metadata = { title: "Reviews" };

export default function Route() {
  return (
    <Page>
      <StudioReviews />
    </Page>
  );
}
