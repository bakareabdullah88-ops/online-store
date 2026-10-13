import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { BrandSkeleton, BrandView } from "@/components/market/brand-view";

export const metadata: Metadata = { title: "Brand", description: "A student-run brand on Kiosk." };

export default function BrandPage() {
  return (
    <Page>
      <Suspense fallback={<BrandSkeleton />}>
        <BrandView />
      </Suspense>
    </Page>
  );
}
