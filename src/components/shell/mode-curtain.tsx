"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { brand } from "@/config/brand";
import { spring } from "@/design/motion";
import { modeForPath, type Mode } from "./mode";

type Phase = "idle" | "cover" | "hold" | "reveal";

type CurtainState = {
  phase: Phase;
  target: Mode;
  href: string;
  start: (target: Mode, href: string) => void;
  set: (p: Partial<Pick<CurtainState, "phase">>) => void;
};

export const useCurtain = create<CurtainState>((set, get) => ({
  phase: "idle",
  target: "buying",
  href: "/",
  start: (target, href) => {
    if (get().phase !== "idle") return;
    set({ phase: "cover", target, href });
  },
  set: (p) => set(p),
}));

/**
 * The signature transition. A curtain in the destination mode's colour rises
 * over the app, the route (and accent) swaps underneath, then it lifts away.
 * Only transform + opacity animate. Reduced motion: a quick crossfade.
 */
export function ModeCurtain() {
  const { phase, target, href, set } = useCurtain();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const covered = useRef(false);

  // Once covered, navigate; reveal when the destination mode is on screen.
  useEffect(() => {
    if (phase === "hold" && modeForPath(pathname) === target) {
      const t = window.setTimeout(() => set({ phase: "reveal" }), 140);
      return () => window.clearTimeout(t);
    }
  }, [phase, pathname, target, set]);

  // Safety: never leave the curtain up (e.g. navigation blocked).
  useEffect(() => {
    if (phase !== "hold") return;
    const t = window.setTimeout(() => set({ phase: "reveal" }), 2500);
    return () => window.clearTimeout(t);
  }, [phase, set]);

  const selling = target === "selling";
  const visible = phase === "cover" || phase === "hold";

  return (
    <AnimatePresence
      onExitComplete={() => {
        covered.current = false;
        set({ phase: "idle" });
      }}
    >
      {visible && (
        <motion.div
          key="curtain"
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-(--z-curtain) flex flex-col justify-end overflow-hidden bg-ink text-canvas"
          initial={reduce ? { opacity: 0 } : { y: "100%" }}
          animate={reduce ? { opacity: 1 } : { y: "0%" }}
          exit={reduce ? { opacity: 0 } : { y: "-100%" }}
          transition={reduce ? { duration: 0.15 } : spring.gentle}
          onAnimationComplete={() => {
            if (phase === "cover" && !covered.current) {
              covered.current = true;
              set({ phase: "hold" });
              router.push(href);
            }
          }}
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-1.5"
            style={{ background: selling ? "var(--studio-contrast)" : "var(--ember-contrast)" }}
          />
          <div className="container-page pb-[18vh]">
            <motion.p
              className="eyebrow text-canvas/60"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: reduce ? 0 : 0.08 }}
            >
              Switching to
            </motion.p>
            <motion.p
              className="mt-3 font-display text-display-xl"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring.smooth, delay: reduce ? 0 : 0.12 }}
            >
              {selling ? (
                <>
                  <em style={{ color: "var(--studio-contrast)" }}>Selling</em>
                  <span className="text-canvas/50"> · {brand.sellerProductName}</span>
                </>
              ) : (
                <>
                  <em style={{ color: "var(--ember-contrast)" }}>Buying</em>
                  <span className="text-canvas/50"> · Marketplace</span>
                </>
              )}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
