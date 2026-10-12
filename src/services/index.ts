import { env } from "@/env";
import type { Services } from "./contracts";
import { mockServices } from "./mock";
import { remoteServices } from "./remote";

/**
 * The single switch between data implementations.
 * NEXT_PUBLIC_DATA_SOURCE=mock (default) | remote
 */
export const services: Services = env.NEXT_PUBLIC_DATA_SOURCE === "remote" ? remoteServices : mockServices;

export type { Services } from "./contracts";
export * from "./errors";
