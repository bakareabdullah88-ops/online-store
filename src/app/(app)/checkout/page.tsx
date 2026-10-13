import type { Metadata } from "next";
import { Page } from "@/components/shell/page";
import { RequireAuth } from "@/components/shell/require-auth";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

function CheckoutSkeleton() {
  return (
    <div className="container-page grid gap-8 pt-10 lg:grid-cols-12" aria-hidden>
      <div className="flex flex-col gap-4 lg:col-span-7">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-36 w-full" rounded="lg" />
        <Skeleton className="h-72 w-full" rounded="lg" />
      </div>
      <Skeleton className="h-80 w-full lg:col-span-5" rounded="lg" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Page>
      <RequireAuth fallback={<CheckoutSkeleton />}>
        <CheckoutView />
      </RequireAuth>
    </Page>
  );
}
