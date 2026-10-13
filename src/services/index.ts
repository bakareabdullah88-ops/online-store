import { env } from "@/env";
import type { Services } from "./contracts";

/**
 * The single switch between data implementations.
 * NEXT_PUBLIC_DATA_SOURCE=mock (default) | remote
 *
 * The implementation is loaded on first use, so the mock backend (seed data,
 * IndexedDB, input validation) stays out of every page's initial bundle and
 * off the hydration critical path.
 */
let impl: Promise<Services> | null = null;
function load(): Promise<Services> {
  impl ??=
    env.NEXT_PUBLIC_DATA_SOURCE === "remote"
      ? import("./remote").then((m) => m.remoteServices)
      : import("./mock").then((m) => m.mockServices);
  return impl;
}

type AsyncMethods = Record<string, (...args: unknown[]) => Promise<unknown>>;

/** A stand-in for one service whose methods forward to the loaded implementation. */
function lazy<K extends Exclude<keyof Services, "realtime">>(name: K): Services[K] {
  return new Proxy({} as Services[K], {
    get: (_, method) => {
      if (typeof method !== "string" || method === "then") return undefined;
      return (...args: unknown[]) =>
        load().then((s) => {
          const fn = (s[name] as unknown as AsyncMethods)[method];
          if (!fn) throw new Error(`services.${name}.${method} does not exist`);
          return fn(...args);
        });
    },
  });
}

export const services: Services = {
  auth: lazy("auth"),
  catalog: lazy("catalog"),
  social: lazy("social"),
  orders: lazy("orders"),
  notifications: lazy("notifications"),
  messages: lazy("messages"),
  places: lazy("places"),
  studio: lazy("studio"),
  media: lazy("media"),
  realtime: {
    subscribe(cb) {
      let off: (() => void) | undefined;
      let stopped = false;
      void load().then((s) => {
        if (!stopped) off = s.realtime.subscribe(cb);
      });
      return () => {
        stopped = true;
        off?.();
      };
    },
  },
};

export type { Services } from "./contracts";
export * from "./errors";
