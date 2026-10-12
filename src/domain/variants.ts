import type { Product, ProductOption, Variant } from "@/services/types";

/** Selection: option id → value id */
export type Selection = Record<string, string>;

export const DEFAULT_VARIANT_KEY = "default";

export function variantKeyFor(
  options: readonly ProductOption[],
  selection: Selection,
): string | null {
  if (options.length === 0) return DEFAULT_VARIANT_KEY;
  const ids: string[] = [];
  for (const o of options) {
    const v = selection[o.id];
    if (!v) return null;
    ids.push(v);
  }
  return ids.join("|");
}

export function variantLabel(options: readonly ProductOption[], key: string): string {
  if (key === DEFAULT_VARIANT_KEY || options.length === 0) return "";
  const ids = key.split("|");
  return options
    .map((o, i) => o.values.find((v) => v.id === ids[i])?.label)
    .filter(Boolean)
    .join(" · ");
}

export function findVariant(product: Pick<Product, "variants">, key: string): Variant | undefined {
  return product.variants.find((v) => v.key === key);
}

export function totalStock(product: Pick<Product, "variants">): number {
  return product.variants.reduce((n, v) => n + v.stock, 0);
}

export function unitPrice(product: Pick<Product, "priceKobo" | "variants">, key: string): number {
  return product.priceKobo + (findVariant(product, key)?.priceDeltaKobo ?? 0);
}

/** Every combination of option values (cartesian product), as variant keys. */
export function allVariantKeys(options: readonly ProductOption[]): string[] {
  if (options.length === 0) return [DEFAULT_VARIANT_KEY];
  return options.reduce<string[]>(
    (acc, o) => acc.flatMap((prefix) => o.values.map((v) => (prefix ? `${prefix}|${v.id}` : v.id))),
    [""],
  );
}

/**
 * Is a given option value still purchasable, given the other selected values?
 * Used to grey out sold-out sizes in pickers.
 */
export function isValueAvailable(
  product: Pick<Product, "options" | "variants">,
  selection: Selection,
  optionId: string,
  valueId: string,
): boolean {
  const trial = { ...selection, [optionId]: valueId };
  return product.variants.some((v) => {
    if (v.stock <= 0) return false;
    const ids = v.key.split("|");
    return product.options.every((o, i) => !trial[o.id] || trial[o.id] === ids[i]);
  });
}

export type StockState = "in_stock" | "low" | "sold_out";

export function stockState(stock: number): StockState {
  if (stock <= 0) return "sold_out";
  if (stock <= 3) return "low";
  return "in_stock";
}
