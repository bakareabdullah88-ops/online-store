"use client";

import { useRouter } from "next/navigation";
import { useMode, type Mode } from "@/components/shell/mode";
import { useCurtain } from "@/components/shell/mode-curtain";
import { useSession } from "@/queries/session";
import { usePrefs } from "@/stores/ui";

/** Switch between the market and your shop, with the curtain transition. */
export function useSwitchWorkspace() {
  const mode = useMode();
  const { user } = useSession();
  const router = useRouter();
  const start = useCurtain((s) => s.start);
  const { lastBuyingPath, lastSellingPath } = usePrefs();
  const hasShop = !!user && user.brandIds.length > 0;

  return (next: Mode, origin?: { x: number; y: number }) => {
    if (next === mode) return;
    if (next === "selling" && !hasShop) {
      router.push("/open-shop");
      return;
    }
    start(
      next,
      next === "selling"
        ? lastSellingPath?.startsWith("/studio")
          ? lastSellingPath
          : "/studio"
        : lastBuyingPath && !lastBuyingPath.startsWith("/studio")
          ? lastBuyingPath
          : "/home",
      origin,
    );
  };
}
