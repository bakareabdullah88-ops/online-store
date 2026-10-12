import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { ProductEditor } from "@/components/studio/product-editor";

export const metadata: Metadata = { title: "New product" };

export default function Route() {
  return (
    <Page>
      <ProductEditor id={null} />
    </Page>
  );
}
