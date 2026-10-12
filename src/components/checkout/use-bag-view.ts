"use client";

import { useMemo } from "react";
import { groupByBrand, lineId, type BagLine } from "@/domain/bag";
import { findVariant, unitPrice, variantLabel } from "@/domain/variants";
import { useBrands, useProducts } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import { useBag } from "@/stores/bag";
import type { Brand, ProductWithBrand } from "@/services/types";

export type BagItemView = {
  id: string;
  line: BagLine;
  product: ProductWithBrand | undefined;
  /** true once we know the product is gone / unpublished */
  unavailable: boolean;
  label: string;
  unitKobo: number;
  totalKobo: number;
  stock: number;
};

export type BagGroupView = {
  brandId: string;
  brand: Brand | undefined;
  items: BagItemView[];
  subtotalKobo: number;
  count: number;
  blockedReason: string | null;
};

/** Joins the client bag (Zustand) with fresh server data (TanStack Query). */
export function useBagView() {
  const lines = useBag((s) => s.lines);
  const { user } = useSession();
  const productIds = useMemo(() => [...new Set(lines.map((l) => l.productId))].sort(), [lines]);
  const brandIds = useMemo(() => [...new Set(lines.map((l) => l.brandId))].sort(), [lines]);
  const products = useProducts({ ids: productIds, pageSize: 48 }, { enabled: productIds.length > 0 });
  const brands = useBrands({ ids: brandIds });

  const groups = useMemo<BagGroupView[]>(() => {
    const byId = new Map((products.data?.items ?? []).map((p) => [p.id, p]));
    const settled = products.isSuccess && !products.isPlaceholderData;
    return groupByBrand(lines).map((g) => {
      const brand = brands.data?.find((b) => b.id === g.brandId);
      const items = g.lines.map((line) => {
        const product = byId.get(line.productId);
        const unit = product ? unitPrice(product, line.variantKey) : 0;
        return {
          id: lineId(line),
          line,
          product,
          unavailable: settled && !product,
          label: product ? variantLabel(product.options, line.variantKey) : "",
          unitKobo: unit,
          totalKobo: unit * line.quantity,
          stock: product ? (findVariant(product, line.variantKey)?.stock ?? 0) : 0,
        };
      });
      const own = !!user && user.brandIds.includes(g.brandId);
      return {
        brandId: g.brandId,
        brand,
        items,
        subtotalKobo: items.reduce((n, i) => n + i.totalKobo, 0),
        count: items.reduce((n, i) => n + i.line.quantity, 0),
        blockedReason: own
          ? "This is your own shop. Sellers can't buy their own products."
          : brand?.vacation
            ? `${brand.name} is on a short break and isn't taking orders.`
            : null,
      };
    });
  }, [lines, products.data, products.isSuccess, products.isPlaceholderData, brands.data, user]);

  const subtotalKobo = groups.reduce((n, g) => n + g.subtotalKobo, 0);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const loading = productIds.length > 0 && (products.isPending || (products.isPlaceholderData && products.isFetching));
  return { groups, subtotalKobo, count, loading, isEmpty: lines.length === 0 };
}
