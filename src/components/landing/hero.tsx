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
  Bell,
  MapPin,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { KamplugTile } from "@/components/app/kamplug-mark";
import { ProductArt } from "@/components/art/product-art";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/** The phone in the middle: a drawn Kamplug market screen. Example content only. */
function PhoneScreen() {
  return (
    <div className="relative mx-auto w-[260px] rounded-[44px] bg-[#0f1115] p-2.5 shadow-[0_40px_80px_-30px_rgb(15_17_21/0.5)] md:w-[290px]">
      <div className="overflow-hidden rounded-[36px] bg-surface text-left">
        <div className="relative flex h-9 items-center justify-between px-6 text-[11px] font-semibold">
          <span>9:41</span>
          <span className="absolute top-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#0f1115]" />
          <span className="h-2.5 w-4 rounded-[3px] bg-ink" />
        </div>
        <div className="flex items-center gap-2 px-4 pt-1 pb-3">
          <KamplugTile className="size-7" />
          <span className="flex-1" />
          <Bell className="size-4 text-ink-2" />
          <ShoppingBag className="size-4 text-ink-2" />
        </div>
        <div className="px-4">
          <p className="text-[11px] text-muted">Near you · UNILAG</p>
          <p className="text-[19px] leading-tight font-semibold tracking-[-0.02em]">
            What are you craving?
          </p>
          <div className="mt-3 flex h-9 items-center gap-2 rounded-xl bg-surface-2 px-3 text-[12px] text-muted ring-1 ring-line">
            <Search className="size-3.5" /> Search food, thrift, merch
          </div>
          <div className="mt-3 flex gap-1.5">
            {["All", "Food", "Thrift", "Beauty"].map((c, i) => (
              <span
                key={c}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",
                  i === 0 ? "bg-ink text-surface" : "bg-surface-2 text-ink-2 ring-1 ring-line",
                )}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5 px-4 pb-5">
          {(
            [
              ["bowl", "ochre", "Jollof bowl", "₦3,500"],
              ["sneaker", "rose", "Retro sneakers", "₦12,000"],
              ["dropper", "plum", "Glow serum", "₦4,500"],
              ["tee", "sea", "Campus tee", "₦6,000"],
            ] as const
          ).map(([motif, palette, name, price], i) => (
            <div key={name} className="overflow-hidden rounded-xl ring-1 ring-line">
              <ProductArt
                motif={motif}
                palette={palette}
                seed={i * 5 + 2}
                className="block aspect-square w-full"
              />
              <div className="px-2 py-1.5">
                <p className="truncate text-[11px] font-medium">{name}</p>
                <p className="text-[11px] font-semibold tabular">{price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A card that pops out from behind the phone, then floats on its own rhythm. */
function Floating({
  children,
  className,
  from,
  i,
  scrollY,
  px,
  py,
  depth = 1,
  phone = false,
}: {
  children: ReactNode;
  /** Absolute position around the phone. */
  className: string;
  /** Where it pops out from, relative to its resting place (towards the phone). */
  from: { x: number; y: number };
  i: number;
  scrollY: MotionValue<number>;
  px: MotionValue<number>;
  py: MotionValue<number>;
  depth?: number;
  /** Keep it on phones too. */
  phone?: boolean;
}) {
  const reduce = useReducedMotion();
  const drift = useTransform(scrollY, [0, 700], [0, -60 * depth]);
  const pointX = useTransform(px, (v) => v * 18 * depth);
  const pointY = useTransform(py, (v) => v * 18 * depth);
  const y = useTransform([drift, pointY], ([a, b]) => (a as number) + (b as number));
  return (
    <motion.div
      aria-hidden
      className={cn("absolute z-10 text-left", !phone && "max-lg:hidden", className)}
      style={reduce ? undefined : { x: pointX, y }}
    >
      <motion.div
        initial={reduce ? false : { x: from.x, y: from.y, scale: 0.4, opacity: 0 }}
        animate={reduce ? undefined : { x: 0, y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.55 + i * 0.12 }}
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          transition={{
            duration: 4.5 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.4 + i * 0.25,
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const card =
  "rounded-2xl bg-surface p-3.5 shadow-[0_18px_40px_-18px_rgb(15_17_21/0.28)] ring-1 ring-line";

/**
 * The top of the landing page: a calm headline, two clear actions, and the app itself
 * with everyday moments (an order, a message, a sale) popping out around it.
 */
export function LandingHero() {
  const reduce = !!useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spx = useSpring(px, { stiffness: 60, damping: 18 });
  const spy = useSpring(py, { stiffness: 60, damping: 18 });
  const { scrollY } = useScroll();
  const phoneY = useTransform(scrollY, [0, 700], [0, 40]);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduce, px, py]);

  const shared = { scrollY, px: spx, py: spy };

  return (
    <section className="relative isolate overflow-hidden bg-surface pt-32 md:pt-36">
      {/* Soft light and faint rings behind the phone. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--accent-soft),transparent_70%)]" />
        <svg
          className="absolute top-[52%] left-1/2 w-[1100px] -translate-x-1/2 text-line-strong"
          viewBox="0 0 1100 600"
          fill="none"
        >
          {[220, 330, 440, 550].map((r) => (
            <circle
              key={r}
              cx="550"
              cy="560"
              r={r}
              stroke="currentColor"
              strokeDasharray="2 7"
              opacity={0.7 - r / 1100}
            />
          ))}
        </svg>
      </div>

      <div className="mx-auto max-w-6xl px-4 text-center md:px-6">
        <motion.p
          initial={reduce ? false : { y: 8 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[12px] tracking-wide text-muted uppercase"
        >
          <span>Free for students</span>
          <span aria-hidden className="size-1 rounded-full bg-line-strong" />
          <span>Pay on delivery</span>
          <span aria-hidden className="size-1 rounded-full bg-line-strong" />
          <span>8 campuses</span>
        </motion.p>
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.06, ease: EASE }}
          className="mx-auto mt-5 max-w-4xl font-[family-name:var(--ff-fraunces)] text-[clamp(44px,8vw,96px)] leading-[0.98] font-medium tracking-[-0.035em] text-balance"
        >
          Your campus,
          <br />
          one <em className="text-brand-ink">plug</em> away
        </motion.h1>
        <motion.p
          initial={reduce ? false : { y: 14 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-muted md:text-[19px]"
        >
          Buy food, fashion and thrift from students near you, or open a shop and sell to your
          hostel.
        </motion.p>
        <motion.div
          initial={reduce ? false : { y: 14 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
          className="mt-8 flex items-center justify-center gap-2.5 sm:gap-3"
        >
          <Link
            href="/signup"
            className="group flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold whitespace-nowrap text-surface transition-colors duration-150 hover:bg-brand hover:text-white"
          >
            <span className="sm:hidden">Create account</span>
            <span className="max-sm:hidden">Create your account</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/open-shop"
            className="flex h-12 items-center rounded-full bg-surface px-5 text-[15px] font-semibold whitespace-nowrap text-ink ring-1 ring-line-strong transition-colors hover:ring-ink sm:px-6"
          >
            Open a shop
          </Link>
        </motion.div>

        {/* The app, with moments popping out around it. Pictures only; names are examples. */}
        <div className="relative mx-auto mt-14 max-w-5xl md:mt-16">
          <motion.div
            initial={reduce ? false : { y: 60 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="relative z-0 h-[440px] overflow-hidden md:h-[500px]"
          >
            <motion.div style={reduce ? undefined : { y: phoneY }} aria-hidden>
              <PhoneScreen />
            </motion.div>
          </motion.div>

          {/* Left side */}
          <Floating {...shared} i={0} from={{ x: 220, y: 120 }} className="top-6 left-0 xl:-left-4">
            <div className={cn(card, "w-[270px]")}>
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
                <span className="grid size-5 place-items-center rounded-full bg-accent-soft text-brand-ink">
                  <ShoppingBag className="size-3" />
                </span>
                New order
                <span className="ml-auto font-mono text-[11px]">KMP-7QRT</span>
              </p>
              <div className="mt-2.5 flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
                <span className="size-10 overflow-hidden rounded-lg">
                  <ProductArt motif="bowl" palette="ochre" seed={4} className="block size-full" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">Jollof bowl × 2</p>
                  <p className="text-[11.5px] text-muted">₦7,000 · Pickup at Arts</p>
                </div>
              </div>
            </div>
          </Floating>

          <Floating
            {...shared}
            i={2}
            from={{ x: 200, y: 0 }}
            depth={0.6}
            phone
            className="top-[80%] left-[8%] max-lg:top-[66%] max-lg:left-0"
          >
            <div className="flex items-center gap-2.5 rounded-xl bg-brand px-4 py-3 text-[13.5px] font-semibold text-white shadow-[0_16px_34px_-14px_var(--brand)]">
              <Truck className="size-4" /> Out for delivery
            </div>
          </Floating>

          <Floating
            {...shared}
            i={4}
            from={{ x: 180, y: -80 }}
            depth={1.2}
            className="top-[40%] left-0 xl:-left-6"
          >
            <div className="w-[190px] rounded-2xl bg-[#e9e3ff] p-4 text-[#2b1f63] shadow-[0_18px_40px_-18px_rgb(43_31_99/0.4)] dark:bg-[#2b2350] dark:text-[#e9e3ff]">
              <p className="text-[12.5px] font-medium">Revenue this week</p>
              <p className="mt-1 text-[30px] leading-none font-semibold tracking-[-0.03em] tabular">
                ₦61,500
              </p>
              <p className="mt-2 flex items-center gap-1 text-[12px] font-medium">
                <TrendingUp className="size-3.5" /> 18% up
              </p>
            </div>
          </Floating>

          {/* Right side */}
          <Floating
            {...shared}
            i={1}
            from={{ x: -220, y: 120 }}
            className="top-4 right-0 xl:-right-4"
          >
            <div className={cn(card, "w-[250px]")}>
              <p className="flex items-center gap-1.5 text-[12px] font-medium text-muted">
                <MessageCircle className="size-3.5" /> New message
              </p>
              <p className="mt-2 w-fit rounded-lg rounded-tl-sm bg-surface-2 px-3 py-2 text-[13px]">
                Is the denim jacket still available in L?
              </p>
            </div>
          </Floating>

          <Floating
            {...shared}
            i={3}
            from={{ x: -160, y: 40 }}
            depth={0.7}
            phone
            className="top-[36%] right-[4%] max-lg:top-[10%] max-lg:right-0"
          >
            <div className="flex items-center gap-1.5 rounded-full bg-[#fff1b8] px-3.5 py-2 text-[12.5px] font-semibold text-[#5a4300] shadow-sm">
              <Sparkles className="size-3.5" /> Shops near you
            </div>
          </Floating>

          <Floating
            {...shared}
            i={5}
            from={{ x: -200, y: -60 }}
            depth={1.1}
            className="top-[60%] right-0 xl:-right-6"
          >
            <div className={cn(card, "flex w-[260px] items-center gap-3")}>
              <span className="size-14 shrink-0 overflow-hidden rounded-xl">
                <ProductArt motif="sneaker" palette="rose" seed={9} className="block size-full" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">Retro sneakers</p>
                <p className="flex items-center gap-1 text-[11.5px] text-muted">
                  <MapPin className="size-3" /> 4 min away
                </p>
              </div>
              <span className="rounded-lg bg-accent px-2.5 py-1.5 text-[12px] font-semibold text-on-accent">
                Add
              </span>
            </div>
          </Floating>

          {/* Fade the phone into the next section. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-surface to-transparent"
          />
        </div>
        <p className="relative z-30 pt-2 pb-6 text-[12px] text-muted">
          Pictures of the app. Names and amounts are examples.
        </p>
      </div>
    </section>
  );
}
