"use client";

import { motion } from "motion/react";
import { Plus, ShoppingBag } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { useMode, type Mode } from "@/components/shell/mode";
import { centerOf } from "@/components/shell/mode-curtain";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useMyBrand } from "@/queries/studio";
import { useNavBadges } from "./nav-badges";
import { useSwitchWorkspace } from "./workspace";

/** Market ⇄ your shop, as a segmented glass control with a sliding thumb. */
export function WorkspaceSwitch({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const mode = useMode();
  const { data: brand } = useMyBrand();
  const badges = useNavBadges();
  const go = useSwitchWorkspace();
  const options: { value: Mode; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      value: "buying",
      label: "Market",
      icon: (
        <span className="grid size-6 place-items-center rounded-lg bg-[linear-gradient(140deg,var(--chart-blue),var(--chart-violet))] text-white shadow-sm">
          <ShoppingBag className="size-3.5" />
        </span>
      ),
    },
    {
      value: "selling",
      label: brand ? brand.name : "Open a shop",
      icon: brand ? (
        <span className="block size-6 overflow-hidden rounded-lg shadow-sm">
          <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
        </span>
      ) : (
        <span className="grid size-6 place-items-center rounded-lg border border-dashed border-line-strong text-muted">
          <Plus className="size-3.5" />
        </span>
      ),
      count: badges.newOrders,
    },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Workspace"
      className={cn(
        "flex items-center gap-0.5 rounded-xl bg-ink/[0.04] p-1 ring-1 ring-line/70",
        className,
      )}
    >
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <motion.button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={(e) =>
              // Keyboard clicks have no pointer position; grow from the button instead.
              go(
                o.value,
                e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : centerOf(e.currentTarget),
              )
            }
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex h-9 min-w-0 items-center gap-2 rounded-[10px] px-2 text-[13px] font-semibold transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="workspace-thumb"
                transition={spring.snappy}
                className="absolute inset-0 rounded-[10px] bg-surface shadow-sm ring-1 ring-line"
                aria-hidden
              />
            )}
            <span className="relative">{o.icon}</span>
            {!compact && <span className="relative max-w-28 truncate">{o.label}</span>}
            {!!o.count && (
              <span className="relative grid h-4 min-w-4 place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white">
                {o.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
