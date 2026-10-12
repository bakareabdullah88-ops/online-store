"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Bike, MapPin, RotateCcw, Star } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { spring, stagger } from "@/design/motion";
import { etaSeconds, isActive } from "@/domain/orders";
import { formatNaira } from "@/domain/money";
import { formatDate, formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useMyOrders } from "@/queries/orders";
import type { Order } from "@/services/types";
import { OrderProgress } from "./order-timeline";
import { ReviewDialog } from "./review-dialog";
import { StatusPill } from "./status-pill";
import { useReorder } from "./use-reorder";

export function formatEta(seconds: number) {
  if (seconds < 60) return "under a minute";
  return `~${Math.round(seconds / 60)} min`;
}

export function etaLine(order: Order, eta: number | null) {
  if (order.fulfilment.method === "pickup" && order.status === "ready") return "Ready to collect now";
  if (!order.autoProgress) return "The brand updates this order as it moves.";
  if (eta === null) return "\u00a0";
  return order.fulfilment.method === "pickup" ? `Ready to collect in ${formatEta(eta)}` : `Arriving in ${formatEta(eta)}`;
}

export function OrderCard({ order, index = 0 }: { order: Order; index?: number }) {
  const now = useNow(1000);
  const reorder = useReorder();
  const [reviewOpen, setReviewOpen] = useState(false);
  const active = isActive(order.status);
  const eta = now ? etaSeconds(order, now) : null;
  const units = order.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ ...spring.smooth, delay: stagger(index) }}
      className="relative rounded-lg bg-surface hairline transition-shadow hover:shadow-md"
    >
      <Link href={`/orders/${order.id}`} className="block p-4 md:p-5" aria-label={`Order ${order.code} from ${order.brandName}`}>
        <div className="flex items-start gap-3">
          <span className="size-10 shrink-0 overflow-hidden rounded-full">
            <AppImage image={order.brandLogo} alt="" variant="logo" name={order.brandName} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="truncate text-body font-semibold">{order.brandName}</p>
              <StatusPill status={order.status} method={order.fulfilment.method} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-small text-muted">
              {order.fulfilment.method === "delivery" ? <Bike className="size-3.5" /> : <MapPin className="size-3.5" />}
              <span className="font-mono">{order.code}</span>
              <span aria-hidden>·</span>
              {now ? (active ? formatRelative(order.placedAt, now) : formatDate(order.placedAt, { year: true })) : " "}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-small font-medium tabular">{formatNaira(order.totalKobo)}</p>
            <p className="text-small text-muted">
              {units} item{units === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {order.items.slice(0, 4).map((it) => (
            <span key={it.productId + it.variantKey} className="size-12 overflow-hidden rounded-sm">
              <AppImage image={it.image} alt="" />
            </span>
          ))}
          {order.items.length > 4 && <span className="font-mono text-small text-muted">+{order.items.length - 4}</span>}
        </div>
        {active && (
          <div className="mt-4">
            <OrderProgress order={order} />
            <p className="mt-2 text-small text-muted">
              {etaLine(order, eta)}
            </p>
          </div>
        )}
      </Link>
      {order.status === "delivered" && (
        <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 md:px-5">
          <Button size="sm" variant="secondary" leadingIcon={<RotateCcw className="size-4" />} onClick={() => void reorder(order)}>
            Reorder
          </Button>
          {!order.reviewed && (
            <Button size="sm" variant="ghost" leadingIcon={<Star className="size-4" />} onClick={() => setReviewOpen(true)}>
              Rate &amp; review
            </Button>
          )}
        </div>
      )}
      {order.status === "delivered" && <ReviewDialog order={order} open={reviewOpen} onOpenChange={setReviewOpen} />}
    </motion.li>
  );
}

export function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-lg bg-surface p-5 hairline">
          <div className="flex items-start gap-3">
            <Skeleton className="size-10" rounded="full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3.5 w-28" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-4 flex gap-2">
            {[0, 1, 2].map((k) => (
              <Skeleton key={k} className="size-12" />
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OrdersList({ embedded = false }: { embedded?: boolean }) {
  const { data, isPending, isError, refetch } = useMyOrders();
  const [tab, setTab] = useState<"active" | "past">("active");
  const activeOrders = (data ?? []).filter((o) => isActive(o.status));
  const past = (data ?? []).filter((o) => !isActive(o.status));
  const shown = tab === "active" ? activeOrders : past;
  const effectiveTab = !isPending && activeOrders.length === 0 && tab === "active" && past.length > 0 ? "past" : tab;
  const list = effectiveTab === tab ? shown : past;

  return (
    <div>
      {!embedded && (
        <header className="mb-6">
          <p className="eyebrow text-muted">Orders</p>
          <h1 className="mt-2 font-display text-display-lg">Your orders</h1>
        </header>
      )}
      <Tabs value={effectiveTab} onValueChange={(v) => setTab(v as "active" | "past")} variant="pill" className="mb-6">
        <TabsList label="Order status">
          <TabsTrigger value="active" count={activeOrders.length}>
            Active
          </TabsTrigger>
          <TabsTrigger value="past" count={past.length}>
            Past
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {isError ? (
        <EmptyState compact illustration="error" title="Couldn't load your orders" action={<Button onClick={() => void refetch()}>Try again</Button>} />
      ) : isPending ? (
        <OrdersSkeleton />
      ) : list.length === 0 ? (
        <EmptyState
          illustration="orders"
          title={effectiveTab === "active" ? "No orders on the way" : "No past orders yet"}
          body="When you order from a campus brand, you'll track it here, live."
          action={<ButtonLink href="/explore">Find something</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {list.map((o, i) => (
              <OrderCard key={o.id} order={o} index={i} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
