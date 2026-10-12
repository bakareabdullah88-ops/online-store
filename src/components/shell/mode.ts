"use client";

import { usePathname } from "next/navigation";

export type Mode = "buying" | "selling";

export function modeForPath(path: string): Mode {
  return path === "/studio" || path.startsWith("/studio/") ? "selling" : "buying";
}

/** Mode is derived from the route: /studio/** is Selling. See docs/DECISIONS.md §3. */
export function useMode(): Mode {
  return modeForPath(usePathname() ?? "/");
}
