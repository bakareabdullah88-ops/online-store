"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Stars } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useProducts } from "@/queries/catalog";
import { useMyReviews } from "@/queries/orders";
import { NavPageHeader } from "@/components/app/nav-header";

export function MyReviewsView() {
  const { data, isPending } = useMyReviews();
  const ids = [...new Set((data ?? []).map((r) => r.productId))];
  const products = useProducts({ ids, pageSize: 48 }, { enabled: ids.length > 0 });
  const mounted = useMounted();
  return (
    <div>
      <NavPageHeader
        eyebrow="Reviews"
        title="Reviews you've written"
        description="Thanks for helping other students choose well."
      />
      {isPending ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32" rounded="lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          illustration="reviews"
          title="No reviews yet"
          body="After an order is delivered, you can rate it from your orders."
          action={<ButtonLink href="/orders">Your orders</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((r) => {
            const p = products.data?.items.find((x) => x.id === r.productId);
            return (
              <li key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {p ? (
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-body font-semibold hover:underline"
                      >
                        {p.name}
                      </Link>
                    ) : (
                      <Skeleton className="h-5 w-40" />
                    )}
                    <p className="text-small text-muted">
                      {p?.brand.name} {mounted && `· ${formatDate(r.createdAt, { year: true })}`}
                    </p>
                  </div>
                  <Stars value={r.rating} className="text-ink" />
                </div>
                <p className="mt-3 text-body text-ink-2">{r.body}</p>
                {r.reply && (
                  <div className="mt-3 rounded-md bg-canvas-sunk px-4 py-3">
                    <p className="eyebrow text-muted">Reply from {p?.brand.name ?? "the brand"}</p>
                    <p className="mt-1 text-small text-ink-2">{r.reply.body}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
