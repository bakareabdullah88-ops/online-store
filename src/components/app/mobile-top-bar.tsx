"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Bell, Grid2X2, Search } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/sheet";
import { useMode } from "@/components/shell/mode";
import { cn } from "@/lib/cn";
import { useUi } from "@/stores/ui";
import { AccountMenu } from "./account-menu";
import { KioskMark } from "./kiosk-mark";
import { NavGrid } from "./more-menu";
import { useNavBadges } from "./nav-badges";
import { ModeLine } from "./mode-line";
import { WorkspaceSwitch } from "./workspace-switch";

const iconButton =
  "pressable relative grid size-10 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink";

/** Phone header: logo, everything-menu, search, notifications and account. */
export function MobileTopBar() {
  const mode = useMode();
  const badges = useNavBadges();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const [menu, setMenu] = useState(false);
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className="sticky top-0 z-(--z-header) border-b border-line bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur-md md:hidden"
    >
      <ModeLine />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-14 items-center gap-1 px-3"
      >
        <Link
          href={mode === "selling" ? "/studio" : "/home"}
          aria-label="Kiosk home"
          className="grid size-9 shrink-0 pressable place-items-center rounded-xl bg-primary text-on-primary"
        >
          <KioskMark className="size-5" />
        </Link>
        <WorkspaceSwitch compact className="ml-1" />
        <span className="flex-1" />
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
        <button
          type="button"
          aria-label="All pages"
          onClick={() => setMenu(true)}
          className={cn(iconButton)}
        >
          <Grid2X2 className="size-5" />
        </button>
        <AccountMenu />
      </motion.div>
      <BottomSheet
        open={menu}
        onOpenChange={setMenu}
        title="All pages"
        description="Everything in this workspace"
      >
        <div className="pb-4">
          <NavGrid onNavigate={() => setMenu(false)} />
        </div>
      </BottomSheet>
    </header>
  );
}
