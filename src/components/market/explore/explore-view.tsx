"use client";

import { pagePad } from "@/components/app/layout";
import { NavPageHeader } from "@/components/app/nav-header";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { keepPreviousData } from "@tanstack/react-query";
import { useInfiniteQuery } from "@/queries/use-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChipGroup, ChipOption } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/overlay";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { categories } from "@/config/categories";
import { spring } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCampuses, useSearch } from "@/queries/catalog";
import { qk } from "@/queries/keys";
import { services } from "@/services";
import type { SortKey } from "@/services/types";
import { BrandCard } from "../brand-card";
import { ProductRow, ProductRowSkeleton } from "../product-row";
import { CategoryNav, ExploreFilters } from "./filters";
import {
  activeFilterCount,
  sortLabels,
  toQuery,
  useExploreParams,
  type ExploreParams,
} from "./params";

function ActivePills({
  params,
  update,
}: {
  params: ExploreParams;
  update: (p: Partial<ExploreParams>) => void;
}) {
  const campuses = useCampuses();
  const pills: { key: string; label: string; clear: Partial<ExploreParams> }[] = [];
  if (params.min !== null || params.max !== null) {
    const label =
      params.min !== null && params.max !== null
        ? `${formatNaira(params.min * 100)}–${formatNaira(params.max * 100)}`
        : params.min !== null
          ? `From ${formatNaira(params.min * 100)}`
          : `Under ${formatNaira((params.max ?? 0) * 100)}`;
    pills.push({ key: "price", label, clear: { min: null, max: null } });
  }
  const campus = campuses.data?.find((c) => c.id === params.campus);
  if (campus) pills.push({ key: "campus", label: campus.shortName, clear: { campus: null } });
  const zone = campus?.zones.find((z) => z.id === params.zone);
  if (zone) pills.push({ key: "zone", label: zone.name, clear: { zone: null } });
  if (params.rating)
    pills.push({ key: "rating", label: `${params.rating}★ & up`, clear: { rating: null } });
  if (params.stock) pills.push({ key: "stock", label: "In stock", clear: { stock: false } });
  if (!pills.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      <AnimatePresence initial={false}>
        {pills.map((p) => (
          <motion.li
            key={p.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={spring.snappy}
          >
            <button
              type="button"
              onClick={() => update(p.clear)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent-soft pr-2 pl-3 text-small font-medium text-accent-ink hover:brightness-95"
              aria-label={`Remove filter ${p.label}`}
            >
              {p.label}
              <X className="size-3.5" />
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function BrandMatches({ q }: { q: string }) {
  const { data } = useSearch(q);
  if (!data?.brands.length) return null;
  return (
    <section aria-label="Matching brands" className="mb-6">
      <p className="mb-3 eyebrow text-muted">Brands</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {data.brands.map((b) => (
          <BrandCard key={b.id} brand={b} variant="compact" className="bg-surface hairline" />
        ))}
      </div>
    </section>
  );
}

export function ExploreView({ mode = "explore" }: { mode?: "explore" | "search" }) {
  const { params, update, clearFilters, pending } = useExploreParams();
  const query = useMemo(() => toQuery(params), [params]);
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const list = useInfiniteQuery({
    queryKey: [...qk.products(query), "infinite"],
    queryFn: ({ pageParam }) => services.catalog.getProducts({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });

  const items = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data]);
  const total = list.data?.pages[0]?.total ?? 0;
  const filters = activeFilterCount(params);
  const category = categories.find((c) => c.id === params.category);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = list;

  // Infinite scroll with a visible "Load more" fallback.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sortOptions = (Object.keys(sortLabels) as SortKey[])
    .filter((s) => s !== "relevance" || !!params.q)
    .map((s) => ({ value: s, label: sortLabels[s] }));

  const title =
    mode === "search" ? (
      params.q ? (
        <>
          Results for <em className="text-accent">“{params.q}”</em>
        </>
      ) : (
        "Search"
      )
    ) : category ? (
      category.name
    ) : (
      "Everything on campus"
    );

  const summary = (
    <span aria-live="polite">
      {list.isPending ? "Loading…" : `${formatNumber(total)} ${total === 1 ? "item" : "items"}`}
      {category && !list.isPending && ` · ${category.blurb}`}
    </span>
  );

  return (
    <div className={pagePad}>
      {/* On large screens the title sits at the top of the results column instead,
          level with the sidebar. */}
      <div className="lg:hidden">
        <NavPageHeader
          title={title}
          current={mode === "search" ? "Search" : category ? category.name : "Discover"}
          className="mb-0"
          description={summary}
        />
      </div>

      {/* Phones and tablets have no sidebar, so categories scroll sideways here. */}
      <div className="-mx-4 mt-5 scrollbar-none overflow-x-auto px-4 py-1 md:-mx-6 md:px-6 lg:hidden">
        <ChipGroup
          label="Category"
          value={params.category}
          onChange={(v) => update({ category: v as ExploreParams["category"] })}
        >
          <ChipOption value="all">All</ChipOption>
          {categories.map((c) => (
            <ChipOption key={c.id} value={c.id}>
              {c.name}
            </ChipOption>
          ))}
        </ChipGroup>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-8 lg:mt-0 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Categories and filters">
          <div className="sticky top-24 scrollbar-none flex max-h-[calc(100dvh-7rem)] flex-col gap-4 overflow-y-auto pb-4">
            <div className="card p-3">
              <CategoryNav value={params.category} onChange={(v) => update({ category: v })} />
            </div>
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-title font-semibold">Filters</h2>
                {filters > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-small text-muted underline underline-offset-4 hover:text-ink"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ExploreFilters params={params} update={update} />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 lg:min-h-[52px]">
            <div className="hidden min-w-0 lg:block">
              <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.03em]">
                {title}
              </h1>
              <p className="mt-0.5 text-small text-muted">{summary}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {(pending || (list.isFetching && !list.isFetchingNextPage)) && (
                <Spinner className="size-4 text-muted" label="Updating results" />
              )}
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden"
                leadingIcon={<SlidersHorizontal className="size-4" />}
                onClick={() => setSheet(true)}
              >
                Filters
                {filters > 0 && (
                  <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-on-primary">
                    {filters}
                  </span>
                )}
              </Button>
              <div className="w-44 sm:w-52">
                <Select
                  label="Sort by"
                  value={params.sort}
                  onValueChange={(v) => update({ sort: v })}
                  options={sortOptions}
                  className="h-9 text-small"
                />
              </div>
            </div>
          </div>
          <div className="mb-4 empty:hidden">
            <ActivePills params={params} update={update} />
          </div>
          {mode === "search" && params.q && <BrandMatches q={params.q} />}
          {list.isError ? (
            <EmptyState
              illustration="error"
              title="We couldn't load products"
              body="Something went wrong on our side. Your filters are saved."
              action={<Button onClick={() => void list.refetch()}>Try again</Button>}
            />
          ) : list.isPending ? (
            <div className="flex flex-col gap-4" aria-busy>
              {Array.from({ length: 5 }, (_, i) => (
                <ProductRowSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              illustration="search"
              title={params.q ? `Nothing matches “${params.q}”` : "Nothing matches these filters"}
              body={
                params.q
                  ? "Try a shorter word, a brand name, or browse a category."
                  : "Try widening the price range or switching campus."
              }
              action={
                filters > 0 ? (
                  <Button onClick={clearFilters}>Clear filters</Button>
                ) : (
                  <Button onClick={() => update({ q: "", category: "all" })}>
                    Browse everything
                  </Button>
                )
              }
            />
          ) : (
            <LayoutGroup>
              <ul
                className={cn(
                  "flex flex-col gap-4 transition-opacity",
                  list.isPlaceholderData && "opacity-60",
                )}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((p, i) => (
                    <motion.li
                      key={p.id}
                      layout={!reduce}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={spring.smooth}
                    >
                      <ProductRow product={p} morph priority={i < 2} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </LayoutGroup>
          )}
          <div ref={sentinel} className="flex justify-center py-10">
            {hasNextPage && (
              <Button
                variant="secondary"
                loading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                Load more
              </Button>
            )}
            {!hasNextPage && items.length > 24 && (
              <p className="text-small text-muted">You&apos;ve seen everything. Nice.</p>
            )}
          </div>
        </div>
      </div>

      <ResponsiveSheet
        open={sheet}
        onOpenChange={setSheet}
        title="Filters"
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={clearFilters}
              disabled={filters === 0}
            >
              Clear
            </Button>
            <Button className="flex-[2]" onClick={() => setSheet(false)}>
              {list.isFetching ? "Updating…" : `Show ${formatNumber(total)} results`}
            </Button>
          </div>
        }
      >
        <ExploreFilters params={params} update={update} />
      </ResponsiveSheet>
    </div>
  );
}
