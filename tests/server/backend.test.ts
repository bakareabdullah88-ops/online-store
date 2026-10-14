// @vitest-environment node
/**
 * The real backend, end to end: HTTP requests into the route handlers, the
 * service code on the server, and a Postgres database. Needs DATABASE_URL
 * (a throwaway database: every test wipes it). Skipped without one.
 */
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Services } from "@/services/contracts";
import type { CheckoutInput } from "@/services/inputs";

type Api = Omit<Services, "media" | "realtime">;
type Fn = (...args: never[]) => Promise<unknown>;
type Method<S extends keyof Api> = {
  [M in keyof Api[S]]: Api[S][M] extends Fn ? M : never;
}[keyof Api[S]] &
  string;
type Call<S extends keyof Api, M extends Method<S>> = Api[S][M] extends Fn ? Api[S][M] : never;

// One file, run in order: the tests share a database.
const flags = vi.hoisted(() => ({
  onlinePayments: false,
  passwordResetEmail: false,
  payouts: false,
}));
vi.mock("@/config/features", () => ({ features: flags }));

// Google, as Better Auth reports it after the redirect back: whoever `googleUser` is.
const google = vi.hoisted(() => ({
  user: null as null | { email: string; name: string; emailVerified: boolean },
  signedOut: 0,
}));
vi.mock("@/server/better-auth", () => ({
  googleConfigured: () => true,
  getAuth: async () => ({
    api: {
      getSession: async () => (google.user ? { user: google.user, session: {} } : null),
      signOut: async () => {
        google.signedOut++;
        return new Response(null, {
          headers: { "set-cookie": "kamplug-auth.session_token=; Max-Age=0; Path=/" },
        });
      },
    },
  }),
}));

const url = process.env.TEST_DATABASE_URL;
if (url) process.env.DATABASE_URL = url;

const ORIGIN = "http://kiosk.test";
const PASSWORD = "campus123";

const { handleRpc, __resetAttempts } = await import("@/server/rpc");
const { handleUpload, handleGet } = await import("@/server/media");
const { handleGoogleFinish } = await import("@/server/google");
const { forgetR2 } = await import("@/server/media-store");
const { db, closePool } = await import("@/server/pg");
const store = await import("@/server/store");

async function wipe() {
  const pool = await db();
  await pool.query("truncate kamplug_docs, kamplug_meta, kamplug_sessions, kamplug_media");
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
      /** Comes back from Google signed in as `google.user`. Returns where it was sent. */
      async finishGoogle(next?: string) {
        const res = await handleGoogleFinish(
          new Request(
            `${ORIGIN}/api/session/google${next ? `?next=${encodeURIComponent(next)}` : ""}`,
            { headers: headers() },
          ),
        );
        keep(res);
        return (
          new URL(res.headers.get("location")!).pathname +
          new URL(res.headers.get("location")!).search
        );
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
      "select collection, count(*)::int as n from kamplug_docs where not deleted group by collection",
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
    expect(JSON.stringify(user)).not.toMatch(/passwordHash|passwordSalt/);
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

  it("keeps the photos the product editor sends, in order, and nothing made up", async () => {
    const { seller, product } = await openShop();
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3]);
    const a = (await (await seller.upload(png)).json()).data.ref;
    const b = (await (await seller.upload(png)).json()).data.ref;
    const input = {
      name: product.name,
      description: product.description,
      category: product.category,
      priceKobo: product.priceKobo,
      options: [],
      variants: [{ key: "default", stock: 10, priceDeltaKobo: 0 }],
      status: "published" as const,
      // What the editor sends: every photo as a ref, none as imageIds.
      imageIds: [],
      keepImages: [b, a, { kind: "url", src: "https://evil.example/x.png" }],
    };
    const saved = await seller.call("studio", "updateProduct", product.id, input);
    expect(saved.images).toEqual([b, a]);
    // Reordering keeps both.
    const again = await seller.call("studio", "updateProduct", product.id, {
      ...input,
      keepImages: [a, b],
    });
    expect(again.images).toEqual([a, b]);
    // Buyers see them too.
    const seen = await browser().call("catalog", "getProduct", product.slug);
    expect(seen.images).toEqual([a, b]);
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

  it("signs in with Google: a new account, then the same one again", async () => {
    google.user = { email: "Ngozi@Gmail.com", name: "Ngozi Eze", emailVerified: true };
    const b = browser();
    expect(await b.finishGoogle("/explore")).toBe("/welcome?next=%2Fexplore");
    const me = await b.call("auth", "getSession");
    expect(me).toMatchObject({ email: "ngozi@gmail.com", name: "Ngozi Eze", hasPassword: false });
    // Better Auth's own session is always ended; Kamplug's cookie is the sign-in.
    expect(google.signedOut).toBeGreaterThan(0);

    const again = browser();
    await again.finishGoogle();
    expect((await again.call("auth", "getSession"))?.id).toBe(me?.id);
    // No password to guess.
    expect(
      await code(browser().call("auth", "signIn", { email: "ngozi@gmail.com", password: "" })),
    ).toBe("VALIDATION");
    // Deleting a Google-only account is confirmed with its email.
    expect(await code(again.call("auth", "deleteAccount", { password: "wrong@gmail.com" }))).toBe(
      "UNAUTHORIZED",
    );
    await again.call("auth", "deleteAccount", { password: "ngozi@gmail.com" });
  });

  it("takes an email back from whoever signed up with it before Google confirmed it", async () => {
    const squatter = browser();
    await squatter.call("auth", "signUp", {
      name: "Not Kemi",
      email: "kemi@gmail.com",
      password: PASSWORD,
    });
    google.user = { email: "kemi@gmail.com", name: "Kemi", emailVerified: true };
    const kemi = browser();
    await kemi.finishGoogle();
    expect((await kemi.call("auth", "getSession"))?.hasPassword).toBe(false);
    expect(
      await code(browser().call("auth", "signIn", { email: "kemi@gmail.com", password: PASSWORD })),
    ).toBe("UNAUTHORIZED");
  });

  it("refuses Google accounts whose email isn't verified", async () => {
    google.user = { email: "x@example.com", name: "X", emailVerified: false };
    const b = browser();
    expect(await b.finishGoogle()).toBe("/login?error=google");
    expect(await b.call("auth", "getSession")).toBeNull();
  });

  it("stores photos on Cloudflare R2 when it's set up", async () => {
    const calls: { method: string; url: string; auth: string | null }[] = [];
    const realFetch = globalThis.fetch;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = new Request(input, init);
      calls.push({ method: req.method, url: req.url, auth: req.headers.get("authorization") });
      return new Response(null, { status: 200 });
    });
    Object.assign(process.env, {
      R2_ACCOUNT_ID: "acc123",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET_NAME: "kamplug-images",
      R2_PUBLIC_URL: "https://img.kamplug.test/",
    });
    forgetR2();
    try {
      const { seller } = await openShop();
      const res = await seller.upload(new Uint8Array([1, 2, 3]), "image/webp");
      const { data } = await res.json();
      expect(calls[0]).toMatchObject({
        method: "PUT",
        url: `https://acc123.r2.cloudflarestorage.com/kamplug-images/images/${data.id}.webp`,
      });
      expect(calls[0]!.auth).toMatch(/^AWS4-HMAC-SHA256 Credential=key\//);
      const img = await handleGet(data.id);
      expect(img.status).toBe(302);
      expect(img.headers.get("location")).toBe(`https://img.kamplug.test/images/${data.id}.webp`);
      // Deleting the account removes the photo from R2 too (it's theirs).
      await seller.call("studio", "updateBrand", { logoImageId: data.id });
      await seller.call("auth", "deleteAccount", { password: PASSWORD });
      expect(calls.at(-1)).toMatchObject({ method: "DELETE" });
    } finally {
      vi.stubGlobal("fetch", realFetch);
      for (const k of [
        "R2_ACCOUNT_ID",
        "R2_ACCESS_KEY_ID",
        "R2_SECRET_ACCESS_KEY",
        "R2_BUCKET_NAME",
        "R2_PUBLIC_URL",
      ])
        delete process.env[k];
      forgetR2();
    }
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
  it("takes old sample data out of a database that still has it, keeping real accounts", async () => {
    const real = browser();
    await real.call("auth", "signUp", {
      name: "Real Person",
      email: "real@example.com",
      password: PASSWORD,
    });
    const pool = await db();
    const row = (collection: string, data: Record<string, unknown>) =>
      pool.query(
        "insert into kamplug_docs (collection, id, data, seq, ord) values ($1, $2, $3, nextval('kamplug_seq'), nextval('kamplug_seq'))",
        [collection, data.id, JSON.stringify(data)],
      );
    await row("brands", { id: "b_demo_secondlap", name: "Second Lap" });
    await row("users", {
      id: "u_demo_preview",
      name: "Temi",
      brandIds: [],
      followingBrandIds: [],
      wishlistProductIds: [],
    });
    // A fresh server, as after a deploy.
    store.forgetCache();
    store.forgetSetup();
    expect(await real.call("catalog", "getBrands")).toEqual([]);
    const { rows } = await pool.query(
      "select id from kamplug_docs where id like '%\\_demo\\_%' and not deleted",
    );
    expect(rows).toEqual([]);
    expect((await real.call("auth", "getSession"))?.email).toBe("real@example.com");
  });
});
