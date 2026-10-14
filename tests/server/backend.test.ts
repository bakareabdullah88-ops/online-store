// @vitest-environment node
/**
 * The real backend, end to end: HTTP requests into the route handlers, the
 * service code on the server, and a Postgres database. Needs DATABASE_URL
 * (a throwaway database: every test wipes it). Skipped without one.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Services } from "@/services/contracts";
import type { CheckoutInput } from "@/services/inputs";

type Api = Omit<Services, "media" | "realtime">;
type Fn = (...args: never[]) => Promise<unknown>;
type Method<S extends keyof Api> = {
  [M in keyof Api[S]]: Api[S][M] extends Fn ? M : never;
}[keyof Api[S]] &
  string;
type Call<S extends keyof Api, M extends Method<S>> = Api[S][M] extends Fn ? Api[S][M] : never;

// One file, run in order: the tests share a database. The flags change per block.
const flags = vi.hoisted(() => ({
  inviteOnly: false,
  sampleData: false,
  onlinePayments: false,
  passwordResetEmail: false,
  payouts: false,
}));
vi.mock("@/config/features", () => ({ features: flags }));

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

const ORIGIN = "http://kiosk.test";
const PASSWORD = "campus123";

const { handleRpc, __resetAttempts } = await import("@/server/rpc");
const { handleUpload, handleGet } = await import("@/server/media");
const { db, closePool } = await import("@/server/pg");
const store = await import("@/server/store");

async function wipe() {
  const pool = await db();
  await pool.query("truncate kiosk_docs, kiosk_meta, kiosk_sessions, kiosk_media");
  store.forgetCache();
  store.forgetSetup();
  __resetAttempts();
}

afterAll(async () => {
  if (url) await closePool();
});

describe.skipIf(!url)("backend on Postgres", () => {
  /** A browser: keeps its own cookie. */
  function browser() {
    let cookie = "";
    const headers = (extra: Record<string, string> = {}) => ({
      origin: ORIGIN,
      host: "kiosk.test",
      ...(cookie ? { cookie } : {}),
      ...extra,
    });
    const keep = (res: Response) => {
      for (const c of res.headers.getSetCookie()) {
        const [pair] = c.split(";");
        const value = pair!.split("=").slice(1).join("=");
        cookie = value ? pair! : "";
      }
    };
    return {
      async raw(service: string, method: string, ...args: unknown[]) {
        const res = await handleRpc(
          new Request(`${ORIGIN}/api/rpc`, {
            method: "POST",
            headers: headers({ "content-type": "application/json" }),
            body: JSON.stringify({ service, method, args }),
          }),
        );
        keep(res);
        return res;
      },
      /** Calls a service as this browser, typed like the real client. */
      async call<S extends keyof Api, M extends Method<S>>(
        service: S,
        method: M,
        ...args: Parameters<Call<S, M>>
      ): Promise<Awaited<ReturnType<Call<S, M>>>> {
        const res = await this.raw(service, method, ...args);
        const body = await res.json();
        if (!res.ok) throw Object.assign(new Error(body.error.message), body.error);
        return body.data;
      },
      async upload(bytes: Uint8Array, type = "image/png") {
        const res = await handleUpload(
          new Request(`${ORIGIN}/api/media`, {
            method: "POST",
            headers: headers({ "content-type": type }),
            body: bytes as Uint8Array<ArrayBuffer>,
          }),
        );
        return res;
      },
    };
  }

  async function code(p: Promise<unknown>) {
    try {
      await p;
    } catch (e) {
      return (e as { code: string }).code;
    }
    return "ok";
  }

  beforeEach(wipe);

  async function openShop(seller = browser()) {
    await seller.call("auth", "signUp", {
      name: "Kemi Bakes",
      email: "kemi@shop.com",
      password: PASSWORD,
    });
    await seller.call("auth", "updateProfile", {
      name: "Kemi Bakes",
      campusId: "c_unilag",
      phone: "08031234567",
    });
    const brand = await seller.call("studio", "createBrand", {
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
    const product = await seller.call("studio", "createProduct", {
      name: "Vanilla Cupcakes (6)",
      description: "Soft vanilla cupcakes with buttercream.",
      category: "food",
      priceKobo: 400_000,
      options: [],
      variants: [{ key: "default", stock: 10, priceDeltaKobo: 0 }],
      status: "published",
    });
    return { seller, brand, product };
  }

  const checkout = (brandId: string, productId: string, quantity = 2): CheckoutInput => ({
    campusId: "c_unilag",
    phone: "08031234567",
    paymentMethod: "pay_on_delivery",
    groups: [
      {
        brandId,
        lines: [{ productId, variantKey: "default", quantity }],
        fulfilment: { method: "delivery", zoneId: "unilag-z1", addressLine: "Moremi Hall, B214" },
      },
    ],
  });

  it("starts with the campus list and nobody signed in", async () => {
    const b = browser();
    expect((await b.call("catalog", "listCampuses")).length).toBeGreaterThanOrEqual(8);
    expect(await b.call("auth", "getSession")).toBeNull();
  });

  it("shares one database between people: a shop, an order and its updates", async () => {
    const { seller, brand, product } = await openShop();
    const buyer = browser();
    await buyer.call("auth", "signUp", {
      name: "Bisi Ade",
      email: "bisi@example.com",
      password: PASSWORD,
    });
    await buyer.call("auth", "updateProfile", {
      name: "Bisi Ade",
      campusId: "c_unilag",
      phone: "08030000000",
    });

    // The buyer sees the seller's product.
    const page = await buyer.call("catalog", "getProducts", { pageSize: 48 });
    expect(page.total).toBe(1);
    const { orders } = await buyer.call("orders", "createOrders", checkout(brand.id, product.id));
    expect(orders).toHaveLength(1);

    // The seller sees the order and moves it along.
    const inbox = await seller.call("studio", "listOrders");
    expect(inbox.map((o) => o.id)).toEqual([orders[0]!.id]);
    for (const st of ["confirmed", "preparing", "out_for_delivery", "delivered"] as const)
      await seller.call("studio", "updateOrderStatus", orders[0]!.id, st);

    expect((await buyer.call("orders", "getOrder", orders[0]!.id)).status).toBe("delivered");
    expect((await buyer.call("catalog", "getProduct", product.slug)).variants[0]!.stock).toBe(8);

    // Every record is a row in Postgres.
    const pool = await db();
    const { rows } = await pool.query(
      "select collection, count(*)::int as n from kiosk_docs where not deleted group by collection",
    );
    const n = Object.fromEntries(rows.map((r) => [r.collection, r.n]));
    expect(n).toMatchObject({ users: 2, brands: 1, products: 1, orders: 1 });
  });

  it("keeps people apart: a buyer can't run someone else's shop", async () => {
    const { brand, product } = await openShop();
    const buyer = browser();
    await buyer.call("auth", "signUp", {
      name: "Bisi Ade",
      email: "bisi@example.com",
      password: PASSWORD,
    });
    await buyer.call("auth", "updateProfile", {
      name: "Bisi Ade",
      campusId: "c_unilag",
      phone: "08030000000",
    });
    const { orders } = await buyer.call("orders", "createOrders", checkout(brand.id, product.id));
    expect(await code(buyer.call("studio", "updateOrderStatus", orders[0]!.id, "delivered"))).toBe(
      "FORBIDDEN",
    );
    expect(await code(buyer.call("studio", "deleteProducts", [product.id]))).toBe("FORBIDDEN");
    expect(await code(browser().call("orders", "getOrder", orders[0]!.id))).toBe("UNAUTHORIZED");
  });

  it("signs in with a cookie, never sends password hashes, and signs out", async () => {
    await openShop();
    const b = browser();
    const user = await b.call("auth", "signIn", { email: "kemi@shop.com", password: PASSWORD });
    expect(user.email).toBe("kemi@shop.com");
    expect(JSON.stringify(user)).not.toMatch(/password/i);
    expect((await b.call("auth", "getSession"))?.id).toBe(user.id);
    await b.call("auth", "signOut");
    expect(await b.call("auth", "getSession")).toBeNull();
    expect(
      await code(b.call("auth", "signIn", { email: "kemi@shop.com", password: "wrong-pass" })),
    ).toBe("UNAUTHORIZED");
  });

  it("sells the last one once when two people check out at the same time", async () => {
    const { seller, brand, product } = await openShop();
    await seller.call("studio", "updateProduct", product.id, {
      name: product.name,
      description: product.description,
      category: product.category,
      priceKobo: product.priceKobo,
      options: [],
      variants: [{ key: "default", stock: 1, priceDeltaKobo: 0 }],
      status: "published",
    });
    const buyers = await Promise.all(
      ["a", "b", "c"].map(async (x) => {
        const b = browser();
        await b.call("auth", "signUp", {
          name: `Buyer ${x}`,
          email: `${x}@example.com`,
          password: PASSWORD,
        });
        await b.call("auth", "updateProfile", {
          name: `Buyer ${x}`,
          campusId: "c_unilag",
          phone: "08030000000",
        });
        return b;
      }),
    );
    // A fresh server cache, as if each request landed on a different server.
    store.forgetCache();
    const results = await Promise.all(
      buyers.map((b) => code(b.call("orders", "createOrders", checkout(brand.id, product.id, 1)))),
    );
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect((await seller.call("studio", "listOrders")).length).toBe(1);
    expect((await seller.call("studio", "getProduct", product.id)).variants[0]!.stock).toBe(0);
  });

  it("closes the holes found in review: drafts, payout details, mixed shops, repeated lines", async () => {
    const { seller, brand, product } = await openShop();
    await seller.call("studio", "updateBrand", {
      payoutAccount: { bankName: "GTBank", accountNumber: "0123456789", accountName: "Kemi Bakes" },
    });
    const draft = await seller.call("studio", "createProduct", {
      name: "Secret Recipe Cake",
      description: "Not ready for anyone to see yet.",
      category: "food",
      priceKobo: 500_000,
      options: [],
      variants: [{ key: "default", stock: 5, priceDeltaKobo: 0 }],
      status: "draft",
    });

    const buyer = browser();
    await buyer.call("auth", "signUp", {
      name: "Bisi Ade",
      email: "bisi@example.com",
      password: PASSWORD,
    });
    await buyer.call("auth", "updateProfile", {
      name: "Bisi Ade",
      campusId: "c_unilag",
      phone: "08030000000",
    });

    // Drafts stay private, even when asked for by id or saved to a wishlist.
    const page = await buyer.call("catalog", "getProducts", { ids: [draft.id], pageSize: 48 });
    expect(page.total).toBe(0);
    expect(await code(buyer.call("social", "toggleWishlist", draft.id))).toBe("NOT_FOUND");
    // Payout details never leave the shop.
    expect((await buyer.call("catalog", "getBrand", brand.handle)).payoutAccount).toBeNull();
    expect((await seller.call("studio", "getMyBrand"))?.payoutAccount?.accountLast4).toBe("6789");

    // A second shop can't sell the first shop's product.
    const rival = browser();
    await rival.call("auth", "signUp", {
      name: "Rival Shop",
      email: "rival@shop.com",
      password: PASSWORD,
    });
    await rival.call("auth", "updateProfile", {
      name: "Rival Shop",
      campusId: "c_unilag",
      phone: "08030000001",
    });
    const rb = await rival.call("studio", "createBrand", {
      name: "Rival Bakes",
      handle: "rivalbakes",
      category: "food",
      tagline: "Also cakes",
      bio: "Cakes, but from the other side of campus, delivered warm.",
      fulfilment: {
        pickup: true,
        delivery: true,
        deliveryFeeKobo: 0,
        prepMinutes: 60,
        pickupPointIds: ["unilag-pp1"],
        zoneIds: ["unilag-z1"],
      },
    });
    expect(await code(rival.call("orders", "createOrders", checkout(rb.id, product.id)))).toBe(
      "CONFLICT",
    );

    // Repeating a line can't buy more than there is.
    const many = checkout(brand.id, product.id, 6);
    many.groups[0]!.lines.push({ productId: product.id, variantKey: "default", quantity: 6 });
    expect(await code(buyer.call("orders", "createOrders", many))).toBe("CONFLICT");
    // Nor can the same shop appear twice.
    const twice = checkout(brand.id, product.id, 1);
    twice.groups.push(twice.groups[0]!);
    expect(await code(buyer.call("orders", "createOrders", twice))).toBe("VALIDATION");
    expect((await buyer.call("catalog", "getProduct", product.slug)).variants[0]!.stock).toBe(10);
  });

  it("only deletes photos their uploader owns", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    const { seller } = await openShop();
    const { data } = await (await seller.upload(png)).json();
    const other = browser();
    await other.call("auth", "signUp", {
      name: "Someone Else",
      email: "else@example.com",
      password: PASSWORD,
    });
    await other.call("auth", "updateProfile", {
      name: "Someone Else",
      campusId: "c_unilag",
      phone: "08030000002",
      avatarImageId: data.id,
    });
    await other.call("auth", "deleteAccount", { password: PASSWORD });
    expect((await handleGet(data.id)).status).toBe(200);
  });

  it("refuses unknown operations and cross-site requests", async () => {
    const b = browser();
    expect((await b.raw("auth", "constructor")).status).toBe(404);
    expect((await b.raw("media", "deleteImage", "x")).status).toBe(404);
    const res = await handleRpc(
      new Request(`${ORIGIN}/api/rpc`, {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          host: "kiosk.test",
          "content-type": "application/json",
        },
        body: JSON.stringify({ service: "auth", method: "getSession", args: [] }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("stores and serves uploaded photos for signed-in people only", async () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    expect((await browser().upload(png)).status).toBe(401);
    const { seller } = await openShop();
    const res = await seller.upload(png);
    expect(res.status).toBe(200);
    const { data } = await res.json();
    expect(data.ref).toEqual({ kind: "blob", id: data.id });
    const img = await handleGet(data.id);
    expect(img.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(png);
    expect((await seller.upload(png, "text/html")).status).toBe(422);
  });
});

describe.skipIf(!url)("preview on Postgres", () => {
  beforeAll(async () => {
    flags.inviteOnly = true;
    flags.sampleData = true;
    await wipe();
  });
  afterAll(() => {
    flags.inviteOnly = false;
    flags.sampleData = false;
  });

  let cookie = "";
  async function call(service: string, method: string, ...args: unknown[]) {
    const res = await handleRpc(
      new Request(`${ORIGIN}/api/rpc`, {
        method: "POST",
        headers: {
          origin: ORIGIN,
          host: "kiosk.test",
          "content-type": "application/json",
          ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify({ service, method, args }),
      }),
    );
    for (const c of res.headers.getSetCookie()) cookie = c.split(";")[0]!;
    const body = await res.json();
    return { status: res.status, ...body };
  }

  it("fills a fresh database with the sample shops once", async () => {
    const t = Date.now();
    const page = await call("catalog", "getProducts", { pageSize: 48 });
    expect(page.data.total).toBeGreaterThan(100);
    expect(Date.now() - t).toBeLessThan(20_000);
    const { rows } = await (
      await db()
    ).query("select value from kiosk_meta where key = 'sampleVersion'");
    expect(rows).toHaveLength(1);
  });

  it("lets anyone look around as the preview account, without changing anything", async () => {
    const me = await call("auth", "startPreview");
    expect(me.data.preview).toBe(true);
    expect((await call("auth", "getSession")).data.id).toBe(me.data.id);
    expect((await call("orders", "listMyOrders")).data.length).toBeGreaterThan(20);

    const products = (await call("catalog", "getProducts", { pageSize: 5 })).data.items;
    // Views still count; edits don't stick.
    expect(
      (await call("catalog", "recordEvent", { type: "view", productId: products[0].id })).status,
    ).toBe(200);
    const follow = await call("social", "toggleFollow", products[0].brandId);
    expect(follow.status).toBe(403);
    expect(follow.error.message).toMatch(/preview/);
  });

  it("keeps invite-only sign-up closed", async () => {
    cookie = "";
    const res = await call("auth", "signUp", {
      name: "Someone New",
      email: "new@example.com",
      password: "campus123",
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
