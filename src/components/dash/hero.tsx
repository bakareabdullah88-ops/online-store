"use client";

import { useId, type ReactNode } from "react";
import { formatNaira } from "@/domain/money";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { CountUp, DeltaBadge } from "./card";

type Point = { date: string; amountKobo: number };

/** A quiet area chart of money per day. No axes: the figure above carries the number. */
function AreaChart({ points }: { points: Point[] }) {
  const id = useId();
  const w = 600;
  const h = 140;
  const max = Math.max(1, ...points.map((p) => p.amountKobo));
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const xy = points.map((p, i) => [i * step, h - 8 - (p.amountKobo / max) * (h - 20)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const empty = points.every((p) => p.amountKobo === 0);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-28 w-full md:h-36"
      role="img"
      aria-label={
        empty
          ? "No sales in this range yet"
          : `Daily totals from ${formatDate(points[0]!.date)} to ${formatDate(points.at(-1)!.date)}`
      }
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        opacity={empty ? 0.35 : 1}
      />
    </svg>
  );
}

/**
 * The one number a dashboard is about (revenue for a shop, spending for a
 * buyer), with how it moved and a few supporting figures underneath.
 */
export function HeroFigure({
  label,
  valueKobo,
  change,
  compare,
  stats,
  points,
  footer,
  className,
}: {
  label: string;
  valueKobo: number;
  change: number | null;
  compare: string;
  stats: { label: string; value: ReactNode }[];
  points: Point[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-end md:p-7">
        <div>
          <p className="text-small font-medium text-muted">{label}</p>
          <p className="mt-2 text-[44px] leading-none font-semibold tracking-[-0.04em] tabular md:text-[56px]">
            <CountUp value={valueKobo} format={(n) => formatNaira(Math.round(n))} />
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-small text-muted">
            <DeltaBadge change={change} />
            {compare}
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="truncate text-[12.5px] text-muted">{s.label}</dt>
                <dd className="mt-1 text-[18px] font-semibold tracking-[-0.02em] tabular">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="-mx-1">
          <AreaChart points={points} />
        </div>
      </div>
      {footer && <div className="border-t border-line px-5 py-3 md:px-7">{footer}</div>}
    </section>
  );
}
