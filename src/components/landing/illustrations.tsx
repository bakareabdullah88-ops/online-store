/**
 * Flat, bold landing illustrations in a campus setting: solid colours, thick
 * black outlines, no gradients, and a little life (cars drive past, trees sway,
 * a clock ticks). All drawn for Kamplug; decorative, so hidden from screen
 * readers. Motion classes (lp-*) live in globals.css and stop with reduced motion.
 */

const K = "#1b1f3b";
const S = {
  stroke: K,
  strokeWidth: 4,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};
const thin = { ...S, strokeWidth: 3 };

function Tree({ x, y, r, fill = "#2bb673" }: { x: number; y: number; r: number; fill?: string }) {
  return (
    <g className="lp-sway" style={{ animationDelay: `${(x % 7) * -0.4}s` }}>
      <path d={`M${x} ${y} V${y + r * 0.9}`} {...S} strokeWidth={6} />
      <path
        d={`M${x - r} ${y + 4} a${r * 0.6} ${r * 0.6} 0 0 1 ${r * 0.35} -${r * 0.8} a${r * 0.65} ${r * 0.65} 0 0 1 ${r * 1.2} -${r * 0.2} a${r * 0.6} ${r * 0.6} 0 0 1 ${r * 0.45} ${r * 1} Z`}
        fill={fill}
        {...S}
      />
    </g>
  );
}

/** A keke napep, drawn facing right at the origin. */
function Keke({ body = "#ffc23d" }: { body?: string }) {
  return (
    <g>
      <path d="M0 44 V12 Q0 0 12 0 H80 Q100 0 106 22 L110 44 Z" fill={body} {...S} />
      <path d="M0 24 H110" stroke="#111" strokeWidth="6" />
      <path d="M14 8 H54 V22 H14 Z" fill="#7fb6f2" {...thin} />
      <path d="M66 8 H86 L92 22 H66 Z" fill="#7fb6f2" {...thin} />
      <g className="lp-wheel">
        <circle cx="22" cy="48" r="11" fill={K} />
        <path d="M14 48 H30" stroke="#888" strokeWidth="3" />
      </g>
      <g className="lp-wheel">
        <circle cx="92" cy="48" r="11" fill={K} />
        <path d="M84 48 H100" stroke="#888" strokeWidth="3" />
      </g>
    </g>
  );
}

/** Jollof rice with plantain on a plate. */
export function JollofPlate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <ellipse cx="200" cy="200" rx="180" ry="80" fill="#ffffff" {...S} />
      <ellipse cx="200" cy="196" rx="140" ry="58" fill="#f4f1ea" {...thin} />
      <path d="M90 190 Q120 110 200 104 Q290 108 312 186 Q200 236 90 190 Z" fill="#f05a3e" {...S} />
      {Array.from({ length: 26 }, (_, i) => (
        <circle
          key={i}
          cx={120 + ((i * 47) % 180)}
          cy={140 + ((i * 29) % 50)}
          r="4"
          fill="#ffb27a"
        />
      ))}
      {[
        [250, 176, -20],
        [280, 158, 10],
        [226, 150, 30],
      ].map(([x, y, a], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="46"
          height="26"
          rx="10"
          transform={`rotate(${a} ${x! + 23} ${y! + 13})`}
          fill="#ffc23d"
          {...thin}
        />
      ))}
      <path d="M150 120 l10 -14 l10 14" fill="#2bb673" {...thin} />
      <path d="M190 112 l12 -16 l10 16" fill="#2bb673" {...thin} />
    </svg>
  );
}

/** A thrift rack with three shirts. */
export function ThriftRack({ className }: { className?: string }) {
  const shirts = ["#5aa9f0", "#e85d75", "#ffc23d"];
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <path
        d="M40 40 H360 M60 40 V280 M340 40 V280 M40 280 H90 M310 280 H360"
        {...S}
        strokeWidth={6}
      />
      {shirts.map((c, i) => {
        const x = 90 + i * 85;
        return (
          <g
            key={c}
            className="lp-sway"
            style={{ transformOrigin: "50% 0%", animationDelay: `${i * -0.7}s` }}
          >
            <path d={`M${x + 40} 40 v14`} {...S} />
            <path
              d={`M${x} 80 L${x + 26} 58 Q${x + 40} 70 ${x + 54} 58 L${x + 80} 80 L${x + 68} 100 L${x + 62} 94 V200 H${x + 18} V94 L${x + 12} 100 Z`}
              fill={c}
              {...S}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Skincare: a dropper bottle, a jar of shea butter and a tube. */
export function BeautySet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <rect x="70" y="120" width="80" height="140" rx="16" fill="#e85d75" {...S} />
      <rect x="92" y="80" width="36" height="40" fill="#111" />
      <ellipse cx="110" cy="74" rx="16" ry="12" fill="#fff4d6" {...S} />
      <rect x="170" y="170" width="120" height="90" rx="14" fill="#fff4d6" {...S} />
      <rect x="164" y="150" width="132" height="30" rx="10" fill="#ffc23d" {...S} />
      <text x="230" y="225" textAnchor="middle" fontSize="20" fontWeight="800" fill={K}>
        SHEA
      </text>
      <path
        d="M310 260 L300 120 Q300 110 312 110 H338 Q350 110 350 120 L340 260 Z"
        fill="#b78cf2"
        {...S}
      />
      <rect x="312" y="90" width="26" height="22" fill="#111" />
      <path
        className="lp-twinkle"
        d="M200 60 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 Z"
        fill="#ffc23d"
        {...thin}
      />
    </svg>
  );
}

/** A phone with earbuds. */
export function TechSet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <rect x="140" y="30" width="130" height="250" rx="22" fill="#111" />
      <rect x="152" y="46" width="106" height="218" rx="12" fill="#5aa9f0" />
      <rect x="166" y="64" width="78" height="44" rx="8" fill="#ffc23d" {...thin} />
      <rect x="166" y="120" width="34" height="34" rx="8" fill="#2bb673" {...thin} />
      <rect x="210" y="120" width="34" height="34" rx="8" fill="#e85d75" {...thin} />
      <rect x="166" y="166" width="78" height="14" rx="7" fill="#fff4d6" />
      <g className="lp-bob">
        <path d="M70 170 q-20 0 -20 22 q0 22 20 22 v40" fill="#ffffff" {...S} />
      </g>
      <g className="lp-bob-late">
        <path d="M330 170 q20 0 20 22 q0 22 -20 22 v40" fill="#ffffff" {...S} />
      </g>
    </svg>
  );
}

/** A stack of books with a past-questions booklet. */
export function BookStack({ className }: { className?: string }) {
  const books = [
    ["#2bb673", 60, 220, 280],
    ["#ffc23d", 80, 180, 250],
    ["#e85d75", 50, 140, 260],
    ["#5aa9f0", 90, 100, 230],
  ] as const;
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      {books.map(([c, x, y, w]) => (
        <g key={c}>
          <rect x={x} y={y} width={w} height="40" rx="6" fill={c} {...S} />
          <path
            d={`M${x + 20} ${y + 12} H${x + w - 20}`}
            stroke="#fff4d6"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      ))}
      <g className="lp-bob">
        <rect
          x="250"
          y="34"
          width="90"
          height="56"
          rx="6"
          fill="#fff4d6"
          {...S}
          transform="rotate(8 295 62)"
        />
        <text
          x="296"
          y="70"
          textAnchor="middle"
          fontSize="16"
          fontWeight="800"
          fill={K}
          transform="rotate(8 295 62)"
        >
          PQ 2024
        </text>
      </g>
    </svg>
  );
}

/** A campus tuck shop with a striped awning; the goods on the counter bob. */
export function TuckShop({ className }: { className?: string }) {
  const stripes = Array.from({ length: 8 }, (_, i) => i);
  return (
    <svg viewBox="0 0 640 400" className={className} aria-hidden>
      <rect x="80" y="120" width="480" height="260" fill="#fff4d6" {...S} />
      {stripes.map((i) => (
        <path
          key={i}
          d={`M${60 + i * 65} 80 h65 v50 q-32 26 -65 0 Z`}
          fill={i % 2 ? "#ffffff" : "#3a5bff"}
          {...S}
        />
      ))}
      <rect x="60" y="56" width="520" height="28" rx="6" fill="#1f37b8" {...S} />
      <text
        x="320"
        y="76"
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fill="#fff"
        style={{ letterSpacing: "0.2em" }}
      >
        TUCK SHOP
      </text>
      {/* Shelf */}
      <path d="M110 220 H530" {...S} />
      {[
        [130, "#f05a3e"],
        [180, "#2bb673"],
        [230, "#ffc23d"],
        [400, "#5aa9f0"],
        [450, "#e85d75"],
        [500, "#ffc23d"],
      ].map(([x, c], i) => (
        <g key={i} className={i % 2 ? "lp-bob" : "lp-bob-late"}>
          <rect
            x={x as number}
            y="168"
            width="30"
            height="52"
            rx="6"
            fill={c as string}
            {...thin}
          />
          <rect x={(x as number) + 8} y="158" width="14" height="12" fill={K} />
        </g>
      ))}
      <rect x="280" y="160" width="90" height="60" rx="8" fill="#fff" {...thin} />
      <text x="325" y="198" textAnchor="middle" fontSize="20" fontWeight="800" fill={K}>
        OPEN
      </text>
      {/* Counter */}
      <rect x="60" y="280" width="520" height="100" fill="#b78cf2" {...S} />
      <rect x="60" y="270" width="520" height="22" fill="#1f37b8" {...S} />
      <g className="lp-bob">
        <ellipse cx="200" cy="256" rx="54" ry="16" fill="#fff" {...thin} />
        <path d="M156 252 Q200 214 244 252 Z" fill="#f05a3e" {...thin} />
      </g>
      <g className="lp-bob-late">
        <rect x="380" y="214" width="80" height="56" rx="6" fill="#ffc23d" {...thin} />
        <text x="420" y="248" textAnchor="middle" fontSize="16" fontWeight="800" fill={K}>
          ₦500
        </text>
      </g>
    </svg>
  );
}

/** A big keke rushing past with parcels, motion lines behind it. */
export function DeliveryKeke({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 360" className={className} aria-hidden>
      <g className="lp-bob">
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M${40 - i * 10} ${150 + i * 40} H${150 - i * 20}`}
            {...S}
            strokeWidth={8}
          />
        ))}
        <g transform="translate(170 70) scale(3.6)">
          <Keke body="#3a5bff" />
        </g>
        <rect x="320" y="40" width="80" height="64" rx="6" fill="#ffc23d" {...S} />
        <path d="M320 64 H400 M360 40 V104" {...thin} />
        <rect x="410" y="54" width="60" height="50" rx="6" fill="#fff4d6" {...S} />
      </g>
    </svg>
  );
}

/** A hostel room at night: shelf, plant, desk, a phone popping new messages and a Kamplug bag. */
export function HostelRoom({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 640" className={className} aria-hidden>
      {/* Wall stripes */}
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 100} y="0" width="50" height="470" fill="#262b55" />
      ))}
      {/* Bookcase */}
      <rect x="720" y="40" width="180" height="440" fill="#ff6a2c" {...S} />
      {[150, 270, 390].map((y) => (
        <path key={y} d={`M720 ${y} H900`} stroke="#ffd1bf" strokeWidth="10" />
      ))}
      {[
        [740, "#ffffff"],
        [762, "#7fb6f2"],
        [784, "#1f37b8"],
      ].map(([x, c]) => (
        <rect key={x} x={x as number} y="72" width="18" height="78" fill={c as string} {...thin} />
      ))}
      <Tree x={810} y={340} r={36} fill="#2bb673" />
      {/* Wall shelf with plant and a poster */}
      <rect x="300" y="200" width="380" height="16" rx="8" fill="#ffd1bf" {...thin} />
      <g className="lp-sway">
        <path
          d="M380 150 l-20 -40 M380 150 l0 -50 M380 150 l20 -40 M380 150 l-34 -20 M380 150 l34 -20"
          stroke="#2bb673"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>
      <path d="M356 150 h48 l-6 50 h-36 Z" fill="#ff6a2c" {...thin} />
      <rect
        x="500"
        y="110"
        width="90"
        height="90"
        fill="#fff4d6"
        stroke="#ff6a2c"
        strokeWidth="10"
      />
      <path
        className="lp-twinkle"
        d="M640 140 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 Z"
        fill="#ff6a2c"
      />
      <path
        className="lp-twinkle"
        style={{ ["--lp-delay" as string]: "-1.2s" } as React.CSSProperties}
        d="M220 300 l6 14 l14 6 l-14 6 l-6 14 l-6 -14 l-14 -6 l14 -6 Z"
        fill="#3dd68c"
      />
      {/* Floor and rug */}
      <rect x="0" y="470" width="900" height="170" fill="#1b1f3b" />
      <path d="M120 600 L220 500 H820 L900 600 Z" fill="#fbd98a" {...S} />
      {/* Desk */}
      <rect x="280" y="440" width="380" height="24" rx="10" fill="#ff6a2c" {...S} />
      <path
        d="M320 464 L300 600 M620 464 L640 600"
        stroke="#ff6a2c"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* Laptop */}
      <path d="M330 440 L350 340 H500 L480 440 Z" fill="#b78cf2" {...S} />
      <rect x="320" y="432" width="200" height="12" rx="4" fill="#1f37b8" {...thin} />
      {/* Phone with message bubbles popping */}
      <rect x="560" y="364" width="50" height="76" rx="10" fill="#111" />
      <rect x="566" y="372" width="38" height="58" rx="5" fill="#3dd68c" />
      {[
        [560, 330, "#ffffff", "0s"],
        [580, 296, "#ffc23d", "-1.6s"],
        [600, 262, "#ffffff", "-3.2s"],
      ].map(([x, y, c, d], i) => (
        <g
          key={i}
          className="lp-pop"
          style={{ ["--lp-delay" as string]: d } as React.CSSProperties}
        >
          <rect
            x={x as number}
            y={y as number}
            width="92"
            height="28"
            rx="14"
            fill={c as string}
            {...thin}
          />
          <path
            d={`M${(x as number) + 18} ${(y as number) + 14} h46`}
            stroke="#111"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* Kamplug paper bag */}
      <path d="M680 600 L690 480 H780 L800 600 Z" fill="#c8915a" {...S} />
      <path d="M700 480 l10 -14 h50 l10 14" fill="#a87443" {...thin} />
      <circle cx="740" cy="540" r="24" fill="#3a5bff" {...thin} />
      <path
        d="M732 528 V552 M732 540 L746 528 M738 536 L748 552"
        stroke="#ffc23d"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** A takeaway pack of jollof and a bottle of zobo, for the closing panel. */
export function TakeawaySet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 420" className={className} aria-hidden>
      <ellipse cx="320" cy="370" rx="250" ry="40" fill="#1f37b8" {...S} />
      <g className="lp-bob">
        <path
          d="M120 360 V170 Q120 150 140 140 V100 H180 V140 Q200 150 200 170 V360 Z"
          fill="#8e1f4a"
          {...S}
        />
        <rect x="138" y="70" width="44" height="32" rx="6" fill="#ffc23d" {...S} />
        <rect x="128" y="210" width="64" height="70" rx="8" fill="#fff4d6" {...thin} />
        <text x="160" y="252" textAnchor="middle" fontSize="18" fontWeight="800" fill={K}>
          ZOBO
        </text>
      </g>
      <g className="lp-bob-late">
        <path d="M240 250 L280 360 H520 L560 250 Z" fill="#ffffff" {...S} />
        <path d="M240 250 Q400 150 560 250 Z" fill="#f05a3e" {...S} />
        {Array.from({ length: 30 }, (_, i) => (
          <circle
            key={i}
            cx={290 + ((i * 53) % 230)}
            cy={215 + ((i * 17) % 30)}
            r="5"
            fill="#ffb27a"
          />
        ))}
        <rect
          x="430"
          y="200"
          width="60"
          height="32"
          rx="12"
          fill="#ffc23d"
          {...thin}
          transform="rotate(-14 460 216)"
        />
        <rect
          x="380"
          y="186"
          width="56"
          height="30"
          rx="12"
          fill="#ffc23d"
          {...thin}
          transform="rotate(12 408 201)"
        />
        <path d="M240 250 L560 250" {...S} />
      </g>
    </svg>
  );
}

/** Wobbly blobs for the bottom of the "Start selling" card. */
export function SellPanel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 220"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <rect width="520" height="220" fill="#ffc23d" />
      <path d="M0 0 h120 q30 40 -10 70 q-50 40 -40 90 q-30 40 -70 30 Z" fill="#ff8a3d" {...S} />
      <path d="M400 220 q-20 -60 30 -90 q40 -30 90 -10 v100 Z" fill="#ff8a3d" {...S} />
      <g className="lp-bob">
        <rect x="190" y="50" width="140" height="120" rx="12" fill="#fff" {...S} />
        <path d="M190 90 H330" {...thin} />
        <text x="260" y="78" textAnchor="middle" fontSize="18" fontWeight="800" fill={K}>
          NEW ORDER
        </text>
        <text x="260" y="130" textAnchor="middle" fontSize="30" fontWeight="800" fill="#3a5bff">
          ₦3,500
        </text>
      </g>
      {[
        [70, 160, "0s"],
        [460, 40, "-1s"],
        [140, 30, "-1.8s"],
      ].map(([x, y, d], i) => (
        <circle
          key={i}
          className="lp-twinkle"
          style={{ ["--lp-delay" as string]: d } as React.CSSProperties}
          cx={x as number}
          cy={y as number}
          r="6"
          fill="#fff"
        />
      ))}
    </svg>
  );
}

/** Blobs and the Kamplug box for the "Shop your campus" card. */
export function ShopPanel({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 220"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <rect width="520" height="220" fill="#3a5bff" />
      <path d="M0 220 q20 -110 100 -110 q70 0 90 110 Z" fill="#ff6a4d" {...S} />
      <path d="M220 220 q60 -90 160 -70 q80 20 140 70 Z" fill="#9fd8ff" {...S} />
      <g transform="translate(260 10) scale(0.62)">
        <PlugBagShape />
      </g>
    </svg>
  );
}

function PlugBagShape() {
  return (
    <g className="lp-bob">
      <path d="M110 80 L150 40 H330 L290 80 Z" fill="#ffe680" {...S} />
      <rect x="110" y="80" width="180" height="170" fill="#ffd23f" {...S} />
      <path d="M290 80 L330 40 V210 L290 250 Z" fill="#e0b000" {...S} />
      <path
        d="M178 128 V202 M178 166 L216 128 M192 154 L220 202"
        stroke="#1b1f3b"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </g>
  );
}

/** A four-point sparkle used as a decorative mark. */
export function Sparkle({ className, color = "#3a5bff" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 0 C22 12 28 18 40 20 C28 22 22 28 20 40 C18 28 12 22 0 20 C12 18 18 12 20 0 Z"
        fill={color}
      />
    </svg>
  );
}

/** An eight-point starburst, like a stamp. */
export function Burst({ className, color = "#ff8a3d" }: { className?: string; color?: string }) {
  const pts = Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 ? 11 : 20;
    const a = (i * Math.PI) / 8;
    return `${(20 + r * Math.cos(a)).toFixed(1)},${(20 + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <polygon points={pts} fill={color} />
    </svg>
  );
}
