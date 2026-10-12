import { env } from "@/env";

const MAX = env.NEXT_PUBLIC_MOCK_LATENCY ?? 900;
const MIN = Math.min(300, MAX);

/**
 * Simulated network latency (300–900ms by default) so loading states are
 * real and designed. Set NEXT_PUBLIC_MOCK_LATENCY=0 to disable.
 */
export function latency(scale = 1): Promise<void> {
  if (MAX === 0) return Promise.resolve();
  const ms = (MIN + Math.random() * (MAX - MIN)) * scale;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Short latency for interactions that should feel instant (toggles, beacons). */
export const quick = () => latency(0.35);
