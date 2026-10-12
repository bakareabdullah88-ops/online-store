import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioPayouts } from "@/components/studio/payouts";

export const metadata: Metadata = { title: "Payouts" };

export default function Route() {
  return (
    <Page>
      <StudioPayouts />
    </Page>
  );
}
