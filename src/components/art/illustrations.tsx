import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Empty-state illustrations. Inline SVG, drawn with theme tokens so they work
 * in light and dark, in Buying (ember) and Selling (studio green) modes.
 */

export type IllustrationName =
  | "bag"
  | "orders"
  | "wishlist"
  | "search"
  | "notifications"
  | "messages"
  | "products"
  | "offline"
  | "error"
  | "lost"
  | "following"
  | "reviews"
  | "wallet"
  | "places"
  | "customers"
  | "promos";

const stroke = { stroke: "var(--ink)", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={cn("h-auto w-44", className)} aria-hidden>
      <ellipse cx="100" cy="142" rx="64" ry="7" fill="var(--ink)" opacity="0.07" />
      {children}
    </svg>
  );
}

const drawings: Record<IllustrationName, ReactNode> = {
  bag: (
    <>
      <path d="M58 58 H142 L150 136 H50 Z" fill="var(--sand)" />
      <path d="M58 58 H142 L150 136 H50 Z" {...stroke} />
      <path d="M78 70 V50 Q78 30 100 30 Q122 30 122 50 V70" {...stroke} />
      <circle cx="78" cy="72" r="3.5" fill="var(--ink)" />
      <circle cx="122" cy="72" r="3.5" fill="var(--ink)" />
      <path d="M86 104 Q100 114 114 104" {...stroke} />
      <circle cx="150" cy="40" r="10" fill="var(--accent)" />
    </>
  ),
  orders: (
    <>
      <path d="M62 24 H138 V136 L128 128 L118 136 L108 128 L98 136 L88 128 L78 136 L68 128 L62 132 Z" fill="var(--surface)" />
      <path d="M62 24 H138 V136 L128 128 L118 136 L108 128 L98 136 L88 128 L78 136 L68 128 L62 132 Z" {...stroke} />
      <path d="M76 48 H124 M76 64 H112 M76 80 H118" {...stroke} />
      <path d="M76 104 H96" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
      <path d="M110 104 H124" {...stroke} />
    </>
  ),
  wishlist: (
    <>
      <path d="M100 132 C40 96 44 46 76 42 C90 40 98 50 100 58 C102 50 110 40 124 42 C156 46 160 96 100 132 Z" fill="var(--accent-soft)" />
      <path d="M100 132 C40 96 44 46 76 42 C90 40 98 50 100 58 C102 50 110 40 124 42 C156 46 160 96 100 132 Z" {...stroke} />
      <path d="M150 28 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4 z" fill="var(--accent)" />
      <path d="M44 40 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="var(--ink)" opacity="0.6" />
    </>
  ),
  search: (
    <>
      <rect x="40" y="28" width="38" height="46" rx="4" fill="var(--sand)" />
      <rect x="86" y="28" width="38" height="46" rx="4" fill="var(--sand)" />
      <rect x="40" y="82" width="38" height="46" rx="4" fill="var(--sand)" />
      <circle cx="122" cy="98" r="26" fill="var(--surface)" />
      <circle cx="122" cy="98" r="26" {...stroke} />
      <path d="M141 117 L162 138" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
      <path d="M112 98 h20" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  notifications: (
    <>
      <path d="M62 112 Q70 104 70 84 V72 Q70 44 100 44 Q130 44 130 72 V84 Q130 104 138 112 Z" fill="var(--sand)" />
      <path d="M62 112 Q70 104 70 84 V72 Q70 44 100 44 Q130 44 130 72 V84 Q130 104 138 112 Z" {...stroke} />
      <path d="M90 122 Q100 132 110 122" {...stroke} />
      <path d="M100 30 V44" {...stroke} />
      <path d="M150 52 q8 8 0 18 M160 44 q14 16 0 34" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  messages: (
    <>
      <path d="M36 40 H112 Q120 40 120 48 V88 Q120 96 112 96 H64 L48 110 V96 H44 Q36 96 36 88 V48 Q36 40 44 40 Z" fill="var(--surface)" />
      <path d="M36 40 H112 Q120 40 120 48 V88 Q120 96 112 96 H64 L48 110 V96 H44 Q36 96 36 88 V48 Q36 40 44 40 Z" {...stroke} />
      <path d="M90 74 H156 Q164 74 164 82 V114 Q164 122 156 122 H152 V134 L138 122 H98 Q90 122 90 114 Z" fill="var(--accent)" />
      <circle cx="62" cy="68" r="4" fill="var(--ink)" />
      <circle cx="78" cy="68" r="4" fill="var(--ink)" />
      <circle cx="94" cy="68" r="4" fill="var(--ink)" />
    </>
  ),
  products: (
    <>
      <path d="M100 30 L150 52 V110 L100 132 L50 110 V52 Z" fill="var(--sand)" />
      <path d="M100 30 L150 52 V110 L100 132 L50 110 V52 Z" {...stroke} />
      <path d="M50 52 L100 74 L150 52 M100 74 V132" {...stroke} />
      <path d="M75 41 L125 63" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  offline: (
    <>
      <path d="M58 112 Q36 112 36 92 Q36 72 58 72 Q62 46 92 46 Q118 46 126 68 Q156 66 160 90 Q162 112 138 112 Z" fill="var(--sand)" />
      <path d="M58 112 Q36 112 36 92 Q36 72 58 72 Q62 46 92 46 Q118 46 126 68 Q156 66 160 90 Q162 112 138 112 Z" {...stroke} />
      <path d="M48 30 L152 134" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  error: (
    <>
      <path d="M60 52 H130 L124 124 Q123 132 115 132 H75 Q67 132 66 124 Z" fill="var(--sand)" />
      <path d="M60 52 H130 L124 124 Q123 132 115 132 H75 Q67 132 66 124 Z" {...stroke} />
      <path d="M130 66 Q152 66 150 86 Q148 104 126 104" {...stroke} />
      <path d="M92 52 L100 78 L88 96 L98 132" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M80 36 q6 -10 0 -18 M100 36 q6 -10 0 -18" {...stroke} opacity="0.4" />
    </>
  ),
  lost: (
    <>
      <path d="M100 28 V136" {...stroke} />
      <path d="M100 40 H150 L162 54 L150 68 H100 Z" fill="var(--accent)" />
      <path d="M100 76 H50 L38 90 L50 104 H100 Z" fill="var(--sand)" />
      <path d="M100 76 H50 L38 90 L50 104 H100 Z" {...stroke} />
      <path d="M118 54 h22" stroke="var(--on-accent)" strokeWidth="3" strokeLinecap="round" />
      <path d="M62 90 h22" {...stroke} />
    </>
  ),
  following: (
    <>
      <rect x="44" y="44" width="72" height="72" rx="36" fill="var(--sand)" />
      <rect x="44" y="44" width="72" height="72" rx="36" {...stroke} />
      <text x="80" y="88" textAnchor="middle" fontFamily="var(--font-instrument-serif)" fontSize="30" fill="var(--ink)">K</text>
      <circle cx="136" cy="56" r="20" fill="var(--accent)" />
      <path d="M136 48 V64 M128 56 H144" stroke="var(--on-accent)" strokeWidth="3.5" strokeLinecap="round" />
    </>
  ),
  reviews: (
    <>
      <rect x="36" y="38" width="128" height="80" rx="10" fill="var(--surface)" />
      <rect x="36" y="38" width="128" height="80" rx="10" {...stroke} />
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          transform={`translate(${52 + i * 22} 58)`}
          d="M9 0 l2.8 5.8 6.2 .9 -4.5 4.4 1.1 6.2 -5.6 -3 -5.6 3 1.1 -6.2 -4.5 -4.4 6.2 -.9 z"
          fill={i < 4 ? "var(--accent)" : "var(--sand)"}
        />
      ))}
      <path d="M54 96 H130" {...stroke} />
    </>
  ),
  wallet: (
    <>
      <rect x="40" y="48" width="120" height="80" rx="12" fill="var(--sand)" />
      <rect x="40" y="48" width="120" height="80" rx="12" {...stroke} />
      <path d="M40 66 H160" {...stroke} />
      <rect x="116" y="80" width="44" height="28" rx="8" fill="var(--accent)" />
      <circle cx="130" cy="94" r="4" fill="var(--on-accent)" />
      <path d="M58 36 L130 28 L136 48" {...stroke} />
    </>
  ),
  places: (
    <>
      <path d="M100 136 C74 104 62 86 62 66 Q62 30 100 30 Q138 30 138 66 C138 86 126 104 100 136 Z" fill="var(--accent)" />
      <circle cx="100" cy="66" r="14" fill="var(--surface)" />
      <path d="M40 120 Q70 108 100 124 Q130 140 160 122" {...stroke} opacity="0.5" />
    </>
  ),
  customers: (
    <>
      <circle cx="76" cy="66" r="20" fill="var(--sand)" />
      <circle cx="76" cy="66" r="20" {...stroke} />
      <path d="M44 128 Q44 96 76 96 Q108 96 108 128" {...stroke} />
      <circle cx="132" cy="70" r="16" fill="var(--accent)" />
      <path d="M110 128 Q112 102 132 102 Q156 102 156 128" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </>
  ),
  promos: (
    <>
      <path d="M44 56 H156 V76 Q146 80 146 88 Q146 96 156 100 V120 H44 V100 Q54 96 54 88 Q54 80 44 76 Z" fill="var(--accent-soft)" />
      <path d="M44 56 H156 V76 Q146 80 146 88 Q146 96 156 100 V120 H44 V100 Q54 96 54 88 Q54 80 44 76 Z" {...stroke} />
      <path d="M86 104 L114 72" {...stroke} />
      <circle cx="86" cy="76" r="5" fill="var(--accent)" />
      <circle cx="114" cy="100" r="5" fill="var(--accent)" />
    </>
  ),
};

export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  return <Frame className={className}>{drawings[name]}</Frame>;
}
