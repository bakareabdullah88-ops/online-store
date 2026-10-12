"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let browserClient: QueryClient | undefined;

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          // Domain errors (not found, forbidden…) are final; transient ones retry once.
          if (error && typeof error === "object" && "code" in error) return false;
          return count < 1;
        },
      },
      mutations: { retry: false },
    },
  });
}

export function getQueryClient() {
  if (typeof window === "undefined") return makeClient();
  browserClient ??= makeClient();
  return browserClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
