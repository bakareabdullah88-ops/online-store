import { set } from "idb-keyval";
import { beforeEach, describe, expect, it } from "vitest";
import { mockServices as s } from "@/services/mock";
import { __resetMemory, getDb, purgeSampleData, resetDb } from "@/services/mock/db";
import { generateSeed } from "@/services/mock/seed";
import { isServiceError } from "@/services/errors";
import { presetRange } from "@/domain/analytics";
import type { CheckoutInput } from "@/services/inputs";

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

const PASSWORD = "campus123";

/** A seller account with a published product at UNILAG. */
async function openShop(stock = 10) {
  await s.auth.signUp({ name: "Kemi Bakes", email: "kemi@shop.com", password: PASSWORD });
  await s.auth.updateProfile({ name: "Kemi Bakes", campusId: "c_unilag", phone: "08031234567" });
  const brand = await s.studio.createBrand({
    name: "Kemi Bakes",
    handle: "kemibakes",
    category: "food",
    tagline: "Small cakes, big love",
    bio: "Fresh cupcakes baked in Moremi every morning, delivered across campus.",
    fulfilment: {
      pickup: true,
      delivery: true,
      deliveryFeeKobo: 50_000,
      prepMinutes: 60,
      pickupPointIds: ["unilag-pp1"],
      zoneIds: ["unilag-z1"],
    },
  });
  const product = await s.studio.createProduct({
    name: "Vanilla Cupcakes (6)",
    description: "Soft vanilla cupcakes with buttercream.",
    category: "food",
    priceKobo: 400_000,
    options: [],
    variants: [{ key: "default", stock, priceDeltaKobo: 0 }],
    status: "published",
  });
  await s.auth.signOut();
  return { brand, product };
}

async function signUpBuyer() {
  const u = await s.auth.signUp({
    name: "Bisi Ade",
    email: "bisi@example.com",
    password: PASSWORD,
  });
  await s.auth.updateProfile({ name: "Bisi Ade", campusId: "c_unilag", phone: "08030000000" });
  return u;
}

const checkout = (
  brandId: string,
  productId: string,
  extra: Partial<CheckoutInput> = {},
): CheckoutInput => ({
  campusId: "c_unilag",
  phone: "08031234567",
  paymentMethod: "pay_on_delivery",
  groups: [
    {
      brandId,
      lines: [{ productId, variantKey: "default", quantity: 2 }],
      fulfilment: { method: "delivery", zoneId: "unilag-z1", addressLine: "Moremi Hall, B214" },
    },
  ],
  ...extra,
});

describe("fresh install", () => {
  it("starts with campuses and nothing else", async () => {
    expect((await s.catalog.listCampuses()).length).toBeGreaterThanOrEqual(8);
    expect(await s.catalog.getBrands()).toHaveLength(0);
    expect((await s.catalog.getProducts({ pageSize: 48 })).total).toBe(0);
    expect(await s.auth.getSession()).toBeNull();
  });

  it("purges v1 sample accounts but keeps people's own data", async () => {
    const db = await generateSeed();
    db.users.push(
      {
        id: "u_demo_ada",
        brandIds: [],
        followingBrandIds: ["b_real"],
        wishlistProductIds: [],
      } as never,
      {
        id: "u_real1",
        brandIds: ["b_real"],
        followingBrandIds: ["b_sample"],
        wishlistProductIds: ["p_sample"],
      } as never,
    );
    db.brands.push(
      { id: "b_real", ownerId: "u_real1" } as never,
      { id: "b_sample", ownerId: "u_owner_x" } as never,
    );
    db.products.push(
      { id: "p_real", brandId: "b_real" } as never,
      { id: "p_sample", brandId: "b_sample" } as never,
    );
    db.promos.push({ id: "pr_site", brandId: null } as never);
    purgeSampleData(db);
    expect(db.users.map((u) => u.id)).toEqual(["u_real1"]);
    expect(db.brands.map((b) => b.id)).toEqual(["b_real"]);
    expect(db.products.map((p) => p.id)).toEqual(["p_real"]);
    expect(db.users[0]!.followingBrandIds).toEqual([]);
    expect(db.users[0]!.wishlistProductIds).toEqual([]);
    expect(db.promos).toHaveLength(0);
  });

  it("migrates a v1 browser database on load", async () => {
    const { createStore } = await import("idb-keyval");
    const kv = createStore("kiosk-db", "kv");
    await set("meta:version", 1, kv);
    await set(
      "col:users",
      [{ id: "u_demo_ada", brandIds: [], followingBrandIds: [], wishlistProductIds: [] }],
      kv,
    );
    await set("session", "u_demo_ada", kv);
    __resetMemory();
    const db = await getDb();
    expect(db.users).toHaveLength(0);
    expect(await s.auth.getSession()).toBeNull();
  });
});

describe("auth", () => {
  it("signs up, hashes the password and signs in again", async () => {
    const u = await s.auth.signUp({
      name: "Bisi Ade",
      email: "Bisi@Example.com",
      password: PASSWORD,
    });
    expect(u.email).toBe("bisi@example.com");
    expect(u).not.toHaveProperty("passwordHash");
    await s.auth.signOut();
    expect(await s.auth.getSession()).toBeNull();
    await expectCode(
      s.auth.signIn({ email: "bisi@example.com", password: "wrong-pass1" }),
      "UNAUTHORIZED",
    );
    expect((await s.auth.signIn({ email: "bisi@example.com", password: PASSWORD })).id).toBe(u.id);
  });

  it("rejects duplicate emails and weak passwords", async () => {
    await signUpBuyer();
    await s.auth.signOut();
    await expectCode(
      s.auth.signUp({ name: "Ada", email: "bisi@example.com", password: PASSWORD }),
      "CONFLICT",
    );
    await expectCode(
      s.auth.signUp({ name: "Ada", email: "x@y.com", password: "short" }),
      "VALIDATION",
    );
  });

  it("says plainly that email resets are not switched on", async () => {
    await expectCode(s.auth.requestPasswordReset({ email: "bisi@example.com" }), "UNAVAILABLE");
  });

  it("deletes an account and its shop after checking the password", async () => {
    await openShop();
    await s.auth.signIn({ email: "kemi@shop.com", password: PASSWORD });
    await expectCode(s.auth.deleteAccount({ password: "nope-nope1" }), "UNAUTHORIZED");
    await s.auth.deleteAccount({ password: PASSWORD });
    expect(await s.auth.getSession()).toBeNull();
    expect(await s.catalog.getBrands()).toHaveLength(0);
    await expectCode(s.auth.signIn({ email: "kemi@shop.com", password: PASSWORD }), "UNAUTHORIZED");
  });
});

describe("buying and selling", () => {
  it("runs a full order between two real accounts", async () => {
    const { brand, product } = await openShop();
    await signUpBuyer();

    await s.catalog.recordEvent({ type: "view", productId: product.id });
    await s.catalog.recordEvent({ type: "add_to_bag", productId: product.id });

    const input = checkout(brand.id, product.id);
    const quote = await s.orders.quote(input);
    expect(quote.groups[0]!.deliveryFeeKobo).toBe(50_000);
    const { orders } = await s.orders.createOrders(input);
    expect(orders).toHaveLength(1);
    const order = orders[0]!;
    expect(order.status).toBe("placed");
    expect(order.payment.status).toBe("pending");
    expect(order.autoProgress).toBe(false);
    expect((await s.catalog.getProduct(product.slug)).variants[0]!.stock).toBe(8);

    // Seller moves it along by hand.
    await s.auth.signOut();
    await s.auth.signIn({ email: "kemi@shop.com", password: PASSWORD });
    const sellerNotes = await s.notifications.list();
    expect(sellerNotes.some((n) => /order/i.test(n.title))).toBe(true);
    for (const st of ["confirmed", "preparing", "out_for_delivery", "delivered"] as const)
      await s.studio.updateOrderStatus(order.id, st);
    await expectCode(s.studio.updateOrderStatus(order.id, "placed"), "CONFLICT");

    const dash = await s.studio.getDashboard(presetRange("7d"));
    expect(dash.orders.value).toBe(1);
    expect(dash.revenue.value).toBe(order.totalKobo);
    expect(dash.funnel.map((f) => f.value)).toEqual([1, 1, 1, 1, 1]);
    expect(dash.insight?.value).toBe("100%");
    const finance = await s.studio.getFinance();
    expect(finance.earnedKobo).toBe(order.totalKobo);

    // Buyer sees it delivered and paid.
    await s.auth.signOut();
    await s.auth.signIn({ email: "bisi@example.com", password: PASSWORD });
    const mine = await s.orders.getOrder(order.id);
    expect(mine.status).toBe("delivered");
    expect(mine.payment.status).toBe("paid");
    const home = await s.orders.getDashboard(presetRange("30d"));
    expect(home.spent.value).toBe(order.totalKobo);
    expect(home.toReview).toBe(1);
  });

  it("records offline payment per order from how it is fulfilled", async () => {
    const { brand, product } = await openShop();
    await signUpBuyer();
    const input = checkout(brand.id, product.id, { paymentMethod: "pay_on_delivery" });
    input.groups[0]!.fulfilment = {
      method: "pickup",
      zoneId: "unilag-z1",
      pickupPointId: "unilag-pp1",
    };
    const { orders } = await s.orders.createOrders(input);
    expect(orders[0]!.payment.method).toBe("pay_on_pickup");
    const delivered = await s.orders.createOrders(
      checkout(brand.id, product.id, { paymentMethod: "pay_on_pickup" }),
    );
    expect(delivered.orders[0]!.payment.method).toBe("pay_on_delivery");
  });

  it("refuses online payments until they are switched on", async () => {
    const { brand, product } = await openShop();
    await signUpBuyer();
    await expectCode(
      s.orders.createOrders(checkout(brand.id, product.id, { paymentMethod: "card" })),
      "UNAVAILABLE",
    );
  });

  it("blocks sellers from buying their own products", async () => {
    const { brand, product } = await openShop();
    await s.auth.signIn({ email: "kemi@shop.com", password: PASSWORD });
    await expectCode(s.orders.createOrders(checkout(brand.id, product.id)), "CONFLICT");
  });

  it("applies a shop's promo code", async () => {
    const { brand, product } = await openShop();
    await s.auth.signIn({ email: "kemi@shop.com", password: PASSWORD });
    await s.studio.createPromo({ code: "KEMI20", kind: "percent", value: 20, minSubtotalKobo: 0 });
    await s.auth.signOut();
    await signUpBuyer();
    const input = checkout(brand.id, product.id);
    input.groups[0]!.promoCode = "KEMI20";
    const q = await s.orders.quote(input);
    expect(q.groups[0]!.discountKobo).toBe(160_000);
  });

  it("keeps the bio when other shop settings change", async () => {
    await openShop();
    await s.auth.signIn({ email: "kemi@shop.com", password: PASSWORD });
    const b = await s.studio.updateBrand({
      payoutAccount: { bankName: "GTBank", accountNumber: "0123456789", accountName: "Kemi Bakes" },
    });
    expect(b.bio).toMatch(/cupcakes/);
    expect(b.payoutAccount).toEqual({
      bankName: "GTBank",
      accountLast4: "6789",
      accountName: "Kemi Bakes",
    });
  });
});
