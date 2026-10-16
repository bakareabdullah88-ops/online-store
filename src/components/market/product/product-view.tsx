"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BadgeCheck,
  Bike,
  Clock,
  Footprints,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price, QuantityStepper, Stars } from "@/components/ui/misc";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { ChatSheet } from "@/components/messages/chat-sheet";
import { spring } from "@/design/motion";
import { purchaseBlock, MAX_LINE_QUANTITY } from "@/domain/bag";
import { formatWhen } from "@/domain/distance";
import { discountPercent, formatNaira } from "@/domain/money";
import {
  findVariant,
  stockState,
  unitPrice,
  variantKeyFor,
  type Selection,
} from "@/domain/variants";
import { flyToBag } from "@/lib/fly-to-bag";
import { useDocumentTitle, useTextEntryFocus } from "@/lib/hooks";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/cn";
import {
  recordEvent,
  useBrand,
  useCampus,
  useProduct,
  useProductReviews,
  useProducts,
  useRelatedProducts,
} from "@/queries/catalog";
import { useNearness } from "@/queries/nearby";
import { useSession } from "@/queries/session";
import { isServiceError } from "@/services/errors";
import type { ProductWithBrand } from "@/services/types";
import { useBag } from "@/stores/bag";
import { useUi } from "@/stores/ui";
import { toast } from "@/stores/toast";
import { DistanceLine } from "../nearby";
import { ProductCard, ProductCardSkeleton } from "../product-card";
import { Rail } from "../rail";
import { ReviewsBlock } from "../reviews";
import { ShareButton } from "../share-button";
import { WishlistButton } from "../wishlist-button";
import { Gallery } from "./gallery";
import { VariantPicker } from "./variant-picker";

function firstAvailable(p: ProductWithBrand): Selection {
  const v = p.variants.find((x) => x.stock > 0) ?? p.variants[0];
  if (!v || p.options.length === 0) return {};
  const ids = v.key.split("|");
  return Object.fromEntries(p.options.map((o, i) => [o.id, ids[i] ?? o.values[0]?.id ?? ""]));
}

function ProductRail({
  title,
  items,
  isPending,
}: {
  title: string;
  items: ProductWithBrand[] | undefined;
  isPending: boolean;
}) {
  if (!isPending && !items?.length) return null;
  return (
    <section aria-label={title} className="mt-20">
      <h2 className="mb-8 font-display text-display-sm">{title}</h2>
      <Rail label={title} itemClassName="w-[46vw] sm:w-[30vw] md:w-[23vw] lg:w-[18vw] max-w-60">
        {isPending
          ? Array.from({ length: 5 }, (_, i) => <ProductCardSkeleton key={i} />)
          : (items ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
      </Rail>
    </section>
  );
}

export function ProductSkeleton() {
  return (
    <div className="container-page pt-4 md:pt-8" aria-hidden>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10 xl:gap-14">
        <div className="md:col-span-6">
          <Skeleton
            className="aspect-[4/5] w-full max-md:-mx-(--gutter) max-md:w-[calc(100%+2*var(--gutter))]"
            rounded="lg"
          />
        </div>
        <div className="md:col-span-6 md:max-w-[520px]">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-10 w-4/5" />
          <Skeleton className="mt-4 h-8 w-32" />
          <SkeletonText className="mt-6 text-body" lines={3} />
          <Skeleton className="mt-8 h-11 w-64" rounded="md" />
          <Skeleton className="mt-8 h-11 w-full" rounded="md" />
        </div>
      </div>
    </div>
  );
}

export function ProductView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: p, isPending, error } = useProduct(slug);
  const { data: brand } = useBrand(p?.brand.handle ?? "");
  const campus = useCampus(p?.brand.campusId);
  const { user } = useSession();
  const typing = useTextEntryFocus();
  const reviews = useProductReviews(p?.id);
  const related = useRelatedProducts(p?.id);
  const moreFromBrand = useProducts(
    { brandId: p?.brandId, sort: "popular", pageSize: 9 },
    { enabled: !!p },
  );
  const add = useBag((s) => s.add);
  const setBagOpen = useUi((s) => s.setBagOpen);
  const router = useRouter();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const heroRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [qty, setQty] = useState(1);
  const [chat, setChat] = useState(false);
  const [added, setAdded] = useState(false);
  useDocumentTitle(p?.name);

  const productId = p?.id;
  useEffect(() => {
    if (productId) recordEvent("view", productId);
  }, [productId]);

  const sel = useMemo(() => selection ?? (p ? firstAvailable(p) : {}), [selection, p]);
  const key = p ? variantKeyFor(p.options, sel) : null;
  const variant = p && key ? findVariant(p, key) : undefined;
  const stock = variant?.stock ?? 0;
  const price = p && key ? unitPrice(p, key) : (p?.priceKobo ?? 0);

  const near = useNearness(brand?.fulfilment, brand?.campusId);

  if (isPending) return <ProductSkeleton />;
  if (error || !p) {
    return (
      <div className="container-page">
        <EmptyState
          illustration="lost"
          title={
            isServiceError(error) && error.code === "NOT_FOUND"
              ? "This product isn't here anymore"
              : "Something went wrong"
          }
          body="It may have sold out for good or been removed by the brand."
          action={<ButtonLink href="/explore">Keep exploring</ButtonLink>}
        />
      </div>
    );
  }

  const block = purchaseBlock(p, key, {
    userBrandIds: user?.brandIds ?? [],
    brandOnVacation: p.brand.vacation,
  });
  const off = discountPercent(
    price,
    p.compareAtKobo ? p.compareAtKobo + (variant?.priceDeltaKobo ?? 0) : undefined,
  );
  const stockInfo = stockState(stock);
  const own = block.blocked && block.reason === "own_product";
  const canAdd = !block.blocked && !!key;
  const fulfilment = brand?.fulfilment;
  const points =
    campus?.pickupPoints.filter((pp) => fulfilment?.pickupPointIds.includes(pp.id)) ?? [];

  const onAdd = () => {
    if (!key || !canAdd) return;
    add({ productId: p.id, brandId: p.brandId, variantKey: key, quantity: qty }, stock);
    recordEvent("add_to_bag", p.id);
    flyToBag(heroRef.current);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    toast("Added to bag", {
      description: `${p.name}${qty > 1 ? ` × ${qty}` : ""}`,
      action: {
        label: "View bag",
        onClick: () => (desktop ? setBagOpen(true) : router.push("/bag")),
      },
    });
  };

  const addButton = (className?: string) =>
    own ? (
      <ButtonLink
        href={`/studio/products/${p.id}`}
        variant="secondary"
        size="lg"
        className={className}
        leadingIcon={<Store className="size-4.5" />}
      >
        Edit in Studio
      </ButtonLink>
    ) : (
      <Button
        size="lg"
        className={className}
        disabled={!canAdd}
        onClick={onAdd}
        leadingIcon={<ShoppingBag className="size-4.5" />}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={added ? "added" : stockInfo === "sold_out" ? "sold" : "add"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring.snappy}
          >
            {added
              ? "Added"
              : stockInfo === "sold_out"
                ? "Sold out"
                : p.brand.vacation
                  ? "Shop on break"
                  : `Add to bag · ${formatNaira(price * qty)}`}
          </motion.span>
        </AnimatePresence>
      </Button>
    );

  return (
    <div className="container-page pt-0 md:pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 hidden text-small text-muted md:block">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/explore" className="hover:text-ink">
              Explore
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/explore?category=${p.category}`} className="capitalize hover:text-ink">
              {p.category}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/brands/${p.brand.handle}`} className="hover:text-ink">
              {p.brand.name}
            </Link>
          </li>
        </ol>
      </nav>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10 xl:gap-14">
        <div className="min-w-0 md:col-span-6">
          <div className="md:sticky md:top-24">
            <Gallery images={p.images} name={p.name} productId={p.id} heroRef={heroRef} />
          </div>
        </div>

        <div className="min-w-0 md:col-span-6 md:max-w-[520px]">
          <Link
            href={`/brands/${p.brand.handle}`}
            className="group inline-flex items-center gap-2.5"
          >
            <span className="size-8 overflow-hidden rounded-full">
              <AppImage image={p.brand.logo} alt="" variant="logo" name={p.brand.name} />
            </span>
            <span className="text-small font-medium group-hover:underline">{p.brand.name}</span>
            {p.brand.verified && (
              <BadgeCheck className="size-4 text-accent" aria-label="Verified" />
            )}
          </Link>
          <h1 className="mt-4 font-display text-display-md text-balance">{p.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            {p.ratingCount > 0 ? (
              <a
                href="#reviews"
                className="inline-flex items-center gap-2 text-small hover:underline"
              >
                <Stars value={p.rating} size={14} className="text-ink" />
                <span className="text-muted">
                  {p.rating.toFixed(1)} · {p.ratingCount} reviews
                </span>
              </a>
            ) : (
              <span className="text-small text-muted">No reviews yet</span>
            )}
            <span className="text-small text-muted">· {p.salesCount} sold</span>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <Price
              kobo={price}
              compareAt={
                p.compareAtKobo ? p.compareAtKobo + (variant?.priceDeltaKobo ?? 0) : undefined
              }
              size="display"
            />
            {off && (
              <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[11px] font-semibold text-on-accent">
                −{off}%
              </span>
            )}
          </div>

          <p className="mt-6 text-body-lg text-ink-2">{p.description}</p>

          {p.options.length > 0 && (
            <div className="mt-8">
              <VariantPicker product={p} selection={sel} onChange={setSelection} />
            </div>
          )}

          <p
            className={cn(
              "mt-6 flex items-center gap-2 text-small font-medium",
              stockInfo === "sold_out"
                ? "text-danger"
                : stockInfo === "low"
                  ? "text-warning"
                  : "text-success",
            )}
            aria-live="polite"
          >
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
            {stockInfo === "sold_out"
              ? "Sold out in this option"
              : stockInfo === "low"
                ? `Only ${stock} left`
                : "In stock"}
          </p>

          {block.blocked && block.reason !== "sold_out" && (
            <div
              className={cn(
                "mt-6 rounded-lg p-4",
                own ? "bg-accent-soft text-accent-ink" : "bg-warning-soft text-warning",
              )}
              role="note"
            >
              <p className="text-small font-semibold">
                {own ? "This one's yours" : "Not available right now"}
              </p>
              <p className="mt-1 text-small">{block.message}</p>
            </div>
          )}

          <div className="mt-6 hidden items-center gap-3 lg:flex">
            {!own && (
              <QuantityStepper
                value={qty}
                onChange={setQty}
                max={Math.max(1, Math.min(stock, MAX_LINE_QUANTITY))}
                label="Quantity"
              />
            )}
            {addButton("flex-1")}
            <WishlistButton
              productId={p.id}
              productName={p.name}
              size="lg"
              variant="plain"
              className="shadow-[inset_0_0_0_1px_var(--line-strong)]"
            />
          </div>
          <div className="mt-6 flex items-center gap-3 lg:hidden">
            {!own && (
              <QuantityStepper
                value={qty}
                onChange={setQty}
                max={Math.max(1, Math.min(stock, MAX_LINE_QUANTITY))}
                label="Quantity"
              />
            )}
            <WishlistButton
              productId={p.id}
              productName={p.name}
              size="lg"
              variant="plain"
              className="shadow-[inset_0_0_0_1px_var(--line-strong)]"
            />
            <ShareButton title={p.name} path={`/products/${p.slug}`} />
          </div>

          {fulfilment && (
            <div className="card mt-8 divide-y divide-line-thin border-b border-line-thin">
              {fulfilment.delivery && (
                <div className="flex gap-3 py-4">
                  <Bike className="mt-0.5 size-5 shrink-0" />
                  <div className="text-small">
                    <p className="font-medium">
                      Delivery · {formatNaira(fulfilment.deliveryFeeKobo)}
                    </p>
                    <p className="text-muted">
                      To {fulfilment.zoneIds.length} zones on {campus?.shortName}.
                    </p>
                  </div>
                </div>
              )}
              {fulfilment.pickup && (
                <div className="flex gap-3 py-4">
                  <MapPin className="mt-0.5 size-5 shrink-0" />
                  <div className="text-small">
                    <p className="font-medium">Free pickup</p>
                    <p className="text-muted">
                      {points.map((pp) => pp.name).join(" · ") || "Pickup points on campus"}
                    </p>
                  </div>
                </div>
              )}
              {(near.metres !== null || near.relation) && brand && (
                <div className="flex gap-3 py-4">
                  <Footprints className="mt-0.5 size-5 shrink-0" />
                  <div className="text-small">
                    <p className="font-medium">How far</p>
                    <DistanceLine
                      fulfilment={fulfilment}
                      campusId={brand.campusId}
                      badge
                      eta
                      className="mt-1 text-small"
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-3 py-4">
                <Clock className="mt-0.5 size-5 shrink-0" />
                <div className="text-small">
                  <p className="font-medium">Usually ready {formatWhen(fulfilment.prepMinutes)}</p>
                  <p className="text-muted">
                    Each brand ships its own order. You&apos;ll track it live.
                  </p>
                </div>
              </div>
            </div>
          )}

          {p.details.length > 0 && (
            <details className="group mt-8 border-t border-line-thin pt-5" open>
              <summary className="flex cursor-pointer list-none items-center justify-between text-title font-semibold [&::-webkit-details-marker]:hidden">
                Details
                <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <ul className="mt-3 flex flex-col gap-2">
                {p.details.map((d) => (
                  <li key={d} className="flex gap-2.5 text-body text-ink-2">
                    <span className="mt-2.5 size-1 shrink-0 rounded-full bg-ink" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {!own && (
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-line-thin pt-6">
              <Button
                variant="ghost"
                leadingIcon={<MessageCircle className="size-4.5" />}
                onClick={() =>
                  user ? setChat(true) : router.push(`/login?next=/products/${p.slug}`)
                }
              >
                Ask {p.brand.name} a question
              </Button>
              <span className="hidden lg:inline-flex">
                <ShareButton title={p.name} path={`/products/${p.slug}`} />
              </span>
            </div>
          )}
        </div>
      </div>

      <section
        id="reviews"
        aria-labelledby="reviews-title"
        className="mt-20 scroll-mt-24 border-t border-line-thin pt-12"
      >
        <h2 id="reviews-title" className="mb-8 font-display text-display-sm">
          What students say
        </h2>
        <ReviewsBlock data={reviews.data} isPending={reviews.isPending} brandName={p.brand.name} />
      </section>

      <ProductRail
        title={`More from ${p.brand.name}`}
        items={moreFromBrand.data?.items.filter((x) => x.id !== p.id).slice(0, 8)}
        isPending={moreFromBrand.isPending}
      />
      <ProductRail title="You might also like" items={related.data} isPending={related.isPending} />

      {/* Sticky add-to-bag (phones & tablets) */}
      <div className="h-24 lg:hidden" aria-hidden />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-(--z-header) border-t border-line-thin bg-canvas/95 px-(--gutter) pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden",
          // Out of the way while typing (a review, a message): the keyboard would lift it over the field.
          typing && "hidden",
        )}
      >
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-small text-muted">{p.name}</p>
            <p className="font-mono text-body font-medium tabular">{formatNaira(price * qty)}</p>
          </div>
          {addButton("ml-auto flex-1 max-w-64")}
        </div>
      </div>

      {user && !own && (
        <ChatSheet
          open={chat}
          onOpenChange={setChat}
          brandId={p.brandId}
          brandName={p.brand.name}
          productId={p.id}
        />
      )}
    </div>
  );
}
