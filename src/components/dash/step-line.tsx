"use client";

import { motion } from "motion/react";
import { useId } from "react";
import type { RatePoint } from "@/domain/analytics";

/**
 * Step line with a vertically hatched fill and a labelled peak (image 3, "Retention").
 * Gaps (no orders in a bucket) draw at zero.
 */
export function StepLine({ points, height = 150 }: { points: RatePoint[]; height?: number }) {
  const id = useId().replace(/:/g, "");
  const W = 300;
  const H = 100;
  const n = Math.max(points.length, 1);
  const step = W / n;
  const y = (r: number | null) => H - 8 - ((r ?? 0) / 100) * (H - 26);
  let d = `M0,${y(points[0]?.rate ?? 0)}`;
  points.forEach((p, i) => {
    const yy = y(p.rate);
    d += ` L${i * step},${yy} L${(i + 1) * step},${yy}`;
  });
  const area = `${d} L${W},${H} L0,${H} Z`;
  const peakIdx = points.reduce(
    (best, p, i) => ((p.rate ?? -1) > (points[best]?.rate ?? -1) ? i : best),
    0,
  );
  const peak = points[peakIdx];
  const px = (peakIdx + 0.5) * step;
  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        aria-hidden
      >
        <defs>
          <pattern id={`${id}-v`} width="5" height="4" patternUnits="userSpaceOnUse">
            <rect width="1.4" height="4" fill="var(--chart-pink)" opacity="0.28" />
          </pattern>
          <clipPath id={`${id}-clip`}>
            <motion.rect
              initial={{ width: 0 }}
              animate={{ width: W }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              height={H + 10}
              y={-10}
            />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <path d={area} fill={`url(#${id}-v)`} />
          <path
            d={d}
            fill="none"
            stroke="var(--chart-pink)"
            strokeWidth="2.4"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </g>
      </svg>
      {peak && peak.rate !== null && (
        <>
          <span
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-pink ring-4 ring-chart-pink/20"
            style={{ left: `${(px / W) * 100}%`, top: `${(y(peak.rate) / H) * 100}%` }}
            aria-hidden
          />
          <span
            className="absolute -translate-x-1/2 rounded-full bg-surface px-2.5 py-1 text-[12px] font-semibold tabular shadow-md ring-1 ring-line"
            style={{
              left: `${Math.min(88, Math.max(12, (px / W) * 100))}%`,
              top: `calc(${(y(peak.rate) / H) * 100}% - 38px)`,
            }}
          >
            {Math.round(peak.rate)}%
          </span>
        </>
      )}
    </div>
  );
}
