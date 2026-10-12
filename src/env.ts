import { z } from "zod";

/**
 * Typed, validated public environment. Only NEXT_PUBLIC_* values are allowed:
 * this app has no server secrets.
 */
const schema = z.object({
  NEXT_PUBLIC_DATA_SOURCE: z.enum(["mock", "remote"]).default("mock"),
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  /** Simulated latency ceiling in ms for the mock layer ("0" disables). */
  NEXT_PUBLIC_MOCK_LATENCY: z.coerce.number().int().min(0).max(5000).optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_MOCK_LATENCY: process.env.NEXT_PUBLIC_MOCK_LATENCY || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;

/** Absolute site URL for metadata. Vercel provides VERCEL_PROJECT_PRODUCTION_URL. */
export function siteUrl(): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
