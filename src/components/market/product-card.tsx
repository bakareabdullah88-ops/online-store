"use client";

import Link from "next/link";
import { ViewTransition } from "react";
import { Star } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { discountPercent, formatNaira } from "@/domain/money";
import { stockState, totalStock } from "@/domain/variants";
import { cn } from "@/lib/cn";
import type { ProductWithBrand } from "@/services/types";
import { WishlistButton } from "./wishlist-button";

export function productTransitionName(id: string) {
  return `product-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/**
 * The product tile. When `morph` is set, the image shares a view-transition
 * name with the product page hero, so it flies into place on navigation.
 */
export function ProductCard({
  product: p,
  morph = false,
  priority,
  className,
  size = "md",
  showBrand = true,
  action,
}: {
  product: ProductWithBrand;
  morph?: boolean;
  priority?: boolean;
  className?: string;
  size?: "md" | "lg";
  showBrand?: boolean;
  /** A control pinned to the photo's bottom-right corner, such as a quick add. */
  action?: React.ReactNode;
}) {
  const off = discountPercent(p.priceKobo, p.compareAtKobo);
  const stock = stockState(totalStock(p));
  const image = (
    <div className="size-full transition-opacity group-hover:opacity-90">
      <AppImage
        image={p.images[0]}
        alt={p.name}
        priority={priority}
        sizes="(min-width: 1024px) 22vw, 46vw"
      />
    </div>
  );
  return (
    <article className={cn("group relative", className)}>
      <Link
        href={`/products/${p.slug}`}
        className="block rounded-md focus-visible:outline-offset-4"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-2">
          {morph ? (
            <ViewTransition name={productTransitionName(p.id)} share="morph" default="none">
              {image}
            </ViewTransition>
          ) : (
            image
          )}
          <div className="pointer-events-none absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
            {off && (
              <span className="rounded-full bg-accent px-2 py-1 font-mono text-[10px] font-semibold text-on-accent">
                −{off}%
              </span>
            )}
            {stock === "sold_out" && (
              <span className="rounded-full bg-primary px-2 py-1 font-mono text-[10px] font-semibold text-on-primary uppercase">
                Sold out
              </span>
            )}
            {stock === "low" && (
              <span className="rounded-full bg-surface/90 px-2 py-1 font-mono text-[10px] font-semibold text-ink uppercase">
                Few left
              </span>
            )}
            {p.brand.vacation && (
              <span className="rounded-full bg-surface/90 px-2 py-1 font-mono text-[10px] font-semibold text-ink uppercase">
                Shop on break
              </span>
            )}
          </div>
        </div>
        <div className={cn("mt-2 flex flex-col", size === "lg" ? "gap-1" : "gap-0.5")}>
          {showBrand && <p className="truncate eyebrow text-muted">{p.brand.name}</p>}
          <h3
            className={cn(
              "line-clamp-2 font-medium text-ink",
              size === "lg" ? "text-body-lg" : "text-small",
            )}
          >
            {p.name}
          </h3>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={cn(
                "font-mono font-medium tabular",
                off ? "text-accent-ink" : "text-ink",
                size === "lg" ? "text-body" : "text-small",
              )}
            >
              {formatNaira(p.priceKobo)}
            </span>
            {p.compareAtKobo && off && (
              <s className="font-mono text-[12px] text-muted tabular">
                {formatNaira(p.compareAtKobo)}
              </s>
            )}
            {p.ratingCount > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-[12px] text-muted">
                <Star className="size-3 fill-current text-ink" aria-hidden />
                <span className="tabular">{p.rating.toFixed(1)}</span>
                <span className="sr-only">out of 5 from {p.ratingCount} reviews</span>
              </span>
            )}
          </div>
        </div>
      </Link>
      <WishlistButton
        productId={p.id}
        productName={p.name}
        size="sm"
        className="absolute top-2 right-2"
      />
      {action && (
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/5]">
          <div className="pointer-events-auto absolute right-2 bottom-2">{action}</div>
        </div>
      )}
    </article>
  );
}

export function ProductCardSkeleton({
  className,
  size = "md",
}: {
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <div className={className} aria-hidden>
      <Skeleton className="aspect-[4/5] w-full" rounded="md" />
      <div className={cn("mt-3 flex flex-col", size === "lg" ? "gap-1.5" : "gap-1")}>
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className={cn(size === "lg" ? "h-4.5" : "h-4", "w-[85%]")} />
        <Skeleton className="mt-0.5 h-4 w-16" />
      </div>
    </div>
  );
}
