"use client";

import { isActive as orderIsActive } from "@/domain/orders";
import type { NavItem } from "@/config/nav";
import { useThreads, useUnreadCount } from "@/queries/inbox";
import { useMyOrders } from "@/queries/orders";
import { useStudioOrders } from "@/queries/studio";
import { useBagCount } from "@/stores/bag";

export type BadgeKey = NonNullable<NavItem["badge"]>;

/** Live counts for nav badges, shared by the sidebar, rail and phone bar. */
export function useNavBadges(): Record<BadgeKey, number> {
  const notifications = useUnreadCount();
  const buyerThreads = useThreads("buyer").data;
  const shopThreads = useThreads("brand").data;
  const orders = useMyOrders().data;
  const shopOrders = useStudioOrders().data;
  const bag = useBagCount();
  return {
    notifications,
    messages: buyerThreads?.reduce((n, t) => n + t.unreadForBuyer, 0) ?? 0,
    shopMessages: shopThreads?.reduce((n, t) => n + t.unreadForBrand, 0) ?? 0,
    bag,
    activeOrders: orders?.filter((o) => orderIsActive(o.status)).length ?? 0,
    newOrders: shopOrders?.filter((o) => o.status === "placed").length ?? 0,
  };
}
