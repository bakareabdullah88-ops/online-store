import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { ProductSkeleton, ProductView } from "@/components/market/product/product-view";

export const metadata: Metadata = {
  title: "Product",
  description: "Made by a student brand on Kamplug.",
};

export default function ProductPage() {
  return (
    <Page>
      <Suspense fallback={<ProductSkeleton />}>
        <ProductView />
      </Suspense>
    </Page>
  );
}
