import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { StudioProducts } from "@/components/studio/products-list";

export const metadata: Metadata = { title: "Products", robots: { index: false } };

export default function Route() {
  return (
    <Page className={pagePad}>
      <Suspense>
        <StudioProducts />
      </Suspense>
    </Page>
  );
}
