"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bike, Inbox } from "lucide-react";
import { create } from "zustand";
import { isActive as orderIsActive } from "@/domain/orders";
import { useMyOrders } from "@/queries/orders";
import { useMyBrand, useStudioOrders } from "@/queries/studio";
import { useUi } from "@/stores/ui";
import { modeForPath, type Mode } from "./mode";

type Phase = "idle" | "cover" | "hold" | "reveal";
type Point = { x: number; y: number };

type CurtainState = {
  phase: Phase;
  target: Mode;
  href: string;
  /** Where the switch was tapped; the circle grows from here. */
  origin: Point | null;
  start: (target: Mode, href: string, origin?: Point) => void;
  set: (p: Partial<Pick<CurtainState, "phase">>) => void;
};

export const useCurtain = create<CurtainState>((set, get) => ({
  phase: "idle",
  target: "buying",
  href: "/",
  origin: null,
  start: (target, href, origin) => {
    if (get().phase !== "idle") return;
    // Whatever was open (the phone menu, search, the bag) belongs to the side you're leaving.
    useUi.setState({ menuOpen: false, commandOpen: false, bagOpen: false });
    set({ phase: "cover", target, href, origin: origin ?? null });
  },
  set: (p) => set(p),
}));

/** The middle of an element, for growing the circle from a button. */
export function centerOf(el: Element): Point {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

const COVER_S = 0.5;
const REVEAL_S = 0.5;
/** Long enough to see where you're going, short enough not to wait on it. */
const MIN_HOLD_MS = 420;
const ease = [0.65, 0, 0.35, 1] as const;

const background: Record<Mode, string> = {
  selling: "#1b1f3b",
  buying: "#3a5bff",
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

/** One live fact about where you're going, only when it's worth saying. */
function useHeadline(target: Mode) {
  const shopOrders = useStudioOrders().data;
  const myOrders = useMyOrders().data;
  if (target === "selling") {
    const waiting = shopOrders?.filter((o) => o.status === "placed").length ?? 0;
    return waiting > 0
      ? { icon: Inbox, text: `${waiting} new ${waiting === 1 ? "order" : "orders"} waiting` }
      : null;
  }
  const onTheWay = myOrders?.filter((o) => orderIsActive(o.status)).length ?? 0;
  return onTheWay > 0
    ? { icon: Bike, text: `${onTheWay} ${onTheWay === 1 ? "order" : "orders"} on the way` }
    : null;
}

const K = "#1b1f3b";

/**
 * The picture in the middle of the curtain. Selling: a little shopfront whose
 * striped awning rolls down as it opens. Buying: a bag that things drop into.
 */
function ModeArt({ selling, still }: { selling: boolean; still: boolean }) {
  const d = (delay: number) => ({ delay: still ? 0 : delay });
  if (selling)
    return (
      <svg viewBox="0 0 64 64" className="size-12" aria-hidden>
        <rect
          x="10"
          y="22"
          width="44"
          height="32"
          rx="3"
          fill="#eef1ff"
          stroke={K}
          strokeWidth="2.5"
        />
        <rect
          x="26"
          y="34"
          width="12"
          height="20"
          rx="1.5"
          fill="#3a5bff"
          stroke={K}
          strokeWidth="2.5"
        />
        <rect
          x="14"
          y="32"
          width="9"
          height="9"
          rx="1.5"
          fill="#ffd84d"
          stroke={K}
          strokeWidth="2"
        />
        <rect
          x="41"
          y="32"
          width="9"
          height="9"
          rx="1.5"
          fill="#ffd84d"
          stroke={K}
          strokeWidth="2"
        />
        <motion.g
          style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
          initial={still ? false : { scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, ...d(0.45) }}
        >
          <path
            d="M6 14 H58 L54 26 H10 Z"
            fill="#ffffff"
            stroke={K}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M15 14 L13 26 M24 14 L23 26 M33 14 V26 M42 14 L42 26 M51 14 L52 26"
            stroke="#3a5bff"
            strokeWidth="5"
          />
          <path
            d="M6 14 H58 L54 26 H10 Z"
            fill="none"
            stroke={K}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </motion.g>
        <rect x="8" y="9" width="48" height="6" rx="2" fill={K} />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" className="size-12" aria-hidden>
      <motion.circle
        cx="26"
        cy="24"
        r="7"
        fill="#ff6a4d"
        stroke={K}
        strokeWidth="2.5"
        initial={still ? false : { y: -26, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16, ...d(0.45) }}
      />
      <motion.rect
        x="33"
        y="16"
        width="11"
        height="14"
        rx="2"
        fill="#ffd84d"
        stroke={K}
        strokeWidth="2.5"
        initial={still ? false : { y: -30, rotate: -20, opacity: 0 }}
        animate={{ y: 0, rotate: 8, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 16, ...d(0.6) }}
      />
      <path d="M22 26 V20 a10 10 0 0 1 20 0 V26" fill="none" stroke={K} strokeWidth="2.5" />
      <path
        d="M12 26 H52 L48 56 H16 Z"
        fill="#3a5bff"
        stroke={K}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M14 30 H50" stroke="#7d93ff" strokeWidth="3" />
    </svg>
  );
}

/**
 * The switch between buying and selling. A green circle grows from the switch,
 * the destination's badge (your shop's logo, or the bag) lands in the middle,
 * the page changes underneath, and the circle shrinks into the new page's logo.
 * Reduced motion: a short fade.
 */
export function ModeCurtain() {
  const { phase, target, href, origin, set } = useCurtain();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const reduce = useReducedMotion();
  const { data: brand } = useMyBrand();
  const headline = useHeadline(target);
  const covered = useRef(false);
  const coveredAt = useRef(0);
  const [geo, setGeo] = useState<{ from: Point; radius: number; to: Point } | null>(null);

  // Work out the circle's size when a switch starts.
  useEffect(() => {
    if (phase !== "cover") return;
    const from = origin ?? { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measured from the window once per switch
    setGeo({ from, radius: farthestCorner(from), to: from });
  }, [phase, origin]);

  // Once the destination is on screen, shrink into its logo.
  useEffect(() => {
    if (phase !== "hold" || modeForPath(pathname) !== target) return;
    const wait = Math.max(120, MIN_HOLD_MS - (Date.now() - coveredAt.current));
    const t = window.setTimeout(() => {
      setGeo((g) => (g ? { ...g, to: logoPoint() } : g));
      set({ phase: "reveal" });
    }, wait);
    return () => window.clearTimeout(t);
  }, [phase, pathname, target, set]);

  // Never leave the cover up (a slow network or a blocked navigation).
  useEffect(() => {
    if (phase !== "hold") return;
    const t = window.setTimeout(() => set({ phase: "reveal" }), 3000);
    return () => window.clearTimeout(t);
  }, [phase, set]);

  const selling = target === "selling";
  const visible = (phase === "cover" || phase === "hold") && (reduce || geo !== null);
  const title = selling ? (brand?.name ?? "Your shop") : "The market";

  return (
    <AnimatePresence
      onExitComplete={() => {
        covered.current = false;
        setGeo(null);
        set({ phase: "idle" });
      }}
    >
      {visible && (
        <motion.div
          key="curtain"
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-(--z-curtain) grid place-items-center overflow-hidden text-white"
          // Its own view-transition layer, so the page cross-fade under it never fades the cover.
          style={{ background: background[target], viewTransitionName: "mode-curtain" }}
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
          {/* Soft light from where you tapped. */}
          {geo && !reduce && (
            <span
              aria-hidden
              className="pointer-events-none absolute size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_65%)]"
              style={{ left: geo.from.x, top: geo.from.y }}
            />
          )}
          <motion.div
            className="relative flex flex-col items-center px-6 text-center"
            initial={reduce ? false : { y: 16, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduce ? undefined : { y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24, delay: reduce ? 0 : 0.18 }}
          >
            <div className="relative grid size-[76px] place-items-center">
              {!reduce && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-[22px] ring-2 ring-white/40"
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1.45, opacity: 0 }}
                  transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
                />
              )}
              <motion.span
                className="grid size-[76px] place-items-center overflow-hidden rounded-[22px] bg-white text-[#3a5bff] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]"
                initial={reduce ? false : { scale: 0.4, rotate: selling ? -14 : 14 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 18,
                  delay: reduce ? 0 : 0.22,
                }}
              >
                <ModeArt selling={selling} still={!!reduce} />
              </motion.span>
            </div>
            <p className="mt-5 text-[12px] font-semibold tracking-[0.14em] text-white/85 uppercase">
              {selling ? "Selling" : "Buying"}
            </p>
            <p className="mt-1 max-w-[18ch] text-[clamp(26px,5vw,40px)] leading-[1.1] font-semibold tracking-[-0.03em]">
              {title}
            </p>
            {headline && (
              <motion.p
                className="mt-4 flex items-center gap-2 rounded-full bg-black/20 py-1.5 pr-3.5 pl-2 text-[13.5px]"
                initial={reduce ? false : { y: 8 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: reduce ? 0 : 0.34,
                }}
              >
                <span className="grid size-6 place-items-center rounded-full bg-white/20">
                  <headline.icon className="size-3.5" aria-hidden />
                </span>
                {headline.text}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
