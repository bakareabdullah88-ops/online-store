"use client";

import { Tabs as RTabs } from "radix-ui";
import { motion } from "motion/react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";

type Ctx = { value: string; layoutId: string; variant: "underline" | "pill" };
const TabsCtx = createContext<Ctx | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
  variant = "underline",
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: ReactNode;
  className?: string;
  variant?: "underline" | "pill";
}) {
  const layoutId = useId();
  return (
    <TabsCtx.Provider value={{ value, layoutId, variant }}>
      <RTabs.Root value={value} onValueChange={onValueChange} className={className}>
        {children}
      </RTabs.Root>
    </TabsCtx.Provider>
  );
}

export function TabsList({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const ctx = useContext(TabsCtx);
  return (
    <RTabs.List
      aria-label={label}
      className={cn(
        "scrollbar-none flex items-center overflow-x-auto",
        ctx?.variant === "pill"
          ? "inline-flex gap-1 rounded-md bg-ink/[0.05] p-1 dark:bg-ink/[0.08]"
          : "gap-6 shadow-[inset_0_-1px_0_var(--line)]",
        className,
      )}
    >
      {children}
    </RTabs.List>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  count,
}: {
  value: string;
  children: ReactNode;
  className?: string;
  count?: number;
}) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("TabsTrigger must be inside Tabs");
  const active = ctx.value === value;
  const pill = ctx.variant === "pill";
  return (
    <RTabs.Trigger
      value={value}
      className={cn(
        "relative inline-flex shrink-0 items-center gap-1.5 text-small font-medium transition-colors duration-150",
        pill ? "h-9 rounded-sm px-3.5" : "h-12 px-0.5",
        active ? "text-ink" : "text-muted hover:text-ink",
        className,
      )}
    >
      {active &&
        (pill ? (
          <motion.span
            layoutId={ctx.layoutId}
            className="absolute inset-0 rounded-sm bg-surface shadow-sm"
            transition={spring.snappy}
            aria-hidden
          />
        ) : (
          <motion.span
            layoutId={ctx.layoutId}
            className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink"
            transition={spring.snappy}
            aria-hidden
          />
        ))}
      <span className="relative">{children}</span>
      {typeof count === "number" && (
        <span className="relative font-mono text-label text-muted">{count}</span>
      )}
    </RTabs.Trigger>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RTabs.Content value={value} className={cn("focus-visible:outline-none", className)}>
      {children}
    </RTabs.Content>
  );
}

/** Segmented control: a compact single-choice switch with a sliding pill. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: ReactNode; icon?: ReactNode }[];
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md bg-ink/[0.05] p-1 dark:bg-ink/[0.08]",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              e.preventDefault();
              const i = options.findIndex((x) => x.value === value);
              const next =
                options[(i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length];
              if (next) onChange(next.value);
              const btns =
                e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button");
              const idx = next ? options.indexOf(next) : -1;
              btns?.[idx]?.focus();
            }}
            className={cn(
              "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm font-medium whitespace-nowrap transition-colors duration-150",
              size === "sm" ? "h-8 px-2.5 text-small" : "h-9 px-3.5 text-small",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-sm bg-surface shadow-sm"
                transition={spring.snappy}
                aria-hidden
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
