/**
 * Typed, validated public environment. Only NEXT_PUBLIC_* values are allowed:
 * this app has no server secrets. Validated by hand (not Zod) because this
 * module ships in every page's client bundle.
 */
export type Env = {
  NEXT_PUBLIC_DATA_SOURCE: "mock" | "remote";
  NEXT_PUBLIC_SITE_URL?: string;
  /** Simulated latency ceiling in ms for the mock layer ("0" disables). */
  NEXT_PUBLIC_MOCK_LATENCY?: number;
};

function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const problems: string[] = [];
  const source = raw.NEXT_PUBLIC_DATA_SOURCE || "mock";
  if (source !== "mock" && source !== "remote")
    problems.push(`NEXT_PUBLIC_DATA_SOURCE must be "mock" or "remote" (got "${source}")`);

  const site = raw.NEXT_PUBLIC_SITE_URL || undefined;
  if (site && !isAbsoluteUrl(site))
    problems.push(`NEXT_PUBLIC_SITE_URL must be an absolute URL (got "${site}")`);

  const latencyRaw = raw.NEXT_PUBLIC_MOCK_LATENCY || undefined;
  const latency = latencyRaw === undefined ? undefined : Number(latencyRaw);
  if (latency !== undefined && !(Number.isInteger(latency) && latency >= 0 && latency <= 5000)) {
    problems.push(
      `NEXT_PUBLIC_MOCK_LATENCY must be a whole number from 0 to 5000 (got "${latencyRaw}")`,
    );
  }

  if (problems.length)
    throw new Error(`Invalid environment variables:\n  ✖ ${problems.join("\n  ✖ ")}`);
  return {
    NEXT_PUBLIC_DATA_SOURCE: source as Env["NEXT_PUBLIC_DATA_SOURCE"],
    ...(site ? { NEXT_PUBLIC_SITE_URL: site } : {}),
    ...(latency !== undefined ? { NEXT_PUBLIC_MOCK_LATENCY: latency } : {}),
  };
}

// Each NEXT_PUBLIC_* must be referenced literally so Next can inline it.
export const env = parseEnv({
  NEXT_PUBLIC_DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_MOCK_LATENCY: process.env.NEXT_PUBLIC_MOCK_LATENCY,
});

/** Absolute site URL for metadata. Vercel provides VERCEL_PROJECT_PRODUCTION_URL. */
export function siteUrl(): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return new URL(`https://${vercel}`);
  return new URL(`http://localhost:${process.env.PORT ?? 3000}`);
}
