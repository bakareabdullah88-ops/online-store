import type { Services } from "../contracts";
import { ServiceError } from "../errors";

/**
 * BACKEND-SEAM: the real implementation. Each method should call the endpoint
 * documented in API_CONTRACT.md and map HTTP errors to ServiceError codes.
 * Until then every call fails loudly and clearly.
 */
function notImplemented(path: string): never {
  throw new ServiceError(
    "NOT_IMPLEMENTED",
    `The remote data source is not implemented yet (${path}). Set NEXT_PUBLIC_DATA_SOURCE=mock.`,
  );
}

function stub<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get(_, method) {
      return async () => notImplemented(`${name}.${String(method)}`);
    },
  });
}

export const remoteServices: Services = {
  auth: stub("auth"),
  catalog: stub("catalog"),
  social: stub("social"),
  orders: stub("orders"),
  notifications: stub("notifications"),
  messages: stub("messages"),
  wallet: stub("wallet"),
  places: stub("places"),
  studio: stub("studio"),
  media: stub("media"),
  demo: stub("demo"),
};
