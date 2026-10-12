import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { MyReviewsView } from "@/components/account/my-reviews";

export const metadata: Metadata = { title: "My reviews", robots: { index: false } };

export default function Route() {
  return (
    <Page>
      <MyReviewsView />
    </Page>
  );
}
