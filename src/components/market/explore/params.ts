"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { categories } from "@/config/categories";
import type { CategoryId, ProductQuery, SortKey } from "@/services/types";

export type ExploreParams = {
  q: string;
  category: CategoryId | "all";
  sort: SortKey;
  min: number | null; // naira
  max: number | null; // naira
  campus: string | null;
  zone: string | null;
  rating: number | null;
  stock: boolean;
};

const SORTS: SortKey[] = ["relevance", "popular", "newest", "price_asc", "price_desc", "rating"];

export const sortLabels: Record<SortKey, string> = {
  relevance: "Best match",
  popular: "Popular",
  newest: "Newest",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  rating: "Top rated",
};

function num(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function parseExplore(sp: URLSearchParams): ExploreParams {
  const cat = sp.get("category");
  const sort = sp.get("sort") as SortKey | null;
  const q = sp.get("q")?.trim() ?? "";
  return {
    q,
    category: categories.some((c) => c.id === cat) ? (cat as CategoryId) : "all",
    sort: sort && SORTS.includes(sort) ? sort : q ? "relevance" : "popular",
    min: num(sp.get("min")),
    max: num(sp.get("max")),
    campus: sp.get("campus") || null,
    zone: sp.get("zone") || null,
    rating: num(sp.get("rating")),
    stock: sp.get("stock") === "1",
  };
}

export function toQuery(p: ExploreParams): Omit<ProductQuery, "page"> {
  return {
    ...(p.q ? { q: p.q } : {}),
    ...(p.category !== "all" ? { category: p.category } : {}),
    sort: p.sort,
    ...(p.min !== null ? { minPriceKobo: p.min * 100 } : {}),
    ...(p.max !== null ? { maxPriceKobo: p.max * 100 } : {}),
    ...(p.campus ? { campusId: p.campus } : {}),
    ...(p.zone ? { zoneId: p.zone } : {}),
    ...(p.rating ? { minRating: p.rating } : {}),
    ...(p.stock ? { inStock: true } : {}),
    pageSize: 24,
  };
}

export function activeFilterCount(p: ExploreParams) {
  return [p.min !== null || p.max !== null, !!p.campus, !!p.zone, !!p.rating, p.stock].filter(Boolean).length;
}

/** Filters live in the URL so results are shareable and survive refresh/back. */
export function useExploreParams() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/explore";
  const [pending, startTransition] = useTransition();
  const params = useMemo(() => parseExplore(new URLSearchParams(sp.toString())), [sp]);

  const update = useCallback(
    (patch: Partial<ExploreParams>) => {
      const next = { ...params, ...patch };
      if (patch.campus !== undefined && patch.campus !== params.campus) next.zone = null;
      const out = new URLSearchParams();
      if (next.q) out.set("q", next.q);
      if (next.category !== "all") out.set("category", next.category);
      const defaultSort = next.q ? "relevance" : "popular";
      if (next.sort !== defaultSort) out.set("sort", next.sort);
      if (next.min !== null) out.set("min", String(next.min));
      if (next.max !== null) out.set("max", String(next.max));
      if (next.campus) out.set("campus", next.campus);
      if (next.zone) out.set("zone", next.zone);
      if (next.rating) out.set("rating", String(next.rating));
      if (next.stock) out.set("stock", "1");
      const qs = out.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [params, pathname, router],
  );

  const clearFilters = useCallback(
    () => update({ min: null, max: null, campus: null, zone: null, rating: null, stock: false }),
    [update],
  );

  return { params, update, clearFilters, pending };
}
