"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/shell/require-auth";
import { useSession } from "@/queries/session";
import { useUi } from "@/stores/ui";

const fallback = (
  <div className="flex flex-col gap-6" aria-hidden>
    <Skeleton className="h-1.5 w-full" rounded="full" />
    <Skeleton className="mt-8 h-12 w-80" />
    <Skeleton className="h-13 w-full" rounded="md" />
  </div>
);

/** Signed-in users without a shop only; others go to Studio. */
export function OpenShopGate({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const router = useRouter();
  const justOpened = useUi((s) => s.shopJustOpened);
  const hasShop = !!user && user.brandIds.length > 0 && !justOpened;
  useEffect(() => {
    if (hasShop) router.replace("/studio");
  }, [hasShop, router]);
  return <RequireAuth fallback={fallback}>{hasShop ? fallback : children}</RequireAuth>;
}
