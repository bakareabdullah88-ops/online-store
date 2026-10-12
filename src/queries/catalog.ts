"use client";

import { keepPreviousData, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useInfiniteQuery, useQuery } from "./use-query";
import { services } from "@/services";
import type { BrandQuery } from "@/services/contracts";
import type { Page, ProductQuery, ProductWithBrand } from "@/services/types";
import { qk } from "./keys";

export function useCampuses() {
  return useQuery({ queryKey: qk.campuses, queryFn: () => services.catalog.listCampuses(), staleTime: Infinity });
}

export function useCampus(id: string | null | undefined) {
  const { data } = useCampuses();
  return id ? data?.find((c) => c.id === id) : undefined;
}

export function useProducts(query: ProductQuery, opts: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.products(query),
    queryFn: () => services.catalog.getProducts(query),
    placeholderData: keepPreviousData,
    enabled: opts.enabled ?? true,
  });
}

export function useInfiniteProducts(query: Omit<ProductQuery, "page">) {
  return useInfiniteQuery({
    queryKey: [...qk.products(query), "infinite"],
    queryFn: ({ pageParam }) => services.catalog.getProducts({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

/** Look through cached product lists for a product (instant product pages). */
function findCachedProduct(qc: QueryClient, slug: string): ProductWithBrand | undefined {
  const lists = qc.getQueriesData<Page<ProductWithBrand> | { pages: Page<ProductWithBrand>[] } | ProductWithBrand[]>({
    queryKey: ["products"],
  });
  for (const [, data] of lists) {
    if (!data) continue;
    const items = Array.isArray(data) ? data : "pages" in data ? data.pages.flatMap((p) => p.items) : data.items;
    const hit = items.find((p) => p.slug === slug);
    if (hit) return hit;
  }
  for (const key of [qk.wishlist]) {
    const hit = qc.getQueryData<ProductWithBrand[]>(key)?.find((p) => p.slug === slug);
    if (hit) return hit;
  }
  return undefined;
}

export function useProduct(slug: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.product(slug),
    queryFn: () => services.catalog.getProduct(slug),
    placeholderData: () => findCachedProduct(qc, slug),
  });
}

export function useRelatedProducts(productId: string | undefined) {
  return useQuery({
    queryKey: qk.related(productId ?? ""),
    queryFn: () => services.catalog.getRelatedProducts(productId!, 8),
    enabled: !!productId,
  });
}

export function usePriceRange() {
  return useQuery({ queryKey: qk.priceRange, queryFn: () => services.catalog.getPriceRange(), staleTime: Infinity });
}

export function useBrands(query: BrandQuery = {}) {
  return useQuery({ queryKey: qk.brands(query), queryFn: () => services.catalog.getBrands(query) });
}

export function useBrand(handle: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.brand(handle),
    queryFn: () => services.catalog.getBrand(handle),
    placeholderData: () => {
      for (const [, data] of qc.getQueriesData<{ handle: string }[]>({ queryKey: ["brands"] })) {
        const hit = data?.find((b) => b.handle === handle);
        if (hit) return hit as never;
      }
      return undefined;
    },
  });
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: qk.productReviews(productId ?? ""),
    queryFn: () => services.catalog.getProductReviews(productId!),
    enabled: !!productId,
  });
}

export function useBrandReviews(brandId: string | undefined) {
  return useQuery({
    queryKey: qk.brandReviews(brandId ?? ""),
    queryFn: () => services.catalog.getBrandReviews(brandId!),
    enabled: !!brandId,
  });
}

export function useSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: qk.search(term),
    queryFn: () => services.catalog.search(term, 6),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function recordEvent(type: "view" | "add_to_bag", productId: string) {
  void services.catalog.recordEvent({ type, productId }).catch(() => undefined);
}
