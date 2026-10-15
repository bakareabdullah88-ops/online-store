"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, Check, MessageCircle, Receipt, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { KamplugTile } from "@/components/app/kamplug-mark";
import { cn } from "@/lib/cn";

/** A drawing, not data: the names and amounts below are examples. */
const todo = [
  { label: "Confirm 2 new orders", tone: "bg-accent" },
  { label: "Reply to a question about sizes", tone: "bg-chart-orange" },
  { label: "Restock the A3 campus print", tone: "bg-faint" },
];

const W = 1040;
const H = 560;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Scales a fixed-size drawing to the width it is given. */
function useFit() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, (e?.contentRect.width ?? W) / W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, scale };
}

/** One loop: an order arrives, the seller accepts it, the revenue figure moves. */
function useLoop(reduce: boolean | null) {
  const [step, setStep] = useState(0); // 0 quiet, 1 order in, 2 accepted
  useEffect(() => {
    if (reduce) return;
    const wait = [1600, 2200, 2800];
    let i = 0;
    let t: number;
    const next = () => {
      i = (i + 1) % 3;
      setStep(i);
      t = window.setTimeout(next, wait[i]);
    };
    t = window.setTimeout(next, wait[0]);
    return () => window.clearTimeout(t);
  }, [reduce]);
  return reduce ? 2 : step;
}

const line =
  "M0,118 L60,112 L120,116 L180,98 L240,104 L300,86 L360,92 L420,70 L480,78 L540,58 L600,64";

/**
 * A coded picture of Shop Studio: the same top bar and revenue panel the app
 * uses. An order slides in and gets accepted, on a slow loop.
 */
export function StudioPreview() {
  const { ref, scale } = useFit();
  const reduce = useReducedMotion();
  const step = useLoop(reduce);
  const accepted = step === 2;

  return (
    <div
      ref={ref}
      className="relative w-full text-left"
      style={{ height: H * scale }}
      role="img"
      aria-label="Illustration of Shop Studio, where sellers see revenue and accept orders"
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
        aria-hidden
      >
        <div className="flex size-full flex-col overflow-hidden rounded-2xl bg-[var(--app-bg)] shadow-md ring-1 ring-line">
          {/* top bar */}
          <div className="flex h-14 items-center gap-6 border-b border-line bg-surface px-5">
            <KamplugTile className="size-8" />
            <span className="rounded-full bg-success-soft px-3 py-1 text-[12px] font-medium text-success">
              Selling
            </span>
            {["Performance", "Orders", "Products", "Inbox"].map((l, i) => (
              <span
                key={l}
                className={cn("text-[13px]", i === 0 ? "font-semibold text-ink" : "text-ink-2")}
              >
                {l}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-4 text-ink-2">
              <Search className="size-4" />
              <MessageCircle className="size-4" />
              <span className="relative">
                <Bell className="size-4" />
                <span
                  className={cn(
                    "absolute -top-1.5 -right-1.5 size-2 rounded-full bg-badge transition-opacity duration-200",
                    step === 1 ? "opacity-100" : "opacity-0",
                  )}
                />
              </span>
              <span className="size-7 rounded-full bg-sand ring-1 ring-line" />
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-4 p-6">
            <div>
              <p className="text-[22px] font-semibold tracking-[-0.02em]">Your shop</p>
              <p className="text-[13px] text-muted">How your shop did, last 7 days</p>
            </div>

            {/* revenue */}
            <div className="grid grid-cols-[1fr_1.4fr] items-end gap-8 rounded-xl bg-surface p-6 ring-1 ring-line">
              <div>
                <p className="text-[13px] text-muted">Revenue</p>
                <p className="mt-2 text-[44px] leading-none font-semibold tracking-[-0.04em] tabular">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={accepted ? "after" : "before"}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -14, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="inline-block"
                    >
                      {accepted ? "₦61,500" : "₦48,500"}
                    </motion.span>
                  </AnimatePresence>
                </p>
                <p className="mt-3 text-[12.5px] text-muted">
                  <span className="mr-1.5 rounded-full bg-success-soft px-1.5 py-0.5 font-medium text-success">
                    +18%
                  </span>
                  vs the week before
                </p>
                <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4">
                  {[
                    ["Orders", accepted ? "15" : "14"],
                    ["Customers", "11"],
                    ["Conversion", "4.2%"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[11.5px] text-muted">{k}</p>
                      <p className="mt-0.5 text-[16px] font-semibold tabular">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <svg viewBox="0 0 600 130" preserveAspectRatio="none" className="h-36 w-full">
                <path d={`${line} L600,130 L0,130 Z`} fill="var(--accent)" opacity="0.08" />
                <path
                  d={line}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            {/* to do */}
            <div className="w-[56%] rounded-xl bg-surface p-5 ring-1 ring-line">
              <p className="text-[14px] font-semibold">Needs your attention</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {todo.map((t) => (
                  <li key={t.label} className="flex items-center gap-2.5 text-[13px] text-ink-2">
                    <span className={cn("size-1.5 rounded-full", t.tone)} />
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* incoming order: transform only, so its text never fades below readable contrast */}
        <motion.div
          initial={false}
          animate={step >= 1 ? { y: 0 } : { y: 220 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="absolute right-6 bottom-6 w-80 rounded-xl bg-surface p-4 shadow-lg ring-1 ring-line"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent-ink">
              <Receipt className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold">
                New order <span className="font-mono text-[12px] text-muted">KMP-7QRT</span>
              </p>
              <p className="text-[12px] text-muted">2 items · ₦13,000 · Pickup</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <span className="flex h-8 flex-1 items-center justify-center rounded-md text-[12.5px] font-medium ring-1 ring-line">
              Decline
            </span>
            <span
              className={cn(
                "flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[12.5px] font-semibold transition-colors duration-200",
                accepted ? "bg-success-soft text-success" : "bg-primary text-on-primary",
              )}
            >
              {accepted ? (
                <>
                  <Check className="size-3.5" /> Accepted
                </>
              ) : (
                "Accept"
              )}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
