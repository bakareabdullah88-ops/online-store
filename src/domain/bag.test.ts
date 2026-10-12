import { describe, expect, it } from "vitest";
import { addLine, groupByBrand, itemCount, lineId, lineSubtotal, purchaseBlock, removeLine, setQuantity } from "./bag";

const product = {
  brandId: "b1",
  status: "published" as const,
  priceKobo: 100_000,
  variants: [
    { key: "s", stock: 3, priceDeltaKobo: 0 },
    { key: "xl", stock: 0, priceDeltaKobo: 5_000 },
  ],
};

describe("bag math", () => {
  it("adds and merges lines, clamped to stock", () => {
    let lines = addLine([], { productId: "p1", brandId: "b1", variantKey: "s", quantity: 2 }, 3, 1);
    lines = addLine(lines, { productId: "p1", brandId: "b1", variantKey: "s", quantity: 5 }, 3, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.quantity).toBe(3);
  });
  it("updates and removes quantities", () => {
    const lines = addLine([], { productId: "p1", brandId: "b1", variantKey: "s", quantity: 1 }, 9, 1);
    const id = lineId(lines[0]!);
    expect(setQuantity(lines, id, 4)[0]!.quantity).toBe(4);
    expect(setQuantity(lines, id, 0)).toHaveLength(0);
    expect(removeLine(lines, id)).toHaveLength(0);
  });
  it("groups by brand in first-added order", () => {
    const lines = [
      { productId: "a", brandId: "b2", variantKey: "x", quantity: 1, addedAt: 2 },
      { productId: "b", brandId: "b1", variantKey: "x", quantity: 2, addedAt: 1 },
      { productId: "c", brandId: "b2", variantKey: "x", quantity: 1, addedAt: 3 },
    ];
    const groups = groupByBrand(lines);
    expect(groups.map((g) => g.brandId)).toEqual(["b1", "b2"]);
    expect(groups[1]!.lines).toHaveLength(2);
    expect(itemCount(lines)).toBe(4);
  });
  it("computes line subtotals with variant price deltas", () => {
    expect(lineSubtotal({ productId: "p", brandId: "b1", variantKey: "xl", quantity: 2, addedAt: 0 }, product)).toBe(210_000);
  });
  it("blocks buying your own product", () => {
    const r = purchaseBlock(product, "s", { userBrandIds: ["b1"], brandOnVacation: false });
    expect(r.blocked && r.reason).toBe("own_product");
  });
  it("blocks sold-out variants and vacation shops", () => {
    expect(purchaseBlock(product, "xl", { userBrandIds: [], brandOnVacation: false })).toMatchObject({ reason: "sold_out" });
    expect(purchaseBlock(product, "s", { userBrandIds: [], brandOnVacation: true })).toMatchObject({ reason: "vacation" });
    expect(purchaseBlock(product, "s", { userBrandIds: [], brandOnVacation: false })).toEqual({ blocked: false });
  });
});
