"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { useSession } from "@/queries/session";

/** Shop pages need a shop: people without one are sent to open one. */
export function ShopGate({ children }: { children: ReactNode }) {
  const { user, isReady } = useSession();
  const router = useRouter();
  const missing = isReady && !!user && user.brandIds.length === 0;
  useEffect(() => {
    if (missing) router.replace("/open-shop");
  }, [missing, router]);
  if (!isReady || missing) {
    return (
      <div className="p-8">
        <DashboardSkeleton />
      </div>
    );
  }
  return <>{children}</>;
}
