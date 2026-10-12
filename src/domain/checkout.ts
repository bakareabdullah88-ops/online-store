import type { FulfilmentMethod } from "@/services/types";
import type { Kobo } from "./money";

export type GroupQuote = {
  brandId: string;
  brandName: string;
  subtotalKobo: Kobo;
  deliveryFeeKobo: Kobo;
  discountKobo: Kobo;
  totalKobo: Kobo;
  method: FulfilmentMethod;
  promo:
    | { code: string; status: "applied"; label: string }
    | { code: string; status: "invalid"; reason: string }
    | null;
  /** Lines that can't be bought as requested (sold out, own product, unpublished…) */
  problems: { productId: string; variantKey: string; reason: string }[];
};

export type CheckoutQuote = {
  groups: GroupQuote[];
  subtotalKobo: Kobo;
  deliveryKobo: Kobo;
  discountKobo: Kobo;
  totalKobo: Kobo;
};

export function groupTotal(g: { subtotalKobo: Kobo; deliveryFeeKobo: Kobo; discountKobo: Kobo }): Kobo {
  return Math.max(0, g.subtotalKobo + g.deliveryFeeKobo - g.discountKobo);
}

export function sumQuote(groups: GroupQuote[]): CheckoutQuote {
  return {
    groups,
    subtotalKobo: groups.reduce((n, g) => n + g.subtotalKobo, 0),
    deliveryKobo: groups.reduce((n, g) => n + g.deliveryFeeKobo, 0),
    discountKobo: groups.reduce((n, g) => n + g.discountKobo, 0),
    totalKobo: groups.reduce((n, g) => n + g.totalKobo, 0),
  };
}
