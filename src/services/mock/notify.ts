import { newId } from "@/lib/ids";
import { statusLabel } from "@/domain/orders";
import type { AppNotification, Order, OrderStatus } from "../types";
import type { DbSnapshot } from "./seed";

export function pushNotification(db: DbSnapshot, n: Omit<AppNotification, "id" | "read" | "createdAt"> & { createdAt?: string }) {
  db.notifications.push({ id: newId("n"), read: false, createdAt: n.createdAt ?? new Date().toISOString(), ...n });
}

export function notifyBuyerOfStatus(db: DbSnapshot, order: Order, status: OrderStatus, at?: string) {
  const buyer = db.users.find((u) => u.id === order.buyerId);
  if (!buyer?.notificationPrefs.orderUpdates) return;
  const label = statusLabel(status, order.fulfilment.method);
  const body: Partial<Record<OrderStatus, string>> = {
    confirmed: `${order.brandName} accepted your order.`,
    preparing: `${order.brandName} is packing your order.`,
    ready: `Your order is ready. Show code ${order.code} at the pickup point.`,
    out_for_delivery: "A rider is on the way. Keep your phone close.",
    delivered: order.fulfilment.method === "pickup" ? "Picked up. Enjoy! Tap to leave a review." : "Delivered. Enjoy! Tap to leave a review.",
    declined: `${order.brandName} couldn't take this order. You haven't been charged.`,
    cancelled: "Your order was cancelled.",
  };
  pushNotification(db, {
    userId: order.buyerId,
    kind: "order",
    title: `${label} · ${order.code}`,
    body: body[status] ?? "",
    href: `/orders/${order.id}`,
    ...(at ? { createdAt: at } : {}),
  });
}
