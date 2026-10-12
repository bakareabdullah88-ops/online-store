import { hashString } from "@/lib/random";
import type { ArtMotif, ImageRef } from "@/services/types";

/**
 * Real photos for the demo catalogue, by product type. Files live in
 * /public/seed. Regenerate with `node scripts/fetch-photos.mjs`.
 * Product types with no photos keep their generated art.
 */
export const motifPhotos: Partial<Record<ArtMotif, readonly string[]>> = {};

/** `count` photos for one product, starting at a stable offset so neighbours differ. */
export function photosFor(motif: ArtMotif, key: string, count: number): ImageRef[] | null {
  const pool = motifPhotos[motif];
  if (!pool?.length) return null;
  const start = hashString(key) % pool.length;
  return Array.from({ length: Math.max(1, Math.min(count, pool.length)) }, (_, k) => ({
    kind: "url" as const,
    src: pool[(start + k) % pool.length]!,
  }));
}
