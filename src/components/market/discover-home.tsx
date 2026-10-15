"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
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
import { categoryName } from "@/config/categories";
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

/** Search everywhere, with a round shortcut to filters beside it. */
function SearchBar() {
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  return (
    <div className="flex w-full gap-2.5">
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-white px-5 text-left text-[15px] text-[#6b7280] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.01]"
      >
        <Search className="size-5 shrink-0 text-[#1f2430]" aria-hidden />
        <span className="truncate">Search food, thrift, shops…</span>
      </button>
      <Link
        href="/explore"
        aria-label="Browse with filters"
        className="grid size-14 shrink-0 place-items-center rounded-full bg-white text-[#0e7a4f] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
      >
        <SlidersHorizontal className="size-5" />
      </Link>
    </div>
  );
}

/**
 * The big header: where you are, how many shops are on your campus, and search.
 * Full-bleed under the top bar on phones; a wide rounded banner on bigger screens.
 */
function Hero({
  campusName,
  shopCount,
}: {
  campusName: string | undefined;
  shopCount: number | undefined;
}) {
  return (
    <section className="relative -mx-4 -mt-5 overflow-hidden rounded-b-[28px] bg-[#101412] text-white md:mx-0 md:mt-0 md:rounded-[28px]">
      <Image
        src="/discover/banner-food.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-55"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,14,12,0.35),rgba(10,14,12,0.85))]"
      />
      <Link
        href="/account"
        className="absolute top-4 right-4 z-10 hidden h-10 items-center gap-2 rounded-full bg-white/12 px-4 text-[14px] font-medium ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/20 md:inline-flex"
      >
        <Gauge className="size-4" aria-hidden /> Your dashboard
      </Link>
      <div className="relative flex flex-col items-center px-5 pt-6 pb-6 text-center md:px-10 md:pt-9 md:pb-9">
        <Link
          href="/account/settings"
          className="flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors hover:bg-white/10"
        >
          <span className="text-[13px] text-white/80">Delivering on</span>
          <span className="inline-flex max-w-[80vw] items-center gap-1.5 text-[15px] font-semibold">
            <MapPin className="size-4 shrink-0 text-[#3dd68c]" aria-hidden />
            <span className="truncate">{campusName ?? "Choose your campus"}</span>
          </span>
        </Link>
        <div className="mt-5 flex items-center gap-3 md:mt-6">
          {shopCount ? (
            <>
              <span className="text-[64px] leading-none font-bold tracking-[-0.04em] text-[#3dd68c] tabular md:text-[84px]">
                {shopCount}
              </span>
              <span className="text-left text-[24px] leading-[1.05] font-semibold tracking-[-0.01em] uppercase md:text-[32px]">
                {shopCount === 1 ? "Shop" : "Shops"}
                <br />
                on campus
              </span>
            </>
          ) : (
            <span className="text-[34px] leading-[1.05] font-semibold tracking-[-0.03em] md:text-[48px]">
              Your campus, <span className="text-[#3dd68c]">one plug</span> away
            </span>
          )}
        </div>
        <p className="mt-3 max-w-md text-[17px] leading-snug font-medium md:text-[19px]">
          Food, thrift and more from students near you, to your hostel or ready for pickup.
        </p>
        <div className="mt-6 w-full max-w-2xl md:mt-8">
          <SearchBar />
        </div>
      </div>
    </section>
  );
}

/** A slim strip for the order you're waiting on. */
function OnTheWay({ order }: { order: Order }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="group flex items-center gap-3 rounded-2xl bg-accent-soft p-3.5 pr-4 ring-1 ring-accent/20"
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

/** Rounded photo tiles, one per category, scrolling sideways on phones. */
function Categories() {
  return (
    <section aria-labelledby="home-categories">
      <h2 id="home-categories" className="sr-only">
        Categories
      </h2>
      <ul className="-mx-(--gutter) scrollbar-none flex gap-3 overflow-x-auto px-(--gutter) pb-1 md:mx-0 md:grid md:grid-cols-8 md:gap-4 md:px-0">
        {categories.map((c) => (
          <li key={c.id} className="shrink-0">
            <Link
              href={`/explore?category=${c.id}`}
              className="group flex w-[76px] flex-col items-center gap-2 md:w-full"
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface p-1 shadow-sm ring-1 ring-line transition-transform duration-300 group-hover:-translate-y-1">
                <span className="relative block size-full overflow-hidden rounded-[12px]">
                  <Image
                    src={`/discover/${c.id}.jpg`}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 140px, 76px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </span>
              </span>
              <span className="text-[13px] font-medium text-ink-2 group-hover:text-ink md:text-[14px]">
                {short[c.id]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A shop card in the style of a restaurant tile: photo with a badge and heart, then name and rating. */
function ShopTile({ brand: b }: { brand: Brand }) {
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
    <article className="group relative w-[280px] rounded-2xl bg-surface p-1.5 shadow-sm ring-1 ring-line transition-shadow hover:shadow-md md:w-auto">
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
        </div>
        <div className="flex items-start gap-2.5 px-2 pt-2.5 pb-2">
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
          className="absolute top-4 right-4 grid size-9 pressable place-items-center rounded-full bg-black/25 backdrop-blur-sm"
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
  const campusShops = useBrands(user?.campusId ? { campusId: user.campusId } : {}).data;

  return (
    <div className={cn(pagePad, "flex flex-col gap-7 md:gap-9")}>
      <h1 className="sr-only">
        {mounted && firstName ? `What do you need, ${firstName}?` : "Home"}
      </h1>
      <Hero campusName={campus?.name} shopCount={campusShops?.length} />
      {onTheWay && <OnTheWay order={onTheWay} />}
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
