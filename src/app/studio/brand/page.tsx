import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioBrandSettings } from "@/components/studio/brand-settings";

export const metadata: Metadata = { title: "Brand" };

export default function Route() {
  return (
    <Page>
      <StudioBrandSettings />
    </Page>
  );
}
