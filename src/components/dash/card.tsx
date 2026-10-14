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
import { useEffect, useId, useRef, type ReactNode } from "react";
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

/** Glass card with a header and an optional "…" menu. Fades up when scrolled into view. */
export function DashCard({
  title,
  icon,
  tone = "var(--chart-blue)",
  aside,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  /** Small coloured icon next to the title. */
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
    <section className={cn("card flex min-w-0 lift flex-col overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex items-center gap-3 px-5 pt-5 md:px-6 md:pt-6">
          {icon && (
            <span
              className="grid size-9 shrink-0 place-items-center rounded-xl tone-tile [&_svg]:size-[18px]"
              style={{ ["--tone" as string]: tone }}
            >
              {icon}
            </span>
          )}
          {title && (
            <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold tracking-[-0.01em] md:text-[18px]">
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

/** Tiny area chart for a stat card. */
export function Sparkline({ data, tone }: { data: number[]; tone: string }) {
  const id = useId().replace(/:/g, "");
  if (data.length < 2 || data.every((d) => d === 0)) {
    return (
      <span
        className="block h-9 w-full rounded-lg bg-[repeating-linear-gradient(90deg,var(--line)_0_6px,transparent_6px_10px)] opacity-60"
        aria-hidden
      />
    );
  }
  const max = Math.max(...data);
  const W = 120;
  const H = 36;
  const pts = data.map(
    (d, i) => [(i / (data.length - 1)) * W, H - 3 - (d / max) * (H - 8)] as const,
  );
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block h-9 w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={tone} stopOpacity="0.32" />
          <stop offset="1" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${line} L${W},${H} L0,${H} Z`}
        fill={`url(#${id}-g)`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={tone}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Headline number card: coloured icon, change badge, count-up value and a sparkline. */
export function StatCard({
  label,
  value,
  format,
  change,
  compare,
  icon,
  tone = "var(--chart-blue)",
  spark,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  change: number | null;
  compare: string;
  icon?: ReactNode;
  tone?: string;
  spark?: number[];
}) {
  return (
    <section className="card flex min-w-0 lift flex-col gap-3 p-4 md:p-5">
      <div className="flex items-start gap-2.5">
        {icon && (
          <span
            className="hidden size-9 shrink-0 place-items-center rounded-xl tone-tile sm:grid [&_svg]:size-[18px]"
            style={{ ["--tone" as string]: tone }}
          >
            {icon}
          </span>
        )}
        <h2 className="min-w-0 flex-1 pt-1 text-[13px] leading-tight font-medium break-words text-ink-2 sm:pt-1.5">
          {label}
        </h2>
        <DeltaBadge change={change} />
      </div>
      <p className="truncate text-[19px] leading-none font-bold tracking-[-0.03em] sm:text-[22px] md:text-[26px]">
        <CountUp value={value} format={format} />
      </p>
      {spark && <Sparkline data={spark} tone={tone} />}
      <p className="text-[11.5px] text-muted">{compare}</p>
    </section>
  );
}
