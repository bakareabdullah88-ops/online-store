"use client";

import { AnimatePresence, motion } from "motion/react";
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
  tight = false,
  className,
}: {
  compact?: boolean;
  /** Small phones: icons only, so the header icons keep a full tap size. */
  tight?: boolean;
  className?: string;
}) {
  const mode = useMode();
  const { data: brand } = useMyBrand();
  const badges = useNavBadges();
  const go = useSwitchWorkspace();
  const options: {
    value: Mode;
    /** What the side is for, always shown in words. */
    label: string;
    /** Longer description for screen readers and the hover tooltip. */
    title: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      value: "buying",
      label: "Buying",
      title: "Buying: the market",
      icon: (
        <span className="grid size-6 place-items-center rounded-lg bg-brand text-white">
          <ShoppingBag className="size-3.5" />
        </span>
      ),
    },
    {
      value: "selling",
      label: "Selling",
      title: brand ? `Selling: ${brand.name}` : "Selling: open a shop",
      icon: brand ? (
        <span className="block size-6 overflow-hidden rounded-lg">
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
            aria-label={o.title}
            title={o.title}
            onClick={(e) =>
              // Keyboard clicks have no pointer position; grow from the button instead.
              go(
                o.value,
                e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : centerOf(e.currentTarget),
              )
            }
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex h-9 min-w-0 shrink-0 items-center gap-2 rounded-lg px-2 text-[13px] font-semibold transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId="workspace-thumb"
                transition={spring.snappy}
                className="absolute inset-0 rounded-lg bg-surface ring-1 ring-line"
                aria-hidden
              />
            )}
            <span className="relative">{o.icon}</span>
            {/* Compact (phones, narrow headers): only the active side shows its word. */}
            <AnimatePresence initial={false}>
              {(!compact || active) && (
                <motion.span
                  key="label"
                  className={cn(
                    "relative overflow-hidden whitespace-nowrap",
                    tight && "max-[419px]:hidden",
                  )}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={spring.snappy}
                >
                  {o.label}
                </motion.span>
              )}
            </AnimatePresence>
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
