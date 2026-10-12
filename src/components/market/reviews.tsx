"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, Stars } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { formatRelative, formatNumber } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import type { RatingBreakdown, Review } from "@/services/types";

export function RatingSummary({ breakdown }: { breakdown: RatingBreakdown }) {
  const max = Math.max(1, ...breakdown.histogram);
  return (
    <div className="flex gap-6">
      <div>
        <p className="font-display text-display-lg leading-none">{breakdown.count ? breakdown.average.toFixed(1) : "–"}</p>
        <Stars value={breakdown.average} size={14} className="mt-2 text-ink" />
        <p className="mt-1.5 text-small text-muted">{formatNumber(breakdown.count)} reviews</p>
      </div>
      <ol className="flex min-w-0 flex-1 flex-col justify-center gap-1.5" aria-label="Rating breakdown">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = breakdown.histogram[star - 1] ?? 0;
          return (
            <li key={star} className="flex items-center gap-2 text-small">
              <span className="w-3 font-mono text-muted">{star}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
                <motion.span
                  className="block h-full origin-left rounded-full bg-ink"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: n / max }}
                  viewport={{ once: true }}
                  transition={{ ...spring.gentle, delay: (5 - star) * 0.05 }}
                />
              </span>
              <span className="w-6 text-right font-mono text-muted tabular">{n}</span>
              <span className="sr-only">{star} stars: {n} reviews</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ReviewItem({ review, brandName }: { review: Review; brandName?: string }) {
  const now = useNow(60_000);
  return (
    <article className="border-b border-line py-5 last:border-0">
      <header className="flex items-center gap-3">
        <Avatar name={review.authorName} size={32} />
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium">{review.authorName}</p>
          <p className="text-small text-muted">
            {now ? formatRelative(review.createdAt, now) : " "}
            {review.variantLabel && ` · ${review.variantLabel}`}
          </p>
        </div>
        <Stars value={review.rating} size={13} className="text-ink" />
      </header>
      <p className="mt-3 text-body text-ink-2">{review.body}</p>
      {review.reply && (
        <div className="mt-3 rounded-md bg-canvas-sunk px-4 py-3">
          <p className="eyebrow text-muted">Reply from {brandName ?? "the brand"}</p>
          <p className="mt-1 text-small text-ink-2">{review.reply.body}</p>
        </div>
      )}
    </article>
  );
}

export function ReviewsBlock({
  data,
  isPending,
  brandName,
  emptyBody = "Be the first to review after your order arrives.",
}: {
  data: { reviews: Review[]; breakdown: RatingBreakdown } | undefined;
  isPending: boolean;
  brandName?: string;
  emptyBody?: string;
}) {
  const [limit, setLimit] = useState(4);
  if (isPending) {
    return (
      <div aria-hidden className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
        <Skeleton className="h-28 w-full" />
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="flex items-center gap-3">
                <Skeleton className="size-8" rounded="full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!data || data.reviews.length === 0) {
    return <EmptyState compact illustration="reviews" title="No reviews yet" body={emptyBody} />;
  }
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr] md:gap-12">
      <div>
        <RatingSummary breakdown={data.breakdown} />
      </div>
      <div>
        {data.reviews.slice(0, limit).map((r) => (
          <ReviewItem key={r.id} review={r} brandName={brandName} />
        ))}
        {data.reviews.length > limit && (
          <Button variant="secondary" className="mt-4" onClick={() => setLimit((l) => l + 6)}>
            Show more reviews ({data.reviews.length - limit})
          </Button>
        )}
      </div>
    </div>
  );
}
