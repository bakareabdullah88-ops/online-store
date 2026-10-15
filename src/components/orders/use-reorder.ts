"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { services } from "@/services";
import { errorMessage } from "@/services/errors";
import type { Order } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { findVariant } from "@/domain/variants";

/**
 * Puts an old order's items back in the bag (skipping what's sold out).
 * `pending` drives the button's spinner; a second tap while it runs is ignored,
 * so quantities never double.
 */
export function useReorder() {
  const add = useBag((s) => s.add);
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const busy = useRef(false);

  const reorder = async (order: Order) => {
    if (busy.current) return;
    busy.current = true;
    setPendingId(order.id);
    try {
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
          ? "Back in your bag"
          : `Added ${added} of ${order.items.length} items`,
        {
          description: added < order.items.length ? "Some items are sold out." : undefined,
          action: { label: "Checkout", onClick: () => router.push("/checkout") },
        },
      );
    } catch (e) {
      toast.error("That didn't go through", { description: errorMessage(e) });
    } finally {
      busy.current = false;
      setPendingId(null);
    }
  };
  return { reorder, pendingId };
}
