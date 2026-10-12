import type * as Inputs from "../inputs";

export type Schemas = typeof Inputs;

let loaded: Promise<Schemas> | undefined;

/**
 * Input schemas load on the first write. Building Zod schemas is costly, and
 * reads (what every page does first) never need them.
 */
export function schemas(): Promise<Schemas> {
  loaded ??= import("../inputs");
  return loaded;
}
