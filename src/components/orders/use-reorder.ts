"use client";

import { useRouter } from "next/navigation";
import { services } from "@/services";
import type { Order } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { findVariant } from "@/domain/variants";

/** Puts an old order's items back in the bag (skipping what's sold out). */
export function useReorder() {
  const add = useBag((s) => s.add);
  const router = useRouter();
  return async (order: Order) => {
    const page = await services.catalog.getProducts({
      ids: order.items.map((i) => i.productId),
      pageSize: 48,
    });
    let added = 0;
    for (const it of order.items) {
      const p = page.items.find((x) => x.id === it.productId);
      const v = p ? findVariant(p, it.variantKey) : undefined;
      if (!p || !v || v.stock <= 0) continue;
      add(
        { productId: p.id, brandId: p.brandId, variantKey: it.variantKey, quantity: it.quantity },
        v.stock,
      );
      added++;
    }
    if (added === 0) {
      toast.error("Nothing to reorder", { description: "Those items are sold out right now." });
      return;
    }
    toast.success(
      added === order.items.length
        ? "Added to your bag"
        : `Added ${added} of ${order.items.length} items`,
      {
        description: added < order.items.length ? "Some items are sold out." : undefined,
        action: { label: "Checkout", onClick: () => router.push("/checkout") },
      },
    );
  };
}
