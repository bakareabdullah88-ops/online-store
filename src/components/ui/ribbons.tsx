"use client";

import { motion, useReducedMotion } from "motion/react";
import { createRng } from "@/lib/random";

/* Ribbon shapes are worked out once, so server and client markup match. */

const W = 1440;
const H = 900;

/** A smooth wave across the screen (Catmull-Rom through evenly spaced points). */
function wave(y0: number, amp: number, phase: number, tilt: number, steps = 6): string {
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const x = -160 + (i * (W + 320)) / steps;
    return [x, y0 + tilt * (x / W) + amp * Math.sin(i * 1.15 + phase)] as const;
  });
  let d = `M${pts[0]![0].toFixed(1)},${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(1)},${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)},${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

type Ribbon = {
  from: string;
  to: string;
  width: number;
  a: string;
  b: string;
  duration: number;
  delay: number;
};

const RIBBONS: Ribbon[] = [
  {
    y: 110,
    amp: 70,
    phase: 0,
    tilt: 120,
    width: 26,
    from: "var(--chart-blue)",
    to: "var(--chart-violet)",
    duration: 7,
    delay: 0,
  },
  {
    y: 760,
    amp: 80,
    phase: 1.4,
    tilt: -180,
    width: 30,
    from: "var(--chart-mint)",
    to: "var(--chart-green)",
    duration: 8.5,
    delay: 0.15,
  },
  {
    y: 230,
    amp: 55,
    phase: 2.6,
    tilt: -140,
    width: 14,
    from: "var(--chart-pink)",
    to: "var(--chart-orange)",
    duration: 6.2,
    delay: 0.3,
  },
  {
    y: 640,
    amp: 60,
    phase: 4.1,
    tilt: 160,
    width: 12,
    from: "var(--chart-orange)",
    to: "#f5c542",
    duration: 7.6,
    delay: 0.45,
  },
  {
    y: 30,
    amp: 40,
    phase: 5.2,
    tilt: 90,
    width: 8,
    from: "var(--chart-violet)",
    to: "var(--chart-pink)",
    duration: 5.8,
    delay: 0.6,
  },
].map((r) => ({
  from: r.from,
  to: r.to,
  width: r.width,
  a: wave(r.y, r.amp, r.phase, r.tilt),
  b: wave(r.y + 18, r.amp * 0.8, r.phase + Math.PI * 0.9, r.tilt),
  duration: r.duration,
  delay: r.delay,
}));

const CONFETTI_COLORS = [
  "var(--chart-blue)",
  "var(--chart-pink)",
  "var(--chart-mint)",
  "var(--chart-orange)",
  "var(--chart-violet)",
  "#f5c542",
];

const rng = createRng(4242);
const CONFETTI = Array.from({ length: 34 }, (_, i) => ({
  left: rng.int(2, 98),
  delay: rng.next() * 1.2,
  fall: 7 + rng.next() * 7,
  drift: rng.int(-60, 60),
  spin: (rng.chance(0.5) ? 1 : -1) * rng.int(220, 540),
  w: rng.int(5, 9),
  h: rng.int(12, 22),
  curl: rng.chance(0.45),
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
}));

/**
 * Celebration streamers: wide ribbons draw themselves across the screen and
 * keep waving, while paper ribbons drift down. They stay behind the content
 * and never take clicks.
 */
export function Ribbons() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full opacity-90"
      >
        <defs>
          {RIBBONS.map((r, i) => (
            <linearGradient key={i} id={`ribbon-${i}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" style={{ stopColor: r.from }} />
              <stop offset="1" style={{ stopColor: r.to }} />
            </linearGradient>
          ))}
        </defs>
        {RIBBONS.map((r, i) => (
          <g key={i}>
            <motion.path
              fill="none"
              stroke={`url(#ribbon-${i})`}
              strokeWidth={r.width}
              strokeLinecap="round"
              initial={reduce ? { d: r.a } : { d: r.a, pathLength: 0, opacity: 0 }}
              animate={reduce ? { d: r.a } : { d: [r.a, r.b, r.a], pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: 1.6, delay: r.delay, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.3, delay: r.delay },
                d: { duration: r.duration, repeat: Infinity, ease: "easeInOut", delay: r.delay },
              }}
            />
            {/* A soft shine travelling along the ribbon. */}
            {!reduce && (
              <motion.path
                fill="none"
                stroke="white"
                strokeOpacity={0.35}
                strokeWidth={Math.max(2, r.width * 0.28)}
                strokeLinecap="round"
                strokeDasharray="60 340"
                initial={{ d: r.a, strokeDashoffset: 0, opacity: 0 }}
                animate={{ d: [r.a, r.b, r.a], strokeDashoffset: -1600, opacity: 1 }}
                transition={{
                  d: { duration: r.duration, repeat: Infinity, ease: "easeInOut", delay: r.delay },
                  strokeDashoffset: { duration: 6, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 0.6, delay: r.delay + 1.2 },
                }}
              />
            )}
          </g>
        ))}
      </svg>
      {!reduce &&
        CONFETTI.map((c, i) => (
          <motion.span
            key={i}
            className="absolute top-0 block"
            style={{
              left: `${c.left}%`,
              width: c.w,
              height: c.h,
              background: c.curl ? "transparent" : c.color,
              border: c.curl ? `3px solid ${c.color}` : undefined,
              borderRadius: c.curl ? "999px 999px 0 0" : 2,
              borderBottom: c.curl ? "none" : undefined,
            }}
            initial={{ y: -40, x: 0, rotate: 0, opacity: 0 }}
            animate={{
              y: ["-5vh", "105vh"],
              x: [0, c.drift, -c.drift / 2, c.drift / 3],
              rotate: c.spin,
              opacity: [0, 1, 1, 0.9],
            }}
            transition={{
              duration: c.fall,
              delay: c.delay,
              repeat: Infinity,
              ease: "linear",
              x: { duration: c.fall, repeat: Infinity, ease: "easeInOut", delay: c.delay },
            }}
          />
        ))}
    </div>
  );
}
