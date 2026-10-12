import { describe, expect, it } from "vitest";
import type { Order } from "@/services/types";
import { AUTO_SCHEDULE, advanceOrder, canTransition, deliveryProgress, nextSellerStatus, transition } from "./orders";

const placedAt = Date.parse("2025-06-01T12:00:00Z");
function order(over: Partial<Order> = {}): Order {
  return {
    id: "o1",
    code: "KSK-AAAA",
    checkoutId: "c",
    buyerId: "u",
    buyerName: "U",
    buyerPhone: "",
    brandId: "b",
    brandName: "B",
    brandHandle: "b",
    brandLogo: { kind: "art", motif: "monogram", palette: "sand", seed: 1 },
    items: [],
    fulfilment: { method: "delivery", campusId: "c", zoneId: "z", addressLine: "Room 1" },
    subtotalKobo: 0,
    deliveryFeeKobo: 0,
    discountKobo: 0,
    totalKobo: 0,
    payment: { method: "pay_on_pickup", status: "pending" },
    status: "placed",
    timeline: [{ status: "placed", at: new Date(placedAt).toISOString() }],
    autoProgress: true,
    placedAt: new Date(placedAt).toISOString(),
    reviewed: false,
    ...over,
  };
}

describe("order state machine", () => {
  it("allows only legal seller transitions", () => {
    expect(canTransition(order(), "confirmed")).toBe(true);
    expect(canTransition(order(), "delivered")).toBe(false);
    expect(canTransition(order({ status: "preparing" }), "ready")).toBe(false); // delivery order
    expect(canTransition(order({ status: "preparing" }), "out_for_delivery")).toBe(true);
    expect(canTransition(order({ status: "delivered" }), "placed")).toBe(false);
  });
  it("suggests the next happy-path step per method", () => {
    expect(nextSellerStatus(order({ status: "preparing" }))).toBe("out_for_delivery");
    expect(nextSellerStatus(order({ status: "preparing", fulfilment: { method: "pickup", campusId: "c", zoneId: "z" } }))).toBe("ready");
    expect(nextSellerStatus(order({ status: "delivered" }))).toBeNull();
  });
  it("transition appends the timeline and throws on illegal moves", () => {
    const next = transition(order(), "confirmed", placedAt + 1000);
    expect(next.status).toBe("confirmed");
    expect(next.timeline).toHaveLength(2);
    expect(() => transition(order(), "delivered", placedAt)).toThrow();
  });
  it("auto-advances on schedule and marks pay-on-delivery as paid", () => {
    const early = advanceOrder(order(), placedAt + 1000);
    expect(early.reached).toEqual([]);
    const mid = advanceOrder(order(), placedAt + (AUTO_SCHEDULE.preparing + 1) * 1000);
    expect(mid.order.status).toBe("preparing");
    expect(mid.reached).toEqual(["confirmed", "preparing"]);
    const done = advanceOrder(order(), placedAt + (AUTO_SCHEDULE.delivered + 1) * 1000);
    expect(done.order.status).toBe("delivered");
    expect(done.order.payment.status).toBe("paid");
  });
  it("never advances manual or terminal orders", () => {
    const o = order({ autoProgress: false });
    expect(advanceOrder(o, placedAt + 999_999).order).toBe(o);
  });
  it("reports rider progress while out for delivery", () => {
    const out = advanceOrder(order(), placedAt + (AUTO_SCHEDULE.dispatch + 1) * 1000).order;
    expect(out.status).toBe("out_for_delivery");
    const p = deliveryProgress(out, placedAt + ((AUTO_SCHEDULE.dispatch + AUTO_SCHEDULE.delivered) / 2) * 1000);
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThan(0.6);
  });
});
