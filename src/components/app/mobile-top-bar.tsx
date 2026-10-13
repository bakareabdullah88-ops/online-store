"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { useMode } from "@/components/shell/mode";
import { cn } from "@/lib/cn";
import { useMyBrand } from "@/queries/studio";
import { useUi } from "@/stores/ui";
import { AccountMenu } from "./account-menu";
import { KioskMark } from "./kiosk-mark";
import { MenuSheet } from "./menu-sheet";
import { useNavBadges } from "./nav-badges";

const iconButton =
  "relative grid size-10 place-items-center rounded-full text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink";

/** Phone header: menu, workspace name, search, notifications and account. */
export function MobileTopBar() {
  const mode = useMode();
  const { data: brand } = useMyBrand();
  const badges = useNavBadges();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const [menu, setMenu] = useState(false);
  const shop = mode === "selling" && brand;
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-(--z-header) flex h-[calc(var(--header-h)+env(safe-area-inset-top))] items-center gap-1 border-b border-line glass px-2 pt-[env(safe-area-inset-top)] lg:hidden"
    >
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMenu(true)}
        className={iconButton}
      >
        <Menu className="size-5" />
      </button>
      <Link
        href={shop ? "/studio" : "/home"}
        className="flex min-w-0 flex-1 items-center gap-2 px-1"
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px]",
            !shop && "bg-primary text-on-primary",
          )}
        >
          {shop ? (
            <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
          ) : (
            <KioskMark className="size-4" />
          )}
        </span>
        <span className="truncate text-[15px] font-semibold">{shop ? brand.name : "Market"}</span>
      </Link>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setCommandOpen(true)}
        className={iconButton}
      >
        <Search className="size-5" />
      </button>
      <Link
        href="/notifications"
        aria-label={
          badges.notifications ? `Notifications, ${badges.notifications} unread` : "Notifications"
        }
        className={iconButton}
      >
        <Bell className="size-5" />
        {badges.notifications > 0 && (
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-badge ring-2 ring-surface" />
        )}
      </Link>
      <div className="pr-1 pl-1">
        <AccountMenu />
      </div>
      <MenuSheet open={menu} onOpenChange={setMenu} />
    </header>
  );
}
