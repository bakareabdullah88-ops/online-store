import type { Promo } from "@/services/types";
import { percentOf, type Kobo } from "./money";

export type PromoContext = {
  brandId: string;
  subtotalKobo: Kobo;
  deliveryFeeKobo: Kobo;
  now: number;
};

export type PromoResult =
  | { ok: true; discountKobo: Kobo; freeDelivery: boolean; label: string }
  | { ok: false; reason: string };

/** Pure promo evaluation. The same function runs in the UI preview and in createOrders. */
export function evaluatePromo(promo: Promo | undefined, ctx: PromoContext): PromoResult {
  if (!promo) return { ok: false, reason: "That code doesn't exist" };
  if (!promo.active) return { ok: false, reason: "This code is no longer active" };
  if (promo.expiresAt && Date.parse(promo.expiresAt) < ctx.now) return { ok: false, reason: "This code has expired" };
  if (promo.usageLimit !== undefined && promo.usageCount >= promo.usageLimit)
    return { ok: false, reason: "This code has been fully redeemed" };
  if (promo.brandId !== null && promo.brandId !== ctx.brandId)
    return { ok: false, reason: "This code is for a different brand" };
  if (ctx.subtotalKobo < promo.minSubtotalKobo) {
    const short = promo.minSubtotalKobo - ctx.subtotalKobo;
    return { ok: false, reason: `Add ${formatShort(short)} more to use this code` };
  }

  switch (promo.kind) {
    case "percent": {
      let discount = percentOf(ctx.subtotalKobo, promo.value);
      if (promo.maxDiscountKobo !== undefined) discount = Math.min(discount, promo.maxDiscountKobo);
      return { ok: true, discountKobo: discount, freeDelivery: false, label: `${promo.value}% off` };
    }
    case "fixed":
      return {
        ok: true,
        discountKobo: Math.min(promo.value, ctx.subtotalKobo),
        freeDelivery: false,
        label: `${formatShort(promo.value)} off`,
      };
    case "free_delivery":
      if (ctx.deliveryFeeKobo === 0)
        return { ok: false, reason: "Free delivery codes only apply to delivery orders" };
      return { ok: true, discountKobo: 0, freeDelivery: true, label: "Free delivery" };
  }
}

function formatShort(kobo: Kobo) {
  return `₦${Math.ceil(kobo / 100).toLocaleString("en-NG")}`;
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}
