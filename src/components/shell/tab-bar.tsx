"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useId } from "react";
import { MoreHorizontal, User } from "lucide-react";
import { isActive, marketTabs, studioTabs, type NavItem } from "@/config/nav";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { CountBadge } from "@/components/ui/misc";
import { useBagCount } from "@/stores/bag";
import { useUi } from "@/stores/ui";

function TabLink({
  item,
  active,
  layoutId,
  badge,
}: {
  item: NavItem;
  active: boolean;
  layoutId: string;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 pt-1.5 pb-1",
        active ? "text-ink" : "text-muted",
      )}
      {...(item.href === "/bag" ? { "data-bag-target": true } : {})}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
          transition={spring.snappy}
          aria-hidden
        />
      )}
      <span className="relative">
        <Icon className="size-[22px]" strokeWidth={active ? 2.1 : 1.7} />
        {badge !== undefined && (
          <CountBadge count={badge} className="absolute -top-1.5 -right-2.5" />
        )}
      </span>
      <span className="text-[11px] leading-none font-medium">{item.label}</span>
    </Link>
  );
}

const HIDE_ON = ["/products/", "/checkout", "/open-shop", "/studio/products/"];

/** Bottom tab bar on phones. Market and Studio variants. */
export function TabBar({ variant = "market" }: { variant?: "market" | "studio" }) {
  const pathname = usePathname() ?? "/";
  const layoutId = useId();
  const count = useBagCount();
  const setAccountOpen = useUi((s) => s.setAccountOpen);
  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;
  const items = variant === "market" ? marketTabs : studioTabs;
  const anyActive = items.some((i) => isActive(i, pathname));
  return (
    <>
      <div
        className="h-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] lg:hidden"
        aria-hidden
      />
      <nav
        aria-label={variant === "market" ? "Main" : "Studio"}
        style={{ viewTransitionName: "tab-bar" }}
        className="fixed inset-x-0 bottom-0 z-(--z-header) border-t border-line bg-canvas/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <div className="mx-auto flex h-(--tabbar-h) max-w-lg items-stretch">
          {items.map((item) => (
            <TabLink
              key={item.href}
              item={item}
              active={isActive(item, pathname)}
              layoutId={layoutId}
              badge={item.href === "/bag" ? count : undefined}
            />
          ))}
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 pt-1.5 pb-1",
              !anyActive && pathname.startsWith("/account") ? "text-ink" : "text-muted",
            )}
            aria-haspopup="dialog"
          >
            {!anyActive &&
              (pathname.startsWith("/account") ||
                pathname.startsWith("/wishlist") ||
                pathname.startsWith("/notifications") ||
                pathname.startsWith("/messages") ||
                (variant === "studio" && !anyActive)) && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-accent"
                  transition={spring.snappy}
                  aria-hidden
                />
              )}
            {variant === "market" ? (
              <User className="size-[22px]" strokeWidth={1.7} />
            ) : (
              <MoreHorizontal className="size-[22px]" strokeWidth={1.7} />
            )}
            <span className="text-[11px] leading-none font-medium">
              {variant === "market" ? "Account" : "More"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
