"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useMode } from "@/components/shell/mode";
import { isActive, marketTabs, shopTabs } from "@/config/nav";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
import { useUi } from "@/stores/ui";
import { useNavBadges } from "./nav-badges";

/** Routes with their own sticky action bar at the bottom. */
const HIDE_ON = ["/products/", "/checkout", "/studio/products/"];

/**
 * Phone navigation (image 8): a floating frosted pill of icon-only tabs with a
 * sliding active disc, and a round action button beside it.
 */
export function MobileNav() {
  const pathname = usePathname() ?? "/";
  const mode = useMode();
  const { user } = useSession();
  const badges = useNavBadges();
  const pulse = useUi((s) => s.bagPulse);
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;
  const tabs = mode === "selling" ? shopTabs : marketTabs;
  const hasShop = !!user && user.brandIds.length > 0;
  const fab =
    mode === "selling" || hasShop
      ? { href: "/studio/products/new", label: "Add a product" }
      : { href: "/open-shop", label: "Open a shop" };

  return (
    <>
      <div
        className="h-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] md:hidden"
        aria-hidden
      />
      <div
        style={{ viewTransitionName: "tab-bar" }}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-header) flex items-center justify-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] md:hidden"
      >
        <nav
          aria-label={mode === "selling" ? "Shop" : "Main"}
          className="pointer-events-auto flex h-16 items-center gap-1 rounded-full glass-bar p-2"
        >
          {tabs.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={count ? `${item.label}, ${count}` : item.label}
                aria-current={active ? "page" : undefined}
                {...(item.href === "/bag" ? { "data-bag-target": true } : {})}
                className={cn(
                  "relative grid size-12 place-items-center rounded-full transition-colors",
                  active ? "text-on-primary" : "text-ink-2 active:scale-95",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-full bg-primary shadow-md"
                    aria-hidden
                  />
                )}
                <motion.span
                  key={item.href === "/bag" ? pulse : 0}
                  initial={item.href === "/bag" && pulse ? { scale: 1.25 } : false}
                  animate={{ scale: 1 }}
                  transition={spring.bouncy}
                  className="relative"
                >
                  <Icon className="size-[21px]" strokeWidth={active ? 2.2 : 1.8} />
                </motion.span>
                {count > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-badge px-1 text-[9.5px] font-bold text-white tabular ring-2 ring-surface">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <Link
          href={fab.href}
          aria-label={fab.label}
          className="pointer-events-auto grid size-16 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-[0_12px_32px_-10px_var(--accent)] transition-transform active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.4} />
        </Link>
      </div>
    </>
  );
}
