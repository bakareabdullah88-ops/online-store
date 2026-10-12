import { beforeEach, describe, expect, it } from "vitest";
import { mockServices as s } from "@/services/mock";
import { __resetMemory, resetDb } from "@/services/mock/db";
import { DEMO } from "@/services/mock/seed";
import { isServiceError } from "@/services/errors";

beforeEach(async () => {
  __resetMemory();
  await resetDb();
});

async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
  } catch (e) {
    expect(isServiceError(e)).toBe(true);
    expect((e as { code: string }).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
}

describe("seed", () => {
  it("has enough believable data", async () => {
    const campuses = await s.catalog.listCampuses();
    expect(campuses.length).toBeGreaterThanOrEqual(8);
    const brands = await s.catalog.getBrands();
    expect(brands.length).toBeGreaterThanOrEqual(16);
    const page = await s.catalog.getProducts({ pageSize: 48 });
    expect(page.total).toBeGreaterThanOrEqual(120);
    for (const p of page.items) {
      expect(Number.isInteger(p.priceKobo)).toBe(true);
      expect(p.name).not.toMatch(/product \d|lorem/i);
    }
  });
});

describe("auth", () => {
  it("signs up, hashes the password and signs in again", async () => {
    const u = await s.auth.signUp({ name: "Bisi Ade", email: "Bisi@Example.com", password: "campus123" });
    expect(u.email).toBe("bisi@example.com");
    expect(u).not.toHaveProperty("passwordHash");
    await s.auth.signOut();
    expect(await s.auth.getSession()).toBeNull();
    await expectCode(s.auth.signIn({ email: "bisi@example.com", password: "wrong-pass1" }), "UNAUTHORIZED");
    const again = await s.auth.signIn({ email: "bisi@example.com", password: "campus123" });
    expect(again.id).toBe(u.id);
  });
  it("rejects duplicate emails and weak passwords", async () => {
    await expectCode(s.auth.signUp({ name: "Ada", email: DEMO.buyer.email, password: "campus123" }), "CONFLICT");
    await expectCode(s.auth.signUp({ name: "Ada", email: "x@y.com", password: "short" }), "VALIDATION");
  });
  it("one-click demo login works for both roles", async () => {
    expect((await s.auth.signInDemo("buyer")).id).toBe(DEMO.buyer.id);
    const seller = await s.auth.signInDemo("seller");
    expect(seller.brandIds.length).toBe(1);
  });
});

describe("catalog", () => {
  it("filters, sorts and searches", async () => {
    const food = await s.catalog.getProducts({ category: "food", sort: "price_asc", pageSize: 48 });
    expect(food.items.every((p) => p.category === "food")).toBe(true);
    const prices = food.items.map((p) => p.priceKobo);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const res = await s.catalog.search("jollof");
    expect(res.products[0]?.name).toMatch(/jollof/i);
    const brand = await s.catalog.getBrand("adirelab");
    expect(brand.name).toBe("Àdìrẹ Lab");
  });
});

describe("checkout", () => {
  it("creates one order per brand with promo pricing and decrements stock", async () => {
    await s.auth.signInDemo("buyer");
    const { items } = await s.catalog.getProducts({ pageSize: 48, inStock: true });
    const a = items.find((p) => p.brandId === "b_mamaputexpress")!;
    const b = items.find((p) => p.brandId === "b_plughub")!;
    const va = a.variants.find((v) => v.stock > 1)!;
    const vb = b.variants.find((v) => v.stock > 0)!;
    const input = {
      campusId: "c_unilag",
      phone: "08031234567",
      paymentMethod: "card" as const,
      groups: [
        { brandId: a.brandId, lines: [{ productId: a.id, variantKey: va.key, quantity: 2 }], fulfilment: { method: "delivery" as const, zoneId: "unilag-z1", addressLine: "Room B214" }, promoCode: "freedel" },
        { brandId: b.brandId, lines: [{ productId: b.id, variantKey: vb.key, quantity: 1 }], fulfilment: { method: "pickup" as const, zoneId: "covenant-z6", pickupPointId: "covenant-pp1" } },
      ],
    };
    const quote = await s.orders.quote(input);
    expect(quote.groups[0]!.deliveryFeeKobo).toBe(0);
    expect(quote.groups[0]!.promo).toMatchObject({ status: "applied" });
    const { orders } = await s.orders.createOrders(input);
    expect(orders).toHaveLength(2);
    expect(orders[0]!.totalKobo).toBe(quote.groups[0]!.totalKobo);
    const after = await s.catalog.getProduct(a.slug);
    expect(after.variants.find((v) => v.key === va.key)!.stock).toBe(va.stock - 2);
    const mine = await s.orders.listMyOrders();
    expect(mine.some((o) => o.id === orders[0]!.id)).toBe(true);
  });

  it("blocks sellers from buying their own products", async () => {
    await s.auth.signInDemo("seller");
    const { items } = await s.catalog.getProducts({ brandId: "b_adirelab", inStock: true });
    const p = items[0]!;
    const v = p.variants.find((x) => x.stock > 0)!;
    await expectCode(
      s.orders.createOrders({
        campusId: "c_unilag",
        phone: "08031234567",
        paymentMethod: "card",
        groups: [{ brandId: p.brandId, lines: [{ productId: p.id, variantKey: v.key, quantity: 1 }], fulfilment: { method: "pickup", zoneId: "unilag-z5", pickupPointId: "unilag-pp1" } }],
      }),
      "CONFLICT",
    );
  });
});

describe("studio", () => {
  it("lets a new user open a shop, publish a product and create a working promo", async () => {
    await s.auth.signUp({ name: "Kemi Shop", email: "kemi@shop.com", password: "campus123" });
    await s.auth.updateProfile({ name: "Kemi Shop", campusId: "c_ui", phone: "08031234567" });
    expect(await s.studio.isHandleAvailable("adirelab")).toBe(false);
    const brand = await s.studio.createBrand({
      name: "Kemi Bakes",
      handle: "kemibakes",
      category: "food",
      tagline: "Small cakes, big love",
      bio: "",
      fulfilment: { pickup: true, delivery: false, deliveryFeeKobo: 0, prepMinutes: 60, pickupPointIds: ["ui-pp1"], zoneIds: [] },
    });
    expect(brand.handle).toBe("kemibakes");
    const product = await s.studio.createProduct({
      name: "Vanilla Cupcakes (6)",
      description: "Soft vanilla cupcakes with buttercream.",
      category: "food",
      priceKobo: 400_000,
      options: [],
      variants: [{ key: "default", stock: 10, priceDeltaKobo: 0 }],
      status: "published",
    });
    expect(product.slug).toContain("kemibakes");
    await s.studio.createPromo({ code: "KEMI20", kind: "percent", value: 20, minSubtotalKobo: 0 });
    const setup = await s.studio.getSetup();
    expect(setup.find((x) => x.id === "promo")?.done).toBe(true);

    // A buyer uses the brand code
    await s.auth.signInDemo("buyer");
    const q = await s.orders.quote({
      campusId: "c_ui",
      phone: "08031234567",
      paymentMethod: "card",
      groups: [{ brandId: brand.id, lines: [{ productId: product.id, variantKey: "default", quantity: 1 }], fulfilment: { method: "pickup", zoneId: "ui-z5", pickupPointId: "ui-pp1" }, promoCode: "KEMI20" }],
    });
    expect(q.groups[0]!.discountKobo).toBe(80_000);
  });

  it("advances orders through the kanban and notifies the buyer", async () => {
    await s.auth.signInDemo("seller");
    const orders = await s.studio.listOrders();
    const live = orders.find((o) => o.id === "o_ada_live_a7b2")!;
    expect(live.status).toBe("preparing");
    const next = await s.studio.updateOrderStatus(live.id, "out_for_delivery");
    expect(next.status).toBe("out_for_delivery");
    await expectCode(s.studio.updateOrderStatus(live.id, "placed"), "CONFLICT");
    await s.auth.signInDemo("buyer");
    const notes = await s.notifications.list();
    expect(notes[0]!.title).toMatch(/Out for delivery/);
  });
});
