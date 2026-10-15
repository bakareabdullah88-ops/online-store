"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Gem,
  Headphones,
  Printer,
  Recycle,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** The categories students actually sell, floating around the headline. */
const floaters: {
  icon: LucideIcon;
  label: string;
  /** Position as % of the hero box. */
  x: number;
  y: number;
  size: "sm" | "md" | "lg";
  /** Parallax strength: how far it drifts with the pointer and on scroll. */
  depth: number;
  /** Where it sits on phones, clear of the text; omitted means hidden on phones. */
  phone?: { x: number; y: number };
}[] = [
  {
    icon: UtensilsCrossed,
    label: "Food",
    x: 8,
    y: 18,
    size: "lg",
    depth: 1.2,
    phone: { x: 10, y: 2 },
  },
  { icon: Shirt, label: "Fashion", x: 88, y: 14, size: "lg", depth: 1, phone: { x: 90, y: 4 } },
  { icon: Sparkles, label: "Skincare", x: 4, y: 62, size: "md", depth: 0.7 },
  { icon: Recycle, label: "Thrift", x: 93, y: 58, size: "md", depth: 0.8 },
  { icon: Headphones, label: "Tech", x: 18, y: 86, size: "sm", depth: 0.5 },
  { icon: Printer, label: "Prints", x: 80, y: 86, size: "sm", depth: 0.6 },
  { icon: Gem, label: "Accessories", x: 24, y: 4, size: "sm", depth: 0.4 },
  { icon: BookOpen, label: "Books", x: 72, y: 2, size: "sm", depth: 0.45 },
];

const bubble = {
  sm: "size-12 rounded-2xl [&_svg]:size-5",
  md: "size-14 rounded-[18px] [&_svg]:size-6",
  lg: "size-16 rounded-[20px] [&_svg]:size-7",
};

function Floater({
  f,
  i,
  px,
  py,
  scrollY,
  reduce,
}: {
  f: (typeof floaters)[number];
  i: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
  scrollY: MotionValue<number>;
  reduce: boolean;
}) {
  const x = useTransform(px, (v) => v * 22 * f.depth);
  const pointerY = useTransform(py, (v) => v * 22 * f.depth);
  const scrollShift = useTransform(scrollY, [0, 600], [0, -140 * f.depth]);
  const y = useTransform([pointerY, scrollShift], ([a, b]) => (a as number) + (b as number));
  const Icon = f.icon;
  return (
    <motion.div
      className={cn(
        "absolute top-(--fy) left-(--fx) max-md:top-(--py) max-md:left-(--px) max-md:scale-75",
        !f.phone && "max-md:hidden",
      )}
      style={
        {
          "--fx": `${f.x}%`,
          "--fy": `${f.y}%`,
          "--px": `${f.phone?.x ?? f.x}%`,
          "--py": `${f.phone?.y ?? f.y}%`,
          x: reduce ? 0 : x,
          y: reduce ? 0 : y,
        } as unknown as React.CSSProperties
      }
      aria-hidden
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.6 }}
        animate={
          reduce
            ? { opacity: 1 }
            : { opacity: 1, scale: 1, y: [0, -10, 0], rotate: [0, i % 2 ? 4 : -4, 0] }
        }
        transition={{
          opacity: { duration: 0.6, delay: 0.25 + i * 0.07 },
          scale: { duration: 0.7, delay: 0.25 + i * 0.07, ease: [0.22, 1, 0.36, 1] },
          y: { duration: 5 + (i % 4), repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          rotate: { duration: 7 + (i % 3), repeat: Infinity, ease: "easeInOut" },
        }}
        className={cn(
          "grid -translate-x-1/2 -translate-y-1/2 place-items-center liquid-glass text-brand-ink",
          bubble[f.size],
        )}
      >
        <Icon strokeWidth={1.75} />
      </motion.div>
    </motion.div>
  );
}

/**
 * The top of the landing page: headline, the main call to action, and category icons
 * that float, follow the pointer a little and drift apart as you scroll.
 */
export function LandingHero() {
  const reduce = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 60, damping: 18 });
  const spy = useSpring(py, { stiffness: 60, damping: 18 });
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 600], [0, 120]);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduce, px, py]);

  return (
    <section ref={ref} className="relative isolate overflow-hidden pt-32 pb-10 md:pt-36">
      {/* Soft brand light behind the glass, so the navbar and bubbles have something to blur. */}
      <motion.div
        aria-hidden
        style={{ y: reduce ? 0 : glowY }}
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[620px] max-w-5xl"
      >
        <div className="absolute top-10 left-[8%] size-[420px] rounded-full bg-brand/25 blur-[110px] dark:bg-brand/35" />
        <div className="absolute top-32 right-[6%] size-[360px] rounded-full bg-chart-mint/40 blur-[110px] dark:bg-chart-mint/15" />
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="pointer-events-none absolute inset-0 -top-6 bottom-0">
          {floaters.map((f, i) => (
            <Floater
              key={f.label}
              f={f}
              i={i}
              px={spx}
              py={spy}
              scrollY={scrollY}
              reduce={reduce}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-3xl py-10 text-center md:py-14">
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto inline-flex items-center gap-2 rounded-full liquid-glass px-3.5 py-1.5 text-[13px] font-medium text-ink-2"
          >
            <span className="size-1.5 rounded-full bg-accent" /> Free for students. No card needed.
          </motion.p>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-[clamp(42px,7vw,84px)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance"
          >
            Your campus <span className="text-brand-ink">plug</span>.
          </motion.h1>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink-2 md:text-[19px]"
          >
            Buy food, fashion, thrift and more from students near you. Or open your own shop and
            sell to your hostel.
          </motion.p>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-[15.5px] font-semibold text-on-accent shadow-[0_10px_30px_-12px_var(--accent)] transition-colors duration-150 hover:bg-accent-hover"
            >
              Create your account
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/open-shop"
              className="flex h-12 items-center rounded-xl liquid-glass px-6 text-[15.5px] font-semibold text-ink transition-colors hover:text-brand-ink"
            >
              Open a shop
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
