"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Bike, MapPin } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/orders/status-pill";
import { spring, stagger } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import { useMyOrders } from "@/queries/orders";
import { Celebration } from "./celebration";

export function SuccessView() {
  const params = useSearchParams();
  const checkoutId = params.get("checkout");
  const query = useMyOrders();
  const orders = (query.data ?? []).filter((o) => o.checkoutId === checkoutId);
  // Not found yet while the list is still loading or refreshing: wait before saying so.
  const isPending = orders.length === 0 && (query.isPending || query.isFetching);

  if (!isPending && orders.length === 0) {
    return (
      <div className="container-page">
        <EmptyState
          illustration="orders"
          title="We couldn't find that checkout"
          body="It may have expired, but anything you paid for is in Orders."
          action={<ButtonLink href="/orders">See your orders</ButtonLink>}
        />
      </div>
    );
  }

  const total = orders.reduce((n, o) => n + o.totalKobo, 0);
  return (
    <div className="container-page max-w-2xl pt-10 text-center md:pt-16">
      <Celebration />
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.smooth, delay: 0.2 }}
        className="mt-8 font-display text-display-lg text-balance"
      >
        {orders.length > 1 ? `${orders.length} orders placed` : "Order placed"}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-body-lg text-muted"
        role="status"
      >
        {isPending
          ? "Confirming…"
          : `${formatNaira(total)} · Each brand will accept and update its order. We'll keep you posted.`}
      </motion.p>

      <ul className="mt-10 flex flex-col border-b border-line-thin text-left">
        {isPending
          ? [0, 1].map((i) => <Skeleton key={i} className="my-3 h-20 w-full" rounded="lg" />)
          : orders.map((o, i) => (
              <motion.li
                key={o.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring.smooth, delay: 0.3 + stagger(i, 0.06) }}
              >
                <Link href={`/orders/${o.id}`} className="group card flex items-center gap-4 py-4">
                  <span className="size-12 shrink-0 overflow-hidden rounded-full">
                    <AppImage image={o.brandLogo} alt="" variant="logo" name={o.brandName} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-body font-semibold">{o.brandName}</span>
                      <StatusPill status={o.status} method={o.fulfilment.method} />
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-small text-muted">
                      {o.fulfilment.method === "delivery" ? (
                        <Bike className="size-3.5" />
                      ) : (
                        <MapPin className="size-3.5" />
                      )}
                      <span className="font-mono">{o.code}</span> · {formatNaira(o.totalKobo)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-small font-medium">
                    Track{" "}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.li>
            ))}
      </ul>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {isPending ? (
          // Until we know how many orders there are, don't offer a link that might be wrong.
          <Skeleton className="h-11 w-48" />
        ) : orders.length === 1 && orders[0] ? (
          <ButtonLink href={`/orders/${orders[0].id}`} size="lg">
            Track your order
          </ButtonLink>
        ) : (
          <ButtonLink href="/orders" size="lg">
            Track your orders
          </ButtonLink>
        )}
        <ButtonLink href="/explore" size="lg" variant="secondary">
          Keep shopping
        </ButtonLink>
      </div>
    </div>
  );
}
