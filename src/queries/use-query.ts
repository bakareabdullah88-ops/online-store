"use client";

import {
  useInfiniteQuery as useTanstackInfiniteQuery,
  useQuery as useTanstackQuery,
  type DefaultError,
  type InfiniteData,
  type QueryKey,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useMounted } from "@/lib/hooks";

/**
 * Hydration-safe wrappers around TanStack Query.
 *
 * Data lives in IndexedDB and some reads resolve in a few milliseconds, which
 * can land before a late Suspense boundary finishes hydrating. Until the app
 * has hydrated we report "pending with no data", so client markup always
 * matches the server-rendered skeletons. After that, the real result is
 * returned untouched (keeping TanStack's tracked-property optimisation).
 */
export function useQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  const mounted = useMounted();
  const result = useTanstackQuery(options);
  if (mounted) return result;
  return {
    ...result,
    data: undefined,
    status: "pending",
    isPending: true,
    isSuccess: false,
    isError: false,
    error: null,
    isFetched: false,
    isFetchedAfterMount: false,
    isPlaceholderData: false,
    isLoading: true,
  } as UseQueryResult<TData, TError>;
}

export function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): UseInfiniteQueryResult<TData, TError> {
  const mounted = useMounted();
  const result = useTanstackInfiniteQuery(options);
  if (mounted) return result;
  return {
    ...result,
    data: undefined,
    status: "pending",
    isPending: true,
    isSuccess: false,
    isError: false,
    error: null,
    isFetched: false,
    isPlaceholderData: false,
    isLoading: true,
    hasNextPage: false,
  } as UseInfiniteQueryResult<TData, TError>;
}
