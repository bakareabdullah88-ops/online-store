"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { RatingInput } from "@/components/ui/misc";
import { Dialog } from "@/components/ui/sheet";
import { spring } from "@/design/motion";
import { useReviewItem } from "@/queries/orders";
import { useMyReviews } from "@/queries/orders";
import { reviewInputSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type { Order } from "@/services/types";
import { toast } from "@/stores/toast";

const labels = ["", "Not great", "Could be better", "Good", "Really good", "Loved it"];

/** Rate and review each item of a delivered order, one by one. */
export function ReviewDialog({
  order,
  open,
  onOpenChange,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const mine = useMyReviews();
  const reviewed = new Set(
    (mine.data ?? []).filter((r) => r.orderId === order.id).map((r) => r.productId),
  );
  const pending = order.items.filter((i) => !reviewed.has(i.productId));
  const item = pending[0];
  const review = useReviewItem();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    if (!item) return;
    const parsed = reviewInputSchema.safeParse({
      orderId: order.id,
      productId: item.productId,
      rating,
      body,
    });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      return;
    }
    setErrors({});
    review.mutate(parsed.data, {
      onSuccess: () => {
        setRating(0);
        setBody("");
        toast.success("Thanks for the review", {
          description: `It helps other students and ${order.brandName}.`,
        });
        if (pending.length <= 1) onOpenChange(false);
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "How was it?" : "All reviewed"}
      description={
        item
          ? `Reviewing ${pending.length > 1 ? `${order.items.length - pending.length + 1} of ${order.items.length}` : "your order"} from ${order.brandName}`
          : undefined
      }
      footer={
        item ? (
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Later
            </Button>
            <Button loading={review.isPending} onClick={submit}>
              Post review
            </Button>
          </>
        ) : (
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        )
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {item ? (
          <motion.div
            key={item.productId}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={spring.smooth}
            className="flex flex-col gap-5"
          >
            <div className="flex items-center gap-3">
              <span className="size-14 overflow-hidden rounded-sm">
                <AppImage image={item.image} alt="" />
              </span>
              <div>
                <p className="text-body font-medium">{item.name}</p>
                {item.variantLabel && (
                  <p className="mt-1 eyebrow text-muted">{item.variantLabel}</p>
                )}
              </div>
            </div>
            <div>
              <RatingInput value={rating} onChange={setRating} label={`Rate ${item.name}`} />
              <p className="mt-1 h-5 text-small text-muted" aria-live="polite">
                {labels[rating]}
              </p>
              {errors.rating && (
                <p className="text-small font-medium text-danger">{errors.rating}</p>
              )}
            </div>
            <Field
              label="Your review"
              error={errors.body}
              hint="What did you like? How was the fit, taste or packaging?"
            >
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} />
            </Field>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring.bouncy}
            className="flex flex-col items-center py-6 text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="size-7" />
            </span>
            <p className="mt-4 text-body">
              You&apos;ve reviewed everything in this order. Thank you!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
