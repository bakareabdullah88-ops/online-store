"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, MessageCircle, RotateCcw, Star, X } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatSheet } from "@/components/messages/chat-sheet";
import { spring } from "@/design/motion";
import {
  canBuyerCancel,
  deliveryProgress,
  etaSeconds,
  isActive,
  statusLabel,
} from "@/domain/orders";
import { formatNaira } from "@/domain/money";
import { formatDate, formatTime } from "@/lib/format";
import { useDocumentTitle, useNow } from "@/lib/hooks";
import { useCampus } from "@/queries/catalog";
import { useCancelOrder, useOrder } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { errorMessage, isServiceError } from "@/services/errors";
import { toast } from "@/stores/toast";
import { CampusMap } from "./campus-map";
import { etaLine } from "./orders-list";
import { OrderTimeline } from "./order-timeline";
import { ReviewDialog } from "./review-dialog";
import { StatusPill } from "./status-pill";
import type { PaymentMethod } from "@/services/types";
import { useReorder } from "./use-reorder";

const paymentLabels: Record<PaymentMethod, string> = {
  pay_on_delivery: "Pay on delivery",
  pay_on_pickup: "Pay at pickup",
  card: "Card",
  transfer: "Bank transfer",
};

export function OrderDetailSkeleton() {
  return (
    <div className="max-w-5xl" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-12 w-72" />
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 w-full lg:col-span-7" rounded="lg" />
        <Skeleton className="h-80 w-full lg:col-span-5" rounded="lg" />
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isPending, error } = useOrder(id);
  const { user } = useSession();
  const campus = useCampus(order?.fulfilment.campusId);
  const now = useNow(1000);
  const cancel = useCancelOrder();
  const reorder = useReorder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [chat, setChat] = useState(false);
  useDocumentTitle(order ? `Order ${order.code}` : null);

  if (isPending) return <OrderDetailSkeleton />;
  if (error || !order) {
    return (
      <div>
        <EmptyState
          illustration="orders"
          title={
            isServiceError(error) && error.code === "NOT_FOUND"
              ? "We couldn't find that order"
              : "Something went wrong"
          }
          body="It may belong to a different account."
          action={<ButtonLink href="/orders">Your orders</ButtonLink>}
        />
      </div>
    );
  }

  const active = isActive(order.status);
  const zone = campus?.zones.find((z) => z.id === order.fulfilment.zoneId);
  const point = campus?.pickupPoints.find((p) => p.id === order.fulfilment.pickupPointId);
  const progress = now ? deliveryProgress(order, now) : 0;
  const eta = now ? etaSeconds(order, now) : null;
  const isBuyer = user?.id === order.buyerId;
  const units = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <div className="max-w-5xl">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-small text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <header className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-muted">Order {order.code}</p>
          <motion.h1
            key={order.status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.smooth}
            className="mt-2 font-display text-display-md"
            aria-live="polite"
          >
            {statusLabel(order.status, order.fulfilment.method)}
          </motion.h1>
          <p className="mt-2 text-body text-muted">
            {active
              ? order.autoProgress || order.status === "ready"
                ? etaLine(order, eta)
                : `${order.brandName} will update this order from their Shop Studio.`
              : `Placed ${now ? `${formatDate(order.placedAt, { year: true })} at ${formatTime(order.placedAt)}` : ""}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isBuyer && canBuyerCancel(order) && (
            <Button
              variant="secondary"
              leadingIcon={<X className="size-4.5" />}
              onClick={() => setConfirmCancel(true)}
            >
              Cancel order
            </Button>
          )}
          {isBuyer && (
            <Button
              variant="secondary"
              leadingIcon={<MessageCircle className="size-4.5" />}
              onClick={() => setChat(true)}
            >
              Message {order.brandName}
            </Button>
          )}
          {isBuyer && order.status === "delivered" && (
            <>
              <Button
                variant="secondary"
                leadingIcon={<RotateCcw className="size-4.5" />}
                onClick={() => void reorder(order)}
              >
                Reorder
              </Button>
              {!order.reviewed && (
                <Button
                  leadingIcon={<Star className="size-4.5" />}
                  onClick={() => setReviewOpen(true)}
                >
                  Rate &amp; review
                </Button>
              )}
            </>
          )}
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
          {order.fulfilment.method === "delivery" ? (
            <CampusMap
              campusKey={order.fulfilment.campusId}
              progress={progress}
              mode="delivery"
              fromLabel={order.brandName}
              toLabel={`${zone?.name ?? "You"}${order.fulfilment.addressLine ? ` · ${order.fulfilment.addressLine}` : ""}`}
            />
          ) : (
            <section className="overflow-hidden rounded-lg bg-primary p-6 text-on-primary">
              <p className="eyebrow opacity-60">Pickup code</p>
              <p className="mt-3 font-mono text-display-md tracking-[0.12em]">{order.code}</p>
              <p className="mt-3 text-small opacity-70">
                Show this at{" "}
                <strong className="font-semibold">{point?.name ?? "the pickup point"}</strong>
                {point?.hint && `: ${point.hint}`}.
              </p>
              <div className="mt-5 flex gap-1" aria-hidden>
                {order.code.split("").map((ch, i) => (
                  <span
                    key={i}
                    className="h-10 flex-1 rounded-xs bg-on-primary"
                    style={{ opacity: ((ch.charCodeAt(0) * (i + 3)) % 7) / 10 + 0.25 }}
                  />
                ))}
              </div>
            </section>
          )}

          <section
            aria-labelledby="progress-title"
            className="rounded-lg bg-surface p-5 hairline md:p-6"
          >
            <h2 id="progress-title" className="mb-5 text-title font-semibold">
              Progress
            </h2>
            <OrderTimeline order={order} />
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <section aria-labelledby="items-title" className="rounded-lg bg-surface hairline">
            <header className="flex items-center gap-3 border-b border-line p-5">
              <span className="size-9 overflow-hidden rounded-full">
                <AppImage image={order.brandLogo} alt="" variant="logo" name={order.brandName} />
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/brands/${order.brandHandle}`}
                  className="text-body font-semibold hover:underline"
                >
                  {order.brandName}
                </Link>
                <p id="items-title" className="text-small text-muted">
                  {units} item{units === 1 ? "" : "s"}
                </p>
              </div>
              <StatusPill status={order.status} method={order.fulfilment.method} />
            </header>
            <ul className="divide-y divide-line px-5">
              {order.items.map((it) => (
                <li key={it.productId + it.variantKey} className="flex gap-3 py-3.5">
                  <span className="size-14 shrink-0 overflow-hidden rounded-sm">
                    <AppImage image={it.image} alt="" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium">{it.name}</p>
                    <p className="text-small text-muted">
                      {it.variantLabel ? `${it.variantLabel} · ` : ""}× {it.quantity}
                    </p>
                  </div>
                  <span className="font-mono text-small tabular">
                    {formatNaira(it.unitPriceKobo * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-2 border-t border-line p-5 text-small">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-mono tabular">{formatNaira(order.subtotalKobo)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  {order.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}
                </dt>
                <dd className="font-mono tabular">
                  {order.deliveryFeeKobo ? formatNaira(order.deliveryFeeKobo) : "Free"}
                </dd>
              </div>
              {order.discountKobo > 0 && (
                <div className="flex justify-between text-success">
                  <dt>
                    Discount{" "}
                    {order.promoCode && <span className="font-mono">({order.promoCode})</span>}
                  </dt>
                  <dd className="font-mono tabular">−{formatNaira(order.discountKobo)}</dd>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-line pt-3 text-body font-semibold">
                <dt>Total</dt>
                <dd className="font-mono tabular">{formatNaira(order.totalKobo)}</dd>
              </div>
              <div className="mt-1 flex justify-between">
                <dt className="text-muted">Payment</dt>
                <dd>
                  {paymentLabels[order.payment.method]} ·{" "}
                  <span className="capitalize">{order.payment.status}</span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg bg-surface p-5 text-small hairline">
            <h2 className="mb-3 text-body font-semibold">
              {order.fulfilment.method === "delivery" ? "Delivery details" : "Pickup details"}
            </h2>
            <dl className="grid grid-cols-[110px_1fr] gap-y-2">
              <dt className="text-muted">Campus</dt>
              <dd>{campus?.name}</dd>
              <dt className="text-muted">
                {order.fulfilment.method === "delivery" ? "Zone" : "Pickup point"}
              </dt>
              <dd>{order.fulfilment.method === "delivery" ? zone?.name : point?.name}</dd>
              {order.fulfilment.addressLine && (
                <>
                  <dt className="text-muted">Address</dt>
                  <dd>{order.fulfilment.addressLine}</dd>
                </>
              )}
              {order.fulfilment.note && (
                <>
                  <dt className="text-muted">Note</dt>
                  <dd>{order.fulfilment.note}</dd>
                </>
              )}
              <dt className="text-muted">Phone</dt>
              <dd className="font-mono">{order.buyerPhone}</dd>
            </dl>
          </section>
        </div>
      </div>

      <Dialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this order?"
        description={`${order.brandName} hasn't accepted it yet, so you can cancel for free.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
              Keep order
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending}
              onClick={() =>
                cancel.mutate(order.id, {
                  onSuccess: () => {
                    setConfirmCancel(false);
                    toast("Order cancelled", {
                      description:
                        order.payment.status === "paid"
                          ? "Your payment will be refunded."
                          : undefined,
                    });
                  },
                  onError: (e) => {
                    setConfirmCancel(false);
                    toast.error("Couldn't cancel", { description: errorMessage(e) });
                  },
                })
              }
            >
              Cancel order
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">Items go back on the shelf for other students.</p>
      </Dialog>
      {order.status === "delivered" && (
        <ReviewDialog order={order} open={reviewOpen} onOpenChange={setReviewOpen} />
      )}
      {isBuyer && (
        <ChatSheet
          open={chat}
          onOpenChange={setChat}
          brandId={order.brandId}
          brandName={order.brandName}
        />
      )}
    </div>
  );
}
