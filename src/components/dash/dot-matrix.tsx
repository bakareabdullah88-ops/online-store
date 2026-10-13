"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { DailyPoint, WeekdayCount } from "@/domain/analytics";
import { cn } from "@/lib/cn";

/** Weekday columns of paired dots with the busiest day called out (image 3, "Transactions"). */
export function WeekdayDots({ days, peak }: { days: WeekdayCount[]; peak: number | null }) {
  const ROWS = 5;
  const max = Math.max(1, ...days.map((d) => d.orders));
  // Monday first.
  const ordered = [...days.slice(1), days[0]!];
  return (
    <div className="relative flex items-end justify-between gap-1.5 pt-10">
      {ordered.map((d, col) => {
        const filled = d.orders === 0 ? 0 : Math.max(1, Math.round((d.orders / max) * ROWS * 2));
        const isPeak = d.day === peak;
        return (
          <div
            key={d.day}
            className="relative flex flex-col items-center gap-1.5"
            title={`${d.label}: ${d.orders}`}
          >
            {isPeak && (
              <span className="absolute -top-9 rounded-full bg-surface px-2.5 py-1 text-[12px] whitespace-nowrap text-muted shadow-md ring-1 ring-line">
                Peak: <b className="font-semibold text-ink">{d.label}</b>
              </span>
            )}
            <div className="grid grid-cols-2 gap-[3px]">
              {Array.from({ length: ROWS * 2 }, (_, k) => {
                const row = ROWS - 1 - Math.floor(k / 2);
                const index = row * 2 + (k % 2);
                const on = index < filled;
                return (
                  <motion.span
                    key={k}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: col * 0.04 + row * 0.03,
                      type: "spring",
                      stiffness: 500,
                      damping: 22,
                    }}
                    className={cn(
                      "size-[9px] rounded-full md:size-[10px]",
                      on
                        ? isPeak
                          ? "bg-chart-green"
                          : "bg-chart-mint"
                        : row === 0
                          ? "bg-chart-mint/45"
                          : "bg-transparent",
                    )}
                  />
                );
              })}
            </div>
            <span className="text-[10.5px] text-muted">{d.label.slice(0, 2)}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Group days into at most `max` columns (weeks for long ranges). */
function columns(points: DailyPoint[], max = 31) {
  if (points.length <= max) return points.map((p) => ({ ...p, span: 1 }));
  const size = Math.ceil(points.length / max);
  const out: (DailyPoint & { span: number })[] = [];
  for (let i = 0; i < points.length; i += size) {
    const chunk = points.slice(i, i + size);
    out.push({
      date: chunk[0]!.date,
      amountKobo: chunk.reduce((n, c) => n + c.amountKobo, 0),
      orders: chunk.reduce((n, c) => n + c.orders, 0),
      span: chunk.length,
    });
  }
  return out;
}

const dayFmt = new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric" });
const parse = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};

/**
 * Column-of-dots daily chart with a highlighted column and value tag (video:
 * "Revenue Analytics"). Hover or focus a column to inspect it.
 */
export function DailyDots({
  points,
  format,
  metric = "amountKobo",
  rows = 10,
}: {
  points: DailyPoint[];
  format: (v: number) => string;
  metric?: "amountKobo" | "orders";
  rows?: number;
}) {
  const cols = columns(points);
  const max = Math.max(1, ...cols.map((c) => c[metric]));
  const best = cols.reduce(
    (b, c, i) => (c[metric] > (cols[b]?.[metric] ?? 0) ? i : b),
    cols.length - 1,
  );
  const [active, setActive] = useState<number | null>(null);
  const hi = active ?? best;
  const sel = cols[hi];
  const labelEvery = Math.ceil(cols.length / 7);
  return (
    <div className="relative">
      <div
        className="flex items-end gap-[3px] md:gap-1"
        style={{ height: rows * 13 + 30 }}
        onMouseLeave={() => setActive(null)}
      >
        {cols.map((c, i) => {
          const filled = c[metric] === 0 ? 0 : Math.max(1, Math.round((c[metric] / max) * rows));
          const on = i === hi;
          return (
            <button
              key={c.date}
              type="button"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              aria-label={`${dayFmt.format(parse(c.date))}${c.span > 1 ? ` (${c.span} days)` : ""}: ${format(c[metric])}`}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-[3px] outline-none focus-visible:rounded-md focus-visible:bg-accent-soft"
            >
              {Array.from({ length: rows }, (_, r) => {
                const row = rows - 1 - r;
                const lit = row < filled;
                return (
                  <motion.span
                    key={r}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.012 + row * 0.02, 0.6), duration: 0.25 }}
                    className={cn(
                      "aspect-square w-full max-w-[10px] rounded-full transition-colors duration-200",
                      lit
                        ? on
                          ? "bg-chart-violet"
                          : "bg-chart-mint"
                        : row === 0
                          ? "bg-chart-track"
                          : "bg-transparent",
                    )}
                  />
                );
              })}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] md:gap-1" aria-hidden>
        {cols.map((c, i) => (
          <span key={c.date} className="relative min-w-0 flex-1 text-center">
            {i === hi ? (
              <span className="absolute left-1/2 -translate-x-1/2 rounded-md bg-[color-mix(in_oklab,var(--chart-violet)_78%,black)] px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-white">
                {dayFmt.format(parse(c.date))}
              </span>
            ) : (
              i % labelEvery === 0 &&
              Math.abs(i - hi) > 2 && (
                <span className="absolute left-1/2 -translate-x-1/2 text-[10.5px] whitespace-nowrap text-muted">
                  {dayFmt.format(parse(c.date))}
                </span>
              )
            )}
            &nbsp;
          </span>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {sel && (
          <motion.span
            key={hi}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-0 right-0 rounded-lg bg-[color-mix(in_oklab,var(--chart-violet)_78%,black)] px-2 py-1 text-[12px] font-semibold text-white tabular shadow-md"
            role="status"
          >
            {format(sel[metric])}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
