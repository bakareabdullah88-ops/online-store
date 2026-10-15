"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  ChevronRight,
  Gauge,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Store,
} from "lucide-react";
import { pagePad } from "@/components/app/layout";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { categories } from "@/config/categories";
import { formatNaira } from "@/domain/money";
import { isActive, statusLabel } from "@/domain/orders";
import { cn } from "@/lib/cn";
import { formatCompact } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useBrands, useCampus, useProducts } from "@/queries/catalog";
import { useMyOrders } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { useToggleFollow } from "@/queries/social";
import type { Brand, CategoryId, Order } from "@/services/types";
import { useUi } from "@/stores/ui";
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

function SectionHead({
  title,
  href,
  label = "See all",
}: {
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] md:text-[20px]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="tap-area inline-flex items-center gap-0.5 text-small font-medium text-accent-ink hover:underline"
        >
          {label} <ChevronRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

/** "What are you looking for?" Opens search everywhere, plus a shortcut to filters. */
function SearchBar() {
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-surface px-4 text-left text-[15px] text-muted ring-1 ring-line transition-shadow hover:ring-line-strong"
      >
        <Search className="size-5 shrink-0" aria-hidden />
        <span className="truncate">Search food, thrift, shops…</span>
      </button>
      <Link
        href="/explore"
        aria-label="Browse with filters"
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-surface transition-opacity hover:opacity-90"
      >
        <SlidersHorizontal className="size-5" />
      </Link>
    </div>
  );
}

/** The top banner: your order if one is on the way, otherwise a welcome to the market. */
function Banner({ order }: { order: Order | undefined }) {
  if (order) {
    return (
      <Link
        href={`/orders/${order.id}`}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-brand p-5 text-white md:p-6"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/15">
          <Bike className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] text-white">Your order from {order.brandName}</span>
          <span className="mt-0.5 block text-[20px] font-semibold tracking-[-0.02em]">
            {statusLabel(order.status, order.fulfilment.method)}
          </span>
          <span className="mt-0.5 block text-[13px] text-white tabular">
            {order.code} · {formatNaira(order.totalKobo)}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[13.5px] font-semibold text-[#0e7a4f]">
          Track <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand text-white">
      <div className="relative z-10 flex max-w-[62%] flex-col items-start gap-2 p-5 md:max-w-[50%] md:p-7">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-white uppercase">Kamplug</p>
        <p className="text-[21px] leading-tight font-semibold tracking-[-0.02em] md:text-[28px]">
          Everything on campus, one plug away
        </p>
        <p className="hidden text-[14px] text-white sm:block">
          Food, thrift, beauty and more from students near you.
        </p>
        <Link
          href="/explore"
          className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-[#0e7a4f] transition-transform hover:translate-x-0.5"
        >
          Start exploring <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="absolute inset-y-0 right-0 w-[48%] md:w-[55%]">
        <Image
          src="/discover/banner-food.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 55vw, 48vw"
          className="object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-r from-[#0e7a4f] via-[#0e7a4f]/30 to-transparent" />
      </div>
    </div>
  );
}

/** Round photo buttons, one per category, scrolling sideways on phones. */
function Categories() {
  return (
    <section aria-labelledby="home-categories">
      <h2 id="home-categories" className="sr-only">
        Categories
      </h2>
      <ul className="-mx-(--gutter) scrollbar-none flex gap-4 overflow-x-auto px-(--gutter) pb-1 md:mx-0 md:grid md:grid-cols-8 md:gap-3 md:px-0">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              href={`/explore?category=${c.id}`}
              className="group flex w-[68px] flex-col items-center gap-2 md:w-full"
            >
              <span className="relative size-[64px] overflow-hidden rounded-full bg-surface-2 ring-1 ring-line transition-transform duration-300 group-hover:-translate-y-0.5 md:size-[76px]">
                <Image
                  src={`/discover/${c.id}.jpg`}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="text-[12.5px] font-medium text-ink-2 group-hover:text-ink md:text-[13px]">
                {short[c.id]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A shop card in the style of a restaurant tile: cover, logo, name, rating, how you get it. */
function ShopTile({ brand: b }: { brand: Brand }) {
  const { user } = useSession();
  const follow = useToggleFollow();
  const following = !!user?.followingBrandIds.includes(b.id);
  const f = b.fulfilment;
  return (
    <article className="group relative w-[260px] md:w-auto">
      <Link href={`/brands/${b.handle}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-surface-2">
          <div className="size-full transition-transform duration-500 group-hover:scale-[1.04]">
            <AppImage
              image={b.cover}
              alt=""
              variant="cover"
              sizes="(min-width: 1024px) 25vw, 260px"
            />
          </div>
          {b.vacation && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold">
              On a break
            </span>
          )}
        </div>
        <div className="mt-2.5 flex items-start gap-2.5">
          <span className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
            <AppImage image={b.logo} alt="" variant="logo" name={b.name} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1 text-[15px] font-semibold">
              <span className="truncate">{b.name}</span>
              {b.verified && (
                <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified shop" />
              )}
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[12.5px] text-muted">
              {b.ratingCount > 0 && (
                <span className="inline-flex items-center gap-1 text-ink-2">
                  <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
                  <span className="tabular">{b.rating.toFixed(1)}</span>
                </span>
              )}
              {f?.delivery ? (
                <span className="inline-flex items-center gap-1">
                  <Bike className="size-3.5" aria-hidden />
                  {f.deliveryFeeKobo ? formatNaira(f.deliveryFeeKobo) : "Free delivery"}
                </span>
              ) : f?.pickup ? (
                <span className="inline-flex items-center gap-1">
                  <Store className="size-3.5" aria-hidden /> Pickup
                </span>
              ) : null}
              <span className="tabular">{formatCompact(b.followerCount)} followers</span>
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
          className="absolute top-2.5 right-2.5 grid size-9 pressable place-items-center rounded-full bg-surface/95 shadow-sm"
        >
          <Heart
            className={cn(
              "size-[18px]",
              following ? "fill-[#f43f5e] text-[#f43f5e]" : "text-ink-2",
            )}
          />
        </button>
      )}
    </article>
  );
}

function ShopTileSkeleton() {
  return (
    <div className="w-[260px] md:w-auto" aria-hidden>
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

function Shops({ campusId }: { campusId: string | undefined }) {
  const near = useBrands(campusId ? { campusId, limit: 8 } : { limit: 8 }).data;
  const everywhere = useBrands({ limit: 8 }).data;
  // Your campus first; if it has no shops yet, shops from everywhere.
  const shops = near && near.length > 0 ? near : everywhere;
  const local = !!near && near.length > 0 && !!campusId;
  if (shops && shops.length === 0) return null;
  return (
    <section>
      <SectionHead title={local ? "Shops near you" : "Popular shops"} href="/explore" />
      <ul className="-mx-(--gutter) scrollbar-none flex snap-x scroll-px-(--gutter) gap-4 overflow-x-auto px-(--gutter) pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 xl:grid-cols-4">
        {shops
          ? shops.map((b) => (
              <li key={b.id} className="shrink-0 snap-start">
                <ShopTile brand={b} />
              </li>
            ))
          : Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="shrink-0">
                <ShopTileSkeleton />
              </li>
            ))}
      </ul>
    </section>
  );
}

function ProductGrid({
  title,
  sort,
  href,
  skip = [],
}: {
  title: string;
  sort: "popular" | "newest";
  href: string;
  /** Products already shown above, so the same ones don't appear twice. */
  skip?: string[];
}) {
  const { data } = useProducts({ sort, pageSize: 12, inStock: true });
  const items = data?.items.filter((p) => !skip.includes(p.id)).slice(0, 10);
  if (items && items.length === 0) return null;
  return (
    <section>
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

/** Nothing on Kamplug yet: say so plainly and offer to be first. */
function EmptyMarket() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
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
  const mounted = useMounted();
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const orders = useMyOrders().data;
  const anyProducts = useProducts({ pageSize: 1 }).data;
  // Same query as "Popular right now", so "New on Kamplug" can leave those out.
  const popular = useProducts({ sort: "popular", pageSize: 12, inStock: true }).data;
  const popularIds = popular?.items.slice(0, 10).map((p) => p.id) ?? [];
  const onTheWay = (orders ?? [])
    .filter((o) => isActive(o.status))
    .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt))[0];
  const firstName = user?.name.split(" ")[0];
  const empty = anyProducts && anyProducts.items.length === 0;

  return (
    <div className={cn(pagePad, "flex flex-col gap-7 md:gap-9")}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/account/settings"
              className="inline-flex max-w-full items-center gap-1 text-[13px] text-muted hover:text-ink"
            >
              <MapPin className="size-3.5 shrink-0 text-accent-ink" aria-hidden />
              <span className="truncate">{campus ? campus.name : "Choose your campus"}</span>
            </Link>
            <h1 className="mt-1 text-[24px] leading-tight font-semibold tracking-[-0.03em] md:text-[30px]">
              {mounted && firstName ? `What do you need, ${firstName}?` : "What do you need today?"}
            </h1>
          </div>
          <Link
            href="/account"
            className="hidden h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium ring-1 ring-line transition-colors hover:bg-ink/[0.04] sm:inline-flex"
          >
            <Gauge className="size-4" aria-hidden /> Your dashboard
          </Link>
        </div>
        <SearchBar />
      </div>

      <Banner order={onTheWay} />
      <Categories />

      {empty ? (
        <EmptyMarket />
      ) : (
        <>
          <Shops campusId={user?.campusId ?? undefined} />
          <ProductGrid title="Popular right now" sort="popular" href="/explore?sort=popular" />
          {popular && (
            <ProductGrid
              title="New on Kamplug"
              sort="newest"
              href="/explore?sort=newest"
              skip={popularIds}
            />
          )}
        </>
      )}

      <Link
        href="/account"
        className="flex items-center gap-3 rounded-2xl bg-surface-2 p-4 ring-1 ring-line transition-colors hover:bg-ink/[0.04] sm:hidden"
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
