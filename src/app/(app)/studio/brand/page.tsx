import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { StudioBrandSettings } from "@/components/studio/brand-settings";

export const metadata: Metadata = { title: "Brand" };

export default function Route() {
  return (
    <Page className={pagePad}>
      <StudioBrandSettings />
    </Page>
  );
}
