import type { FulfilmentMethod, Order, OrderStatus, TimelineEntry } from "@/services/types";

export const TERMINAL: readonly OrderStatus[] = ["delivered", "cancelled", "declined"];

export function isTerminal(status: OrderStatus) {
  return TERMINAL.includes(status);
}

export function isActive(status: OrderStatus) {
  return !isTerminal(status);
}

/** The happy path for each fulfilment method. */
export function stepsFor(method: FulfilmentMethod): OrderStatus[] {
  return method === "pickup"
    ? ["placed", "confirmed", "preparing", "ready", "delivered"]
    : ["placed", "confirmed", "preparing", "out_for_delivery", "delivered"];
}

const sellerTransitions: Record<OrderStatus, OrderStatus[]> = {
  placed: ["confirmed", "declined"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "out_for_delivery"],
  ready: ["delivered"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
  declined: [],
};

/** Can a seller move an order from → to? Respects the fulfilment method. */
export function canTransition(
  order: Pick<Order, "status" | "fulfilment">,
  to: OrderStatus,
): boolean {
  if (!sellerTransitions[order.status].includes(to)) return false;
  if (to === "ready" && order.fulfilment.method !== "pickup") return false;
  if (to === "out_for_delivery" && order.fulfilment.method !== "delivery") return false;
  return true;
}

export function nextSellerStatus(order: Pick<Order, "status" | "fulfilment">): OrderStatus | null {
  const steps = stepsFor(order.fulfilment.method);
  const i = steps.indexOf(order.status);
  if (i < 0 || i === steps.length - 1) return null;
  return steps[i + 1] ?? null;
}

export function canBuyerCancel(order: Pick<Order, "status">) {
  return order.status === "placed";
}

export function statusLabel(status: OrderStatus, method: FulfilmentMethod = "delivery"): string {
  switch (status) {
    case "placed":
      return "Placed";
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready for pickup";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return method === "pickup" ? "Picked up" : "Delivered";
    case "cancelled":
      return "Cancelled";
    case "declined":
      return "Declined";
  }
}

export function statusTone(
  status: OrderStatus,
): "neutral" | "accent" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "placed":
      return "warning";
    case "confirmed":
    case "preparing":
      return "info";
    case "ready":
    case "out_for_delivery":
      return "accent";
    case "delivered":
      return "success";
    case "cancelled":
    case "declined":
      return "danger";
  }
}

export function statusDescription(status: OrderStatus, method: FulfilmentMethod): string {
  switch (status) {
    case "placed":
      return "Waiting for the brand to accept your order.";
    case "confirmed":
      return "The brand accepted your order.";
    case "preparing":
      return "Your order is being packed.";
    case "ready":
      return "Head to the pickup point with your order code.";
    case "out_for_delivery":
      return "It's on the way to you.";
    case "delivered":
      return method === "pickup" ? "Collected. Enjoy." : "Delivered. Enjoy.";
    case "cancelled":
      return "This order was cancelled.";
    case "declined":
      return "The brand couldn't take this order. You haven't been charged.";
  }
}

/**
 * Auto-progress schedule (seconds after placedAt) for orders flagged
 * `autoProgress`. Real orders are moved by the seller, so this is unused today.
 */
export const AUTO_SCHEDULE: Record<"confirmed" | "preparing" | "dispatch" | "delivered", number> = {
  confirmed: 6,
  preparing: 16,
  dispatch: 30,
  delivered: 62,
};

function scheduledSteps(method: FulfilmentMethod): { status: OrderStatus; offset: number }[] {
  return [
    { status: "confirmed", offset: AUTO_SCHEDULE.confirmed },
    { status: "preparing", offset: AUTO_SCHEDULE.preparing },
    { status: method === "pickup" ? "ready" : "out_for_delivery", offset: AUTO_SCHEDULE.dispatch },
    { status: "delivered", offset: AUTO_SCHEDULE.delivered },
  ];
}

/**
 * Pure: brings an auto-progressing order up to date for `now`.
 * Returns the same object when nothing changed.
 */
export function advanceOrder(order: Order, now: number): { order: Order; reached: OrderStatus[] } {
  if (!order.autoProgress || isTerminal(order.status)) return { order, reached: [] };
  const placed = Date.parse(order.placedAt);
  const have = new Set(order.timeline.map((t) => t.status));
  const added: TimelineEntry[] = [];
  for (const step of scheduledSteps(order.fulfilment.method)) {
    const at = placed + step.offset * 1000;
    if (at > now) break;
    if (!have.has(step.status)) added.push({ status: step.status, at: new Date(at).toISOString() });
  }
  if (added.length === 0) return { order, reached: [] };
  const last = added[added.length - 1];
  return {
    order: {
      ...order,
      status: last ? last.status : order.status,
      timeline: [...order.timeline, ...added],
      payment:
        last?.status === "delivered" && order.payment.method === "pay_on_pickup"
          ? { ...order.payment, status: "paid" }
          : order.payment,
    },
    reached: added.map((a) => a.status),
  };
}

/**
 * Seconds until the next milestone the buyer cares about: delivery for
 * delivery orders, "ready to collect" for pickup orders. Null when there is
 * no estimate (terminal, already ready, or a manually-updated order).
 */
export function etaSeconds(order: Order, now: number): number | null {
  if (isTerminal(order.status) || !order.autoProgress) return null;
  if (order.fulfilment.method === "pickup" && order.status === "ready") return null;
  const placed = Date.parse(order.placedAt);
  const target =
    order.fulfilment.method === "pickup" ? AUTO_SCHEDULE.dispatch : AUTO_SCHEDULE.delivered;
  return Math.max(0, Math.round((placed + target * 1000 - now) / 1000));
}

/** Apply a seller transition, appending to the timeline. Throws on an illegal move. */
export function transition(order: Order, to: OrderStatus, now: number): Order {
  if (!canTransition(order, to)) {
    throw new Error(`Can't move an order from ${order.status} to ${to}`);
  }
  return {
    ...order,
    status: to,
    timeline: [...order.timeline, { status: to, at: new Date(now).toISOString() }],
    payment:
      to === "delivered" && order.payment.method === "pay_on_pickup"
        ? { ...order.payment, status: "paid" }
        : to === "declined" || to === "cancelled"
          ? {
              ...order.payment,
              status: order.payment.status === "paid" ? "refunded" : order.payment.status,
            }
          : order.payment,
  };
}
