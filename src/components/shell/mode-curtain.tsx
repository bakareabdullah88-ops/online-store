"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bike, Inbox, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { create } from "zustand";
import { CountUp } from "@/components/dash/card";
import { counts } from "@/domain/analytics";
import { formatNairaCompact } from "@/domain/money";
import { isActive as orderIsActive } from "@/domain/orders";
import { useMyOrders } from "@/queries/orders";
import { useMyBrand, useStudioOrders } from "@/queries/studio";
import { useBagCount } from "@/stores/bag";
import { modeForPath, type Mode } from "./mode";

type Phase = "idle" | "cover" | "hold" | "reveal";
type Point = { x: number; y: number };

type CurtainState = {
  phase: Phase;
  target: Mode;
  href: string;
  /** Where the switch was tapped; the circle grows from here. */
  origin: Point | null;
  /** Set when a switch finishes, so the destination can say hello. */
  arrival: { mode: Mode; id: number } | null;
  start: (target: Mode, href: string, origin?: Point) => void;
  set: (p: Partial<Pick<CurtainState, "phase">>) => void;
};

export const useCurtain = create<CurtainState>((set, get) => ({
  phase: "idle",
  target: "buying",
  href: "/",
  origin: null,
  arrival: null,
  start: (target, href, origin) => {
    if (get().phase !== "idle") return;
    set({ phase: "cover", target, href, origin: origin ?? null });
  },
  set: (p) => set(p),
}));

/** The middle of an element, for growing the circle from a button without a pointer position. */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const COVER_S = 0.6;
const REVEAL_S = 0.55;
/** Long enough to read the numbers in the middle. */
const MIN_HOLD_MS = 650;
const ease = [0.7, 0, 0.25, 1] as const;

const palettes: Record<Mode, { bg: string; accent: string }> = {
  selling: { bg: "#0b6541", accent: "#bff3d8" },
  buying: { bg: "#0e7a4f", accent: "#d9f5e6" },
};

function farthestCorner(p: Point) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  return Math.ceil(
    Math.max(
      Math.hypot(p.x, p.y),
      Math.hypot(w - p.x, p.y),
      Math.hypot(p.x, h - p.y),
      Math.hypot(w - p.x, h - p.y),
    ),
  );
}

/** Where the circle shrinks back to: the Kamplug logo on the new page. */
function logoPoint(): Point {
  const logo = Array.from(document.querySelectorAll('[aria-label="Kamplug home"]')).find(
    (el) => (el as HTMLElement).offsetParent !== null,
  );
  return logo ? centerOf(logo) : { x: window.innerWidth / 2, y: 0 };
}

const circle = (r: number, p: Point) => `circle(${r}px at ${p.x}px ${p.y}px)`;

/** Live numbers for the destination, shown while the circle is full. */
function useHighlights(target: Mode) {
  const shopOrders = useStudioOrders().data;
  const myOrders = useMyOrders().data;
  const bag = useBagCount();
  if (target === "selling") {
    if (!shopOrders) return [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const waiting = shopOrders.filter((o) => o.status === "placed").length;
    const revenue = shopOrders
      .filter((o) => counts(o) && Date.parse(o.placedAt) >= monthStart)
      .reduce((n, o) => n + o.totalKobo, 0);
    return [
      {
        icon: Inbox,
        value: waiting,
        label: waiting === 1 ? "new order waiting" : "new orders waiting",
        money: false,
      },
      { icon: TrendingUp, value: revenue, label: "this month", money: true },
    ];
  }
  const onTheWay = myOrders?.filter((o) => orderIsActive(o.status)).length ?? 0;
  return [
    {
      icon: Bike,
      value: onTheWay,
      label: onTheWay === 1 ? "order on the way" : "orders on the way",
      money: false,
    },
    {
      icon: ShoppingBag,
      value: bag,
      label: bag === 1 ? "item in your bag" : "items in your bag",
      money: false,
    },
  ];
}

/**
 * The signature transition between the market and your shop. A circle in the
 * destination's colour grows from where you tapped, the bag turns into a shop
 * (or back), live numbers count up, the route swaps underneath, and the
 * circle shrinks into the new page's logo. Reduced motion: a quick crossfade.
 */
export function ModeCurtain() {
  const { phase, target, href, origin, set } = useCurtain();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const { data: brand } = useMyBrand();
  // Only numbers worth saying: no "0 items in your bag".
  const highlights = useHighlights(target).filter((h) => h.value > 0);
  const covered = useRef(false);
  const coveredAt = useRef(0);
  const [geo, setGeo] = useState<{ from: Point; radius: number; to: Point } | null>(null);

  // Work out the circle's geometry when a switch starts.
  useEffect(() => {
    if (phase !== "cover") return;
    const from = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measured from the window once per switch
    setGeo({ from, radius: farthestCorner(from), to: from });
  }, [phase, origin]);

  // Once the destination is on screen (and the numbers had a moment), shrink into its logo.
  useEffect(() => {
    if (phase !== "hold" || modeForPath(pathname) !== target) return;
    const wait = Math.max(140, MIN_HOLD_MS - (Date.now() - coveredAt.current));
    const t = window.setTimeout(() => {
      setGeo((g) => (g ? { ...g, to: logoPoint() } : g));
      set({ phase: "reveal" });
    }, wait);
    return () => window.clearTimeout(t);
  }, [phase, pathname, target, set]);

  // Safety: never leave the cover up (e.g. navigation blocked).
  useEffect(() => {
    if (phase !== "hold") return;
    const t = window.setTimeout(() => set({ phase: "reveal" }), 2500);
    return () => window.clearTimeout(t);
  }, [phase, set]);

  const selling = target === "selling";
  const colors = palettes[target];
  const visible = (phase === "cover" || phase === "hold") && (reduce || geo !== null);
  const title = selling ? (brand?.name ?? "Your shop") : "Marketplace";

  return (
    <AnimatePresence
      onExitComplete={() => {
        covered.current = false;
        setGeo(null);
        set({ phase: "idle" });
        useCurtain.setState({ arrival: { mode: target, id: Date.now() } });
      }}
    >
      {visible && (
        <motion.div
          key="curtain"
          role="status"
          aria-live="assertive"
          className="fixed inset-0 z-(--z-curtain) grid place-items-center overflow-hidden text-white"
          // Its own view-transition layer, so the page cross-fade under it never fades the cover.
          style={{ background: colors.bg, viewTransitionName: "mode-curtain" }}
          initial={reduce || !geo ? { opacity: 0 } : { clipPath: circle(0, geo.from) }}
          animate={reduce || !geo ? { opacity: 1 } : { clipPath: circle(geo.radius, geo.from) }}
          exit={
            reduce || !geo
              ? { opacity: 0 }
              : { clipPath: circle(0, geo.to), transition: { duration: REVEAL_S, ease } }
          }
          transition={reduce ? { duration: 0.15 } : { duration: COVER_S, ease }}
          onAnimationComplete={() => {
            if (phase === "cover" && !covered.current) {
              covered.current = true;
              coveredAt.current = Date.now();
              set({ phase: "hold" });
              router.push(href);
            }
          }}
        >
          <div className="relative flex flex-col items-center px-6 text-center">
            {/* The bag turns into a shop (or back). */}
            <div className="relative grid size-24 place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-white/12 ring-1 ring-white/25 backdrop-blur-sm"
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.12 }}
              />
              <motion.span
                aria-hidden
                className="absolute"
                initial={reduce ? false : { rotate: 0, scale: 1, opacity: 1 }}
                animate={reduce ? { opacity: 0 } : { rotate: -90, scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.35, delay: 0.3, ease: "easeIn" }}
              >
                {selling ? <ShoppingBag className="size-10" /> : <Store className="size-10" />}
              </motion.span>
              <motion.span
                aria-hidden
                className="absolute"
                initial={reduce ? false : { rotate: 90, scale: 0.3, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 320,
                  damping: 16,
                  delay: reduce ? 0 : 0.55,
                }}
              >
                {selling ? <Store className="size-10" /> : <ShoppingBag className="size-10" />}
              </motion.span>
            </div>

            <motion.p
              className="mt-6 text-[12px] font-semibold tracking-[0.14em] uppercase"
              style={{ color: colors.accent }}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 0.85, y: 0 }}
              transition={{ duration: 0.35, delay: reduce ? 0 : 0.35 }}
            >
              {selling ? "Switching to selling" : "Switching to buying"}
            </motion.p>
            <motion.p
              className="mt-2 max-w-[18ch] text-[clamp(30px,6vw,52px)] leading-[1.05] font-bold tracking-[-0.035em]"
              initial={reduce ? false : { opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, delay: reduce ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.p>

            {highlights.length > 0 && (
              <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
                {highlights.map((h, i) => (
                  <motion.li
                    key={h.label}
                    className="flex items-center gap-2 rounded-full bg-white/12 py-2 pr-4 pl-2.5 text-[14px] ring-1 ring-white/20 backdrop-blur-sm"
                    initial={reduce ? false : { opacity: 0, y: 14, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 22,
                      delay: reduce ? 0 : 0.6 + i * 0.08,
                    }}
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-white/18">
                      <h.icon className="size-4" aria-hidden />
                    </span>
                    <b className="font-semibold tabular">
                      <CountUp
                        value={h.value}
                        format={(v) =>
                          h.money ? formatNairaCompact(Math.round(v)) : String(Math.round(v))
                        }
                      />
                    </b>
                    <span className="text-white/80">{h.label}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
