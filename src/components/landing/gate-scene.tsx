"use client";

import { useEffect, useRef } from "react";

/**
 * The hero scene: the University of Lagos main gate with the Senate tower behind
 * it, palm trees, the lagoon and traffic on the campus road. It's flat 2D drawn
 * with a lit top, a front and a shaded side, so it reads as 3D. Layers sit at
 * different depths: they drop in from the top on load and drift with the pointer.
 */

const NAVY = "#1b1f3b";

/** A box with a lit top and a shaded right side, so a flat rectangle reads as a block. */
export function Block({
  x,
  y,
  w,
  h,
  d = 24,
  front,
  side,
  top,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  d?: number;
  front: string;
  side: string;
  top: string;
}) {
  return (
    <g>
      <path d={`M${x} ${y} l${d} -${d * 0.7} h${w} l-${d} ${d * 0.7} Z`} fill={top} />
      <path d={`M${x + w} ${y} l${d} -${d * 0.7} v${h} l-${d} ${d * 0.7} Z`} fill={side} />
      <rect x={x} y={y} width={w} height={h} fill={front} />
    </g>
  );
}

export function Palm({
  x,
  y,
  s = 1,
  delay = 0,
}: {
  x: number;
  y: number;
  s?: number;
  delay?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M0 0 Q6 -60 -4 -120"
        stroke="#8a5a2b"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <g className="lp-sway" style={{ animationDelay: `${delay}s` }}>
        {[-150, -110, -70, -30, 10].map((a, i) => (
          <path
            key={i}
            d="M-4 -120 q30 -24 64 4 q-34 -8 -64 -4 Z"
            fill={i % 2 ? "#1f9d63" : "#2bb673"}
            transform={`rotate(${a + 60} -4 -120)`}
          />
        ))}
      </g>
    </g>
  );
}

/** Pointer parallax for a scene: writes the pointer position to --px/--py on the
 * enclosing section; each `.lp-layer[data-depth]` moves by its depth. */
export function useParallax(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current?.closest("section") ?? ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--px", px.toFixed(3));
        el.style.setProperty("--py", py.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref]);
}

/** Puffy clouds with a lit top and a shaded underside; three depths, three speeds. */
export function Clouds3D() {
  const clouds = [
    { top: "8%", w: 120, dur: "52s", delay: "-10s", depth: "far" },
    { top: "26%", w: 90, dur: "60s", delay: "-40s", depth: "far" },
    { top: "4%", w: 200, dur: "36s", delay: "-4s", depth: "mid" },
    { top: "38%", w: 170, dur: "40s", delay: "-24s", depth: "mid" },
    { top: "16%", w: 280, dur: "26s", delay: "-16s", depth: "near" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {clouds.map((c, i) => (
        <div
          key={i}
          data-depth={c.depth}
          className="lp-layer absolute inset-x-0"
          style={{ top: c.top }}
        >
          <div
            className="lp-cloud"
            style={
              {
                width: c.w,
                ["--lp-dur" as string]: c.dur,
                ["--lp-delay" as string]: c.delay,
                opacity: c.depth === "far" ? 0.7 : 1,
                filter: c.depth === "far" ? "blur(0.6px)" : undefined,
              } as React.CSSProperties
            }
          >
            <div className="lp-float" style={{ animationDelay: `${i * -1.1}s` }}>
              <svg
                viewBox="0 0 240 110"
                className="w-full drop-shadow-[0_14px_14px_rgba(27,31,59,0.12)]"
              >
                <path
                  d="M24 96 a30 30 0 0 1 10 -54 a44 44 0 0 1 80 -18 a38 38 0 0 1 66 14 a32 32 0 0 1 36 58 Z"
                  fill="#ffffff"
                />
                <path
                  d="M24 96 a30 30 0 0 1 -6 -24 q90 26 196 0 a32 32 0 0 1 2 24 Z"
                  fill="#dfe5f2"
                />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function GateScene({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useParallax(ref);

  return (
    <div ref={ref} className={className} aria-hidden>
      <svg
        viewBox="0 120 1440 400"
        preserveAspectRatio="xMidYMax slice"
        className="block h-full w-full overflow-visible"
      >
        {/* Far: Senate tower, hostels, the lagoon with a boat */}
        <g data-depth="far" className="lp-layer">
          <path d="M1180 470 H1440 V500 H1180 Z" fill="#9fd8ff" />
          <g className="lp-bob" style={{ animationDuration: "4s" }}>
            <path d="M1300 474 h54 l-10 12 h-36 Z" fill="#ff6a4d" />
            <path d="M1326 474 V448 l18 22 Z" fill="#ffffff" />
          </g>
          <g className="lp-drop" style={{ animationDelay: "0.05s" }}>
            <Block
              x={120}
              y={150}
              w={120}
              h={350}
              d={30}
              front="#c4d3ff"
              side="#8fa6f0"
              top="#e6ecff"
            />
            {Array.from({ length: 9 }, (_, r) =>
              [0, 1, 2].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={134 + c * 36}
                  y={170 + r * 34}
                  width="22"
                  height="20"
                  rx="2"
                  fill="#3a5bff"
                  opacity={(r + c) % 4 === 0 ? 0.9 : 0.35}
                />
              )),
            )}
          </g>
          <g className="lp-drop" style={{ animationDelay: "0.12s" }}>
            <Block
              x={1190}
              y={300}
              w={210}
              h={170}
              d={26}
              front="#ffd9cf"
              side="#f0a896"
              top="#fff0eb"
            />
            {[0, 1, 2].map((r) =>
              [0, 1, 2, 3, 4].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={1204 + c * 40}
                  y={316 + r * 46}
                  width="24"
                  height="26"
                  rx="3"
                  fill="#ff6a4d"
                  opacity={(r * 5 + c) % 3 === 0 ? 0.85 : 0.35}
                />
              )),
            )}
          </g>
        </g>

        {/* Mid: library and the main gate */}
        <g data-depth="mid" className="lp-layer">
          <ellipse
            className="lp-shadow"
            cx="730"
            cy="500"
            rx="320"
            ry="14"
            fill="#1b1f3b"
            opacity="0.1"
          />
          <g className="lp-drop" style={{ animationDelay: "0.18s" }}>
            <Block
              x={270}
              y={350}
              w={170}
              h={150}
              d={24}
              front="#d6f7e8"
              side="#8fd9b6"
              top="#effcf6"
            />
            <path d="M262 350 L355 318 L448 350 Z" fill="#3ddc97" />
            {[0, 1].map((r) =>
              [0, 1, 2, 3].map((c) => (
                <rect
                  key={`${r}-${c}`}
                  x={284 + c * 38}
                  y={386 + r * 50}
                  width="26"
                  height="34"
                  rx="13"
                  fill="#1b1f3b"
                  opacity="0.75"
                />
              )),
            )}
          </g>
          <g className="lp-drop" style={{ animationDelay: "0.28s" }}>
            <g transform="translate(170 -66)">
              <path d="M820 300 l34 -22 v270 l-34 18 Z" fill="#c9ced9" />
              <path d="M300 300 l34 -22 h520 l-34 22 Z" fill="#ffffff" />
              <path
                d="M300 300 H820 V566 H790 V486 A45 45 0 0 0 700 486 V566 H670 V440 A110 110 0 0 0 450 440 V566 H420 V486 A45 45 0 0 0 330 486 V566 H300 Z"
                fill="#f2efe8"
              />
              <path d="M300 300 H820 V372 H300 Z" fill="#ffffff" />
              <path d="M300 372 H820" stroke="#d8d2c4" strokeWidth="6" />
              <path
                d="M450 440 A110 110 0 0 1 670 440 l-16 6 A94 94 0 0 0 466 446 Z"
                fill="#d8d2c4"
              />
              <path
                d="M330 486 A45 45 0 0 1 420 486 l-10 4 A35 35 0 0 0 340 490 Z"
                fill="#d8d2c4"
              />
              <path
                d="M700 486 A45 45 0 0 1 790 486 l-10 4 A35 35 0 0 0 710 490 Z"
                fill="#d8d2c4"
              />
              <rect x="534" y="244" width="52" height="40" rx="6" fill="#3a5bff" />
              <path
                d="M560 252 l5 10 l11 2 l-8 8 l2 11 l-10 -5 l-10 5 l2 -11 l-8 -8 l11 -2 Z"
                fill="#ffd23f"
              />
              {[318, 802].map((fx, i) => (
                <g key={fx}>
                  <path d={`M${fx} 300 V236`} stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
                  <g className="lp-wave" style={{ animationDelay: `${i * -0.5}s` }}>
                    <path d={`M${fx + 2} 238 h40 v24 h-40 Z`} fill="#3a5bff" />
                    <path d={`M${fx + 15} 238 h14 v24 h-14 Z`} fill="#ffffff" />
                  </g>
                </g>
              ))}
            </g>
          </g>
        </g>

        {/* Near: palms */}
        <g data-depth="near" className="lp-layer">
          {[
            [40, 1.2, 0.4, 0],
            [470, 1.15, 0.5, -0.6],
            [1050, 1.2, 0.6, -1.2],
            [1420, 1.1, 0.7, -0.3],
          ].map(([x, s, d, sd], i) => (
            <g key={i} className="lp-grow" style={{ animationDelay: `${d}s` }}>
              <Palm x={x!} y={500} s={s!} delay={sd!} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/** The campus road along the bottom of the hero, with a keke and a danfo driving past. */
export function RoadStrip() {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="xMidYMax slice"
      className="block h-[70px] w-full md:h-[90px]"
      aria-hidden
    >
      <rect x="0" y="0" width="1440" height="16" fill="#3ddc97" />
      <rect x="0" y="16" width="1440" height="74" fill="#2a2d3e" />
      <path d="M0 54 H1440" stroke="#f6f6f4" strokeWidth="4" strokeDasharray="34 26" />
      <g transform="translate(0 20)">
        <g className="lp-drive">
          <rect x="0" y="0" width="110" height="34" rx="12" fill="#ffd23f" />
          <rect x="0" y="0" width="110" height="10" rx="5" fill="#ffe680" />
          <rect x="14" y="6" width="40" height="14" rx="3" fill="#9fd8ff" />
          <rect x="66" y="6" width="22" height="14" rx="3" fill="#9fd8ff" />
          <circle className="lp-wheel" cx="22" cy="38" r="10" fill="#111" />
          <circle className="lp-wheel" cx="92" cy="38" r="10" fill="#111" />
        </g>
      </g>
      <g transform="translate(0 12)">
        <g className="lp-drive-slow">
          <rect x="0" y="0" width="170" height="44" rx="10" fill="#ff6a4d" />
          <rect x="0" y="0" width="170" height="10" rx="5" fill="#ff9a84" />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={12 + i * 36} y="10" width="28" height="16" rx="3" fill="#9fd8ff" />
          ))}
          <circle className="lp-wheel" cx="30" cy="48" r="11" fill="#111" />
          <circle className="lp-wheel" cx="138" cy="48" r="11" fill="#111" />
        </g>
      </g>
    </svg>
  );
}
