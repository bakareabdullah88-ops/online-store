"use client";

import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { services } from "@/services";
import { useBag } from "@/stores/bag";
import { useSpot } from "@/stores/spot";
import { usePrefs, useUi } from "@/stores/ui";
import { modeForPath } from "./mode";

const NOT_REMEMBERED = [
  "/login",
  "/signup",
  "/forgot-password",
  "/welcome",
  "/open-shop",
  "/checkout/success",
];

/**
 * Keeps global, non-visual state in sync:
 * - <html data-mode> follows the route (accent swap)
 * - remembers the last path per mode for the switch
 * - rehydrates persisted client stores after first paint (no hydration mismatch)
 * - refreshes queries when another tab changes the mock database
 */
export function AppSync() {
  const pathname = usePathname() ?? "/";
  const qc = useQueryClient();

  useEffect(() => {
    void useBag.persist.rehydrate();
    void usePrefs.persist.rehydrate();
    void useSpot.persist.rehydrate();
    // Offline shell (production only, so dev never serves stale chunks).
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    // Signed out and out of the app: the auth gate can redirect again.
    if (pathname === "/" || pathname.startsWith("/login")) useUi.getState().setLeaving(false);
    const mode = modeForPath(pathname);
    document.documentElement.dataset.mode = mode;
    if (NOT_REMEMBERED.some((p) => pathname.startsWith(p))) return;
    const search = window.location.search;
    if (mode === "selling") usePrefs.getState().set({ lastSellingPath: pathname + search });
    else if (pathname !== "/") usePrefs.getState().set({ lastBuyingPath: pathname + search });
  }, [pathname]);

  useEffect(() => {
    return services.realtime.subscribe(() => void qc.invalidateQueries());
  }, [qc]);

  return null;
}
