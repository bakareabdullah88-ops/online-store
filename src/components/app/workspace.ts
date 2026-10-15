"use client";

import { useRouter } from "next/navigation";
import { useMode, type Mode } from "@/components/shell/mode";
import { useSession } from "@/queries/session";
import { usePrefs } from "@/stores/ui";

/** Switch between the market and your shop, back to where you left each one. */
export function useSwitchWorkspace() {
  const mode = useMode();
  const { user } = useSession();
  const router = useRouter();
  const { lastBuyingPath, lastSellingPath } = usePrefs();
  const hasShop = !!user && user.brandIds.length > 0;

  return (next: Mode) => {
    if (next === mode) return;
    if (next === "selling" && !hasShop) {
      router.push("/open-shop");
      return;
    }
    router.push(
      next === "selling"
        ? lastSellingPath?.startsWith("/studio")
          ? lastSellingPath
          : "/studio"
        : lastBuyingPath && !lastBuyingPath.startsWith("/studio")
          ? lastBuyingPath
          : "/home",
    );
  };
}
