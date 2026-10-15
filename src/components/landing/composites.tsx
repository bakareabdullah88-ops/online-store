"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { Check, MapPin, Search, ShoppingBag, Shirt, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Coded drawings of the app for the feature rows. Names and prices are examples.
 * Each one plays a short loop while it's on screen and rests on its final frame
 * when motion is reduced.
 */

const panel = "rounded-xl bg-surface ring-1 ring-line";
const EASE = [0.22, 1, 0.36, 1] as const;

/** Counts 0..steps-1 on a loop while the element is in view. */
function useLoopStep(steps: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % steps), ms);
    return () => window.clearInterval(t);
  }, [inView, reduce, steps, ms]);
  return { ref, step: reduce ? steps - 1 : step };
}

const QUERY = "thrift jacket";

export function FoundComposite() {
  // 0-12: typing, 13-15: results showing.
  const { ref, step } = useLoopStep(QUERY.length + 8, 140);
  const typed = QUERY.slice(0, Math.min(step, QUERY.length));
  const done = step >= QUERY.length;
  return (
    <div ref={ref} className="relative mx-auto h-[280px] w-full max-w-[440px]" aria-hidden>
      <div className={cn("absolute top-2 left-0 w-60 p-3 shadow-sm", panel)}>
        <p className="flex h-9 items-center gap-2 rounded-md bg-surface-2 px-2.5 text-[12.5px]">
          <Search className="size-3.5 text-muted" />
          <span>{typed}</span>
          <span className="-ml-1.5 h-4 w-px animate-pulse bg-accent" />
        </p>
        <AnimatePresence>
          {done &&
            ["thrift jacket near me", "thrift jacket under ₦10k", "denim jacket, size L"].map(
              (s, i) => (
                <motion.p
                  key={s}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06, ease: EASE }}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-ink-2"
                >
                  <Search className="size-3 text-faint" /> {s}
                </motion.p>
              ),
            )}
        </AnimatePresence>
      </div>
      <motion.div
        animate={done ? { y: 0, opacity: 1 } : { y: 12, opacity: 0.55 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={cn("absolute top-16 right-0 w-56 overflow-hidden shadow-md", panel)}
      >
        <div className="grid h-32 place-items-center bg-accent-soft text-brand-ink">
          <Shirt className="size-12" strokeWidth={1.25} />
        </div>
        <div className="p-3.5">
          <p className="text-[13.5px] font-semibold">Vintage denim jacket</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted">
            <MapPin className="size-3" /> 4 min away
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold tabular">₦8,500</span>
            <span className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-[12px] font-semibold text-on-accent">
              <ShoppingBag className="size-3.5" /> Add
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const STEPS = ["Placed", "Confirmed", "Out for delivery", "Delivered"];

export function OrderComposite() {
  // One tick per status, then a pause on "Delivered".
  const { ref, step } = useLoopStep(STEPS.length + 2, 900);
  const reached = Math.min(step, STEPS.length - 1);
  return (
    <div ref={ref} className="relative mx-auto h-[300px] w-full max-w-[440px]" aria-hidden>
      <div className={cn("absolute top-4 left-0 w-48 p-3 shadow-sm", panel)}>
        {STEPS.map((s, i) => {
          const on = i <= reached;
          return (
            <div key={s} className="flex items-center gap-2 py-1 text-[12px]">
              <motion.span
                animate={{ scale: on ? 1 : 0.85 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className={cn(
                  "grid size-4 place-items-center rounded-full transition-colors duration-300",
                  on ? "bg-accent text-on-accent" : "ring-1 ring-line-strong",
                )}
              >
                {on && <Check className="size-2.5" strokeWidth={3} />}
              </motion.span>
              <span className={cn("transition-colors", on ? "text-ink" : "text-muted")}>{s}</span>
            </div>
          );
        })}
      </div>
      <div className={cn("absolute right-0 bottom-0 w-64 p-4 shadow-md", panel)}>
        <p className="text-[12.5px] font-semibold">Order summary</p>
        {[
          ["1×", "Jollof bowl", "₦3,500"],
          ["2×", "Zobo, 50cl", "₦1,600"],
          ["1×", "Delivery", "₦500"],
        ].map(([q, n, p]) => (
          <p key={n} className="mt-2.5 flex items-center gap-2 text-[12px]">
            <span className="text-muted tabular">{q}</span>
            <span className="flex-1">{n}</span>
            <span className="font-medium tabular">{p}</span>
          </p>
        ))}
        <p className="mt-3 flex justify-between border-t border-line pt-3 text-[13px] font-semibold tabular">
          <span>Total</span> <span>₦5,600</span>
        </p>
        <span className="mt-3 flex h-9 items-center justify-center rounded-md bg-accent text-[12.5px] font-semibold text-on-accent">
          Pay when it arrives
        </span>
      </div>
    </div>
  );
}

const CHAT = [
  { mine: false, text: "Is the denim jacket still available in L?" },
  { mine: true, text: "Yes. I can drop it at your hall after 4pm." },
  { mine: false, text: "Perfect, ordering now." },
];

export function ChatComposite() {
  const { ref, step } = useLoopStep(CHAT.length + 3, 1100);
  const shown = Math.min(step + 1, CHAT.length);
  return (
    <div ref={ref} className="relative mx-auto h-[280px] w-full max-w-[440px]" aria-hidden>
      <div className={cn("absolute inset-x-4 top-0 p-4 shadow-md", panel)}>
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-ink-2 ring-1 ring-line">
            B
          </span>
          <p className="text-[13px] font-semibold">Buyer</p>
          <span className="ml-auto font-mono text-[11px] text-muted">KMP-7QRT</span>
        </div>
        <div className="flex min-h-[132px] flex-col gap-2 pt-3">
          <AnimatePresence initial={false}>
            {CHAT.slice(0, shown).map((m) => (
              <motion.p
                key={m.text}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={cn(
                  "w-fit max-w-[78%] rounded-lg px-3 py-2 text-[12.5px]",
                  m.mine ? "ml-auto bg-accent-soft" : "bg-surface-2",
                )}
              >
                {m.text}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <motion.div
        animate={shown === CHAT.length ? { y: 0, opacity: 1 } : { y: 8, opacity: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className={cn(
          "absolute right-0 bottom-2 flex items-center gap-2 px-3 py-2.5 shadow-sm",
          panel,
        )}
      >
        <Truck className="size-4 text-brand-ink" />
        <span className="text-[12px] font-medium">Out for delivery</span>
      </motion.div>
    </div>
  );
}
