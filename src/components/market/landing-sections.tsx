"use client";

import { ButtonLink } from "@/components/ui/button";
import { useBrands, useProducts } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import { BrandCard, BrandCardSkeleton } from "./brand-card";
import { ProductCard, ProductCardSkeleton } from "./product-card";
import { Rail } from "./rail";

export function FeaturedBrands() {
  const { data, isPending, isError, refetch } = useBrands({ featured: true, limit: 5 });
  if (isError) {
    return (
      <div className="mt-8 rounded-lg bg-surface p-8 text-center hairline">
        <p className="text-body text-muted">We couldn&apos;t load brands just now.</p>
        <ButtonLink href="/explore" variant="secondary" className="mt-4" onClick={() => void refetch()}>
          Browse everything instead
        </ButtonLink>
      </div>
    );
  }
  const [lead, ...rest] = data ?? [];
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-12" aria-busy={isPending}>
      {isPending || !lead ? (
        <>
          <BrandCardSkeleton variant="lead" className="lg:col-span-6 lg:row-span-2" />
          {[0, 1, 2, 3].map((i) => (
            <BrandCardSkeleton key={i} className="lg:col-span-3" />
          ))}
        </>
      ) : (
        <>
          <BrandCard brand={lead} variant="lead" className="lg:col-span-6 lg:row-span-2" />
          {rest.map((b) => (
            <BrandCard key={b.id} brand={b} className="lg:col-span-3" />
          ))}
        </>
      )}
    </div>
  );
}

export function PopularOnCampus() {
  const { user } = useSession();
  const { data, isPending } = useProducts({ sort: "popular", pageSize: 10, campusId: user?.campusId ?? undefined, inStock: true });
  const items = data?.items ?? [];
  const cards = isPending
    ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)
    : items.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 2} morph />);
  return (
    <Rail label="Popular on campus" itemClassName="w-[46vw] sm:w-[30vw] md:w-[23vw] lg:w-[18vw] xl:w-[15.5vw] max-w-64">
      {cards}
    </Rail>
  );
}
