import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { EditProduct } from "@/components/studio/edit-product";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Edit product" };

export default function Route() {
  return (
    <Page>
      <Suspense fallback={<Skeleton className="h-96 w-full" rounded="lg" />}>
        <EditProduct />
      </Suspense>
    </Page>
  );
}
