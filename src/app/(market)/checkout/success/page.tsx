import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { RequireAuth } from "@/components/shell/require-auth";
import { SuccessView } from "@/components/checkout/success-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

const fallback = (
  <div className="container-page max-w-2xl pt-16" aria-hidden>
    <Skeleton className="mx-auto size-28" rounded="full" />
    <Skeleton className="mx-auto mt-8 h-14 w-72" />
  </div>
);

export default function SuccessPage() {
  return (
    <Page>
      <RequireAuth fallback={fallback}>
        <Suspense fallback={fallback}>
          <SuccessView />
        </Suspense>
      </RequireAuth>
    </Page>
  );
}
