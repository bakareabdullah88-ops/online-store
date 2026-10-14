import { existsSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { presetRange } from "@/domain/analytics";

// Invite-only, with sample data on: the setup visitors get today.
vi.mock("@/config/features", () => ({
  features: {
    inviteOnly: true,
    sampleData: true,
    onlinePayments: false,
    passwordResetEmail: false,
    payouts: false,
  },
}));

const { mockServices: s } = await import("@/services/mock");
const { __resetMemory, getDb, resetDb } = await import("@/services/mock/db");
const { generateSample, isSampleId, PREVIEW } = await import("@/services/mock/seed/sample");
const { refreshSample, stripSample } = await import("@/services/mock/sample-sync");
const { seedCampuses } = await import("@/services/mock/seed/campuses");
const { generateSeed } = await import("@/services/mock/seed");

beforeEach(async () => {
  __resetMemory();
  await resetDb();
});

describe("sample data", () => {
  const sample = generateSample(seedCampuses());

  it("marks every record so it can be found and removed", () => {
    const ids = Object.values(sample).flatMap((rows: { id: string }[]) => rows.map((r) => r.id));
    expect(ids.length).toBeGreaterThan(1000);
    expect(ids.every(isSampleId)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses photos that ship with the app", () => {
    const srcs = new Set(
      [...sample.products.flatMap((p) => p.images), ...sample.brands.map((b) => b.cover)].flatMap(
        (i) => (i.kind === "url" ? [i.src] : []),
      ),
    );
    expect(srcs.size).toBeGreaterThan(50);
    for (const src of srcs) expect(existsSync(join("public", src)), src).toBe(true);
  });

  it("keeps orders pointing at real products and shops", () => {
    const products = new Set(sample.products.map((p) => p.id));
    const brands = new Set(sample.brands.map((b) => b.id));
    for (const o of sample.orders) {
      expect(brands.has(o.brandId)).toBe(true);
      for (const it of o.items) expect(products.has(it.productId)).toBe(true);
    }
  });

  it("lets anyone look around as the preview account", async () => {
    expect(await s.auth.getSession()).toBeNull();
    const u = await s.auth.startPreview();
    expect(u.id).toBe(PREVIEW.userId);
    expect(u.preview).toBe(true);
    expect(u.role).toBe("member");
    expect((await s.auth.getSession())?.id).toBe(PREVIEW.userId);

    const page = await s.catalog.getProducts({});
    expect(page.total).toBeGreaterThan(100);

    const dash = await s.studio.getDashboard(presetRange("30d"));
    expect(dash.revenue.value).toBeGreaterThan(0);
    expect((await s.orders.listMyOrders()).length).toBeGreaterThan(20);
  });

  it("won't delete the preview account", async () => {
    await s.auth.startPreview();
    await expect(s.auth.deleteAccount({ password: "anything" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("refreshes without losing real accounts' links to sample shops", async () => {
    const db = await generateSeed();
    refreshSample(db, Date.now() - 10 * 86_400_000);
    db.users.push({
      ...db.users.find((u) => u.id === PREVIEW.userId)!,
      id: "u_real",
      brandIds: [],
      followingBrandIds: ["b_demo_secondlap"],
      wishlistProductIds: ["p_demo_secondlap_01"],
    });
    const oldOrders = db.orders.length;
    refreshSample(db);
    expect(db.users.find((u) => u.id === "u_real")?.followingBrandIds).toEqual([
      "b_demo_secondlap",
    ]);
    expect(db.brands.some((b) => b.id === "b_demo_secondlap")).toBe(true);
    expect(db.orders.length).toBeGreaterThan(oldOrders * 0.5);
  });

  it("comes out cleanly, keeping what real accounts made", async () => {
    const db = await getDb();
    db.users.push({
      ...db.users.find((u) => u.id === PREVIEW.userId)!,
      id: "u_real",
      brandIds: [],
      followingBrandIds: ["b_demo_secondlap"],
      wishlistProductIds: [],
    });
    stripSample(db, "remove");
    expect(db.users.map((u) => u.id)).toEqual(["u_real"]);
    expect(db.users[0]!.followingBrandIds).toEqual([]);
    for (const rows of [db.brands, db.products, db.orders, db.reviews, db.events, db.threads])
      expect(rows).toHaveLength(0);
  });
});
