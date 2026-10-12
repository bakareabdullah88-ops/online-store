import { describe, expect, it } from "vitest";
import type { Promo } from "@/services/types";
import { evaluatePromo, normalizeCode } from "./promos";

const base: Promo = {
  id: "p",
  code: "KIOSK10",
  brandId: null,
  kind: "percent",
  value: 10,
  maxDiscountKobo: 200_000,
  minSubtotalKobo: 300_000,
  active: true,
  usageCount: 0,
  description: "",
  createdAt: "2025-01-01T00:00:00Z",
};
const ctx = { brandId: "b1", subtotalKobo: 1_000_000, deliveryFeeKobo: 50_000, now: Date.parse("2025-06-01") };

describe("promos", () => {
  it("applies a percentage with a cap", () => {
    expect(evaluatePromo(base, ctx)).toMatchObject({ ok: true, discountKobo: 100_000 });
    expect(evaluatePromo(base, { ...ctx, subtotalKobo: 5_000_000 })).toMatchObject({ ok: true, discountKobo: 200_000 });
  });
  it("enforces minimum subtotal with a helpful message", () => {
    const r = evaluatePromo(base, { ...ctx, subtotalKobo: 250_000 });
    expect(r).toEqual({ ok: false, reason: "Add ₦500 more to use this code" });
  });
  it("fixed discounts never exceed the subtotal", () => {
    const r = evaluatePromo({ ...base, kind: "fixed", value: 5_000_000, minSubtotalKobo: 0 }, ctx);
    expect(r).toMatchObject({ ok: true, discountKobo: 1_000_000 });
  });
  it("free delivery needs a delivery fee", () => {
    const fd = { ...base, kind: "free_delivery" as const, value: 0, minSubtotalKobo: 0 };
    expect(evaluatePromo(fd, ctx)).toMatchObject({ ok: true, freeDelivery: true });
    expect(evaluatePromo(fd, { ...ctx, deliveryFeeKobo: 0 })).toMatchObject({ ok: false });
  });
  it("rejects brand-scoped codes for other brands, expired, inactive and exhausted codes", () => {
    expect(evaluatePromo({ ...base, brandId: "b2" }, ctx)).toMatchObject({ ok: false });
    expect(evaluatePromo({ ...base, expiresAt: "2025-05-01T00:00:00Z" }, ctx)).toMatchObject({ ok: false, reason: "This code has expired" });
    expect(evaluatePromo({ ...base, active: false }, ctx)).toMatchObject({ ok: false });
    expect(evaluatePromo({ ...base, usageLimit: 3, usageCount: 3 }, ctx)).toMatchObject({ ok: false });
    expect(evaluatePromo(undefined, ctx)).toMatchObject({ ok: false });
  });
  it("normalizes codes", () => {
    expect(normalizeCode(" kiosk 10 ")).toBe("KIOSK10");
  });
});
