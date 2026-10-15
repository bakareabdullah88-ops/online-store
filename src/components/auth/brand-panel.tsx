"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BadgeCheck,
  Check,
  Headphones,
  MessageCircle,
  Recycle,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { KamplugMark } from "@/components/app/kamplug-mark";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

const points = [
  "One account to buy and to sell",
  "Pay on delivery or at pickup",
  "Follow every order from placed to delivered",
];

const bubbles: { icon: LucideIcon; x: string; y: string; size: number; d: number }[] = [
  { icon: UtensilsCrossed, x: "62%", y: "6%", size: 56, d: 0 },
  { icon: Shirt, x: "82%", y: "10%", size: 68, d: 0.6 },
  { icon: Sparkles, x: "88%", y: "42%", size: 52, d: 1.1 },
  { icon: Recycle, x: "4%", y: "88%", size: 52, d: 0.3 },
  { icon: Headphones, x: "78%", y: "86%", size: 50, d: 0.9 },
];

const STEPS = ["Placed", "Confirmed", "On the way", "Delivered"];

/** An order moving through its steps on a loop. Example only. */
function OrderCard() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setStep((s) => (s + 1) % (STEPS.length + 1)), 1100);
    return () => window.clearInterval(t);
  }, [reduce]);
  const at = reduce ? STEPS.length - 1 : Math.min(step, STEPS.length - 1);
  return (
    <div className="w-[300px] rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-white/15">
          <UtensilsCrossed className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold">Jollof bowl + zobo</p>
          <p className="text-[12px] text-white/70">
            <span className="font-mono">KMP-7QRT</span> · ₦5,100
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
            <motion.span
              className="block h-full rounded-full bg-white"
              initial={false}
              animate={{ width: i <= at ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </span>
        ))}
      </div>
      <div className="mt-3 flex h-5 items-center gap-1.5 text-[12.5px] font-medium">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={STEPS[at]}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex items-center gap-1.5"
          >
            <Check className="size-3.5" strokeWidth={3} /> {STEPS[at]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

/** A short chat that types itself out. Example only. */
function ChatCard() {
  return (
    <div className="w-[260px] rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)] backdrop-blur-xl">
      <p className="flex items-center gap-1.5 text-[12px] font-medium text-white/75">
        <MessageCircle className="size-3.5" /> Message from a buyer
      </p>
      <p className="mt-2 w-fit rounded-lg rounded-tl-sm bg-white/15 px-3 py-2 text-[12.5px]">
        Can you drop it at Moremi after 4?
      </p>
      <p className="mt-1.5 ml-auto w-fit rounded-lg rounded-tr-sm bg-white px-3 py-2 text-[12.5px] text-brand">
        Yes, see you then.
      </p>
    </div>
  );
}

/**
 * The right half of the login and sign-up pages: the brand colour, the mark, what
 * Kamplug is for, and a couple of moving pictures of the app. Illustrations only.
 */
export function AuthBrandPanel() {
  const reduce = useReducedMotion();
  return (
    <aside
      className="relative hidden overflow-hidden bg-brand text-white lg:flex lg:flex-col"
      aria-label="About Kamplug"
    >
      {/* Light and texture. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 size-[520px] rounded-full bg-white/10 blur-[90px]" />
        <div className="absolute -bottom-40 -left-24 size-[460px] rounded-full bg-black/20 blur-[90px]" />
        <KamplugMark className="absolute -right-24 -bottom-28 size-[520px] rotate-[-8deg] text-white/[0.06]" />
      </div>

      {/* Floating category bubbles. */}
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute grid place-items-center rounded-[22px] border border-white/20 bg-white/10 backdrop-blur-md"
          style={{ left: b.x, top: b.y, width: b.size, height: b.size }}
          initial={reduce ? false : { opacity: 0, scale: 0.7 }}
          animate={
            reduce
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, y: [0, -12, 0], rotate: [0, i % 2 ? 5 : -5, 0] }
          }
          transition={{
            opacity: { duration: 0.6, delay: 0.2 + i * 0.08 },
            scale: { duration: 0.7, delay: 0.2 + i * 0.08, ease: EASE },
            y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: b.d },
            rotate: { duration: 8 + i, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <b.icon className="size-[42%]" strokeWidth={1.75} />
        </motion.span>
      ))}

      <div className="relative z-10 flex flex-1 flex-col justify-center px-12 xl:px-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="max-w-md"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12.5px] font-medium backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-white" /> Free for students
          </p>
          <h2 className="mt-5 text-[40px] leading-[1.05] font-semibold tracking-[-0.04em] xl:text-[46px]">
            Your campus plug.
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-white/80">
            Buy from students near you, or open a shop and sell to your hostel.
          </p>
          <ul className="mt-6 flex flex-col gap-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-[15px] text-white/90">
                <BadgeCheck className="size-[18px] shrink-0" /> {p}
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="relative mt-12 h-[230px] max-w-lg">
          <motion.div
            className="absolute top-0 left-0"
            initial={reduce ? false : { opacity: 0, x: -20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.35 },
              x: { duration: 0.8, delay: 0.35, ease: EASE },
              y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <OrderCard />
          </motion.div>
          <motion.div
            className={cn("absolute right-0 bottom-0")}
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0, y: [0, 6, 0] }}
            transition={{
              opacity: { duration: 0.6, delay: 0.5 },
              x: { duration: 0.8, delay: 0.5, ease: EASE },
              y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <ChatCard />
          </motion.div>
        </div>
        <p className="mt-6 text-[12px] text-white/60">Pictures of the app. Names are examples.</p>
      </div>
    </aside>
  );
}
