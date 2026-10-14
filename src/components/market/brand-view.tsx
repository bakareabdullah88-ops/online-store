"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { BadgeCheck, Bike, Clock, MapPin, MessageCircle, Star, Store } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NumberTicker } from "@/components/ui/misc";
import { Select } from "@/components/ui/overlay";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatSheet } from "@/components/messages/chat-sheet";
import { categoryName } from "@/config/categories";
import { spring } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import { describeDays, formatClock, openState } from "@/domain/hours";
import { formatCompact, formatDate } from "@/lib/format";
import { useDocumentTitle, useNow } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useBrand, useBrandReviews, useCampus, useProducts } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import { useToggleFollow } from "@/queries/social";
import { isServiceError } from "@/services/errors";
import type { Brand, SortKey } from "@/services/types";
import { toast } from "@/stores/toast";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { ReviewsBlock } from "./reviews";
import { ShareButton } from "./share-button";

function OpenBadge({ brand }: { brand: Brand }) {
  const now = useNow(60_000);
  if (!now) return <Skeleton className="h-6 w-36" rounded="full" />;
  const s = openState(brand.openHours, brand.vacation, new Date(now));
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-2 rounded-full px-3 text-small font-medium",
        s.open ? "bg-success-soft text-success" : "bg-ink/[0.06] text-ink-2",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", s.open ? "bg-success" : "bg-faint")}
        aria-hidden
      />
      {s.label}
    </span>
  );
}

function FollowButton({ brand }: { brand: Brand }) {
  const { user } = useSession();
  const toggle = useToggleFollow();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const following = !!user?.followingBrandIds.includes(brand.id);
  return (
    <Button
      variant={following ? "secondary" : "primary"}
      aria-pressed={following}
      onClick={() => {
        if (!user) {
          toast("Log in to follow brands", {
            description: "You'll hear about new drops first.",
            action: {
              label: "Log in",
              onClick: () => router.push(`/login?next=${encodeURIComponent(pathname)}`),
            },
          });
          return;
        }
        toggle.mutate(brand, {
          onSuccess: (r) =>
            r.following &&
            toast.success(`Following ${brand.name}`, {
              description: "New drops will show in your notifications.",
            }),
        });
      }}
      className="min-w-28"
    >
      <motion.span
        key={following ? "f" : "n"}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.snappy}
      >
        {following ? "Following" : "Follow"}
      </motion.span>
    </Button>
  );
}

function BrandProducts({ brand }: { brand: Brand }) {
  const [sort, setSort] = useState<SortKey>("popular");
  const { data, isPending } = useProducts({ brandId: brand.id, sort, pageSize: 48 });
  if (!isPending && data?.items.length === 0) {
    return (
      <EmptyState
        compact
        illustration="products"
        title="No products yet"
        body={`${brand.name} is setting up. Follow to hear when they drop.`}
      />
    );
  }
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-small text-muted">{data ? `${data.total} products` : " "}</p>
        <div className="w-52">
          <Select
            label="Sort products"
            value={sort}
            onValueChange={setSort}
            className="h-9 text-small"
            options={[
              { value: "popular", label: "Popular" },
              { value: "newest", label: "Newest" },
              { value: "price_asc", label: "Price: low to high" },
              { value: "price_desc", label: "Price: high to low" },
            ]}
          />
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 8 }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))
          : data?.items.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} morph showBrand={false} />
              </li>
            ))}
      </ul>
    </div>
  );
}

function BrandAbout({ brand }: { brand: Brand }) {
  const campus = useCampus(brand.campusId);
  const points =
    campus?.pickupPoints.filter((p) => brand.fulfilment.pickupPointIds.includes(p.id)) ?? [];
  const zones = campus?.zones.filter((z) => brand.fulfilment.zoneIds.includes(z.id)) ?? [];
  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
      <div className="md:col-span-7">
        <p className="eyebrow text-muted">The story</p>
        <p className="mt-3 font-display text-display-sm text-balance text-ink">{brand.tagline}</p>
        <p className="mt-4 max-w-prose text-body-lg text-ink-2">
          {brand.bio || "This brand hasn't written a bio yet."}
        </p>
        <p className="mt-6 text-small text-muted">
          On {campus?.name ?? "campus"} since {formatDate(brand.createdAt, { year: true })}
        </p>
      </div>
      <dl className="flex flex-col gap-6 md:col-span-5">
        <div className="card p-5">
          <dt className="flex items-center gap-2 text-small font-semibold">
            <Clock className="size-4" /> Opening hours
          </dt>
          <dd className="mt-2 text-small text-ink-2">
            {describeDays(brand.openHours.days)}, {formatClock(brand.openHours.opens)}–
            {formatClock(brand.openHours.closes)}
          </dd>
        </div>
        {brand.fulfilment.pickup && (
          <div className="card p-5">
            <dt className="flex items-center gap-2 text-small font-semibold">
              <MapPin className="size-4" /> Pickup points · free
            </dt>
            <dd>
              <ul className="mt-2 flex flex-col gap-2">
                {points.map((p) => (
                  <li key={p.id} className="text-small">
                    <span className="text-ink">{p.name}</span>
                    <span className="block text-muted">{p.hint}</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {brand.fulfilment.delivery && (
          <div className="card p-5">
            <dt className="flex items-center gap-2 text-small font-semibold">
              <Bike className="size-4" /> Delivery · {formatNaira(brand.fulfilment.deliveryFeeKobo)}
            </dt>
            <dd className="mt-2 text-small text-ink-2">
              To {zones.length} {zones.length === 1 ? "zone" : "zones"} on {campus?.shortName}:{" "}
              {zones.map((z) => z.name).join(", ")}. Ready in about{" "}
              {brand.fulfilment.prepMinutes >= 60
                ? `${Math.round(brand.fulfilment.prepMinutes / 60)}h`
                : `${brand.fulfilment.prepMinutes} min`}
              .
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function BrandSkeleton() {
  return (
    <div aria-hidden>
      <div className="container-page pt-4 md:pt-6">
        <Skeleton className="aspect-[16/7] w-full md:aspect-[16/5]" rounded="lg" />
      </div>
      <div className="container-page">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <Skeleton
            className="-mt-12 size-24 ring-4 ring-canvas md:-mt-16 md:size-32"
            rounded="full"
          />
          <div className="flex-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-10 w-64" />
            <SkeletonText className="mt-3 max-w-md text-body" lines={1} />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandView() {
  const { handle } = useParams<{ handle: string }>();
  const { data: brand, isPending, error } = useBrand(handle);
  const { user } = useSession();
  const campus = useCampus(brand?.campusId);
  const reviews = useBrandReviews(brand?.id);
  const [tab, setTab] = useState("products");
  const [chat, setChat] = useState(false);
  const router = useRouter();
  useDocumentTitle(brand?.name);

  if (isPending) return <BrandSkeleton />;
  if (error || !brand) {
    return (
      <div className="container-page">
        <EmptyState
          illustration="lost"
          title={
            isServiceError(error) && error.code === "NOT_FOUND"
              ? "We can't find that brand"
              : "Something went wrong"
          }
          body="It may have changed its handle or closed. Explore other brands on campus."
          action={<ButtonLink href="/explore">Explore brands</ButtonLink>}
        />
      </div>
    );
  }

  const own = !!user?.brandIds.includes(brand.id);

  return (
    <div>
      <div className="container-page pt-4 md:pt-6">
        <div className="relative aspect-[16/7] overflow-hidden rounded-lg md:aspect-[16/5]">
          <AppImage image={brand.cover} alt={`${brand.name} cover`} variant="cover" priority />
          {brand.vacation && (
            <span className="absolute top-4 left-4 rounded-full bg-surface/90 px-3 py-1.5 text-small font-medium backdrop-blur">
              On a short break, back soon
            </span>
          )}
        </div>
      </div>

      <div className="container-page">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:gap-6">
          <div className="-mt-12 size-24 shrink-0 overflow-hidden rounded-full ring-4 ring-canvas md:-mt-16 md:size-32">
            <AppImage
              image={brand.logo}
              alt={`${brand.name} logo`}
              variant="logo"
              name={brand.name}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-muted">
              {categoryName(brand.category)} · {campus?.shortName ?? "…"} · @{brand.handle}
            </p>
            <h1 className="mt-2 flex items-center gap-2 font-display text-display-md">
              <span className="truncate">{brand.name}</span>
              {brand.verified && (
                <BadgeCheck className="size-6 shrink-0 text-accent" aria-label="Verified brand" />
              )}
            </h1>
            <p className="mt-1 text-body text-muted">{brand.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {own ? (
              <ButtonLink href="/studio/brand" leadingIcon={<Store className="size-4.5" />}>
                Edit in Shop Studio
              </ButtonLink>
            ) : (
              <>
                <FollowButton brand={brand} />
                <Button
                  variant="secondary"
                  leadingIcon={<MessageCircle className="size-4.5" />}
                  onClick={() =>
                    user ? setChat(true) : router.push(`/login?next=/brands/${brand.handle}`)
                  }
                >
                  Message
                </Button>
              </>
            )}
            <ShareButton title={brand.name} text={brand.tagline} path={`/brands/${brand.handle}`} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pb-6 text-small">
          <OpenBadge brand={brand} />
          {brand.ratingCount > 0 && (
            <button
              type="button"
              onClick={() => setTab("reviews")}
              className="inline-flex items-center gap-1.5 hover:underline"
            >
              <Star className="size-4 fill-current" aria-hidden />
              <span className="font-mono font-medium tabular">{brand.rating.toFixed(1)}</span>
              <span className="text-muted">({brand.ratingCount} reviews)</span>
            </button>
          )}
          <span>
            <NumberTicker
              value={brand.followerCount}
              format={(n) => formatCompact(n)}
              className="font-mono font-medium"
            />{" "}
            <span className="text-muted">followers</span>
          </span>
          <span className="text-muted">
            {brand.fulfilment.pickup && brand.fulfilment.delivery
              ? "Pickup or delivery"
              : brand.fulfilment.pickup
                ? "Pickup only"
                : "Delivery only"}
          </span>
        </div>

        {own && (
          <p className="mt-6 rounded-md bg-accent-soft px-4 py-3 text-small text-accent-ink">
            This is your shop, as buyers see it. You can browse it, but you can&apos;t buy from
            yourself.
          </p>
        )}

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList label={`${brand.name} sections`}>
            <TabsTrigger value="products" count={brand.productCount}>
              Products
            </TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="reviews" count={brand.ratingCount}>
              Reviews
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="pt-8">
            <BrandProducts brand={brand} />
          </TabsContent>
          <TabsContent value="about" className="pt-8">
            <BrandAbout brand={brand} />
          </TabsContent>
          <TabsContent value="reviews" className="pt-8">
            <ReviewsBlock
              data={reviews.data}
              isPending={reviews.isPending}
              brandName={brand.name}
            />
          </TabsContent>
        </Tabs>
      </div>
      {!own && user && (
        <ChatSheet open={chat} onOpenChange={setChat} brandId={brand.id} brandName={brand.name} />
      )}
    </div>
  );
}
