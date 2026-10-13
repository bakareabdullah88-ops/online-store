"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
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
import { KioskMark } from "./kiosk-mark";
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
        "absolute grid h-[18px] min-w-[18px] place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white ring-2 ring-[var(--glass-fill-strong)]",
        className ?? "-top-0.5 -right-0.5",
      )}
    >
      {n > 99 ? "99+" : n}
    </motion.span>
  );
}

function Pill({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const Icon = item.icon;
  const body = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className={cn(
        "group relative flex h-10 shrink-0 items-center gap-2 rounded-xl px-2.5 text-[13.5px] font-semibold transition-colors xl:px-3",
        active ? "text-on-primary" : "text-ink-2 hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="topnav-active"
          transition={spring.snappy}
          className="absolute inset-0 rounded-xl bg-primary shadow-[0_8px_18px_-8px_rgb(0_0_0/0.45)]"
          aria-hidden
        />
      )}
      {!active && (
        <span
          className="absolute inset-0 rounded-xl opacity-0 transition-opacity group-hover:bg-ink/[0.05] group-hover:opacity-100"
          aria-hidden
        />
      )}
      <motion.span
        className="relative"
        whileTap={{ scale: 0.8, rotate: -8 }}
        animate={active ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        <Icon className="size-[18px]" style={active ? undefined : { color: item.tone }} />
      </motion.span>
      <span className="relative hidden xl:inline">{item.label}</span>
      {active && <span className="relative xl:hidden">{item.label}</span>}
      <Count n={count} className="-top-1 -right-1" />
    </Link>
  );
  return active ? (
    body
  ) : (
    <Tooltip content={item.label} side="bottom">
      {body}
    </Tooltip>
  );
}

/** Floating liquid-glass header with the workspace's pages (zentra / LoopAI). Tablets and up. */
export function TopNav() {
  const mode = useMode();
  const path = usePathname() ?? "/";
  const badges = useNavBadges();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const [more, setMore] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  const sections = mode === "selling" ? shopNav : marketNav;
  const primary = sections.flatMap((s) => s.items).filter((i) => i.primary);
  const secondary = sections.flatMap((s) => s.items).filter((i) => !i.primary);
  const moreActive = secondary.some((i) => isActive(i, path));
  // Notifications already have the bell.
  const moreCount = secondary.reduce(
    (n, i) => n + (i.badge && i.badge !== "notifications" ? badges[i.badge] : 0),
    0,
  );

  return (
    <header
      className="sticky top-0 z-(--z-header) hidden px-4 pt-3 md:block md:px-6"
      style={{ viewTransitionName: "site-header" }}
    >
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        initial={{ y: -16, opacity: 0 }}
        transition={spring.smooth}
        className={cn(
          "mx-auto flex h-16 max-w-[1400px] items-center gap-2 rounded-[20px] glass-bar px-2.5 transition-shadow duration-300",
          scrolled && "shadow-[var(--shadow-card-hover)]",
        )}
      >
        <Link
          href={mode === "selling" ? "/studio" : "/home"}
          aria-label="Kiosk home"
          className="flex pressable items-center gap-2 pr-1"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-primary text-on-primary shadow-md">
            <KioskMark className="size-5" />
          </span>
          <span className="hidden text-[18px] font-bold tracking-[-0.03em] 2xl:block">Kiosk</span>
        </Link>
        <WorkspaceSwitch compact className="2xl:hidden" />
        <WorkspaceSwitch className="hidden 2xl:flex" />
        <span className="mx-1 h-7 w-px bg-line" aria-hidden />
        <nav
          aria-label={mode === "selling" ? "Shop" : "Market"}
          className="scrollbar-none flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
        >
          {primary.map((item) => (
            <Pill
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
                  "relative flex h-10 shrink-0 pressable items-center gap-1.5 rounded-xl px-2.5 text-[13.5px] font-semibold transition-colors",
                  moreActive || more
                    ? "bg-ink/[0.06] text-ink"
                    : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
                )}
              >
                <Grid2X2 className="size-[18px]" />
                <span className="hidden xl:inline">More</span>
                <ChevronDown
                  className={cn("size-3.5 transition-transform", more && "rotate-180")}
                />
                <Count n={moreCount} className="-top-1 -right-1" />
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
          className="flex h-10 shrink-0 pressable items-center justify-center gap-2 rounded-xl px-2.5 text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink 2xl:px-3"
        >
          <Search className="size-[18px]" />
          <span className="hidden text-[13px] text-muted 2xl:inline">Search</span>
          <Kbd className="hidden 2xl:inline-flex">⌘K</Kbd>
        </button>
        <Link
          href="/notifications"
          aria-label={
            badges.notifications ? `Notifications, ${badges.notifications} unread` : "Notifications"
          }
          className={iconBtn}
        >
          <motion.span whileHover={{ rotate: [0, -12, 10, -6, 0] }} transition={{ duration: 0.5 }}>
            <Bell className="size-[18px]" />
          </motion.span>
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
      </motion.div>
    </header>
  );
}
