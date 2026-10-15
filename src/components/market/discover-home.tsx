"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bike,
  ChevronRight,
  Footprints,
  Gauge,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Store,
} from "lucide-react";
import { categoryName } from "@/config/categories";
import { pagePad } from "@/components/app/layout";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { categories } from "@/config/categories";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/controls";
import { ResponsiveSheet } from "@/components/ui/sheet";
import {
  WALKING_MINUTES,
  arrivalMinutes,
  compareNearness,
  formatMetres,
  nearness,
  type Nearness,
} from "@/domain/distance";
import { formatNaira } from "@/domain/money";
import { isActive, statusLabel } from "@/domain/orders";
import { cn } from "@/lib/cn";
import { formatCompact } from "@/lib/format";
import { useBrands, useCampus, useCampuses, useProducts } from "@/queries/catalog";
import { useBuyerSpot, useNearQuery } from "@/queries/nearby";
import { useMyOrders } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { useToggleFollow } from "@/queries/social";
import type {
  Brand,
  CategoryId,
  Order,
  ProductQuery,
  ProductWithBrand,
  SortKey,
} from "@/services/types";
import { useHomeFilters, type HomeSort } from "@/stores/home-filters";
import { useUi } from "@/stores/ui";
import { Clouds3D } from "@/components/landing/gate-scene";
import { LagoonScene } from "@/components/scenes/campus-scenes";
import { RelationBadge, etaText } from "./nearby";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { QuickAdd } from "./quick-add";

/** Short names for the round category buttons. */
const short: Record<CategoryId, string> = {
  fashion: "Fashion",
  thrift: "Thrift",
  food: "Food",
  beauty: "Beauty",
  accessories: "Accessories",
  print: "Print",
  tech: "Tech",
  books: "Books",
};

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-3">
      <h2 className="text-[19px] font-semibold tracking-[-0.02em] md:text-[22px]">{title}</h2>
      {href && (
        <Link
          href={href}
          aria-label={`See all: ${title}`}
          className="grid size-10 place-items-center rounded-full text-accent-ink ring-1 ring-line transition-colors hover:bg-accent-soft"
        >
          <ArrowUpRight className="size-5" />
        </Link>
      )}
    </div>
  );
}

/** Search everywhere; the round button beside it sorts and filters this feed in place. */
function SearchBar({ onFilters, active }: { onFilters: () => void; active: number }) {
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  return (
    <div className="flex w-full gap-2.5">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-surface px-5 text-left text-[15px] text-muted shadow-[0_4px_0_var(--line-strong)] ring-1 ring-line transition-transform hover:translate-y-px"
      >
        <Search className="size-5 shrink-0 text-accent" aria-hidden />
        <span className="truncate">Search food, thrift, shops…</span>
      </button>
      <button
        type="button"
        onClick={onFilters}
        aria-label={active ? `Sort and filter (${active} on)` : "Sort and filter"}
        aria-haspopup="dialog"
        className="relative grid size-14 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-[0_4px_0_var(--accent-edge)] transition-transform hover:translate-y-px"
      >
        <SlidersHorizontal className="size-5" aria-hidden />
        {active > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-[#ffd84d] text-[11px] font-bold text-[#1b1f3b] tabular ring-2 ring-surface">
            {active}
          </span>
        )}
      </button>
    </div>
  );
}

/**
 * The big header: where you are, how many shops are on your campus, and search.
 * Full-bleed under the top bar on phones; a wide rounded banner on bigger screens.
 */
function Hero({
  spotName,
  shopCount,
  onFilters,
  activeFilters,
}: {
  spotName: string | undefined;
  shopCount: number | undefined;
  onFilters: () => void;
  activeFilters: number;
}) {
  return (
    <section className="relative isolate -mt-5 ml-[calc(50%-50vw)] w-screen overflow-hidden bg-[#eef1fb] text-ink md:-mt-7 dark:bg-[#161936]">
      <Clouds3D inApp />
      <Link
        href="/account"
        className="absolute top-4 right-4 z-20 hidden h-10 items-center gap-2 rounded-full bg-surface px-4 text-[14px] font-semibold shadow-[0_3px_0_var(--line-strong)] ring-1 ring-line transition-transform hover:translate-y-px md:inline-flex"
      >
        <Gauge className="size-4" aria-hidden /> Your dashboard
      </Link>
      <div className="relative z-10 flex flex-col items-center px-5 pt-7 text-center md:px-10 md:pt-10">
        <Link
          href="/account/places"
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors hover:bg-ink/[0.05]"
        >
          <span className="text-[13px] text-muted">Delivering to</span>
          <span className="inline-flex max-w-[80vw] items-center gap-1.5 text-[15px] font-bold">
            <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate">{spotName ?? "Choose your spot"}</span>
          </span>
        </Link>
        <h1 className="mt-4 text-[clamp(30px,8.4vw,72px)] leading-none font-extrabold tracking-[-0.05em] whitespace-nowrap md:mt-5">
          {shopCount ? (
            <>
              <span className="text-accent tabular">{shopCount}</span>{" "}
              {shopCount === 1 ? "shop" : "shops"} at UNILAG
            </>
          ) : (
            <>
              Wetin you <span className="text-accent">need?</span>
            </>
          )}
        </h1>
        <div className="mt-6 w-full max-w-2xl md:mt-7">
          <SearchBar onFilters={onFilters} active={activeFilters} />
        </div>
      </div>
      <LagoonScene className="relative z-[1] mt-2 h-[190px] w-full sm:h-[240px] md:h-[24vw] md:max-h-[380px]" />
    </section>
  );
}

/** A slim strip for the order you're waiting on. */
function OnTheWay({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="group flex items-center gap-3 border-y border-line-thin py-3.5"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white">
        <Bike className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-ink-2">
          Your order from {order.brandName} · {formatNaira(order.totalKobo)}
        </span>
        <span className="block text-[16px] font-semibold text-accent-ink">
          {statusLabel(order.status, order.fulfilment.method)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-accent-ink">
        Track <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/** Wide photo tiles, one per category, packed close together; they scroll sideways on phones. */
function Categories() {
  return (
    <section aria-labelledby="home-categories">
      <h2 id="home-categories" className="sr-only">
        Categories
      </h2>
      <ul className="-mx-(--gutter) scrollbar-none flex gap-2 overflow-x-auto px-(--gutter) md:mx-0 md:grid md:grid-cols-4 md:gap-2.5 md:px-0">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link href={`/explore?category=${c.id}`} className="group block w-[168px] md:w-full">
              <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-line transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="relative block size-full">
                  <Image
                    src={`/discover/${c.id}.jpg`}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 168px"
                    quality={90}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pt-8 pb-2.5 text-[14px] font-bold text-white md:text-[15px]">
                  {short[c.id]}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A shop in the style of a restaurant tile: a rounded photo with a badge and heart, then name and rating. No box around it. */
function ShopTile({ brand: b, near }: { brand: Brand; near: ShopNear | undefined }) {
  const { user } = useSession();
  const follow = useToggleFollow();
  const following = !!user?.followingBrandIds.includes(b.id);
  const f = b.fulfilment;
  const badge = b.vacation
    ? "On a break"
    : f?.delivery && !f.deliveryFeeKobo
      ? "Free delivery"
      : b.verified
        ? "Verified shop"
        : null;
  return (
    <article className="group relative w-[280px] md:w-auto">
      <Link href={`/brands/${b.handle}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-2">
          <div className="size-full transition-transform duration-500 group-hover:scale-[1.04]">
            <AppImage
              image={b.cover}
              alt=""
              variant="cover"
              sizes="(min-width: 1024px) 25vw, 280px"
            />
          </div>
          {badge && (
            <span
              className={cn(
                "absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                b.vacation ? "bg-surface text-ink" : "bg-brand text-white",
              )}
            >
              {badge === "Verified shop" && <BadgeCheck className="size-3.5" aria-hidden />}
              {badge === "Free delivery" && <Bike className="size-3.5" aria-hidden />}
              {badge}
            </span>
          )}
          {near?.relation && (
            <RelationBadge relation={near.relation} className="absolute bottom-2.5 left-2.5" />
          )}
        </div>
        <div className="flex items-start gap-2.5 pt-3">
          <span className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
            <AppImage image={b.logo} alt="" variant="logo" name={b.name} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-[16px] font-semibold">{b.name}</h3>
              {b.ratingCount > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 text-[13.5px] font-semibold">
                  <Star className="size-4 fill-[#f5b301] text-[#f5b301]" aria-hidden />
                  <span className="tabular">{b.rating.toFixed(1)}</span>
                  <span className="font-normal text-muted tabular">({b.ratingCount})</span>
                </span>
              )}
            </div>
            {near && near.metres !== null && near.walkMin !== null && (
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-accent-ink">
                <Footprints className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate tabular">
                  {near.metres === 0
                    ? "Right by you"
                    : `${formatMetres(near.metres)} · ${near.walkMin} min walk`}
                  {near.etaMin !== null && ` · ${etaText(near.etaMin, !!f?.delivery)}`}
                </span>
              </p>
            )}
            <p className="mt-0.5 truncate text-[13px] text-muted">
              {categoryName(b.category)}
              {f?.delivery && f.deliveryFeeKobo
                ? ` · ${formatNaira(f.deliveryFeeKobo)} delivery`
                : ""}
              {!f?.delivery && f?.pickup ? " · Pickup" : ""}
              {` · ${formatCompact(b.followerCount)} followers`}
            </p>
          </div>
        </div>
      </Link>
      {user && (
        <button
          type="button"
          aria-pressed={following}
          aria-label={following ? `Unfollow ${b.name}` : `Follow ${b.name}`}
          onClick={() => follow.mutate({ id: b.id, handle: b.handle })}
          className="absolute top-2.5 right-2.5 grid size-9 pressable place-items-center rounded-full bg-black/25 backdrop-blur-sm"
        >
          <Heart
            className={cn(
              "size-[19px]",
              following ? "fill-[#f43f5e] text-[#f43f5e]" : "text-white",
            )}
          />
        </button>
      )}
    </article>
  );
}

function ShopTileSkeleton() {
  return (
    <div className="w-[280px] md:w-auto" aria-hidden>
      <Skeleton className="aspect-[16/10] w-full" rounded="lg" />
      <div className="mt-2.5 flex gap-2.5">
        <Skeleton className="size-10" rounded="full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1.5 h-3 w-40" />
        </div>
      </div>
    </div>
  );
}

type ShopNear = Nearness & { etaMin: number | null };

const sortTitles: Record<HomeSort, string> = {
  nearest: "Closest to you",
  popular: "Popular shops",
  rating: "Top rated shops",
  newest: "New shops",
};

function Shops({
  campusId,
  view,
  onFilters,
}: {
  campusId: string | undefined;
  view: HomeView;
  onFilters: () => void;
}) {
  const local = useBrands(campusId ? { campusId } : {}).data;
  const everywhere = useBrands({ limit: 8 }).data;
  const campuses = useCampuses().data;
  // Your campus first; if it has no shops yet, shops from everywhere.
  const pool = local && local.length > 0 ? local : everywhere;
  const ranked = useMemo(() => {
    if (!pool) return undefined;
    const rows = pool.map((b) => {
      const campus = campuses?.find((c) => c.id === b.campusId);
      const n = nearness(b.fulfilment, campus, view.buyer);
      return { b, n: { ...n, etaMin: arrivalMinutes(b.fulfilment, n) } };
    });
    const shown = view.walking ? rows.filter((r) => r.n.walking) : rows;
    const by: Record<HomeSort, (x: (typeof rows)[number], y: (typeof rows)[number]) => number> = {
      nearest: (x, y) => compareNearness(x.n, y.n) || y.b.followerCount - x.b.followerCount,
      popular: (x, y) => y.b.followerCount - x.b.followerCount,
      rating: (x, y) => y.b.rating - x.b.rating || y.b.ratingCount - x.b.ratingCount,
      newest: (x, y) => Date.parse(y.b.createdAt) - Date.parse(x.b.createdAt),
    };
    return [...shown].sort(by[view.sort]).slice(0, 8);
  }, [pool, campuses, view.buyer, view.walking, view.sort]);
  if (pool && pool.length === 0) return null;
  return (
    <section className="border-t border-line-thin pt-5 md:pt-6">
      <SectionHead title={sortTitles[view.sort]} href="/explore" />
      {view.located && (
        <p className="-mt-2 mb-3.5 text-[13px] text-muted">
          Measured from <b className="font-semibold text-ink">{view.buyer.label}</b>
          {view.walking && " · walking distance only"}
        </p>
      )}
      {ranked && ranked.length === 0 ? (
        <div className="flex flex-col items-start gap-3 border-y border-line-thin py-6">
          <p className="text-[15px]">No shops within a short walk of {view.buyer.label} yet.</p>
          <Button variant="secondary" size="sm" onClick={onFilters}>
            Change filters
          </Button>
        </div>
      ) : (
        <ul className="-mx-(--gutter) scrollbar-none flex snap-x scroll-px-(--gutter) gap-4 overflow-x-auto px-(--gutter) pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 xl:grid-cols-4">
          {ranked
            ? ranked.map(({ b, n }) => (
                <li key={b.id} className="shrink-0 snap-start">
                  <ShopTile brand={b} near={n} />
                </li>
              ))
            : Array.from({ length: 4 }, (_, i) => (
                <li key={i} className="shrink-0">
                  <ShopTileSkeleton />
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}

function ProductGrid({
  title,
  query,
  href,
  skip = [],
  keep,
}: {
  title: string;
  query: ProductQuery;
  href: string;
  /** Products already shown above, so the same ones don't appear twice. */
  skip?: string[];
  /** Only show products that pass this (e.g. from your faculty). */
  keep?: (p: ProductWithBrand) => boolean;
}) {
  const { data } = useProducts(query);
  const items = data?.items.filter((p) => !skip.includes(p.id) && (!keep || keep(p))).slice(0, 10);
  if (items && items.length === 0) return null;
  return (
    <section className="border-t border-line-thin pt-5 md:pt-6">
      <SectionHead title={title} href={href} />
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items
          ? items.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                priority={i < 2}
                action={<QuickAdd product={p} />}
              />
            ))
          : Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </section>
  );
}

/** Sort and narrow the home feed without leaving it. */
function FilterSheet({
  open,
  onOpenChange,
  view,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  view: HomeView;
}) {
  const options: { id: HomeSort; label: string }[] = [
    { id: "nearest", label: "Closest to you" },
    { id: "popular", label: "Popular" },
    { id: "rating", label: "Top rated" },
    { id: "newest", label: "Newest" },
  ];
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Sort and filter"
      footer={
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={view.reset}
            disabled={view.active === 0}
          >
            Reset
          </Button>
          <Button className="flex-[2]" onClick={() => onOpenChange(false)}>
            Show results
          </Button>
        </div>
      }
    >
      <div className="flex flex-col divide-y divide-line-thin">
        <div className="pb-5">
          <p className="mb-1 text-[13px] text-muted">Measuring from</p>
          <Link
            href="/account/places"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 text-[16px] font-semibold hover:underline"
          >
            <MapPin className="size-4 text-accent" aria-hidden />
            {view.buyer.label ?? "Set where you are"}
            <span className="text-[14px] font-medium text-accent-ink">· Change</span>
          </Link>
        </div>
        <fieldset className="py-5">
          <legend className="mb-3 eyebrow text-muted">Sort by</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <Chip
                key={o.id}
                selected={view.sort === o.id}
                disabled={o.id === "nearest" && !view.located}
                onClick={() => view.set({ sort: o.id })}
              >
                {o.label}
              </Chip>
            ))}
          </div>
          {!view.located && (
            <p className="mt-2 text-[13px] text-muted">Set your spot to sort by distance.</p>
          )}
        </fieldset>
        <div className="pt-5">
          <Switch
            checked={view.walking}
            disabled={!view.located}
            onCheckedChange={(walking) => view.set({ walking })}
            label="Walking distance"
            description={
              view.located
                ? `Only shops about ${WALKING_MINUTES} minutes or less on foot from ${view.buyer.label}.`
                : "Set your spot first."
            }
          />
        </div>
      </div>
    </ResponsiveSheet>
  );
}

type HomeView = ReturnType<typeof useHomeView>;

function useHomeView() {
  const buyer = useBuyerSpot();
  const { sort: picked, walking, set, reset } = useHomeFilters();
  const located = buyer.onMap;
  const fallback: HomeSort = located ? "nearest" : "popular";
  const sort: HomeSort = picked === "nearest" && !located ? "popular" : (picked ?? fallback);
  const walk = walking && located;
  return {
    buyer,
    located,
    sort,
    walking: walk,
    set,
    reset,
    /** Filters that differ from the default, for the badge on the button. */
    active: Number(sort !== fallback) + Number(walk),
  };
}

/** Nothing on Kamplug yet: say so plainly and offer to be first. */
function EmptyMarket() {
  return (
    <section className="flex flex-col items-center gap-3 border-t border-line-thin py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
        <Store className="size-6" />
      </span>
      <h2 className="text-[18px] font-semibold">No shops here yet</h2>
      <p className="max-w-sm text-small text-muted">
        Be the first plug on your campus. Opening a shop takes a few minutes.
      </p>
      <Link
        href="/open-shop"
        className="mt-1 inline-flex h-10 items-center rounded-full bg-accent px-5 text-[14px] font-semibold text-on-accent hover:bg-accent-hover"
      >
        Open a shop
      </Link>
    </section>
  );
}

/**
 * The buyer's home is the market: search, categories, shops and what's popular,
 * like opening a delivery app. Spending and to-dos live on the dashboard.
 */
export function DiscoverHome() {
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const orders = useMyOrders().data;
  const anyProducts = useProducts({ pageSize: 1 }).data;
  const view = useHomeView();
  const near = useNearQuery();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const openFilters = () => setFiltersOpen(true);
  const onTheWay = (orders ?? [])
    .filter((o) => isActive(o.status))
    .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt))[0];
  const empty = anyProducts && anyProducts.items.length === 0;
  const spotCampus = useCampus(view.buyer.campusId);
  const spotName = view.buyer.label
    ? `${view.buyer.label}${spotCampus ? `, ${spotCampus.shortName}` : ""}`
    : campus?.name;
  const campusShops = useBrands(user?.campusId ? { campusId: user.campusId } : {}).data;

  // The feed follows the chosen sort; walking distance narrows every section.
  const base: ProductQuery = {
    pageSize: 12,
    inStock: true,
    ...(near ? { near } : {}),
    ...(view.walking ? { walking: true } : {}),
  };
  const firstSort: SortKey = view.sort;
  const first = { ...base, sort: firstSort };
  const secondSort: SortKey = view.sort === "newest" ? "popular" : "newest";
  const firstTitle: Record<HomeSort, string> = {
    nearest: "Closest to you",
    popular: "Popular right now",
    rating: "Top rated",
    newest: "New on Kamplug",
  };
  // Your faculty first, then your hall: listings from people around you.
  const mine = !!(view.buyer.facultyZoneId || view.buyer.hallZoneId);
  const campusOf = useCampuses().data;
  const fromMine = (p: ProductWithBrand) => {
    const c = campusOf?.find((x) => x.id === p.brand.campusId);
    const r = nearness(p.brand.fulfilment, c, view.buyer).relation;
    return r === "same_faculty" || r === "same_hostel";
  };
  const mineTitle =
    view.buyer.facultyZoneId && view.buyer.hallZoneId
      ? "From your faculty and hall"
      : view.buyer.facultyZoneId
        ? "From your faculty"
        : "From your hall";
  const mineQuery: ProductQuery = { ...base, sort: "nearest", pageSize: 24 };
  const mineData = useProducts(mineQuery, { enabled: mine }).data;
  const mineIds = mine
    ? (mineData?.items
        .filter(fromMine)
        .slice(0, 10)
        .map((p) => p.id) ?? [])
    : [];
  // Each section skips what's already shown above it.
  const firstIds =
    useProducts(first)
      .data?.items.filter((p) => !mineIds.includes(p.id))
      .slice(0, 10)
      .map((p) => p.id) ?? [];

  return (
    <div className={cn(pagePad, "flex flex-col gap-7 md:gap-9")}>
      <Hero
        spotName={spotName}
        shopCount={campusShops?.length}
        onFilters={openFilters}
        activeFilters={view.active}
      />
      <FilterSheet open={filtersOpen} onOpenChange={setFiltersOpen} view={view} />
      {onTheWay && <OnTheWay order={onTheWay} />}
      <Categories />

      {empty ? (
        <EmptyMarket />
      ) : (
        <>
          {mine && (
            <ProductGrid
              title={mineTitle}
              query={mineQuery}
              href="/explore?sort=nearest"
              keep={fromMine}
            />
          )}
          <Shops campusId={user?.campusId ?? undefined} view={view} onFilters={openFilters} />
          <ProductGrid
            title={firstTitle[view.sort]}
            query={first}
            skip={mineIds}
            href={`/explore?sort=${view.sort}${view.walking ? "&walk=1" : ""}`}
          />
          <ProductGrid
            title={secondSort === "newest" ? "New on Kamplug" : "Popular right now"}
            query={{ ...base, sort: secondSort }}
            href={`/explore?sort=${secondSort}${view.walking ? "&walk=1" : ""}`}
            skip={[...mineIds, ...firstIds]}
          />
        </>
      )}

      <Link
        href="/account"
        className="flex items-center gap-3 border-t border-line-thin pt-5 transition-opacity hover:opacity-80 sm:hidden"
      >
        <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent-ink">
          <Gauge className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Your dashboard</span>
          <span className="block text-[13px] text-muted">
            Spending, orders on the way and to-dos
          </span>
        </span>
        <ChevronRight className="size-5 text-muted" />
      </Link>
    </div>
  );
}
