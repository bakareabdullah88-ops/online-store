"use client";

import Link from "next/link";
import { Bell, Menu, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useMode } from "@/components/shell/mode";
import { useUi } from "@/stores/ui";
import { AccountMenu } from "./account-menu";
import { MessagesButton } from "./messages-button";
import { MobileSidebar } from "./mobile-sidebar";
import { useNavBadges } from "./nav-badges";
import { ModeLine } from "./mode-line";
import { WorkspaceSwitch } from "./workspace-switch";

const iconButton =
  "pressable relative grid size-10 shrink-0 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink max-[380px]:size-9";

function Dot({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white tabular ring-2 ring-surface">
      {n > 99 ? "99+" : n}
    </span>
  );
}

/** Phone header: menu, the buying/selling switch, then search, messages, alerts, bag, account. */
export function MobileTopBar() {
  const mode = useMode();
  const badges = useNavBadges();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const [menu, setMenu] = useState(false);
  const menuCount = mode === "selling" ? badges.newOrders : badges.activeOrders;
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-(--z-header) border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden"
    >
      <ModeLine />
      <div className="flex h-14 items-center gap-0.5 px-2">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
          className={iconButton}
        >
          <Menu className="size-5" />
          {menuCount > 0 && (
            <span className="absolute top-2 right-2 size-2 rounded-full bg-badge ring-2 ring-surface" />
          )}
        </button>
        <WorkspaceSwitch compact tight className="ml-1 shrink-0" />
        <span className="min-w-0 flex-1" />
        <button
          type="button"
          aria-label="Search"
          onClick={() => setCommandOpen(true)}
          className={iconButton}
        >
          <Search className="size-5" />
        </button>
        <MessagesButton />
        <Link
          href="/notifications"
          aria-label={
            badges.notifications ? `Notifications, ${badges.notifications} unread` : "Notifications"
          }
          className={iconButton}
        >
          <Bell className="size-5" />
          <Dot n={badges.notifications} />
        </Link>
        {mode === "buying" && (
          <Link
            href="/bag"
            aria-label={badges.bag ? `Bag, ${badges.bag} items` : "Bag"}
            className={iconButton}
            data-bag-target
          >
            <ShoppingBag className="size-5" />
            <Dot n={badges.bag} />
          </Link>
        )}
        <span className="ml-1 shrink-0">
          <AccountMenu />
        </span>
      </div>
      <MobileSidebar open={menu} onOpenChange={setMenu} />
    </header>
  );
}
