"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, ViewTransition } from "react";
import { BadgeCheck, Bike, Check, MapPin, ShoppingBag, Store } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Stars } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { purchaseBlock } from "@/domain/bag";
import { discountPercent, formatNaira } from "@/domain/money";
import { DEFAULT_VARIANT_KEY, findVariant, stockState, totalStock } from "@/domain/variants";
import { flyToBag } from "@/lib/fly-to-bag";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import { recordEvent, useCampus } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import type { ProductWithBrand } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { useUi } from "@/stores/ui";
import { productTransitionName } from "./product-card";
import { WishlistButton } from "./wishlist-button";

const pill =
  "inline-flex h-11 w-full max-w-[300px] pressable items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-[background-color,filter,box-shadow]";

/** "₦" small and raised, the amount large: easy to scan down a list. */
function BigPrice({ kobo, compareAt }: { kobo: number; compareAt?: number | undefined }) {
  const off = discountPercent(kobo, compareAt);
  const naira = formatNaira(kobo).replace("₦", "");
  return (
    <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1">
      <p className="flex items-start leading-none font-semibold tracking-[-0.02em] tabular">
        <span className="mt-1 mr-0.5 text-[13px] sm:text-[14px]">₦</span>
        <span className="text-[24px] sm:text-[30px]">{naira}</span>
      </p>
      {off && compareAt && (
        <p className="flex items-center gap-2 pb-0.5 text-[13px]">
          <s className="text-muted tabular">{formatNaira(compareAt)}</s>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-on-accent">
            −{off}%
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * A full-width result row (image on the left, details on the right), for
 * scanning a long list of products and adding to the bag without leaving it.
 */
export function ProductRow({
  product: p,
  priority,
  morph = false,
}: {
  product: ProductWithBrand;
  priority?: boolean;
  morph?: boolean;
}) {
  const { user } = useSession();
  const campus = useCampus(p.brand.campusId);
  const add = useBag((s) => s.add);
  const setBagOpen = useUi((s) => s.setBagOpen);
  const router = useRouter();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const imageRef = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState(false);

  const stock = totalStock(p);
  const state = stockState(stock);
  const hasOptions = p.variants.length > 1;
  const swatches = p.options.find((o) => o.values.some((v) => v.swatch))?.values ?? [];
  const block = purchaseBlock(p, hasOptions ? null : DEFAULT_VARIANT_KEY, {
    userBrandIds: user?.brandIds ?? [],
    brandOnVacation: p.brand.vacation,
  });
  const own = block.blocked && block.reason === "own_product";
  const f = p.brand.fulfilment;
  const href = `/products/${p.slug}`;

  const onAdd = () => {
    const v = findVariant(p, DEFAULT_VARIANT_KEY);
    if (!v || v.stock < 1 || block.blocked) return;
    add({ productId: p.id, brandId: p.brandId, variantKey: v.key, quantity: 1 }, v.stock);
    recordEvent("add_to_bag", p.id);
    flyToBag(imageRef.current);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    toast("Added to bag", {
      description: p.name,
      action: {
        label: "View bag",
        onClick: () => (desktop ? setBagOpen(true) : router.push("/bag")),
      },
    });
  };

  const image = (
    <div className="size-full">
      <AppImage
        image={p.images[0]}
        alt={p.name}
        priority={priority}
        sizes="(min-width: 768px) 260px, 130px"
      />
    </div>
  );

  return (
    <article className="relative grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-4 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[minmax(0,270px)_minmax(0,1fr)]">
      <div className="relative bg-surface-2">
        <Link
          href={href}
          className="block h-full focus-visible:outline-offset-[-4px]"
          tabIndex={-1}
          aria-hidden
        >
          <div ref={imageRef} className="aspect-square h-full w-full">
            {morph ? (
              <ViewTransition name={productTransitionName(p.id)} share="morph" default="none">
                {image}
              </ViewTransition>
            ) : (
              image
            )}
          </div>
        </Link>
        <WishlistButton
          productId={p.id}
          productName={p.name}
          size="sm"
          className="absolute top-2 right-2"
        />
      </div>

      <div className="flex min-w-0 flex-col items-start gap-1.5 py-3 pr-3 sm:gap-2 sm:py-5 sm:pr-6">
        <Link
          href={`/brands/${p.brand.handle}`}
          className="inline-flex max-w-full items-center gap-1 text-[13px] font-bold tracking-[-0.01em] hover:underline sm:text-[15px]"
        >
          <span className="truncate">{p.brand.name}</span>
          {p.brand.verified && (
            <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified shop" />
          )}
        </Link>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-medium sm:line-clamp-3 sm:text-[19px] lg:text-[21px]">
          <Link href={href} className="hover:text-accent-ink">
            {p.name}
          </Link>
        </h3>

        {p.ratingCount > 0 ? (
          <Link
            href={`${href}#reviews`}
            className="inline-flex items-center gap-1.5 text-[13px] sm:text-[14px]"
          >
            <span className="tabular">{p.rating.toFixed(1)}</span>
            <Stars value={p.rating} size={14} className="text-[#f59e0b]" />
            <span className="text-accent-ink tabular hover:underline">({p.ratingCount})</span>
          </Link>
        ) : (
          <p className="text-[13px] text-muted">No reviews yet</p>
        )}

        <div className="mt-1">
          <BigPrice kobo={p.priceKobo} compareAt={p.compareAtKobo} />
        </div>

        {f && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2 sm:text-[14px]">
            {f.delivery && (
              <span className="inline-flex items-center gap-1.5">
                <Bike className="size-4 text-muted" aria-hidden />
                {f.deliveryFeeKobo ? (
                  <>
                    <b className="font-semibold text-ink tabular">
                      {formatNaira(f.deliveryFeeKobo)}
                    </b>{" "}
                    delivery
                  </>
                ) : (
                  <b className="font-semibold text-ink">Free delivery</b>
                )}
              </span>
            )}
            {f.pickup && (
              <span className="inline-flex items-center gap-1.5">
                <Store className="size-4 text-muted" aria-hidden />
                Free pickup
              </span>
            )}
          </p>
        )}
        {campus && (
          <p className="hidden items-center gap-1.5 text-[13px] text-muted sm:flex">
            <MapPin className="size-3.5" aria-hidden /> {campus.shortName}
            {f && ` · ready in about ${Math.max(1, Math.round(f.prepMinutes / 60))}h`}
          </p>
        )}

        {p.brand.vacation ? (
          <p className="text-[13px] font-medium text-warning sm:text-[14px]">
            This shop is on a break right now.
          </p>
        ) : state === "sold_out" ? (
          <p className="text-[13px] font-medium text-danger sm:text-[14px]">Sold out</p>
        ) : state === "low" ? (
          <p className="text-[13px] font-medium text-danger sm:text-[14px]">
            Only {stock} left in stock, order soon.
          </p>
        ) : null}

        <div className="mt-1 w-full sm:mt-2">
          {own ? (
            <Link
              href={`/studio/products/${p.id}`}
              className={cn(pill, "ring-1 ring-line-strong hover:bg-ink/[0.04]")}
            >
              <Store className="size-4" /> Your product
            </Link>
          ) : hasOptions ? (
            <Link href={href} className={cn(pill, "ring-1 ring-line-strong hover:bg-ink/[0.04]")}>
              See options
            </Link>
          ) : (
            <button
              type="button"
              aria-label={added ? `${p.name} added to bag` : `Add ${p.name} to bag`}
              onClick={onAdd}
              disabled={block.blocked || state === "sold_out"}
              className={cn(
                pill,
                "bg-[var(--buy)] text-[var(--on-buy)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {added ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
              {added ? "Added" : "Add to bag"}
            </button>
          )}
        </div>

        {swatches.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-2" aria-label="Colours">
            {swatches.slice(0, 6).map((v, i) => (
              <li key={v.id}>
                <span
                  title={v.label}
                  className={cn(
                    "block size-6 rounded-full ring-1 ring-line-strong",
                    i === 0 && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
                  )}
                  style={{ background: v.swatch }}
                />
                <span className="sr-only">{v.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function ProductRowSkeleton() {
  return (
    <div
      className="grid grid-cols-[120px_1fr] gap-4 overflow-hidden rounded-xl border border-line bg-surface sm:grid-cols-[220px_1fr] sm:gap-6 lg:grid-cols-[270px_1fr]"
      aria-hidden
    >
      <Skeleton className="aspect-square w-full" rounded="none" />
      <div className="flex flex-col gap-2.5 py-5 pr-6">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-5 w-[85%]" />
        <Skeleton className="h-5 w-[60%]" />
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-1 h-7 w-28" />
        <Skeleton className="mt-2 h-11 w-full max-w-[300px]" rounded="full" />
      </div>
    </div>
  );
}
