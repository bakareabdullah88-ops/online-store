"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/overlay";
import { cn } from "@/lib/cn";

export type CardAction = { label: string; href?: string; onSelect?: () => void; icon?: ReactNode };

/** The round "…" button on dashboard cards, with real actions. */
export function CardMenu({ actions, label }: { actions: CardAction[]; label: string }) {
  const router = useRouter();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label} options`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink-2 ring-1 ring-line transition-colors hover:text-ink hover:ring-line-strong"
        >
          <MoreHorizontal className="size-[18px]" />
        </button>
      </MenuTrigger>
      <MenuContent>
        {actions.map((a) => (
          <MenuItem
            key={a.label}
            icon={a.icon}
            onSelect={() => (a.href ? router.push(a.href) : a.onSelect?.())}
          >
            {a.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

/** Card with a title and an optional "…" menu. */
export function DashCard({
  title,
  aside,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  /** Accepted for older call sites; titles no longer carry icons. */
  icon?: ReactNode;
  tone?: string;
  aside?: ReactNode;
  actions?: CardAction[];
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const label = typeof title === "string" ? title : "Card";
  return (
    <section className={cn("card flex min-w-0 flex-col overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex items-center gap-3 px-5 pt-5 md:px-6 md:pt-6">
          {title && (
            <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.01em] md:text-[16px]">
              {title}
            </h2>
          )}
          {aside}
          {actions && actions.length > 0 && <CardMenu actions={actions} label={label} />}
        </header>
      )}
      <div
        className={cn("flex min-h-0 flex-1 flex-col px-5 pt-4 pb-5 md:px-6 md:pb-6", bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}

/** Small "+12%" / "−8%" pill. */
export function DeltaBadge({ change, className }: { change: number | null; className?: string }) {
  if (change === null)
    return (
      <span
        className={cn(
          "rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent",
          className,
        )}
      >
        New
      </span>
    );
  const up = change >= 0;
  const text = `${up ? "+" : "−"}${Math.abs(change) >= 100 ? Math.round(Math.abs(change)) : Math.abs(change).toFixed(Math.abs(change) < 10 ? 1 : 0)}%`;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular",
        change === 0
          ? "bg-ink/[0.06] text-ink-2"
          : up
            ? "bg-success-soft text-success"
            : "bg-danger-soft text-danger",
        className,
      )}
    >
      {change === 0 ? "0%" : text}
    </span>
  );
}

/** Counts up from zero the first time it scrolls into view. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      mv.set(value);
      return;
    }
    const c = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => c.stop();
  }, [inView, value, mv, reduce]);
  return (
    <span ref={ref}>
      <motion.span className="tabular" aria-hidden>
        {text}
      </motion.span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
