"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Plus, ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { AppImage } from "@/components/ui/app-image";
import { Tooltip } from "@/components/ui/overlay";
import { useMode } from "@/components/shell/mode";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useMyBrand } from "@/queries/studio";
import { AccountMenu } from "./account-menu";
import { KioskMark } from "./kiosk-mark";
import { useNavBadges } from "./nav-badges";
import { useSwitchWorkspace } from "./workspace";

function CountDot({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-badge px-1 text-[10px] font-semibold text-white tabular ring-2 ring-canvas">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function RailTile({
  label,
  active,
  onClick,
  href,
  children,
  count = 0,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
  count?: number;
}) {
  const tile = (
    <span
      className={cn(
        "relative grid size-12 place-items-center rounded-2xl transition-[box-shadow,transform] duration-200",
        active
          ? "shadow-md ring-2 ring-ink ring-offset-2 ring-offset-canvas"
          : "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {children}
      <CountDot count={count} />
    </span>
  );
  const inner = (
    <>
      {active && (
        <motion.span
          layoutId="rail-indicator"
          transition={spring.snappy}
          className="absolute top-1/2 -left-3 h-8 w-1 -translate-y-1/2 rounded-r-full bg-ink"
          aria-hidden
        />
      )}
      {tile}
    </>
  );
  return (
    <Tooltip content={count ? `${label} · ${count} new` : label} side="right">
      {href ? (
        <Link href={href} aria-label={label} className="relative rounded-2xl">
          {inner}
        </Link>
      ) : (
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className="relative rounded-2xl"
        >
          {inner}
        </button>
      )}
    </Tooltip>
  );
}

/** Left-most column: switch between the market and your shop (image 2's app rail). */
export function Rail() {
  const mode = useMode();
  const { data: brand } = useMyBrand();
  const badges = useNavBadges();
  const go = useSwitchWorkspace();
  return (
    <nav
      aria-label="Workspaces"
      className="sticky top-0 hidden h-dvh w-(--rail-w) shrink-0 flex-col items-center gap-4 py-4 lg:flex"
    >
      <Link
        href="/home"
        aria-label="Kiosk home"
        className="grid size-12 place-items-center rounded-2xl bg-primary text-on-primary shadow-md"
      >
        <KioskMark />
      </Link>
      <span className="h-px w-8 bg-line-strong" aria-hidden />
      <RailTile label="Market" active={mode === "buying"} onClick={() => go("buying")}>
        <span className="grid size-full place-items-center rounded-2xl bg-[linear-gradient(140deg,var(--chart-blue),var(--chart-violet))] text-white">
          <ShoppingBag className="size-5" />
        </span>
      </RailTile>
      {brand ? (
        <RailTile
          label={brand.name}
          active={mode === "selling"}
          onClick={() => go("selling")}
          count={badges.newOrders}
        >
          <span className="size-full overflow-hidden rounded-2xl">
            <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
          </span>
        </RailTile>
      ) : (
        <RailTile label="Open a shop" href="/open-shop">
          <span className="grid size-full place-items-center rounded-2xl border-2 border-dashed border-line-strong text-muted transition-colors hover:border-ink hover:text-ink">
            <Plus className="size-5" />
          </span>
        </RailTile>
      )}
      <div className="mt-auto">
        <AccountMenu side="right" />
      </div>
    </nav>
  );
}
