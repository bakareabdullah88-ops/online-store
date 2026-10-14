"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { features } from "@/config/features";
import { useSession, useStartPreview } from "@/queries/session";
import { useUi } from "@/stores/ui";

/**
 * Client-side gate. BACKEND-SEAM: with real auth, protect routes in proxy.ts
 * using the session cookie so protected HTML is never sent.
 */
export function RequireAuth({
  children,
  fallback,
  requireShop = false,
}: {
  children: ReactNode;
  fallback: ReactNode;
  requireShop?: boolean;
}) {
  const { user, isReady } = useSession();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const leaving = useUi((s) => s.leaving);

  const needsLogin = isReady && !user && !leaving;
  const needsOnboarding = isReady && !!user && !user.onboarded && pathname !== "/welcome";
  const needsShop = isReady && !!user && requireShop && user.brandIds.length === 0;

  // SAMPLE DATA: visitors look around as the preview account instead of being asked to log in.
  const preview = useStartPreview();
  const previewOn = features.sampleData && !preview.isError;
  const startPreview = preview.mutate;
  const previewIdle = preview.isIdle;

  useEffect(() => {
    const next = encodeURIComponent(pathname + window.location.search);
    if (needsLogin && previewOn) {
      if (previewIdle) startPreview();
    } else if (needsLogin) router.replace(`/login?next=${next}`);
    else if (needsOnboarding) router.replace(`/welcome?next=${next}`);
    else if (needsShop) router.replace("/open-shop");
  }, [
    needsLogin,
    needsOnboarding,
    needsShop,
    router,
    pathname,
    previewOn,
    previewIdle,
    startPreview,
  ]);

  if (!isReady || !user || needsOnboarding || needsShop) return <>{fallback}</>;
  return <>{children}</>;
}
