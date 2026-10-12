"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
import { usePrefs } from "@/stores/ui";
import { useMode, type Mode } from "./mode";
import { useCurtain } from "./mode-curtain";

/**
 * Buying / Selling switch. Users without a shop are sent to the
 * open-shop flow when they pick Selling.
 */
export function ModeSwitch({
  className,
  size = "md",
  onSwitch,
}: {
  className?: string;
  size?: "sm" | "md";
  onSwitch?: () => void;
}) {
  const mode = useMode();
  const { user } = useSession();
  const router = useRouter();
  const start = useCurtain((s) => s.start);
  const { lastBuyingPath, lastSellingPath } = usePrefs();
  const layoutId = useId();
  const hasShop = !!user && user.brandIds.length > 0;

  const go = (next: Mode) => {
    if (next === mode) return;
    onSwitch?.();
    if (next === "selling" && !hasShop) {
      router.push(user ? "/open-shop" : "/login?next=/open-shop");
      return;
    }
    start(next, next === "selling" ? lastSellingPath || "/studio" : lastBuyingPath || "/explore");
  };

  const options: { value: Mode; label: string }[] = [
    { value: "buying", label: "Buying" },
    { value: "selling", label: hasShop ? "Selling" : "Sell" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Mode"
      className={cn(
        "relative inline-flex items-center rounded-full bg-ink/[0.06] p-1 dark:bg-ink/[0.1]",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === mode;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => go(o.value)}
            className={cn(
              "relative z-0 inline-flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200",
              size === "sm" ? "h-8 px-3 text-small" : "h-9 px-4 text-small",
              active ? "text-on-primary" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={spring.snappy}
                aria-hidden
              />
            )}
            <span
              className={cn("size-1.5 rounded-full transition-colors", active ? "" : "opacity-60")}
              style={{ background: o.value === "selling" ? "var(--studio)" : "var(--ember)" }}
              aria-hidden
            />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
