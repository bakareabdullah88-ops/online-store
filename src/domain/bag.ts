import type { Product } from "@/services/types";
import type { Kobo } from "./money";
import { findVariant, unitPrice } from "./variants";

export type BagLine = {
  productId: string;
  brandId: string;
  variantKey: string;
  quantity: number;
  addedAt: number;
};

export const MAX_LINE_QUANTITY = 20;

export function lineId(l: Pick<BagLine, "productId" | "variantKey">) {
  return `${l.productId}::${l.variantKey}`;
}

/** Add or merge a line. Quantity is clamped to stock and the per-line max. */
export function addLine(
  lines: BagLine[],
  next: Omit<BagLine, "addedAt">,
  stock: number,
  now: number,
): BagLine[] {
  const id = lineId(next);
  const existing = lines.find((l) => lineId(l) === id);
  const cap = Math.min(stock, MAX_LINE_QUANTITY);
  if (existing) {
    return lines.map((l) =>
      lineId(l) === id ? { ...l, quantity: Math.min(cap, l.quantity + next.quantity) } : l,
    );
  }
  return [...lines, { ...next, quantity: Math.min(cap, next.quantity), addedAt: now }];
}

export function setQuantity(lines: BagLine[], id: string, quantity: number): BagLine[] {
  if (quantity <= 0) return lines.filter((l) => lineId(l) !== id);
  return lines.map((l) =>
    lineId(l) === id ? { ...l, quantity: Math.min(MAX_LINE_QUANTITY, quantity) } : l,
  );
}

export function removeLine(lines: BagLine[], id: string): BagLine[] {
  return lines.filter((l) => lineId(l) !== id);
}

export function itemCount(lines: readonly BagLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Groups lines by brand, preserving first-added order. Each group becomes one order. */
export function groupByBrand(lines: readonly BagLine[]): { brandId: string; lines: BagLine[] }[] {
  const map = new Map<string, BagLine[]>();
  for (const l of [...lines].sort((a, b) => a.addedAt - b.addedAt)) {
    const list = map.get(l.brandId) ?? [];
    list.push(l);
    map.set(l.brandId, list);
  }
  return [...map.entries()].map(([brandId, ls]) => ({ brandId, lines: ls }));
}

export function lineSubtotal(
  line: BagLine,
  product: Pick<Product, "priceKobo" | "variants"> | undefined,
): Kobo {
  if (!product) return 0;
  return unitPrice(product, line.variantKey) * line.quantity;
}

export type PurchaseBlock =
  | { blocked: false }
  | {
      blocked: true;
      reason: "own_product" | "sold_out" | "vacation" | "unpublished";
      message: string;
    };

/** Can this user buy this product variant? Pure; used by the UI and by the service. */
export function purchaseBlock(
  product: Pick<Product, "brandId" | "status" | "variants">,
  variantKey: string | null,
  ctx: { userBrandIds: readonly string[]; brandOnVacation: boolean },
): PurchaseBlock {
  if (ctx.userBrandIds.includes(product.brandId))
    return {
      blocked: true,
      reason: "own_product",
      message: "This is from your own shop, so you can't buy it. Share it with friends instead.",
    };
  if (product.status !== "published")
    return {
      blocked: true,
      reason: "unpublished",
      message: "This product isn't available right now.",
    };
  if (ctx.brandOnVacation)
    return {
      blocked: true,
      reason: "vacation",
      message: "This shop is on a short break. Check back soon.",
    };
  if (variantKey) {
    const v = findVariant(product, variantKey);
    if (!v || v.stock <= 0)
      return { blocked: true, reason: "sold_out", message: "Sold out in this option." };
  }
  return { blocked: false };
}
