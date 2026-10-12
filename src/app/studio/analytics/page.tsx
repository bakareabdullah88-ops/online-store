import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioAnalytics } from "@/components/studio/analytics";

export const metadata: Metadata = { title: "Analytics" };

export default function Route() {
  return (
    <Page>
      <StudioAnalytics />
    </Page>
  );
}
