"use client";

import { motion } from "motion/react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";

const chipBase =
  "relative inline-flex h-10 shrink-0 select-none items-center gap-1.5 rounded-full px-4 text-small font-medium " +
  "transition-[color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type ChipProps = {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  count?: number;
  disabled?: boolean;
};

/** Stand-alone toggle chip (multi-select filters). */
export function Chip({ selected, onClick, children, icon, className, count, disabled }: ChipProps) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={spring.snappy}
      className={cn(
        chipBase,
        selected
          ? "bg-primary text-on-primary"
          : "bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--line-strong)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--ink)]",
        disabled && "opacity-45",
        className,
      )}
    >
      {icon}
      {children}
      {typeof count === "number" && (
        <span className={cn("font-mono text-label", selected ? "opacity-70" : "text-muted")}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

type ChipGroupCtx = { value: string; onChange: (v: string) => void; layoutId: string };
const ChipGroupContext = createContext<ChipGroupCtx | null>(null);

/** Single-select chip rail with a sliding pill indicator (radio semantics). */
export function ChipGroup({
  value,
  onChange,
  label,
  children,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const layoutId = useId();
  return (
    <ChipGroupContext.Provider value={{ value, onChange, layoutId }}>
      <div role="radiogroup" aria-label={label} className={cn("flex items-center gap-2", className)}>
        {children}
      </div>
    </ChipGroupContext.Provider>
  );
}

export function ChipOption({
  value,
  children,
  icon,
  className,
}: {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const ctx = useContext(ChipGroupContext);
  if (!ctx) throw new Error("ChipOption must be used inside ChipGroup");
  const selected = ctx.value === value;
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={() => ctx.onChange(value)}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const group = e.currentTarget.parentElement;
        const radios = group
          ? Array.from(group.querySelectorAll<HTMLButtonElement>('[role="radio"]'))
          : [];
        const i = radios.indexOf(e.currentTarget);
        const next = radios[(i + (e.key === "ArrowRight" ? 1 : -1) + radios.length) % radios.length];
        next?.focus();
        next?.click();
      }}
      whileTap={{ scale: 0.95 }}
      transition={spring.snappy}
      className={cn(
        chipBase,
        selected
          ? "text-on-primary"
          : "text-ink-2 shadow-[inset_0_0_0_1px_var(--line)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--line-strong)]",
        className,
      )}
    >
      {selected && (
        <motion.span
          layoutId={ctx.layoutId}
          className="absolute inset-0 rounded-full bg-primary"
          transition={spring.snappy}
          aria-hidden
        />
      )}
      <span className="relative inline-flex items-center gap-1.5">
        {icon}
        {children}
      </span>
    </motion.button>
  );
}
