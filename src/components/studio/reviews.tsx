"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Textarea } from "@/components/ui/input";
import { Avatar, Stars } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { RatingSummary } from "@/components/market/reviews";
import { spring } from "@/design/motion";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useReplyToReview, useStudioProducts, useStudioReviews } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { RatingBreakdown, Review } from "@/services/types";
import { toast } from "@/stores/toast";
import { NavPageHeader } from "@/components/app/nav-header";

function ReplyBox({ review }: { review: Review }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const reply = useReplyToReview();
  if (review.reply) {
    return (
      <div className="mt-3 border-l-2 border-line pl-4">
        <p className="eyebrow text-muted">Your reply</p>
        <p className="mt-1 text-small text-ink-2">{review.reply.body}</p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring.smooth}
            className="overflow-hidden"
            onSubmit={(e) => {
              e.preventDefault();
              reply.mutate(
                { id: review.id, body: text },
                {
                  onSuccess: () =>
                    toast.success("Reply posted", {
                      description: `${review.authorName} will be notified.`,
                    }),
                  onError: (err) => toast.error(errorMessage(err)),
                },
              );
            }}
          >
            <label htmlFor={`reply-${review.id}`} className="sr-only">
              Reply to {review.authorName}
            </label>
            <Textarea
              id={`reply-${review.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Thank ${review.authorName.split(" ")[0]}, or make it right…`}
              className="min-h-20"
              maxLength={500}
              autoFocus
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="submit"
                size="sm"
                loading={reply.isPending}
                disabled={text.trim().length < 2}
              >
                Post reply
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Reply
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StudioReviews() {
  const { data, isPending } = useStudioReviews();
  const products = useStudioProducts({});
  const [filter, setFilter] = useState<"all" | "unreplied" | "low">("all");
  const now = useNow(60_000);
  const list = (data ?? []).filter((r) =>
    filter === "unreplied" ? !r.reply : filter === "low" ? r.rating <= 3 : true,
  );
  const breakdown: RatingBreakdown | null = data
    ? {
        count: data.length,
        average: data.length
          ? Math.round((data.reduce((n, r) => n + r.rating, 0) / data.length) * 10) / 10
          : 0,
        histogram: [1, 2, 3, 4, 5].map(
          (s) => data.filter((r) => r.rating === s).length,
        ) as RatingBreakdown["histogram"],
      }
    : null;
  return (
    <div>
      <NavPageHeader
        eyebrow="Reviews"
        title="Reviews"
        description="Replying publicly, especially to the tough ones, builds trust with every buyer who reads them."
      />
      {isPending ? (
        <Skeleton className="h-80 w-full" rounded="lg" />
      ) : !data?.length ? (
        <EmptyState
          illustration="reviews"
          title="No reviews yet"
          body="Buyers can review after their order is delivered."
        />
      ) : (
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 xl:grid-cols-[280px_1fr]">
          <div className="card py-5 xl:sticky xl:top-24 xl:self-start">
            {breakdown && <RatingSummary breakdown={breakdown} />}
          </div>
          <div>
            <SegmentedControl
              size="sm"
              label="Filter reviews"
              value={filter}
              onChange={setFilter}
              className="mb-4"
              options={[
                { value: "all", label: `All ${data.length}` },
                { value: "unreplied", label: `Needs reply ${data.filter((r) => !r.reply).length}` },
                { value: "low", label: "3★ and below" },
              ]}
            />
            {list.length === 0 ? (
              <EmptyState
                compact
                illustration="reviews"
                title="Nothing here"
                body="You're all caught up."
              />
            ) : (
              <ul className="flex flex-col border-b border-line-thin">
                {list.map((r) => {
                  const p = products.data?.find((x) => x.id === r.productId);
                  return (
                    <li key={r.id} className="card py-5">
                      <div className="flex items-start gap-3">
                        <Avatar name={r.authorName} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-small font-medium">{r.authorName}</p>
                            <Stars value={r.rating} size={13} className="text-ink" />
                          </div>
                          <p className="text-small text-muted">
                            {p?.name ?? "Product"} {r.variantLabel && `· ${r.variantLabel}`}{" "}
                            {now && `· ${formatRelative(r.createdAt, now)}`}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-body text-ink-2">{r.body}</p>
                      <ReplyBox review={r} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
