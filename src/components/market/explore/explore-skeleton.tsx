import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "../product-card";

export function ExploreSkeleton() {
  return (
    <div className="container-page pt-6 md:pt-10" aria-hidden>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-14 w-2/3 max-w-lg" />
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-24 shrink-0" rounded="full" />
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
        <div className="hidden flex-col gap-6 lg:flex">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
