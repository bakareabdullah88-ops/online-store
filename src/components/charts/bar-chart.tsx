"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";

export type BarDatum = { label: string; value: number; sublabel?: string };

/**
 * Hand-built bar chart. One highlighted bar (the latest or the hovered one),
 * a tooltip, keyboard focusable bars and an accessible data table fallback.
 */
export function BarChart({
  data,
  format,
  height = 180,
  highlight,
  className,
  label,
  compact = false,
}: {
  data: BarDatum[];
  format: (n: number) => string;
  height?: number;
  highlight?: number;
  className?: string;
  label: string;
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...data.map((d) => d.value));
  const [active, setActive] = useState<number | null>(null);
  const focus = active ?? highlight ?? data.length - 1;
  const id = useId();
  const showEvery = data.length > 16 ? Math.ceil(data.length / 8) : 1;

  return (
    <figure className={cn("relative", className)}>
      <div className="relative flex items-stretch gap-[3%]" style={{ height }} onMouseLeave={() => setActive(null)} role="list" aria-label={label}>
        {/* grid lines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-px w-full bg-line" style={{ opacity: i === 3 ? 1 : 0.6 }} />
          ))}
        </div>
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          const on = i === focus;
          return (
            <div
              key={`${d.label}-${i}`}
              role="listitem"
              tabIndex={0}
              aria-label={`${d.label}: ${format(d.value)}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="group relative flex flex-1 cursor-default items-end outline-none"
            >
              <motion.div
                className={cn("w-full rounded-t-[3px] transition-colors duration-200", on ? "bg-accent" : "bg-ink/[0.1] group-hover:bg-ink/[0.18] dark:bg-ink/[0.14]")}
                initial={reduce ? false : { scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ ...spring.gentle, delay: reduce ? 0 : Math.min(i * 0.02, 0.4) }}
                style={{ height: `${Math.max(h, d.value > 0 ? 2 : 0.5)}%`, transformOrigin: "bottom" }}
              />
              {on && !compact && (
                <motion.div
                  layoutId={`${id}-tip`}
                  transition={spring.snappy}
                  className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 rounded-sm bg-primary px-2.5 py-1.5 text-center whitespace-nowrap text-on-primary shadow-md"
                  style={{ bottom: `calc(${Math.max(h, 2)}% + 8px)` }}
                >
                  <span className="block font-mono text-small font-medium tabular">{format(d.value)}</span>
                  <span className="block text-[11px] opacity-70">{d.sublabel ?? d.label}</span>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-2 flex gap-[3%]" aria-hidden>
          {data.map((d, i) => (
            <span key={i} className={cn("flex-1 truncate text-center font-mono text-[10px] text-muted", i % showEvery !== 0 && "invisible")}>
              {d.label}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}

/** Tiny line sparkline for KPI tiles. */
export function Sparkline({ values, className, positive = true }: { values: number[]; className?: string; positive?: boolean }) {
  const reduce = useReducedMotion();
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 28 - ((v - min) / span) * 24 - 2] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1]!;
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full overflow-visible", className)} aria-hidden>
      <motion.path
        d={d}
        fill="none"
        stroke={positive ? "var(--accent)" : "var(--muted)"}
        strokeWidth="1.6"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={positive ? "var(--accent)" : "var(--muted)"} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
