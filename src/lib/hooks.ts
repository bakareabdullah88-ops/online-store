"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { brand } from "@/config/brand";

const noop = () => () => undefined;

/** True after hydration. Use to gate time- or device-dependent rendering. */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** Current time, ticking. Null during SSR/hydration so markup always matches. */
export function useNow(intervalMs = 30_000): number | null {
  const mounted = useMounted();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return mounted ? now : null;
}

/** Client-side title for data that only exists in the browser. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title}${brand.titleSeparator}${brand.name}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
