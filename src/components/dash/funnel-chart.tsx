"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import type { FunnelStep } from "@/domain/analytics";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { formatCompact } from "@/lib/format";

function niceMax(n: number) {
  if (n <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(n));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s * 4 >= n) ?? pow * 10;
  return step * 4;
}

/** Index with the biggest loss: the most useful step to show first. */
function worstStep(steps: FunnelStep[]) {
  let best = steps.length > 2 ? 2 : 0;
  let worst = 0;
  steps.forEach((s, i) => {
    if (s.dropOff !== null && s.dropOff < worst && steps[i - 1]!.value > 0) {
      worst = s.dropOff;
      best = i;
    }
  });
  return best;
}

/**
 * Funnel with hatched steps, a solid highlighted step, slanted joins and a
 * marker for the previous period (image 3, "Payments").
 */
export function FunnelChart({
  steps,
  unit,
  height = 230,
}: {
  steps: FunnelStep[];
  /** Noun for the tooltip, e.g. "views". Defaults to the step label. */
  unit?: (step: FunnelStep) => string;
  height?: number;
}) {
  const [active, setActive] = useState(() => worstStep(steps));
  const gid = useId().replace(/:/g, "");
  const max = niceMax(Math.max(1, ...steps.map((s) => Math.max(s.value, s.prev))));
  const pct = (v: number) => (v / max) * 100;
  const ticks = [1, 0.75, 0.5, 0.25].map((f) => max * f);
  const empty = steps.every((s) => s.value === 0 && s.prev === 0);
  const a = steps[active];

  return (
    <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
      <div className="relative flex min-w-[600px]">
        {/* y axis */}
        <div className="relative w-11 shrink-0" style={{ height, marginTop: 76 }} aria-hidden>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute left-0 -translate-y-1/2 text-[11.5px] text-muted tabular"
              style={{ top: `${100 - (t / max) * 100}%` }}
            >
              {formatCompact(t)}
            </span>
          ))}
        </div>
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
        >
          {steps.map((s, i) => {
            const on = i === active;
            const next = steps[i + 1];
            const h = pct(s.value);
            const hn = next ? pct(next.value) : h;
            return (
              <button
                key={s.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-pressed={on}
                aria-label={`${s.label}: ${s.value}${s.conversion !== null ? `, ${Math.round(s.conversion)}% of the step before` : ""}`}
                className="group relative flex flex-col border-l border-line-thin text-left outline-none first:border-l-0 focus-visible:bg-accent-soft/40"
              >
                {on && (
                  <motion.span
                    layoutId={`${gid}-glow`}
                    transition={spring.smooth}
                    className="absolute inset-0 bg-accent-soft/40"
                    aria-hidden
                  />
                )}
                <span className="relative h-[76px] px-4 pt-0.5">
                  <span
                    className={cn(
                      "block truncate text-[12.5px] transition-colors",
                      on ? "text-ink" : "text-muted",
                    )}
                  >
                    {s.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block text-[26px] leading-tight font-medium tracking-[-0.02em] tabular transition-colors md:text-[30px]",
                      on ? "text-ink" : "text-faint",
                    )}
                  >
                    {formatCompact(s.value)}
                  </span>
                </span>
                <span className="relative block w-full" style={{ height }}>
                  {/* previous period marker */}
                  {s.prev > 0 && (
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...spring.smooth, delay: 0.25 + i * 0.05 }}
                      className="absolute left-[calc((100%-26px)/2)] h-1.5 w-9 -translate-x-1/2 rounded-full bg-accent/60"
                      style={{ bottom: `calc(${pct(s.prev)}% + 10px)` }}
                      title={`Previous period: ${s.prev}`}
                      aria-hidden
                    />
                  )}
                  {/* bar */}
                  <motion.span
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ ...spring.smooth, delay: i * 0.05 }}
                    className={cn(
                      "absolute bottom-0 left-0 origin-bottom transition-[background] duration-300",
                      next ? "right-[26px]" : "right-0",
                      on ? "bg-accent" : "hatch [--hatch:var(--accent)]",
                    )}
                    style={{ height: `${Math.max(h, s.value > 0 ? 1.5 : 0)}%` }}
                    aria-hidden
                  />
                  {/* slanted join to the next step */}
                  {next && (
                    <svg
                      className="absolute right-0 bottom-0 h-full w-[26px]"
                      viewBox="0 0 26 100"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <defs>
                        <linearGradient id={`${gid}-ramp-${i}`} x1="0" x2="1" y1="0" y2="0">
                          <stop
                            offset="0"
                            stopColor="var(--accent)"
                            stopOpacity={on ? 0.55 : 0.28}
                          />
                          <stop offset="1" stopColor="var(--accent)" stopOpacity={0.12} />
                        </linearGradient>
                      </defs>
                      <motion.polygon
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        points={`0,${100 - h} 26,${100 - hn} 26,100 0,100`}
                        fill={`url(#${gid}-ramp-${i})`}
                      />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        {/* tooltip */}
        <AnimatePresence mode="wait">
          {a && !empty && (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.18 }}
              className="pointer-events-none absolute z-10 rounded-full glass px-4 py-2 text-[12.5px] whitespace-nowrap text-muted shadow-lg ring-1 ring-line"
              style={{
                bottom: (Math.min(pct(a.value), 78) / 100) * height + 18,
                ...(active < steps.length - 2
                  ? { left: `calc(44px + (100% - 44px) * ${active / steps.length} + 24px)` }
                  : {
                      right: `calc((100% - 44px) * ${(steps.length - active - 1) / steps.length} + 12px)`,
                    }),
              }}
              role="status"
            >
              <b className="font-semibold text-ink tabular">{formatCompact(a.value)}</b>{" "}
              {unit ? unit(a) : a.label.toLowerCase()}
              {a.conversion !== null && (
                <>
                  <span className="mx-1.5 text-line-strong">|</span>Conversion:{" "}
                  <b className="font-semibold text-ink tabular">{Math.round(a.conversion)}%</b>
                  <span className="mx-1.5 text-line-strong">|</span>Drop-off:{" "}
                  <b className="font-semibold text-ink tabular">{Math.round(a.dropOff ?? 0)}%</b>
                </>
              )}
              {a.conversion === null && (
                <>
                  <span className="mx-1.5 text-line-strong">|</span>Before:{" "}
                  <b className="font-semibold text-ink tabular">{formatCompact(a.prev)}</b>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
