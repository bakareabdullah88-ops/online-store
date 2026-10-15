/**
 * Small "2.5D" category illustrations for the buyer home tiles: flat shapes with a
 * lighter top face and a darker side so they read as solid, navy outlines, and one
 * or two gently moving parts each. Drawn in a 320x200 (16:10) box and anchored
 * bottom-right, leaving the bottom-left quiet for the overlaid category label.
 * Decorative only (aria-hidden). Motion classes (lp-*) live in globals.css and
 * stop under prefers-reduced-motion.
 */
import type { CSSProperties, JSX, ReactNode } from "react";
import type { CategoryId } from "@/services/types";

const K = "#1b1f3b";
const S = {
  stroke: K,
  strokeWidth: 3.5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};
const T = { ...S, strokeWidth: 2.5 };

const C = {
  cobalt: "#3a5bff",
  cobaltLt: "#7088ff",
  cobaltDk: "#2338b8",
  yellow: "#ffd84d",
  yellowLt: "#ffe896",
  yellowDk: "#e0b000",
  coral: "#ff6a4d",
  coralLt: "#ff9d88",
  coralDk: "#d9472c",
  mint: "#7fd3ad",
  mintLt: "#b4ead1",
  mintDk: "#4fae86",
  sky: "#9fd8ff",
  lilac: "#b9a6ff",
  lilacLt: "#dcd2ff",
  lilacDk: "#8f78e6",
  white: "#ffffff",
  paper: "#eef0fa",
  shade: "#c9cde3",
};

/** Transform in place, from the shape's own box. */
const inPlace = (origin = "center"): CSSProperties => ({
  transformBox: "fill-box",
  transformOrigin: origin,
});
/** Transform around a fixed point of the 320x200 drawing. */
const around = (x: number, y: number): CSSProperties => ({
  transformBox: "view-box",
  transformOrigin: `${x}px ${y}px`,
});
const lpDelay = (d: string) => ({ ["--lp-delay" as string]: d }) as CSSProperties;

/** Soft contact shadow on the ground line. */
function Shadow({ cx, rx }: { cx: number; rx: number }) {
  return <ellipse cx={cx} cy={189} rx={rx} ry={5} fill={K} opacity={0.14} />;
}

/** An oblique box: front face, lighter top and darker right side. */
function Box({
  x,
  y,
  w,
  h,
  d = 14,
  front,
  lit,
  dark,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  d?: number;
  front: string;
  lit: string;
  dark: string;
  children?: ReactNode;
}) {
  const e = Math.round(d * 0.7);
  return (
    <g>
      <path d={`M${x} ${y} L${x + d} ${y - e} H${x + w + d} L${x + w} ${y} Z`} fill={lit} {...S} />
      <path
        d={`M${x + w} ${y} L${x + w + d} ${y - e} V${y + h - e} L${x + w} ${y + h} Z`}
        fill={dark}
        {...S}
      />
      <rect x={x} y={y} width={w} height={h} fill={front} {...S} />
      {children}
    </g>
  );
}

/** An upright cylinder with a lighter top ellipse and a darker right flank. */
function Cyl({
  cx,
  y,
  h,
  rx,
  ry,
  body,
  dark,
  lit,
}: {
  cx: number;
  y: number;
  h: number;
  rx: number;
  ry: number;
  body: string;
  dark: string;
  lit: string;
}) {
  const l = cx - rx;
  const r = cx + rx;
  const b = y + h;
  const outline = `M${l} ${y} V${b} A${rx} ${ry} 0 0 0 ${r} ${b} V${y} Z`;
  const sx = cx + rx * 0.45;
  const sy = b + ry * 0.89;
  return (
    <g>
      <path d={outline} fill={body} />
      <path d={`M${sx} ${y} V${sy} A${rx} ${ry} 0 0 0 ${r} ${b} V${y} Z`} fill={dark} />
      <path d={outline} fill="none" {...S} />
      <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill={lit} {...S} />
    </g>
  );
}

/** A four-point sparkle that twinkles. */
function Spark({
  x,
  y,
  r,
  fill = C.yellow,
  delay = "0s",
}: {
  x: number;
  y: number;
  r: number;
  fill?: string;
  delay?: string;
}) {
  const k = r * 0.18;
  return (
    <path
      className="lp-twinkle"
      style={lpDelay(delay)}
      d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r} Z`}
      fill={fill}
      {...T}
    />
  );
}

/* --------------------------------- Fashion -------------------------------- */
/** A T-shirt swaying on a hanger, with a sneaker in front. */
function Fashion() {
  const shirt =
    "M182 62 Q200 78 218 62 L262 82 L252 108 L236 102 V150 H164 V102 L148 108 L138 82 Z";
  return (
    <>
      <Shadow cx={252} rx={56} />
      <g className="lp-sway" style={inPlace("50% 0%")}>
        <path
          d="M200 52 V44 Q200 38 205 35 Q212 30 208 23 Q204 17 197 20"
          fill="none"
          {...S}
        />
        <path d="M200 52 L150 80 H250 Z" fill="none" {...S} />
        <path d={shirt} fill={C.cobalt} />
        <path d="M240 72 L262 82 L252 108 L236 102 Z" fill={C.cobaltDk} />
        <path d="M222 102 H236 V150 H222 Z" fill={C.cobaltDk} />
        <path d="M160 74 L182 62 Q200 78 218 62 L226 66 Q200 88 168 70 Z" fill={C.cobaltLt} />
        <path d={shirt} fill="none" {...S} />
        <path d="M186 65 L200 80 L214 65" fill="none" stroke={C.white} strokeWidth={4} strokeLinecap="round" />
        <rect x="172" y="106" width="18" height="16" rx="3" fill={C.yellow} {...T} />
      </g>
      {/* Sneaker, toe to the left */}
      <path
        d="M200 172 Q198 156 214 152 L238 146 L250 134 Q256 126 266 128 L292 132 Q300 134 300 144 V172 Z"
        fill={C.coral}
        {...S}
      />
      <path d="M286 131 L292 132 Q300 134 300 144 V172 H288 Z" fill={C.coralDk} {...T} />
      <path d="M200 172 Q198 158 212 154 L224 151 Q218 162 224 172 Z" fill={C.white} {...T} />
      <path d="M234 170 Q254 156 272 138" fill="none" stroke={C.yellow} strokeWidth={7} strokeLinecap="round" />
      <path d="M240 147 l7 6 M248 141 l7 6 M256 135 l7 6" {...T} />
      <path d="M254 131 Q272 124 290 133" fill="none" {...T} />
      <rect x="196" y="172" width="108" height="9" rx="3" fill={C.white} {...S} />
      <path d="M196 181 H304 V184 Q304 188 299 188 H201 Q196 188 196 184 Z" fill={C.shade} {...S} />
      <Spark x={292} y={48} r={12} />
    </>
  );
}

/* --------------------------------- Thrift --------------------------------- */
/** A vintage suitcase with brass corners, straps and a swinging price tag. */
function Thrift() {
  return (
    <>
      <Shadow cx={228} rx={82} />
      <rect x="160" y="176" width="12" height="8" rx="2" fill={K} />
      <rect x="262" y="176" width="12" height="8" rx="2" fill={K} />
      <path d="M208 98 Q208 80 224 80 Q240 80 240 98" fill="none" stroke={K} strokeWidth={10} strokeLinecap="round" />
      <path d="M208 98 Q208 80 224 80 Q240 80 240 98" fill="none" stroke={C.coralDk} strokeWidth={4} strokeLinecap="round" />
      <Box x={150} y={104} w={132} h={74} d={16} front={C.coral} lit={C.coralLt} dark={C.coralDk}>
        <path d="M176 104 L192 93 H204 L188 104 Z" fill={C.cobaltDk} {...T} />
        <path d="M244 104 L260 93 H272 L256 104 Z" fill={C.cobaltDk} {...T} />
        <rect x="176" y="104" width="12" height="74" fill={C.cobalt} {...T} />
        <rect x="244" y="104" width="12" height="74" fill={C.cobalt} {...T} />
        <rect x="173" y="130" width="18" height="12" rx="2" fill={C.yellow} {...T} />
        <rect x="241" y="130" width="18" height="12" rx="2" fill={C.yellow} {...T} />
        <path d="M150 164 V178 H164 Z M282 164 V178 H268 Z M150 118 V104 H164 Z M268 104 H282 V118 Z" fill={C.yellow} {...T} />
        <circle cx="216" cy="152" r="12" fill={C.mint} {...T} />
        <circle cx="216" cy="152" r="5" fill={C.white} />
        <rect x="203" y="114" width="26" height="14" rx="4" fill={C.sky} {...T} transform="rotate(-8 216 121)" />
      </Box>
      {/* Price tag hanging off the handle */}
      <g className="lp-sway" style={around(209, 94)}>
        <path d="M209 94 Q196 102 188 114" fill="none" {...T} />
        <g transform="rotate(-12 188 132)">
          <path d="M178 122 L188 112 L198 122 V152 H178 Z" fill={C.white} {...S} />
          <circle cx="188" cy="121" r="2.5" fill={K} />
          <rect x="182" y="131" width="12" height="5" rx="2" fill={C.coral} />
          <path d="M182 143 H194" stroke={C.shade} strokeWidth={3} strokeLinecap="round" />
        </g>
      </g>
      <Spark x={300} y={58} r={11} />
    </>
  );
}

/* ---------------------------------- Food ---------------------------------- */
/** A bowl of jollof with fried plantain, steam wisps drifting up. */
function Food() {
  const body = "M164 122 Q166 176 234 178 Q302 176 304 122 Z";
  const grains: [number, number][] = [
    [190, 114], [204, 104], [218, 112], [230, 100], [244, 110], [256, 102],
    [270, 116], [212, 122], [196, 122], [240, 122], [226, 116], [282, 118],
  ];
  const wisps = [
    [212, "0s"],
    [238, "-3.7s"],
    [264, "-7.3s"],
  ] as const;
  return (
    <>
      <Shadow cx={234} rx={64} />
      {wisps.map(([x, delay]) => {
        const d = `M${x} 82 q-8 -10 0 -20 q8 -10 0 -20`;
        return (
          <g key={x} className="lp-rise" style={{ animationDelay: delay }}>
            <path d={d} fill="none" stroke={K} strokeWidth={9} strokeLinecap="round" />
            <path d={d} fill="none" stroke={C.white} strokeWidth={4.5} strokeLinecap="round" />
          </g>
        );
      })}
      <path d="M210 176 H258 L254 186 H214 Z" fill={C.cobaltDk} {...S} />
      <path d={body} fill={C.white} />
      <path d="M282 122 H304 Q302 170 252 177 Q282 160 282 122 Z" fill={C.shade} />
      <path d="M167 142 Q234 162 301 142" fill="none" stroke={C.cobalt} strokeWidth={7} />
      <path d={body} fill="none" {...S} />
      <ellipse cx="234" cy="122" rx="70" ry="14" fill={C.white} {...S} />
      <path d="M196 108 L172 74" stroke={K} strokeWidth={10} strokeLinecap="round" />
      <path d="M196 108 L172 74" stroke={C.sky} strokeWidth={4.5} strokeLinecap="round" />
      <path d="M172 122 Q178 92 234 88 Q290 92 296 122 Q234 136 172 122 Z" fill="#f0502f" {...S} />
      <path d="M192 104 Q210 94 236 93" fill="none" stroke={C.coralLt} strokeWidth={5} strokeLinecap="round" />
      {grains.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" fill="#ffb27a" />
      ))}
      <ellipse cx="266" cy="104" rx="12" ry="7" fill={C.yellow} {...T} transform="rotate(-18 266 104)" />
      <ellipse cx="280" cy="114" rx="11" ry="6.5" fill={C.yellowDk} {...T} transform="rotate(14 280 114)" />
      <circle cx="222" cy="96" r="3.5" fill={C.mint} {...T} />
      <circle cx="250" cy="96" r="3.5" fill={C.mint} {...T} />
    </>
  );
}

/* --------------------------------- Beauty --------------------------------- */
/** A lipstick, a powder compact and a cream jar whose lid lifts and settles. */
function Beauty() {
  return (
    <>
      <Shadow cx={230} rx={76} />
      {/* Lipstick */}
      <Cyl cx={172} y={128} h={56} rx={15} ry={5} body={C.cobalt} dark={C.cobaltDk} lit={C.cobaltLt} />
      <Cyl cx={172} y={110} h={18} rx={11} ry={4} body={C.yellow} dark={C.yellowDk} lit={C.yellowLt} />
      <path d="M161 112 V92 Q161 86 166 84 L183 76 V112 Z" fill={C.coral} />
      <path d="M177 79 L183 76 V112 H177 Z" fill={C.coralDk} />
      <path d="M161 112 V92 Q161 86 166 84 L183 76 V112" fill="none" {...S} />
      <path d="M166 92 V106" stroke={C.coralLt} strokeWidth={4} strokeLinecap="round" />
      {/* Jar with a lifting lid */}
      <Cyl cx={270} y={138} h={40} rx={30} ry={9} body={C.white} dark={C.shade} lit={C.white} />
      <path d="M240 152 Q270 160 300 152 V164 Q270 172 240 164 Z" fill={C.mint} {...T} />
      <g className="lp-float">
        <Cyl cx={270} y={122} h={14} rx={32} ry={9} body={C.yellow} dark={C.yellowDk} lit={C.yellowLt} />
      </g>
      {/* Compact */}
      <Cyl cx={214} y={172} h={8} rx={30} ry={10} body={C.lilac} dark={C.lilacDk} lit={C.lilacLt} />
      <ellipse cx="214" cy="172" rx="18" ry="5.5" fill={C.sky} {...T} />
      <path d="M204 171 l6 -2" stroke={C.white} strokeWidth={2.5} strokeLinecap="round" />
      <Spark x={216} y={72} r={12} />
      <Spark x={304} y={94} r={8} fill={C.white} delay="-1.2s" />
    </>
  );
}

/* ------------------------------- Accessories ------------------------------ */
/** A wristwatch with a ticking second hand, and sunglasses with a glint. */
function Accessories() {
  const frame = (x: number) => (
    <g key={x}>
      <rect x={x} y={155} width={44} height={32} rx={14} fill={C.coralDk} {...S} />
      <rect x={x} y={151} width={44} height={32} rx={14} fill={C.coral} {...S} />
      <rect x={x + 6} y={157} width={32} height={20} rx={9} fill={C.cobaltDk} {...T} />
      <path d={`M${x + 12} 163 l9 -2`} stroke={C.white} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      <Shadow cx={252} rx={30} />
      <Shadow cx={190} rx={60} />
      {/* Watch strap */}
      <rect x="238" y="44" width="30" height="140" rx="14" fill={C.mint} />
      <rect x="258" y="48" width="8" height="132" rx="4" fill={C.mintDk} />
      <rect x="238" y="44" width="30" height="140" rx="14" fill="none" {...S} />
      <circle cx="253" cy="58" r="2.5" fill={K} />
      <circle cx="253" cy="68" r="2.5" fill={K} />
      {/* Case */}
      <rect x="286" y="108" width="10" height="12" rx="3" fill={C.yellowDk} {...T} />
      <circle cx="257" cy="118" r="34" fill={C.yellowDk} {...S} />
      <circle cx="253" cy="114" r="34" fill={C.yellow} {...S} />
      <path d="M228 102 A28 28 0 0 1 250 87" fill="none" stroke={C.yellowLt} strokeWidth={5} strokeLinecap="round" />
      <circle cx="253" cy="114" r="25" fill={C.white} {...T} />
      <path d="M253 93 V98 M253 130 V135 M232 114 H237 M269 114 H274" stroke={K} strokeWidth={3} strokeLinecap="round" />
      <path d="M253 114 L264 106" stroke={K} strokeWidth={4} strokeLinecap="round" />
      <path className="lp-tick" style={around(253, 114)} d="M253 120 V93" stroke={C.coral} strokeWidth={2.5} strokeLinecap="round" />
      <circle cx="253" cy="114" r="3.5" fill={K} />
      {/* Sunglasses, folded in front */}
      <path d="M178 164 Q190 155 202 164" fill="none" stroke={K} strokeWidth={8} strokeLinecap="round" />
      <path d="M178 164 Q190 155 202 164" fill="none" stroke={C.coral} strokeWidth={3} strokeLinecap="round" />
      {[134, 202].map(frame)}
      <Spark x={150} y={154} r={9} fill={C.white} />
      <Spark x={298} y={56} r={11} delay="-1.2s" />
    </>
  );
}

/* ---------------------------------- Print --------------------------------- */
/** A printer feeding out a printed sheet. */
function Print() {
  return (
    <>
      <Shadow cx={230} rx={82} />
      <g className="lp-rise">
        <rect x="186" y="54" width="68" height="80" fill={C.white} {...S} />
        <rect x="196" y="64" width="26" height="18" rx="2" fill={C.cobalt} />
        <circle cx="238" cy="73" r="7" fill={C.coral} />
        <path d="M196 92 H244 M196 100 H244 M196 108 H230" stroke={C.shade} strokeWidth={4} strokeLinecap="round" />
      </g>
      <rect x="160" y="172" width="14" height="8" rx="2" fill={K} />
      <rect x="266" y="172" width="14" height="8" rx="2" fill={K} />
      <Box x={150} y={110} w={140} h={64} d={18} front={C.paper} lit={C.white} dark={C.shade}>
        <path d="M180 104 H258" stroke={K} strokeWidth={4} strokeLinecap="round" />
        <rect x="150" y="160" width="140" height="14" fill={C.cobalt} {...S} />
        <rect x="162" y="128" width="74" height="8" rx="4" fill={K} />
        <path d="M164 136 H234 L242 150 H156 Z" fill={C.sky} {...T} />
        <rect x="248" y="118" width="32" height="12" rx="3" fill={C.mint} {...T} />
        <circle cx="254" cy="144" r="4" fill={C.coral} {...T} />
        <circle cx="267" cy="144" r="4" fill={C.yellow} {...T} />
      </Box>
      <circle className="lp-twinkle" style={lpDelay("-0.8s")} cx="280" cy="144" r="4" fill={C.mint} {...T} />
      <Spark x={292} y={58} r={10} delay="-1.6s" />
    </>
  );
}

/* ---------------------------------- Tech ---------------------------------- */
/** Over-ear headphones bobbing beside a phone, a music note floating up. */
function Tech() {
  const cup = (x: number, cushion: number) => (
    <g key={x}>
      <rect x={x + 4} y={106} width={24} height={40} rx={10} fill={C.coralDk} {...S} />
      <rect x={x} y={102} width={24} height={40} rx={10} fill={C.coral} {...S} />
      <rect x={cushion} y={108} width={8} height={30} rx={4} fill={K} />
      <path d={`M${x + 6} 112 V122`} stroke={C.coralLt} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  );
  return (
    <>
      <Shadow cx={180} rx={44} />
      <Shadow cx={268} rx={38} />
      <g className="lp-bob">
        <path d="M146 112 Q146 54 180 54 Q214 54 214 112" fill="none" stroke={K} strokeWidth={12} strokeLinecap="round" />
        <path d="M146 112 Q146 54 180 54 Q214 54 214 112" fill="none" stroke={C.cobalt} strokeWidth={6} strokeLinecap="round" />
        <path d="M156 76 Q164 62 180 60" fill="none" stroke={C.cobaltLt} strokeWidth={2.5} strokeLinecap="round" />
        {cup(134, 154)}
        {cup(202, 198)}
      </g>
      <Box x={236} y={64} w={56} h={120} d={10} front={C.cobalt} lit={C.cobaltLt} dark={C.cobaltDk}>
        <rect x="242" y="72" width="44" height="98" rx="6" fill={C.sky} {...T} />
        <rect x="250" y="80" width="28" height="28" rx="5" fill={C.lilac} {...T} />
        <circle cx="264" cy="128" r="9" fill={C.white} {...T} />
        <path d="M261 123 V133 L269 128 Z" fill={C.coral} />
        <rect x="249" y="146" width="30" height="5" rx="2.5" fill={C.white} />
        <rect x="249" y="146" width="14" height="5" rx="2.5" fill={C.cobalt} />
        <rect x="258" y="175" width="12" height="3" rx="1.5" fill={C.cobaltDk} />
      </Box>
      <g className="lp-float" style={{ animationDelay: "-2s" }}>
        <path d="M296 40 V22 L310 17 V35" fill="none" {...S} />
        <ellipse cx="292" cy="40" rx="5.5" ry="4.5" fill={C.yellow} {...T} />
        <ellipse cx="306" cy="35" rx="5.5" ry="4.5" fill={C.yellow} {...T} />
      </g>
    </>
  );
}

/* ---------------------------------- Books --------------------------------- */
/** A stack of three books with a pencil on top and a ribbon bookmark swinging. */
function Books() {
  const pages = (x: number, y: number, w: number, h: number, d: number) => {
    const e = Math.round(d * 0.7);
    return (
      <path
        d={`M${x + w + 3} ${y + h * 0.4} l${d - 4} ${-e + 2} M${x + w + 3} ${y + h * 0.7} l${d - 4} ${-e + 2}`}
        stroke={C.shade}
        strokeWidth={2}
        strokeLinecap="round"
      />
    );
  };
  return (
    <>
      <Shadow cx={224} rx={82} />
      <Box x={150} y={158} w={130} h={26} front={C.cobalt} lit={C.cobaltLt} dark={C.white}>
        {pages(150, 158, 130, 26, 14)}
        <rect x="162" y="158" width="6" height="26" fill={C.yellow} />
        <rect x="262" y="158" width="6" height="26" fill={C.yellow} />
      </Box>
      <Box x={166} y={134} w={116} h={24} front={C.coral} lit={C.coralLt} dark={C.white}>
        {pages(166, 134, 116, 24, 14)}
        <rect x="178" y="134" width="5" height="24" fill={C.white} />
        <rect x="190" y="134" width="5" height="24" fill={C.white} />
      </Box>
      <g className="lp-sway" style={inPlace("50% 0%")}>
        <path d="M288 128 V158 L284 153 L280 158 V128 Z" fill={C.mint} {...T} />
      </g>
      <Box x={156} y={112} w={120} h={22} front={C.yellow} lit={C.yellowLt} dark={C.white}>
        {pages(156, 112, 120, 22, 14)}
        <rect x="168" y="118" width="40" height="10" rx="2" fill={C.yellowDk} />
      </Box>
      <g transform="rotate(-6 214 98)">
        <path d="M180 92 L164 98 L180 104 Z" fill="#ffd9b0" {...T} />
        <path d="M169 96 L164 98 L169 100 Z" fill={K} />
        <rect x="180" y="92" width="70" height="12" fill={C.lilac} {...T} />
        <rect x="181" y="93" width="68" height="4" fill={C.lilacLt} />
        <rect x="250" y="92" width="7" height="12" fill={C.shade} {...T} />
        <rect x="257" y="92" width="10" height="12" rx="3" fill={C.coral} {...T} />
      </g>
      <Spark x={290} y={64} r={11} />
    </>
  );
}

const ART: Record<CategoryId, () => JSX.Element> = {
  fashion: Fashion,
  thrift: Thrift,
  food: Food,
  beauty: Beauty,
  accessories: Accessories,
  print: Print,
  tech: Tech,
  books: Books,
};

/** Soft tile backgrounds per category: pastel in light mode, deep and muted in dark. */
export const categoryTint: Record<CategoryId, { bg: string; bgDark: string }> = {
  fashion: { bg: "#fff1c9", bgDark: "#2e2a46" },
  thrift: { bg: "#dff5ea", bgDark: "#1e3340" },
  food: { bg: "#ffe1d9", bgDark: "#3a2638" },
  beauty: { bg: "#f1e9ff", bgDark: "#2c2552" },
  accessories: { bg: "#e6f4ff", bgDark: "#1e2f4c" },
  print: { bg: "#e4e9ff", bgDark: "#232a56" },
  tech: { bg: "#ffe6f0", bgDark: "#352545" },
  books: { bg: "#ecf7da", bgDark: "#23363a" },
};

/** A decorative, gently animated illustration for a category tile. */
export function CategoryArt({ id, className }: { id: CategoryId; className?: string }): JSX.Element {
  const Art = ART[id];
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMaxYMax meet"
      className={className}
      aria-hidden
      focusable="false"
    >
      <Art />
    </svg>
  );
}
