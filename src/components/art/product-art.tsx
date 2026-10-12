import { memo, type ReactNode } from "react";
import { artPalettes, type ArtPalette } from "@/design/tokens";
import { createRng } from "@/lib/random";
import type { ArtMotif } from "@/services/types";

/**
 * Generated product "photography": a tonal set, a soft floor shadow and a
 * simplified object. Deterministic for a given seed so it never flickers.
 * Real photos replace these by switching an ImageRef to { kind: "url" }.
 *
 * ViewBox is 400×500 (4:5, the product image ratio used across the app).
 */

type Colors = { bg: string; bgDeep: string; obj: string; shade: string; detail: string };

type MotifDraw = (c: Colors, r: ReturnType<typeof createRng>) => ReactNode;

const motifs: Record<ArtMotif, MotifDraw> = {
  tee: (c) => (
    <g>
      <path
        d="M128 152 L170 130 Q200 156 230 130 L272 152 L322 206 L284 238 L268 222 L268 386 Q200 396 132 386 L132 222 L116 238 L78 206 Z"
        fill={c.obj}
      />
      <path d="M268 222 L284 238 L322 206 L300 182 Z" fill={c.shade} opacity="0.55" />
      <path d="M170 130 Q200 156 230 130 Q200 168 170 130 Z" fill={c.shade} />
      <rect x="176" y="236" width="48" height="20" rx="3" fill={c.detail} opacity="0.85" />
    </g>
  ),
  dress: (c) => (
    <g>
      <path d="M176 118 L184 118 L188 168 L180 168 Z M216 118 L224 118 L220 168 L212 168 Z" fill={c.shade} />
      <path d="M172 166 Q200 182 228 166 L240 214 Q290 320 306 392 Q200 410 94 392 Q110 320 160 214 Z" fill={c.obj} />
      <path d="M160 214 Q200 230 240 214 L244 228 Q200 244 156 228 Z" fill={c.shade} />
      <path d="M200 240 Q230 320 248 398 Q276 396 306 392 Q290 320 240 214 Z" fill={c.shade} opacity="0.35" />
    </g>
  ),
  cap: (c) => (
    <g>
      <path d="M112 300 Q118 190 210 184 Q300 190 304 300 Z" fill={c.obj} />
      <path d="M270 210 Q304 240 304 300 L262 300 Q266 250 248 206 Z" fill={c.shade} opacity="0.5" />
      <path d="M96 300 Q200 286 330 300 Q356 306 338 322 Q200 344 96 316 Q84 306 96 300 Z" fill={c.shade} />
      <circle cx="208" cy="186" r="8" fill={c.shade} />
      <path d="M160 248 h56" stroke={c.detail} strokeWidth="8" strokeLinecap="round" />
    </g>
  ),
  jacket: (c) => (
    <g>
      <path
        d="M140 140 L178 124 L200 140 L222 124 L260 140 L306 196 L320 372 L284 376 L272 236 L272 392 L128 392 L128 236 L116 376 L80 372 L94 196 Z"
        fill={c.obj}
      />
      <path d="M178 124 L200 182 L222 124 L200 140 Z" fill={c.shade} />
      <path d="M200 182 V392" stroke={c.shade} strokeWidth="4" />
      <path d="M150 300 h30 M220 300 h30" stroke={c.shade} strokeWidth="5" strokeLinecap="round" />
      <path d="M272 236 L284 376 L320 372 L306 196 Z" fill={c.shade} opacity="0.4" />
    </g>
  ),
  sneaker: (c) => (
    <g>
      <path
        d="M78 330 Q80 270 120 262 L176 236 Q196 226 214 246 L238 270 Q290 286 326 300 Q348 310 346 336 L346 346 L80 346 Z"
        fill={c.obj}
      />
      <path d="M76 340 H348 Q350 366 330 366 H92 Q74 366 76 340 Z" fill={c.detail} />
      <path d="M150 276 l20 -12 M166 292 l22 -14 M184 306 l22 -14" stroke={c.detail} strokeWidth="6" strokeLinecap="round" />
      <path d="M238 270 Q290 286 326 300 Q340 306 344 322 L250 318 Z" fill={c.shade} opacity="0.5" />
    </g>
  ),
  tote: (c) => (
    <g>
      <path d="M160 200 Q160 120 200 120 Q240 120 240 200" fill="none" stroke={c.shade} strokeWidth="12" />
      <path d="M118 196 H282 L296 392 H104 Z" fill={c.obj} />
      <path d="M250 196 H282 L296 392 H262 Z" fill={c.shade} opacity="0.35" />
      <circle cx="200" cy="292" r="34" fill={c.detail} opacity="0.9" />
      <path d="M184 292 q16 -22 32 0 q-16 22 -32 0" fill={c.obj} />
    </g>
  ),
  bowl: (c) => (
    <g>
      <ellipse cx="200" cy="262" rx="118" ry="26" fill={c.shade} />
      <circle cx="160" cy="246" r="30" fill={c.obj} />
      <circle cx="204" cy="236" r="34" fill={c.obj} opacity="0.85" />
      <circle cx="246" cy="250" r="26" fill={c.shade} opacity="0.75" />
      <circle cx="186" cy="226" r="7" fill={c.detail} />
      <circle cx="226" cy="230" r="6" fill={c.detail} />
      <path d="M82 262 Q92 372 200 376 Q308 372 318 262 Z" fill={c.detail} />
      <path d="M260 262 L318 262 Q312 340 250 366 Q286 318 260 262 Z" fill={c.bgDeep} opacity="0.6" />
    </g>
  ),
  jar: (c) => (
    <g>
      <rect x="138" y="150" width="124" height="34" rx="6" fill={c.shade} />
      <path d="M128 190 Q128 180 140 180 H260 Q272 180 272 190 V372 Q272 392 252 392 H148 Q128 392 128 372 Z" fill={c.obj} />
      <rect x="128" y="250" width="144" height="70" fill={c.detail} />
      <path d="M160 285 h80" stroke={c.shade} strokeWidth="6" strokeLinecap="round" />
      <path d="M240 190 H262 Q272 190 272 200 V372 Q272 392 252 392 H240 Z" fill={c.shade} opacity="0.3" />
    </g>
  ),
  cookie: (c) => (
    <g>
      <circle cx="172" cy="292" r="86" fill={c.obj} />
      <circle cx="246" cy="236" r="70" fill={c.shade} />
      <circle cx="246" cy="236" r="64" fill={c.obj} opacity="0.92" />
      {[
        [150, 262],
        [196, 300],
        [140, 326],
        [186, 350],
        [222, 214],
        [262, 252],
        [236, 270],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 7 : 9} fill={c.shade} opacity="0.85" />
      ))}
    </g>
  ),
  drink: (c) => (
    <g>
      <path d="M236 120 L212 196" stroke={c.shade} strokeWidth="9" strokeLinecap="round" />
      <path d="M140 180 H260 L246 386 Q244 396 234 396 H166 Q156 396 154 386 Z" fill={c.obj} />
      <path d="M146 228 H254 L246 386 Q244 396 234 396 H166 Q156 396 154 386 Z" fill={c.shade} opacity="0.55" />
      <rect x="132" y="170" width="136" height="16" rx="6" fill={c.detail} />
      <circle cx="184" cy="260" r="8" fill={c.detail} opacity="0.6" />
      <circle cx="214" cy="300" r="6" fill={c.detail} opacity="0.6" />
    </g>
  ),
  bottle: (c) => (
    <g>
      <path d="M190 96 H236 V112 H206 V140 H190 Z" fill={c.shade} />
      <rect x="182" y="136" width="36" height="34" rx="4" fill={c.shade} />
      <path d="M150 196 Q150 170 176 170 H224 Q250 170 250 196 V376 Q250 394 232 394 H168 Q150 394 150 376 Z" fill={c.obj} />
      <rect x="150" y="246" width="100" height="84" fill={c.detail} />
      <path d="M170 276 h60 M178 296 h44" stroke={c.shade} strokeWidth="5" strokeLinecap="round" />
      <path d="M228 170 Q250 170 250 196 V376 Q250 394 232 394 H228 Z" fill={c.shade} opacity="0.3" />
    </g>
  ),
  dropper: (c) => (
    <g>
      <path d="M188 104 Q188 88 200 88 Q212 88 212 104 V176 H188 Z" fill={c.shade} />
      <rect x="176" y="170" width="48" height="26" rx="5" fill={c.detail} />
      <path d="M160 214 Q160 196 178 196 H222 Q240 196 240 214 V378 Q240 394 224 394 H176 Q160 394 160 378 Z" fill={c.obj} />
      <rect x="160" y="270" width="80" height="60" fill={c.detail} opacity="0.85" />
      <path d="M176 300 h48" stroke={c.shade} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  tube: (c) => (
    <g transform="rotate(-18 200 260)">
      <path d="M150 128 H250 L240 360 H160 Z" fill={c.obj} />
      <path d="M150 122 H250 V138 H150 Z" fill={c.shade} />
      <rect x="176" y="360" width="48" height="34" rx="4" fill={c.shade} />
      <rect x="166" y="210" width="68" height="70" rx="4" fill={c.detail} />
      <path d="M182 245 h36" stroke={c.shade} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  bracelet: (c, r) => {
    const n = 14;
    const beads = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return { x: 200 + Math.cos(a) * 92, y: 268 + Math.sin(a) * 58, big: i % r.int(3, 4) === 0 };
    }).sort((a, b) => a.y - b.y);
    return (
      <g>
        {beads.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.big ? 22 : 16} fill={b.big ? c.detail : i % 2 ? c.obj : c.shade} />
        ))}
      </g>
    );
  },
  earring: (c) => (
    <g>
      <circle cx="150" cy="212" r="46" fill="none" stroke={c.obj} strokeWidth="9" />
      <circle cx="252" cy="212" r="46" fill="none" stroke={c.obj} strokeWidth="9" />
      <path d="M150 258 L130 330 Q150 352 170 330 Z" fill={c.shade} />
      <path d="M252 258 L232 330 Q252 352 272 330 Z" fill={c.shade} />
      <circle cx="150" cy="322" r="9" fill={c.detail} />
      <circle cx="252" cy="322" r="9" fill={c.detail} />
    </g>
  ),
  poster: (c, r) => (
    <g>
      <rect x="104" y="96" width="192" height="276" fill={c.detail} />
      <rect x="104" y="96" width="192" height="276" fill="none" stroke={c.shade} strokeWidth="10" />
      <circle cx={r.int(160, 240)} cy={r.int(170, 210)} r={r.int(38, 54)} fill={c.obj} />
      <rect x="128" y="250" width="144" height="70" fill={c.shade} opacity="0.85" />
      <path d="M128 344 h80" stroke={c.obj} strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  sticker: (c) => (
    <g>
      <path d="M200 132 L228 214 L314 216 L246 268 L270 352 L200 302 L130 352 L154 268 L86 216 L172 214 Z" fill={c.detail} />
      <path d="M200 150 L223 220 L296 222 L238 266 L258 336 L200 294 L142 336 L162 266 L104 222 L177 220 Z" fill={c.obj} />
      <circle cx="200" cy="248" r="22" fill={c.detail} />
    </g>
  ),
  card: (c) => (
    <g>
      <g transform="rotate(-8 170 250)">
        <rect x="96" y="150" width="160" height="210" rx="6" fill={c.shade} />
      </g>
      <g transform="rotate(6 230 260)">
        <rect x="150" y="150" width="160" height="210" rx="6" fill={c.detail} />
        <circle cx="230" cy="226" r="34" fill={c.obj} />
        <path d="M184 300 h92 M196 320 h68" stroke={c.obj} strokeWidth="6" strokeLinecap="round" />
      </g>
    </g>
  ),
  earbuds: (c) => (
    <g>
      <rect x="120" y="230" width="160" height="128" rx="56" fill={c.detail} />
      <path d="M120 290 H280" stroke={c.shade} strokeWidth="3" />
      <circle cx="200" cy="318" r="5" fill={c.obj} />
      <path d="M150 136 q30 0 30 34 v52 q0 12 -12 12 h-4 q-12 0 -12 -12 v-36 q-30 -4 -30 -24 q0 -26 28 -26" fill={c.obj} />
      <path d="M252 136 q-30 0 -30 34 v52 q0 12 12 12 h4 q12 0 12 -12 v-36 q30 -4 30 -24 q0 -26 -28 -26" fill={c.obj} />
    </g>
  ),
  case: (c) => (
    <g transform="rotate(-6 200 260)">
      <rect x="132" y="108" width="140" height="290" rx="30" fill={c.obj} />
      <rect x="150" y="128" width="62" height="70" rx="16" fill={c.shade} />
      <circle cx="168" cy="150" r="11" fill={c.detail} />
      <circle cx="194" cy="176" r="11" fill={c.detail} />
      <circle cx="202" cy="300" r="40" fill={c.detail} opacity="0.75" />
    </g>
  ),
  cable: (c) => (
    <g fill="none" strokeLinecap="round">
      <ellipse cx="200" cy="262" rx="96" ry="64" stroke={c.obj} strokeWidth="12" />
      <ellipse cx="200" cy="262" rx="70" ry="44" stroke={c.shade} strokeWidth="12" />
      <path d="M290 262 Q330 300 300 352" stroke={c.obj} strokeWidth="12" />
      <rect x="284" y="350" width="32" height="40" rx="6" fill={c.detail} stroke="none" />
    </g>
  ),
  book: (c) => (
    <g>
      <rect x="108" y="300" width="196" height="46" rx="4" fill={c.obj} />
      <rect x="296" y="304" width="8" height="38" fill={c.detail} />
      <rect x="124" y="254" width="176" height="46" rx="4" fill={c.shade} />
      <rect x="292" y="258" width="8" height="38" fill={c.detail} />
      <rect x="100" y="208" width="190" height="46" rx="4" fill={c.detail} />
      <rect x="100" y="208" width="14" height="46" fill={c.obj} />
      <path d="M150 324 h80 M160 276 h60" stroke={c.detail} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  candle: (c) => (
    <g>
      <path d="M200 128 Q218 156 206 176 Q200 186 194 176 Q182 156 200 128 Z" fill={c.detail} />
      <path d="M200 176 V200" stroke={c.shade} strokeWidth="4" />
      <path d="M134 210 Q134 200 146 200 H254 Q266 200 266 210 V376 Q266 394 248 394 H152 Q134 394 134 376 Z" fill={c.obj} />
      <rect x="134" y="262" width="132" height="66" fill={c.detail} opacity="0.9" />
      <path d="M168 296 h64" stroke={c.shade} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  monogram: (c) => <circle cx="200" cy="250" r="120" fill={c.obj} />,
};

function Backdrop({ c, variant }: { c: Colors; variant: number }) {
  switch (variant) {
    case 1:
      return <circle cx="200" cy="250" r="150" fill={c.detail} opacity="0.55" />;
    case 2:
      return <path d="M86 420 V230 Q86 116 200 116 Q314 116 314 230 V420 Z" fill={c.detail} opacity="0.5" />;
    case 3:
      return <rect x="0" y="330" width="400" height="170" fill={c.bgDeep} opacity="0.6" />;
    case 4:
      return (
        <g fill={c.bgDeep} opacity="0.7">
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={25 + col * 50} cy={25 + row * 56} r="2.2" />
            )),
          )}
        </g>
      );
    default:
      return null;
  }
}

export const ProductArt = memo(function ProductArt({
  motif,
  palette,
  seed,
  className,
  title,
}: {
  motif: ArtMotif;
  palette: ArtPalette;
  seed: number;
  className?: string;
  title?: string;
}) {
  const [bg, bgDeep, obj, shade, detail] = artPalettes[palette];
  const c: Colors = { bg, bgDeep, obj, shade, detail };
  const r = createRng(seed);
  const variant = r.int(0, 4);
  const tilt = r.int(-4, 4);
  const lift = r.int(-10, 10);
  const gid = `g${seed}-${motif}`;
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bgDeep} />
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#${gid})`} />
      <Backdrop c={c} variant={variant} />
      <ellipse cx="200" cy="418" rx="128" ry="14" fill={shade} opacity="0.16" />
      <g transform={`translate(0 ${lift}) rotate(${tilt} 200 260)`}>{motifs[motif](c, r)}</g>
    </svg>
  );
});

/** Brand mark: initials set in the display face on a tonal disc. */
export const BrandMark = memo(function BrandMark({
  name,
  palette,
  className,
}: {
  name: string;
  palette: ArtPalette;
  className?: string;
}) {
  const [bg, , obj, , detail] = artPalettes[palette];
  const letters = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <rect width="100" height="100" fill={obj} />
      <circle cx="78" cy="22" r="34" fill={detail} opacity="0.14" />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fill={bg}
        style={{ font: `400 ${letters.length > 1 ? 44 : 56}px var(--font-instrument-serif), serif`, letterSpacing: "-1px" }}
      >
        {letters}
      </text>
    </svg>
  );
});

/** Brand cover: a wide tonal composition. */
export const CoverArt = memo(function CoverArt({
  palette,
  seed,
  motif,
  className,
}: {
  palette: ArtPalette;
  seed: number;
  motif: ArtMotif;
  className?: string;
}) {
  const [bg, bgDeep, obj, shade, detail] = artPalettes[palette];
  const c: Colors = { bg, bgDeep, obj, shade, detail };
  const r = createRng(seed);
  const gid = `cv${seed}`;
  const xs = [r.int(200, 260), r.int(450, 510), r.int(700, 760)];
  return (
    <svg viewBox="0 0 960 360" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bgDeep} />
        </linearGradient>
      </defs>
      <rect width="960" height="360" fill={`url(#${gid})`} />
      <circle cx={xs[2]} cy="90" r="210" fill={detail} opacity="0.45" />
      <rect x="0" y="260" width="960" height="100" fill={bgDeep} opacity="0.5" />
      {xs.map((x, i) => {
        const s = [0.44, 0.52, 0.4][i] ?? 0.44;
        // Motif art is centred around (200, 260) in a 400×500 box.
        return (
          <g key={i} transform={`translate(${x - 200 * s} ${190 - 260 * s}) scale(${s})`}>
            {motifs[motif](c, r)}
          </g>
        );
      })}
    </svg>
  );
});
