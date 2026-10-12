"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { spring } from "@/design/motion";

const COLORS = ["var(--ember)", "var(--studio)", "#C9A24A", "#2F6B70", "var(--ink)"];
const PIECES = 18;

/** A single, tasteful burst: check mark, ring and a few paper pieces. */
export function Celebration() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto size-28" aria-hidden>
      {!reduce &&
        Array.from({ length: PIECES }, (_, i) => {
          const angle = (i / PIECES) * Math.PI * 2 + (i % 3) * 0.2;
          const dist = 70 + (i % 4) * 18;
          return (
            <motion.span
              key={i}
              className="absolute top-1/2 left-1/2 block"
              style={{ width: i % 2 ? 6 : 10, height: i % 2 ? 10 : 4, background: COLORS[i % COLORS.length], borderRadius: i % 3 === 0 ? 999 : 2 }}
              initial={{ x: "-50%", y: "-50%", opacity: 0, rotate: 0, scale: 0.4 }}
              animate={{ x: `calc(-50% + ${Math.cos(angle) * dist}px)`, y: `calc(-50% + ${Math.sin(angle) * dist + 24}px)`, opacity: [0, 1, 1, 0], rotate: (i % 2 ? 1 : -1) * 220, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1], opacity: { times: [0, 0.1, 0.7, 1], duration: 1.3, delay: 0.25 } }}
            />
          );
        })}
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-accent"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: reduce ? 1 : 1.6, opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
      />
      <motion.span
        className="absolute inset-0 flex items-center justify-center rounded-full bg-primary text-on-primary"
        initial={reduce ? { opacity: 0 } : { scale: 0 }}
        animate={reduce ? { opacity: 1 } : { scale: 1 }}
        transition={spring.bouncy}
      >
        <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...spring.bouncy, delay: 0.15 }}>
          <Check className="size-12" strokeWidth={2.5} />
        </motion.span>
      </motion.span>
    </div>
  );
}
