"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { buddyColors, type Buddy, type BuddyShape } from "@/domain/buddy";
import { cn } from "@/lib/cn";

type Point = readonly [number, number];
type Geometry = {
  /** Body outline in a 100×100 box. */
  d: string;
  /** Eye line, half the distance between the eyes, and the mouth line. */
  eyes: number;
  gap: number;
  mouth: number;
  /** Where the arms join the body. */
  armL: Point;
  armR: Point;
  /** Shine on the top-left of the body. */
  gloss: Point;
};

/** A five-point star with soft points (the outline is also stroked round). */
function starPath(cx: number, cy: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

const shapes: Record<BuddyShape, Geometry> = {
  blob: {
    d: "M50 20C68 19 81 31 81 50C82 70 70 85 50 85C30 85 18 72 19 52C19 32 32 21 50 20Z",
    eyes: 50,
    gap: 10,
    mouth: 62,
    armL: [22, 60],
    armR: [78, 60],
    gloss: [34, 32],
  },
  bean: {
    d: "M50 18C66 18 75 30 75 46L75 62C75 76 64 86 50 86C36 86 25 76 25 62L25 46C25 30 34 18 50 18Z",
    eyes: 46,
    gap: 9,
    mouth: 58,
    armL: [27, 58],
    armR: [73, 58],
    gloss: [37, 29],
  },
  cube: {
    d: "M35 24H65Q78 24 78 37V71Q78 84 65 84H35Q22 84 22 71V37Q22 24 35 24Z",
    eyes: 49,
    gap: 11,
    mouth: 62,
    armL: [24, 60],
    armR: [76, 60],
    gloss: [33, 34],
  },
  cloud: {
    d: "M30 84C19 84 12 77 12 68C12 60 18 54 26 53C26 41 36 32 48 32C57 32 64 37 68 44C78 44 88 52 88 64C88 75 80 84 69 84Z",
    eyes: 60,
    gap: 10,
    mouth: 71,
    armL: [15, 72],
    armR: [85, 72],
    gloss: [38, 42],
  },
  star: {
    d: starPath(50, 56, 36, 18),
    eyes: 55,
    gap: 7.5,
    mouth: 65,
    armL: [33, 70],
    armR: [67, 70],
    gloss: [44, 34],
  },
  drop: {
    d: "M50 14C50 14 78 44 78 62C78 77 66 88 50 88C34 88 22 77 22 62C22 44 50 14 50 14Z",
    eyes: 61,
    gap: 9,
    mouth: 72,
    armL: [24, 68],
    armR: [76, 68],
    gloss: [38, 46],
  },
  heart: {
    d: "M50 86C50 86 16 65 16 42C16 30 25 22 35 22C42 22 47 26 50 31C53 26 58 22 65 22C75 22 84 30 84 42C84 65 50 86 50 86Z",
    eyes: 45,
    gap: 11,
    mouth: 57,
    armL: [19, 50],
    armR: [81, 50],
    gloss: [30, 32],
  },
};

const ACTS = ["wave", "jump", "spin", "wink", "dance"] as const;
type Act = (typeof ACTS)[number];
const actMs: Record<Act, number> = { wave: 1300, jump: 950, spin: 1000, wink: 800, dance: 1500 };
const INK = "#1f2430";

/** The drawing alone, 100×100, scaled to whatever box it's put in. */
function BuddyArt({ buddy, act }: { buddy: Buddy; act: { name: Act; n: number } | null }) {
  const g = shapes[buddy.shape];
  const c = buddyColors[buddy.color];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fill = `url(#${id}-body)`;
  const arm = (side: "l" | "r", [x, y]: Point) => {
    const dir = side === "l" ? -1 : 1;
    return (
      <g className={`buddy-arm buddy-arm-${side}`} style={{ transformOrigin: `${x}px ${y}px` }}>
        <path
          d={`M${x} ${y}Q${x + dir * 9} ${y + 3} ${x + dir * 10} ${y + 13}`}
          fill="none"
          stroke={c.shade}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle
          cx={x + dir * 10}
          cy={y + 14}
          r={4.6}
          fill={c.base}
          stroke={c.shade}
          strokeWidth={2}
        />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 100 100" className="size-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={`${id}-body`} cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="52%" stopColor={c.base} />
          <stop offset="100%" stopColor={c.shade} />
        </radialGradient>
      </defs>
      <ellipse
        cx={50}
        cy={93}
        rx={21}
        ry={3.2}
        fill="#000"
        opacity={0.12}
        className="buddy-ground"
      />
      <g key={act?.n ?? 0} data-act={act?.name} className="buddy-act">
        <g className="buddy-idle">
          <path
            d={g.d}
            fill={fill}
            stroke={buddy.shape === "star" ? fill : c.shade}
            strokeWidth={buddy.shape === "star" ? 9 : 1.2}
            strokeLinejoin="round"
          />
          <ellipse
            cx={g.gloss[0]}
            cy={g.gloss[1]}
            rx={7}
            ry={3.6}
            fill="#fff"
            opacity={0.55}
            transform={`rotate(-32 ${g.gloss[0]} ${g.gloss[1]})`}
          />
          {/* Arms in front of the body, so a raised hand is never hidden. */}
          {arm("l", g.armL)}
          {arm("r", g.armR)}
          {/* Cheeks */}
          <ellipse
            cx={50 - g.gap - 6}
            cy={g.eyes + 8}
            rx={4.4}
            ry={2.6}
            fill="#ff5d8f"
            opacity={0.32}
          />
          <ellipse
            cx={50 + g.gap + 6}
            cy={g.eyes + 8}
            rx={4.4}
            ry={2.6}
            fill="#ff5d8f"
            opacity={0.32}
          />
          {/* Eyes */}
          {([-1, 1] as const).map((s) => (
            <g key={s} className={cn("buddy-eye", s < 0 ? "buddy-eye-l" : "buddy-eye-r")}>
              <ellipse cx={50 + s * g.gap} cy={g.eyes} rx={4.2} ry={5.6} fill={INK} />
              <circle cx={50 + s * g.gap + 1.5} cy={g.eyes - 2.2} r={1.7} fill="#fff" />
              <circle
                cx={50 + s * g.gap - 1.4}
                cy={g.eyes + 2.2}
                r={0.8}
                fill="#fff"
                opacity={0.8}
              />
            </g>
          ))}
          {/* Mouth: a smile, or open and happy while it's doing something. */}
          <path
            className="buddy-smile"
            d={`M${45} ${g.mouth}Q50 ${g.mouth + 5} ${55} ${g.mouth}`}
            fill="none"
            stroke={INK}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <g className="buddy-open">
            <path
              d={`M44.5 ${g.mouth - 0.5}Q50 ${g.mouth + 10} 55.5 ${g.mouth - 0.5}Z`}
              fill={INK}
            />
            <path
              d={`M47 ${g.mouth + 4.2}Q50 ${g.mouth + 2} 53 ${g.mouth + 4.2}Q50 ${g.mouth + 7.5} 47 ${g.mouth + 4.2}Z`}
              fill="#ff7a90"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * A customer's animated buddy in a round frame. It breathes and blinks, waves
 * hello, and now and then jumps, spins, winks or dances; pointing at it makes
 * it wave. Still when reduced motion is on or `animated` is false.
 */
export function BuddyAvatar({
  buddy,
  size = 36,
  animated = true,
  className,
  label,
}: {
  buddy: Buddy;
  size?: number;
  animated?: boolean;
  className?: string;
  /** Accessible name; decorative when omitted. */
  label?: string;
}) {
  const reduce = useReducedMotion();
  const live = animated && !reduce;
  const [act, setAct] = useState<{ name: Act; n: number } | null>(null);
  const busy = useRef(false);
  const counter = useRef(0);
  const playRef = useRef<(name: Act) => void>(() => undefined);

  useEffect(() => {
    let clear = 0;
    playRef.current = (name: Act) => {
      if (!live || busy.current) return;
      busy.current = true;
      counter.current += 1;
      setAct({ name, n: counter.current });
      clear = window.setTimeout(() => {
        busy.current = false;
        setAct(null);
      }, actMs[name]);
    };
    if (!live) return;
    // Hello, then something now and then.
    const hello = window.setTimeout(() => playRef.current("wave"), 700);
    let idle = 0;
    const next = () => {
      idle = window.setTimeout(
        () => {
          playRef.current(ACTS[Math.floor(Math.random() * ACTS.length)]!);
          next();
        },
        7000 + Math.random() * 6000,
      );
    };
    next();
    return () => {
      window.clearTimeout(hello);
      window.clearTimeout(idle);
      window.clearTimeout(clear);
      busy.current = false;
    };
  }, [live]);

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      onPointerEnter={() => playRef.current("wave")}
      className={cn(
        "buddy relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full",
        live && "buddy-live",
        className,
      )}
      style={{ width: size, height: size, background: buddyColors[buddy.color].bg }}
    >
      <span className="block size-[88%] translate-y-[4%]">
        <BuddyArt buddy={buddy} act={live ? act : null} />
      </span>
    </span>
  );
}
