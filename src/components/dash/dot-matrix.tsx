"use client";

import { motion } from "motion/react";
import type { WeekdayCount } from "@/domain/analytics";
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
