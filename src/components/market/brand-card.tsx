"use client";

import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryName } from "@/config/categories";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCampus } from "@/queries/catalog";
import type { Brand } from "@/services/types";

export function BrandCard({
  brand: b,
  variant = "default",
  className,
}: {
  brand: Brand;
  variant?: "default" | "lead" | "compact";
  className?: string;
}) {
  const campus = useCampus(b.campusId);
  if (variant === "compact") {
    return (
      <Link
        href={`/brands/${b.handle}`}
        className={cn(
          "group flex items-center gap-3 rounded-md p-2 hover:bg-ink/[0.04]",
          className,
        )}
      >
        <span className="size-12 shrink-0 overflow-hidden rounded-full">
          <AppImage image={b.logo} alt="" variant="logo" name={b.name} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1 truncate text-small font-semibold">
            {b.name}
            {b.verified && (
              <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-label="Verified" />
            )}
          </span>
          <span className="block truncate text-small text-muted">{b.tagline}</span>
        </span>
      </Link>
    );
  }
  const lead = variant === "lead";
  return (
    <Link href={`/brands/${b.handle}`} className={cn("group relative flex flex-col", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          lead ? "aspect-[16/10] md:aspect-auto md:min-h-72 md:flex-1" : "aspect-[16/9]",
        )}
      >
        <div className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <AppImage
            image={b.cover}
            alt=""
            variant="cover"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
        </div>
        {b.vacation && (
          <span className="absolute top-3 left-3 rounded-full bg-surface/90 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase">
            On a break
          </span>
        )}
      </div>
      <div className={cn("relative flex items-end gap-3", lead ? "py-5 md:py-6" : "py-4")}>
        <span
          className={cn(
            "-mt-10 ml-3 shrink-0 overflow-hidden rounded-full ring-4 ring-(--app-bg)",
            lead ? "size-16" : "size-12",
          )}
        >
          <AppImage image={b.logo} alt="" variant="logo" name={b.name} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate eyebrow text-muted">
            {categoryName(b.category)}
            {campus && ` · ${campus.shortName}`}
          </p>
          <h3
            className={cn(
              "mt-1 flex items-center gap-1.5 font-display text-ink",
              lead ? "text-display-sm" : "text-title-lg",
            )}
          >
            <span className="truncate">{b.name}</span>
            {b.verified && (
              <BadgeCheck className="size-4 shrink-0 text-accent" aria-label="Verified brand" />
            )}
          </h3>
          <p
            className={cn(
              "mt-1 text-muted",
              lead ? "line-clamp-2 text-body" : "truncate text-small",
            )}
          >
            {b.tagline}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-4 border-t border-line-thin text-small text-muted",
          lead ? "py-3" : "py-2.5",
        )}
      >
        {b.ratingCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-current text-ink" aria-hidden />
            <span className="font-mono text-ink tabular">{b.rating.toFixed(1)}</span>
            <span className="sr-only">rating</span>
          </span>
        )}
        <span>
          <span className="font-mono text-ink tabular">{formatCompact(b.followerCount)}</span>{" "}
          followers
        </span>
        <span>
          <span className="font-mono text-ink tabular">{b.productCount}</span> products
        </span>
      </div>
    </Link>
  );
}

export function BrandCardSkeleton({
  variant = "default",
  className,
}: {
  variant?: "default" | "lead";
  className?: string;
}) {
  const lead = variant === "lead";
  return (
    <div className={cn("flex flex-col", className)} aria-hidden>
      <Skeleton
        rounded="lg"
        className={cn(
          lead ? "aspect-[16/10] md:aspect-auto md:min-h-72 md:flex-1" : "aspect-[16/9]",
        )}
      />
      <div className={cn("flex items-end gap-3", lead ? "py-5 md:py-6" : "py-4")}>
        <Skeleton
          rounded="full"
          className={cn("-mt-10 ml-3 ring-4 ring-(--app-bg)", lead ? "size-16" : "size-12")}
        />
        <div className="flex-1">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className={cn("mt-2", lead ? "h-7 w-48" : "h-5 w-36")} />
          <Skeleton className="mt-2 h-3.5 w-3/4" />
        </div>
      </div>
      <div className={cn("border-t border-line-thin", lead ? "py-3" : "py-2.5")}>
        <Skeleton className="h-3.5 w-48" />
      </div>
    </div>
  );
}
