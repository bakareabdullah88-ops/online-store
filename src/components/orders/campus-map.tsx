"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { spring } from "@/design/motion";
import { hashString, createRng } from "@/lib/random";

/**
 * Stylised campus map (pure SVG, no map API). Layout is generated from the
 * campus id so each campus has a consistent "shape". The rider marker moves
 * along the route by `progress` (0 → 1).
 */
export function CampusMap({
  campusKey,
  progress,
  mode,
  fromLabel,
  toLabel,
}: {
  campusKey: string;
  progress: number;
  mode: "delivery" | "pickup";
  fromLabel: string;
  toLabel: string;
}) {
  const reduce = useReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number; angle: number } | null>(null);

  const layout = useMemo(() => {
    const r = createRng(hashString(campusKey));
    const blocks = Array.from({ length: 16 }, () => ({
      x: r.int(10, 330),
      y: r.int(10, 190),
      w: r.int(24, 64),
      h: r.int(18, 44),
    }));
    const greens = Array.from({ length: 3 }, () => ({
      cx: r.int(40, 320),
      cy: r.int(30, 180),
      r: r.int(18, 34),
    }));
    const start = { x: r.int(40, 90), y: r.int(140, 180) };
    const end = { x: r.int(270, 330), y: r.int(30, 70) };
    const mid1 = { x: r.int(110, 170), y: start.y };
    const mid2 = { x: mid1.x, y: r.int(90, 120) };
    const mid3 = { x: end.x, y: mid2.y };
    const route = `M${start.x} ${start.y} L${mid1.x} ${mid1.y} Q${mid1.x + 0} ${mid2.y + 0} ${mid2.x + 18} ${mid2.y} L${mid3.x - 18} ${mid3.y} Q${mid3.x} ${mid3.y} ${mid3.x} ${mid3.y - 18} L${end.x} ${end.y}`;
    return { blocks, greens, start, end, route };
  }, [campusKey]);

  // Position the rider on the path. Measured in a layout effect, so the
  // marker never flashes at the wrong spot.
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    const at = Math.max(0, Math.min(1, progress)) * len;
    const p = path.getPointAtLength(at);
    const q = path.getPointAtLength(Math.min(len, at + 1));
    setPoint({ x: p.x, y: p.y, angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI });
  }, [progress, layout.route]);

  return (
    <figure className="relative overflow-hidden rounded-lg bg-[color-mix(in_oklab,var(--sand)_70%,var(--surface))]">
      <svg
        viewBox="0 0 360 210"
        className="block h-auto w-full"
        role="img"
        aria-label={`Map from ${fromLabel} to ${toLabel}`}
      >
        <defs>
          <pattern id="map-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0H0V18" fill="none" stroke="var(--line)" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="360" height="210" fill="url(#map-grid)" />
        {layout.greens.map((g, i) => (
          <circle
            key={i}
            cx={g.cx}
            cy={g.cy}
            r={g.r}
            fill="color-mix(in oklab, var(--success) 18%, transparent)"
          />
        ))}
        {/* roads */}
        <path
          d="M0 105 H360 M180 0 V210 M0 40 C120 60 240 20 360 50"
          stroke="var(--surface)"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
        />
        {layout.blocks.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx="3"
            fill="var(--surface)"
            stroke="var(--line)"
            strokeWidth="0.8"
          />
        ))}
        {/* route */}
        <path
          d={layout.route}
          fill="none"
          stroke="var(--ink)"
          strokeOpacity="0.18"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          ref={pathRef}
          d={layout.route}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: mode === "delivery" ? Math.max(0.001, progress) : 0.001 }}
          transition={reduce ? { duration: 0 } : spring.gentle}
        />
        {/* origin: the brand */}
        <g transform={`translate(${layout.start.x} ${layout.start.y})`}>
          <circle r="9" fill="var(--primary)" />
          <rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="var(--on-primary)" />
        </g>
        {/* destination */}
        <g transform={`translate(${layout.end.x} ${layout.end.y})`}>
          {!reduce && mode === "delivery" && progress < 1 && (
            <motion.circle
              r="10"
              fill="var(--accent)"
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: 0, scale: 2.4 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <path
            d="M0 -16 C-8 -16 -11 -10 -11 -6 C-11 2 0 10 0 10 C0 10 11 2 11 -6 C11 -10 8 -16 0 -16 Z"
            fill="var(--accent)"
            transform="translate(0 -2)"
          />
          <circle r="4" cy="-8" fill="var(--on-accent)" />
        </g>
        {/* rider */}
        {mode === "delivery" && point && progress > 0 && progress < 1 && (
          <motion.g
            initial={false}
            animate={{ x: point.x, y: point.y }}
            transition={reduce ? { duration: 0 } : spring.gentle}
          >
            <circle r="11" fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
            <g transform="translate(-6 -6) scale(0.5)">
              <path
                d="M5 18a3 3 0 1 0 0-.01M19 18a3 3 0 1 0 0-.01M9 6h4l3 6h3M12 12l-3 6h6"
                stroke="var(--ink)"
                strokeWidth="2.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </motion.g>
        )}
      </svg>
      <figcaption className="flex flex-col gap-1 border-t border-line bg-surface/80 px-4 py-2.5 text-small backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="size-2 shrink-0 rounded-xs bg-primary" aria-hidden /> {fromLabel}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-accent" aria-hidden /> {toLabel}
        </span>
      </figcaption>
    </figure>
  );
}
