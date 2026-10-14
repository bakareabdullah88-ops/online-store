import type { Transition } from "motion/react";

/**
 * Motion tokens. Springs for movement, short tweens only for opacity.
 * Timing guide: micro 120–220ms, transitions 300–450ms, hero ≤ 600ms.
 */

export const duration = {
  micro: 0.16,
  base: 0.24,
  transition: 0.36,
  hero: 0.56,
} as const;

export const ease = {
  outQuint: [0.22, 1, 0.36, 1],
  outExpo: [0.16, 1, 0.3, 1],
  inOutSoft: [0.65, 0, 0.35, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const spring = {
  /** Toggles, chips, tab indicators: settles in ~180ms */
  snappy: { type: "spring", stiffness: 520, damping: 38, mass: 0.7 },
  /** Sheets, drawers, layout shifts: ~320ms */
  smooth: { type: "spring", stiffness: 300, damping: 34, mass: 0.9 },
  /** Badges, success moments: quick, with barely any overshoot */
  bouncy: { type: "spring", stiffness: 560, damping: 32, mass: 0.6 },
  /** Large surfaces (mode curtain, hero): ~450ms */
  gentle: { type: "spring", stiffness: 180, damping: 28, mass: 1 },
} as const satisfies Record<string, Transition>;

export type SpringName = keyof typeof spring;

export const fade: Transition = { duration: duration.micro, ease: ease.outQuint };

/** Stagger for list reveals: children appear 40ms apart, capped */
export const stagger = (index: number, step = 0.04, max = 0.32) => Math.min(index * step, max);
