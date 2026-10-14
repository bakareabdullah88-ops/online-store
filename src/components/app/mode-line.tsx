"use client";

import { motion, useReducedMotion } from "motion/react";
import { useMode } from "@/components/shell/mode";

/**
 * A thin line in the side's colour along the top of the header (blue while
 * buying, green while selling), so you always know which account you're in.
 * It draws across from the left each time you switch.
 */
export function ModeLine() {
  const mode = useMode();
  const reduce = useReducedMotion();
  return (
    <motion.span
      key={mode}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[3px] origin-left bg-[linear-gradient(90deg,var(--accent),color-mix(in_oklab,var(--accent)_45%,transparent)_70%,transparent)]"
      initial={reduce ? false : { scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    />
  );
}
