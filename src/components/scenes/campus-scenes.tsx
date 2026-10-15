"use client";

import { useReducedMotion } from "motion/react";
import { useRef } from "react";
import { Block, Clouds3D, Palm, useParallax } from "@/components/landing/gate-scene";
import { cn } from "@/lib/cn";

/**
 * UNILAG landmarks, one per page, drawn the same way as the landing scene: flat
 * shapes with a lit top and a shaded side so they read as 3D, layers at three
 * depths that drift with the pointer, things that drop in from above, and a
 * little life (water moving, awnings flapping, a keke on its route). No text.
 */

function SceneSvg({
  className,
  viewBox = "0 0 1440 400",
  children,
}: {
  className?: string;
  viewBox?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref);
  return (
    <div ref={ref} className={cn("overflow-hidden", className)} aria-hidden>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMax slice"
        className="block h-full w-full overflow-visible"
      >
        {children}
      </svg>
    </div>
  );
}

function Sun({
  x,
  y,
  r = 46,
  color = "#ffd23f",
}: {
  x: number;
  y: number;
  r?: number;
  color?: string;
}) {
  return (
    <g className="lp-drop" style={{ animationDelay: "0s" }}>
      <circle cx={x} cy={y} r={r + 18} fill={color} opacity="0.25" className="lp-twinkle" />
      <circle cx={x} cy={y} r={r} fill={color} />
    </g>
  );
}

function RoundTree({
  x,
  y,
  r,
  fill = "#2bb673",
  delay = 0,
}: {
  x: number;
  y: number;
  r: number;
  fill?: string;
  delay?: number;
}) {
  return (
    <g className="lp-grow" style={{ animationDelay: `${delay}s` }}>
      <g className="lp-sway" style={{ animationDelay: `${-delay * 2}s` }}>
        <rect x={x - 4} y={y - r * 0.2} width="8" height={r * 1.1} rx="3" fill="#8a5a2b" />
        <circle cx={x} cy={y - r * 0.6} r={r} fill={fill} />
        <circle cx={x - r * 0.35} cy={y - r * 0.85} r={r * 0.45} fill="#ffffff" opacity="0.18" />
      </g>
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 2.5} y={y - 90} width="5" height="90" fill="#1b1f3b" />
      <rect x={x - 10} y={y - 102} width="20" height="14" rx="4" fill="#1b1f3b" />
      <circle cx={x} cy={y - 86} r="7" fill="#ffd23f" className="lp-twinkle" />
    </g>
  );
}

/* ------------------------------------------------------------- Lagoon Front */

/**
 * Home: the Lagoon Front at golden hour. The water moves, a canoe and a sailing
 * boat drift past, the Senate tower and the bridge sit across the lagoon, and
 * benches and palms line the bank.
 */
export function LagoonScene({ className }: { className?: string }) {
  return (
    <SceneSvg className={className}>
      <g data-depth="far" className="lp-layer">
        <Sun x={1180} y={110} />
        {/* Senate tower and the skyline across the water */}
        <g className="lp-drop" style={{ animationDelay: "0.1s" }}>
          <Block
            x={980}
            y={90}
            w={110}
            h={200}
            d={26}
            front="#c4d3ff"
            side="#8fa6f0"
            top="#e6ecff"
          />
          {Array.from({ length: 6 }, (_, r) =>
            [0, 1, 2].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={992 + c * 33}
                y={108 + r * 30}
                width="20"
                height="16"
                rx="2"
                fill="#3a5bff"
                opacity={(r + c) % 3 === 0 ? 0.85 : 0.3}
              />
            )),
          )}
          <Block
            x={860}
            y={200}
            w={90}
            h={90}
            d={18}
            front="#dfe5ff"
            side="#a9b8f5"
            top="#f2f4ff"
          />
          <Block
            x={1140}
            y={180}
            w={130}
            h={110}
            d={20}
            front="#ffd9cf"
            side="#f0a896"
            top="#fff0eb"
          />
        </g>
        {/* The bridge on the horizon */}
        <g className="lp-drop" style={{ animationDelay: "0.2s" }}>
          <path d="M0 262 Q720 236 1440 262 V272 Q720 246 0 272 Z" fill="#8fa6f0" />
          {Array.from({ length: 18 }, (_, i) => (
            <rect
              key={i}
              x={40 + i * 80}
              y={268 - Math.sin((i / 17) * Math.PI) * 24}
              width="8"
              height="26"
              fill="#8fa6f0"
            />
          ))}
        </g>
      </g>

      {/* The lagoon */}
      <rect x="0" y="290" width="1440" height="110" fill="#7fc2f5" />
      <g className="lp-stripes">
        {Array.from({ length: 16 }, (_, i) => (
          <path
            key={i}
            d={`M${i * 180} ${310 + (i % 3) * 22} q22 -8 44 0 t44 0`}
            stroke="#ffffff"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />
        ))}
      </g>

      <g data-depth="mid" className="lp-layer">
        {/* Sailing boat drifting across */}
        <g transform="translate(0 270)">
          <g className="lp-drive-slow">
            <g className="lp-bob" style={{ animationDuration: "3s" }}>
              <path d="M0 40 h90 l-14 18 h-62 Z" fill="#ff6a4d" />
              <path d="M44 40 V-30 L90 32 Z" fill="#ffffff" />
              <path d="M40 40 V-10 L8 32 Z" fill="#ffd23f" />
            </g>
          </g>
        </g>
        {/* Canoe with a paddler's pole, bobbing in place */}
        <g className="lp-bob" style={{ animationDuration: "4.4s" }}>
          <path d="M520 340 q80 22 160 0 q-12 16 -80 16 q-68 0 -80 -16 Z" fill="#8a5a2b" />
          <path d="M600 342 L630 290" stroke="#1b1f3b" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>

      <g data-depth="near" className="lp-layer">
        {/* The bank: path, benches, lamps, palms */}
        <path d="M0 360 Q300 330 560 372 L560 400 L0 400 Z" fill="#3ddc97" />
        <path d="M0 376 Q300 350 560 388 L560 400 L0 400 Z" fill="#e9dcc3" />
        <g className="lp-grow" style={{ animationDelay: "0.5s" }}>
          <rect x="150" y="340" width="90" height="10" rx="4" fill="#1b1f3b" />
          <rect x="150" y="322" width="90" height="10" rx="4" fill="#ff6a4d" />
          <rect x="158" y="350" width="6" height="18" fill="#1b1f3b" />
          <rect x="226" y="350" width="6" height="18" fill="#1b1f3b" />
        </g>
        <Lamp x={300} y={372} />
        <g className="lp-grow" style={{ animationDelay: "0.4s" }}>
          <Palm x={70} y={372} s={1.25} />
        </g>
        <g className="lp-grow" style={{ animationDelay: "0.6s" }}>
          <Palm x={440} y={380} s={1.05} delay={-1} />
        </g>
        <g className="lp-grow" style={{ animationDelay: "0.7s" }}>
          <Palm x={1400} y={400} s={1.2} delay={-0.5} />
        </g>
      </g>
    </SceneSvg>
  );
}

/* --------------------------------------------------------------- Main Library */

/**
 * Your dashboard: the Main Library with its long window bands and wide steps,
 * round trees either side and pages fluttering up from an open book.
 */
export function LibraryScene({ className }: { className?: string }) {
  return (
    <SceneSvg className={className} viewBox="0 70 1440 330">
      <g data-depth="far" className="lp-layer">
        <Sun x={220} y={90} r={38} color="#ffe680" />
        <g className="lp-drop" style={{ animationDelay: "0.05s" }}>
          <Block
            x={1160}
            y={150}
            w={200}
            h={220}
            d={24}
            front="#d6f7e8"
            side="#8fd9b6"
            top="#effcf6"
          />
          {[0, 1, 2, 3].map((r) => (
            <rect
              key={r}
              x={1176}
              y={170 + r * 48}
              width="168"
              height="22"
              rx="3"
              fill="#0d6b47"
              opacity="0.35"
            />
          ))}
        </g>
      </g>
      <g data-depth="mid" className="lp-layer">
        <ellipse
          className="lp-shadow"
          cx="720"
          cy="372"
          rx="420"
          ry="12"
          fill="#1b1f3b"
          opacity="0.1"
        />
        <g className="lp-drop" style={{ animationDelay: "0.15s" }}>
          <Block
            x={360}
            y={130}
            w={720}
            h={200}
            d={34}
            front="#fff4d6"
            side="#e8d3a3"
            top="#fffaf0"
          />
          {/* Long window bands */}
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect
                x={380}
                y={150 + r * 56}
                width="680"
                height="30"
                rx="4"
                fill="#3a5bff"
                opacity="0.85"
              />
              {Array.from({ length: 16 }, (_, c) => (
                <rect
                  key={c}
                  x={420 + c * 40}
                  y={150 + r * 56}
                  width="5"
                  height="30"
                  fill="#fff4d6"
                />
              ))}
            </g>
          ))}
          {/* Roof slab */}
          <rect x="340" y="114" width="760" height="18" rx="4" fill="#1b1f3b" />
          {/* Steps */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={560 - i * 30}
              y={330 + i * 11}
              width={320 + i * 60}
              height="12"
              fill={i % 2 ? "#e8d3a3" : "#f4e6c4"}
            />
          ))}
          {/* Door */}
          <rect x="680" y="262" width="80" height="68" rx="6" fill="#1b1f3b" />
        </g>
        {/* Pages fluttering up from an open book on the steps */}
        <g transform="translate(860 330)">
          <path
            d="M0 0 q20 -10 40 0 q20 -10 40 0 v14 q-20 -10 -40 0 q-20 -10 -40 0 Z"
            fill="#ffffff"
          />
          {[0, 1, 2].map((i) => (
            <g
              key={i}
              className="lp-pop"
              style={{ ["--lp-delay" as string]: `${-i * 1.6}s` } as React.CSSProperties}
            >
              <rect
                x={20 + i * 18}
                y={-40 - i * 26}
                width="22"
                height="28"
                rx="3"
                fill={["#ffd23f", "#9fd8ff", "#ffd9cf"][i]}
                transform={`rotate(${-14 + i * 16} ${31 + i * 18} ${-26 - i * 26})`}
              />
            </g>
          ))}
        </g>
      </g>
      <g data-depth="near" className="lp-layer">
        <rect x="0" y="372" width="1440" height="28" fill="#3ddc97" />
        <RoundTree x={240} y={372} r={58} delay={0.4} />
        <RoundTree x={160} y={380} r={40} fill="#1f9d63" delay={0.5} />
        <RoundTree x={1240} y={380} r={52} fill="#1f9d63" delay={0.6} />
        <Lamp x={330} y={378} />
        <Lamp x={1110} y={378} />
      </g>
    </SceneSvg>
  );
}

/* -------------------------------------------------------------- Order route */

/**
 * Orders: a keke riding the campus road from a hall on one side to a faculty
 * on the other, with the route drawn as a dotted line and a pin at each end.
 */
export function RouteScene({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const route = "M210 330 C420 250 560 380 760 320 S1080 250 1230 320";
  return (
    <SceneSvg className={className}>
      <g data-depth="far" className="lp-layer">
        {[160, 520, 980, 1320].map((x, i) => (
          <circle
            key={x}
            cx={x}
            cy={90 + (i % 2) * 40}
            r={6 + (i % 3) * 2}
            fill="#c4d3ff"
            className="lp-twinkle"
            style={{ ["--lp-delay" as string]: `${-i * 0.6}s` } as React.CSSProperties}
          />
        ))}
      </g>
      <g data-depth="mid" className="lp-layer">
        {/* The hall */}
        <g className="lp-drop" style={{ animationDelay: "0.05s" }}>
          <Block
            x={90}
            y={170}
            w={200}
            h={160}
            d={24}
            front="#ffd9cf"
            side="#f0a896"
            top="#fff0eb"
          />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect
                key={`${r}-${c}`}
                x={106 + c * 46}
                y={186 + r * 46}
                width="28"
                height="28"
                rx="3"
                fill="#ff6a4d"
                opacity={(r + c) % 2 ? 0.35 : 0.8}
              />
            )),
          )}
        </g>
        {/* The faculty */}
        <g className="lp-drop" style={{ animationDelay: "0.2s" }}>
          <path d="M1120 200 L1250 150 L1380 200 Z" fill="#3a5bff" />
          <Block
            x={1130}
            y={200}
            w={240}
            h={130}
            d={22}
            front="#f2efe8"
            side="#c9ced9"
            top="#ffffff"
          />
          {[0, 1, 2, 3, 4].map((c) => (
            <rect key={c} x={1148 + c * 46} y={214} width="16" height="116" fill="#ffffff" />
          ))}
        </g>
        {/* Road and route */}
        <path d={route} stroke="#2a2d3e" strokeWidth="44" fill="none" strokeLinecap="round" />
        <path
          d={route}
          stroke="#f6f6f4"
          strokeWidth="4"
          strokeDasharray="18 18"
          fill="none"
          className="lp-dash"
        />
        {/* Pins at both ends */}
        {[
          [210, 318, "#ff6a4d"],
          [1230, 308, "#3a5bff"],
        ].map(([x, y, c], i) => (
          <g key={i} className={i ? "lp-bob-late" : "lp-bob"}>
            <path
              d={`M${x} ${(y as number) - 4} c-18 -22 -18 -46 0 -48 c18 2 18 26 0 48 Z`}
              fill={c as string}
            />
            <circle cx={x as number} cy={(y as number) - 34} r="7" fill="#ffffff" />
          </g>
        ))}
        {/* The keke following the route */}
        <g>
          <g transform="translate(-34 -40)">
            <rect x="0" y="0" width="68" height="30" rx="10" fill="#ffd23f" />
            <rect x="0" y="0" width="68" height="8" rx="4" fill="#ffe680" />
            <rect x="10" y="6" width="26" height="12" rx="3" fill="#9fd8ff" />
            <rect x="42" y="6" width="14" height="12" rx="3" fill="#9fd8ff" />
            <circle cx="14" cy="32" r="7" fill="#111" />
            <circle cx="56" cy="32" r="7" fill="#111" />
          </g>
          {reduce ? null : (
            <animateMotion
              dur="7s"
              repeatCount="indefinite"
              path={route}
              rotate="auto"
              keyPoints="0;1"
              keyTimes="0;1"
              calcMode="linear"
            />
          )}
        </g>
      </g>
      <g data-depth="near" className="lp-layer">
        <RoundTree x={420} y={400} r={46} delay={0.4} />
        <RoundTree x={980} y={400} r={40} fill="#1f9d63" delay={0.5} />
        <g className="lp-grow" style={{ animationDelay: "0.6s" }}>
          <Palm x={40} y={400} s={1.1} />
        </g>
      </g>
    </SceneSvg>
  );
}

/* ---------------------------------------------------------- Shopping Complex */

/**
 * Shop pages: the Shopping Complex, a row of stalls with striped awnings that
 * flap in the breeze, bunting across the top and goods on the counters.
 */
export function MarketScene({ className }: { className?: string }) {
  const stalls = [
    ["#3a5bff", "#ffffff"],
    ["#ff6a4d", "#ffffff"],
    ["#ffd23f", "#1b1f3b"],
    ["#3ddc97", "#ffffff"],
  ] as const;
  return (
    <SceneSvg className={className}>
      <g data-depth="far" className="lp-layer">
        <Sun x={1300} y={80} r={36} />
        {/* Bunting */}
        <path d="M0 70 Q720 130 1440 70" stroke="#1b1f3b" strokeWidth="3" fill="none" />
        {Array.from({ length: 24 }, (_, i) => {
          const x = 30 + i * 60;
          const y = 70 + Math.sin((x / 1440) * Math.PI) * 58;
          return (
            <path
              key={i}
              className="lp-wave"
              style={{ animationDelay: `${-i * 0.15}s` }}
              d={`M${x - 14} ${y} h28 l-14 22 Z`}
              fill={["#3a5bff", "#ff6a4d", "#ffd23f", "#3ddc97"][i % 4]}
            />
          );
        })}
      </g>
      <g data-depth="mid" className="lp-layer">
        <ellipse
          className="lp-shadow"
          cx="720"
          cy="372"
          rx="560"
          ry="12"
          fill="#1b1f3b"
          opacity="0.1"
        />
        <g className="lp-drop" style={{ animationDelay: "0.1s" }}>
          <Block
            x={160}
            y={170}
            w={1120}
            h={200}
            d={30}
            front="#f2efe8"
            side="#c9ced9"
            top="#ffffff"
          />
        </g>
        {stalls.map(([c, stripe], i) => {
          const x = 190 + i * 270;
          return (
            <g key={i} className="lp-drop" style={{ animationDelay: `${0.25 + i * 0.1}s` }}>
              {/* Opening and counter */}
              <rect x={x} y={220} width="230" height="150" fill="#1b1f3b" opacity="0.85" />
              <rect x={x - 6} y={318} width="242" height="52" fill={c} />
              {/* Goods */}
              {[0, 1, 2, 3].map((g) => (
                <g key={g} className={g % 2 ? "lp-bob" : "lp-bob-late"}>
                  <rect
                    x={x + 20 + g * 52}
                    y={284}
                    width="32"
                    height="34"
                    rx="6"
                    fill={["#ffd23f", "#ff6a4d", "#9fd8ff", "#3ddc97"][(g + i) % 4]}
                  />
                </g>
              ))}
              {/* Striped awning */}
              <g className="lp-awning" style={{ animationDelay: `${-i * 0.4}s` }}>
                {Array.from({ length: 6 }, (_, s) => (
                  <path
                    key={s}
                    d={`M${x - 10 + s * 42} 186 h42 v40 q-21 18 -42 0 Z`}
                    fill={s % 2 ? stripe : c}
                  />
                ))}
              </g>
            </g>
          );
        })}
      </g>
      <g data-depth="near" className="lp-layer">
        <rect x="0" y="370" width="1440" height="30" fill="#e9dcc3" />
        <g className="lp-grow" style={{ animationDelay: "0.6s" }}>
          <Palm x={70} y={400} s={1.15} />
        </g>
        <g className="lp-grow" style={{ animationDelay: "0.7s" }}>
          <Palm x={1380} y={400} s={1.1} delay={-0.8} />
        </g>
        {/* Market umbrella */}
        <g className="lp-sway" style={{ animationDuration: "5s" }}>
          <rect x="1324" y="300" width="5" height="96" fill="#1b1f3b" />
          <path d="M1270 304 q56 -58 112 0 Z" fill="#ff6a4d" />
          <path d="M1298 304 q28 -58 28 -58 q0 58 28 58 Z" fill="#ffffff" opacity="0.5" />
        </g>
      </g>
    </SceneSvg>
  );
}

/** A rounded sky panel that holds one of the scenes, with clouds drifting at three depths. */
export function SceneBanner({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-hidden
      className={cn(
        "relative -mx-4 overflow-hidden bg-[#eef1fb] md:mx-0 md:rounded-[28px] dark:bg-[#161936]",
        className,
      )}
    >
      <Clouds3D />
      {children}
    </section>
  );
}
