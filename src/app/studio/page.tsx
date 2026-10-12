import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioOverview } from "@/components/studio/overview";

export const metadata: Metadata = { title: "Overview" };

export default function StudioPage() {
  return (
    <Page>
      <StudioOverview />
    </Page>
  );
}
