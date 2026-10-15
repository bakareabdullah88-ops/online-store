"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Grid2X2, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Popover, Tooltip } from "@/components/ui/overlay";
import { Kbd } from "@/components/ui/misc";
import { useMode } from "@/components/shell/mode";
import { isActive, marketNav, shopNav, type NavItem } from "@/config/nav";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useUi } from "@/stores/ui";
import { AccountMenu } from "./account-menu";
import { KamplugTile, KamplugWordmark } from "./kamplug-mark";
import { MessagesButton } from "./messages-button";
import { ModeLine } from "./mode-line";
import { NavGrid } from "./more-menu";
import { useNavBadges } from "./nav-badges";
import { WorkspaceSwitch } from "./workspace-switch";

const iconBtn =
  "pressable relative grid size-10 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink";

function Count({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <motion.span
      key={n}
      initial={{ scale: 0.4 }}
      animate={{ scale: 1 }}
      transition={spring.bouncy}
      className={cn(
        "absolute grid h-[18px] min-w-[18px] place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white ring-2 ring-surface",
        className ?? "-top-0.5 -right-0.5",
      )}
    >
      {n > 99 ? "99+" : n}
    </motion.span>
  );
}

function NavLink({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const Icon = item.icon;
  return (
    <Tooltip content={item.label} side="bottom">
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        className={cn(
          "relative flex h-16 shrink-0 items-center gap-2 px-2.5 text-[14px] font-medium transition-colors xl:px-3",
          active ? "text-ink" : "text-muted hover:text-ink",
        )}
      >
        <Icon className="size-[18px] lg:hidden" />
        <span className="hidden items-center gap-1.5 lg:flex">
          {item.label}
          {count > 0 && (
            <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </span>
        <span className="lg:hidden">
          <Count n={count} className="top-3 right-0" />
        </span>
        {active && (
          <motion.span
            layoutId="topnav-underline"
            transition={spring.snappy}
            className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-ink"
            aria-hidden
          />
        )}
      </Link>
    </Tooltip>
  );
}

/** A plain full-width header with the workspace's pages. Tablets and up. */
export function TopNav() {
  const mode = useMode();
  const path = usePathname() ?? "/";
  const badges = useNavBadges();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const [more, setMore] = useState(false);

  const sections = mode === "selling" ? shopNav : marketNav;
  const primary = sections.flatMap((s) => s.items).filter((i) => i.primary);
  const secondary = sections.flatMap((s) => s.items).filter((i) => !i.primary);
  const moreActive = secondary.some((i) => isActive(i, path));
  // Notifications and messages already have their own buttons.
  const own = new Set(["notifications", "messages", "shopMessages"]);
  const moreCount = secondary.reduce(
    (n, i) => n + (i.badge && !own.has(i.badge) ? badges[i.badge] : 0),
    0,
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-header) hidden border-b border-line bg-surface/95 backdrop-blur-md md:block",
      )}
      style={{ viewTransitionName: "site-header" }}
    >
      <ModeLine />
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 md:px-6">
        <Link
          href={mode === "selling" ? "/studio" : "/home"}
          aria-label="Kamplug home"
          className="flex pressable items-center gap-2 pr-1"
        >
          <KamplugTile className="size-9" />
          <KamplugWordmark className="hidden text-[20px] 2xl:block" />
        </Link>
        <WorkspaceSwitch compact className="2xl:hidden" />
        <WorkspaceSwitch className="hidden 2xl:flex" />
        <span className="mx-2 h-6 w-px bg-line" aria-hidden />
        <nav
          aria-label={mode === "selling" ? "Shop" : "Market"}
          className="scrollbar-none flex min-w-0 flex-1 items-center overflow-x-auto"
        >
          {primary.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item, path)}
              count={item.badge ? badges[item.badge] : 0}
            />
          ))}
          <Popover
            open={more}
            onOpenChange={setMore}
            align="start"
            className="w-[340px] p-3"
            trigger={
              <button
                type="button"
                aria-label="More pages"
                className={cn(
                  "relative flex h-16 shrink-0 items-center gap-1.5 px-2.5 text-[14px] font-medium transition-colors xl:px-3",
                  moreActive || more ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <Grid2X2 className="size-[18px] lg:hidden" />
                <span className="hidden lg:inline">More</span>
                <ChevronDown
                  className={cn("size-3.5 transition-transform", more && "rotate-180")}
                />
                <Count n={moreCount} className="top-3 right-0" />
              </button>
            }
          >
            <NavGrid onlySecondary onNavigate={() => setMore(false)} />
          </Popover>
        </nav>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          aria-label="Search"
          className="flex h-10 shrink-0 pressable items-center justify-center gap-2 rounded-xl px-2.5 text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink 2xl:w-56 2xl:justify-start 2xl:px-3 2xl:ring-1 2xl:ring-line"
        >
          <Search className="size-[18px]" />
          <span className="hidden text-[13px] text-muted 2xl:inline">Search Kamplug</span>
          <Kbd className="ml-auto hidden 2xl:inline-flex">⌘K</Kbd>
        </button>
        <MessagesButton />
        <Link
          href="/notifications"
          aria-label={
            badges.notifications ? `Notifications, ${badges.notifications} unread` : "Notifications"
          }
          className={iconBtn}
        >
          <Bell className="size-[18px]" />
          <Count n={badges.notifications} />
        </Link>
        {mode === "buying" && (
          <Link
            href="/bag"
            aria-label={badges.bag ? `Bag, ${badges.bag} items` : "Bag"}
            className={iconBtn}
            data-bag-target
          >
            <ShoppingBag className="size-[18px]" />
            <Count n={badges.bag} />
          </Link>
        )}
        <span className="ml-1">
          <AccountMenu />
        </span>
      </div>
    </header>
  );
}
