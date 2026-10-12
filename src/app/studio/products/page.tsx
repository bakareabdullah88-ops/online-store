import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { StudioProducts } from "@/components/studio/products-list";

export const metadata: Metadata = { title: "Products" };

export default function Route() {
  return (
    <Page>
      <StudioProducts />
    </Page>
  );
}
