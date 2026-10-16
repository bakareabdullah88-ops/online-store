"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { purchaseBlock } from "@/domain/bag";
import { DEFAULT_VARIANT_KEY, findVariant, stockState, totalStock } from "@/domain/variants";
import { flyToBag } from "@/lib/fly-to-bag";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import { recordEvent } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import type { ProductWithBrand } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { useUi } from "@/stores/ui";

/**
 * The round "+" on a product tile. One tap adds a single-option product to the
 * bag; products with sizes or colours open their page to choose first.
 */
export function QuickAdd({
  product: p,
  className,
}: {
  product: ProductWithBrand;
  className?: string;
}) {
  const { user } = useSession();
  const add = useBag((s) => s.add);
  const setBagOpen = useUi((s) => s.setBagOpen);
  const router = useRouter();
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [added, setAdded] = useState(false);

  const hasOptions = p.variants.length > 1;
  const soldOut = stockState(totalStock(p)) === "sold_out";
  const block = purchaseBlock(p, hasOptions ? null : DEFAULT_VARIANT_KEY, {
    userBrandIds: user?.brandIds ?? [],
    brandOnVacation: p.brand.vacation,
  });
  if ((block.blocked && block.reason === "own_product") || soldOut || p.brand.vacation) return null;

  const base = cn(
    "grid size-9 pressable place-items-center rounded-full bg-accent text-on-accent shadow-md ring-2 ring-surface transition-colors hover:bg-accent-hover",
    className,
  );

  if (hasOptions) {
    return (
      <Link
        href={`/products/${p.slug}`}
        aria-label={`Choose options for ${p.name}`}
        className={base}
      >
        <Plus className="size-4.5" />
      </Link>
    );
  }

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    const v = findVariant(p, DEFAULT_VARIANT_KEY);
    if (!v || v.stock < 1 || block.blocked) return;
    add({ productId: p.id, brandId: p.brandId, variantKey: v.key, quantity: 1 }, v.stock);
    recordEvent("add_to_bag", p.id);
    const img = e.currentTarget.closest("article")?.querySelector("img");
    flyToBag(img?.parentElement ?? e.currentTarget);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
    toast("Added to bag", {
      description: p.name,
      action: {
        label: "View bag",
        onClick: () => (desktop ? setBagOpen(true) : router.push("/bag")),
      },
    });
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={block.blocked}
      aria-label={added ? `${p.name} added to bag` : `Add ${p.name} to bag`}
      className={cn(base, "disabled:opacity-50")}
    >
      {added ? <Check className="size-4.5" /> : <Plus className="size-4.5" />}
    </button>
  );
}
