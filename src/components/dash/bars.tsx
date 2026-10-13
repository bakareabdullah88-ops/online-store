"use client";

import { motion } from "motion/react";
import type { Part } from "@/domain/analytics";
import { formatNaira } from "@/domain/money";
import { spring } from "@/design/motion";

const COLORS = [
  "var(--chart-green)",
  "var(--chart-blue)",
  "var(--chart-pink)",
  "var(--chart-orange)",
];

/** Hatched horizontal bars with labels (image 3, "Gross Volume"). */
export function HatchedBars({ parts }: { parts: Part[] }) {
  const max = Math.max(1, ...parts.map((p) => p.valueKobo));
  return (
    <ul className="flex flex-col gap-5">
      {parts.map((p, i) => {
        const color = COLORS[i % COLORS.length]!;
        const w = (p.valueKobo / max) * 100;
        return (
          <li key={p.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[14.5px] text-ink-2">{p.label}</span>
              <span className="text-[13px] font-medium tabular">
                {formatNaira(Math.round(p.valueKobo))}
                <span className="ml-1.5 text-muted">{Math.round(p.share)}%</span>
              </span>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-chart-track">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(w, p.valueKobo > 0 ? 4 : 0)}%` }}
                transition={{ ...spring.smooth, delay: 0.1 + i * 0.08 }}
                className="h-full rounded-full hatch"
                style={{
                  ["--hatch" as string]: color,
                  backgroundColor: `color-mix(in oklab, ${color} 28%, transparent)`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
