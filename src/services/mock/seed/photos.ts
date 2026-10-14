import { hashString } from "@/lib/random";
import type { ArtMotif, ImageRef } from "@/services/types";

/**
 * Real photos for the demo catalogue, by product type. Files live in
 * /public/seed. Regenerate with `node scripts/fetch-photos.mjs`.
 * Product types with no photos keep their generated art.
 */
export const motifPhotos: Partial<Record<ArtMotif, readonly string[]>> = {
  tee: [
    "/seed/tee-1.jpg",
    "/seed/tee-2.jpg",
    "/seed/tee-3.jpg",
    "/seed/tee-4.jpg",
    "/seed/tee-5.jpg",
    "/seed/tee-6.jpg",
    "/seed/tee-7.jpg",
  ],
  dress: [
    "/seed/dress-1.jpg",
    "/seed/dress-2.jpg",
    "/seed/dress-3.jpg",
    "/seed/dress-4.jpg",
    "/seed/dress-5.jpg",
  ],
  cap: ["/seed/cap-1.jpg", "/seed/cap-2.jpg", "/seed/cap-3.jpg"],
  jacket: [
    "/seed/jacket-1.jpg",
    "/seed/jacket-2.jpg",
    "/seed/jacket-3.jpg",
    "/seed/jacket-4.jpg",
    "/seed/jacket-5.jpg",
  ],
  sneaker: [
    "/seed/sneaker-1.jpg",
    "/seed/sneaker-2.jpg",
    "/seed/sneaker-3.jpg",
    "/seed/sneaker-4.jpg",
  ],
  tote: ["/seed/tote-1.jpg", "/seed/tote-2.jpg", "/seed/tote-3.jpg", "/seed/tote-4.jpg"],
  bowl: ["/seed/bowl-1.jpg", "/seed/bowl-2.jpg", "/seed/bowl-3.jpg", "/seed/bowl-4.jpg"],
  jar: ["/seed/jar-1.jpg", "/seed/jar-2.jpg", "/seed/jar-3.jpg"],
  cookie: [
    "/seed/cookie-1.jpg",
    "/seed/cookie-2.jpg",
    "/seed/cookie-3.jpg",
    "/seed/cookie-4.jpg",
    "/seed/cookie-5.jpg",
  ],
  drink: [
    "/seed/drink-1.jpg",
    "/seed/drink-2.jpg",
    "/seed/drink-3.jpg",
    "/seed/drink-4.jpg",
    "/seed/drink-5.jpg",
  ],
  bottle: ["/seed/bottle-1.jpg", "/seed/bottle-2.jpg"],
  dropper: ["/seed/dropper-1.jpg", "/seed/dropper-2.jpg"],
  tube: ["/seed/tube-1.jpg", "/seed/tube-2.jpg", "/seed/tube-3.jpg"],
  bracelet: [
    "/seed/bracelet-1.jpg",
    "/seed/bracelet-2.jpg",
    "/seed/bracelet-3.jpg",
    "/seed/bracelet-4.jpg",
  ],
  earring: ["/seed/earring-1.jpg", "/seed/earring-2.jpg", "/seed/earring-3.jpg"],
  poster: ["/seed/poster-1.jpg", "/seed/poster-2.jpg", "/seed/poster-3.jpg", "/seed/poster-4.jpg"],
  sticker: ["/seed/sticker-1.jpg", "/seed/sticker-2.jpg"],
  card: ["/seed/card-1.jpg", "/seed/card-2.jpg"],
  earbuds: ["/seed/earbuds-1.jpg", "/seed/earbuds-2.jpg", "/seed/earbuds-3.jpg"],
  case: ["/seed/case-1.jpg", "/seed/case-2.jpg", "/seed/case-3.jpg", "/seed/case-4.jpg"],
  cable: ["/seed/cable-1.jpg"],
  book: [
    "/seed/book-1.jpg",
    "/seed/book-2.jpg",
    "/seed/book-3.jpg",
    "/seed/book-4.jpg",
    "/seed/book-5.jpg",
    "/seed/book-6.jpg",
  ],
  candle: ["/seed/candle-1.jpg", "/seed/candle-2.jpg"],
};

/** Wide crops (16:5) for shop banners, by product type. */
export const motifCovers: Partial<Record<ArtMotif, string>> = {
  tee: "/seed/tee-banner.jpg",
  dress: "/seed/dress-banner.jpg",
  cap: "/seed/cap-banner.jpg",
  jacket: "/seed/jacket-banner.jpg",
  sneaker: "/seed/sneaker-banner.jpg",
  tote: "/seed/tote-banner.jpg",
  bowl: "/seed/bowl-banner.jpg",
  jar: "/seed/jar-banner.jpg",
  cookie: "/seed/cookie-banner.jpg",
  drink: "/seed/drink-banner.jpg",
  bottle: "/seed/bottle-banner.jpg",
  dropper: "/seed/dropper-banner.jpg",
  tube: "/seed/tube-banner.jpg",
  bracelet: "/seed/bracelet-banner.jpg",
  earring: "/seed/earring-banner.jpg",
  poster: "/seed/poster-banner.jpg",
  sticker: "/seed/sticker-banner.jpg",
  card: "/seed/card-banner.jpg",
  earbuds: "/seed/earbuds-banner.jpg",
  case: "/seed/case-banner.jpg",
  cable: "/seed/cable-banner.jpg",
  book: "/seed/book-banner.jpg",
  candle: "/seed/candle-banner.jpg",
};

/** A wide banner photo for a shop, or null to keep generated art. */
export function coverFor(motif: ArtMotif): ImageRef | null {
  const src = motifCovers[motif];
  return src ? { kind: "url", src } : null;
}

/**
 * Some product types mean different things in different categories (a jar of
 * kuli kuli is a snack, a jar of shea butter is skincare). These borrow the
 * photo set of a closer match.
 */
const categoryPools: Record<string, ArtMotif> = {
  "food:jar": "cookie",
  "food:tote": "cookie",
  "beauty:tote": "jar",
  "tech:bracelet": "case",
};

/** `count` photos for one product, starting at a stable offset so neighbours differ. */
export function photosFor(
  motif: ArtMotif,
  key: string,
  count: number,
  category?: string,
): ImageRef[] | null {
  const pool = motifPhotos[(category && categoryPools[`${category}:${motif}`]) || motif];
  if (!pool?.length) return null;
  const start = hashString(key) % pool.length;
  return Array.from({ length: Math.max(1, Math.min(count, pool.length)) }, (_, k) => ({
    kind: "url" as const,
    src: pool[(start + k) % pool.length]!,
  }));
}
