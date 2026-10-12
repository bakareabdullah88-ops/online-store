import { allVariantKeys } from "@/domain/variants";
import { isActive } from "@/domain/orders";
import { newId, slugify } from "@/lib/ids";
import { hashString } from "@/lib/random";
import { categoryById } from "@/config/categories";
import type { Customer, StudioPeriod, StudioService } from "../contracts";
import { ServiceError } from "../errors";
import { schemas, type Schemas } from "./schemas";
import type { Brand, BrandMetric, ImageRef, Product, Promo } from "../types";
import { commit, getDb } from "./db";
import { clone, requireBrand, requireUser } from "./context";
import { latency, quick } from "./latency";
import { applySellerTransition } from "./orders";
import { pushNotification } from "./notify";
import type { DbSnapshot } from "./seed";

export const PLATFORM_FEE_PERCENT = 5;
const DAY = 86_400_000;

const periodDays: Record<StudioPeriod, number> = { "7d": 7, "30d": 30, "90d": 90 };

function zodFail(error: { issues: { path: PropertyKey[]; message: string }[] }): never {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[i.path.map(String).join(".") || "form"] ??= i.message;
  throw new ServiceError("VALIDATION", Object.values(fields)[0] ?? "Check the form", fields);
}

function series(db: DbSnapshot, brandId: string, days: number, offsetDays = 0): BrandMetric[] {
  const out: BrandMetric[] = [];
  const end = Date.now() - offsetDays * DAY;
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(end - d * DAY).toISOString().slice(0, 10);
    const m = db.metrics.find((x) => x.brandId === brandId && x.date === date);
    out.push(
      m
        ? clone(m)
        : {
            brandId,
            date,
            views: 0,
            addToBag: 0,
            orders: 0,
            revenueKobo: 0,
            hourly: Array.from({ length: 24 }, () => 0),
          },
    );
  }
  return out;
}

const sum = (xs: BrandMetric[], k: "views" | "addToBag" | "orders" | "revenueKobo") =>
  xs.reduce((n, x) => n + x[k], 0);

function uniqueSlug(db: DbSnapshot, name: string, handle: string, ignoreId?: string) {
  const base = `${slugify(name)}-${handle}`;
  let slug = base;
  let i = 2;
  while (db.products.some((p) => p.slug === slug && p.id !== ignoreId)) slug = `${base}-${i++}`;
  return slug;
}

function buildProduct(
  { productInputSchema }: Schemas,
  db: DbSnapshot,
  brand: Brand,
  raw: unknown,
  existing?: Product,
): Product {
  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) zodFail(parsed.error);
  const input = parsed.data;
  if (input.compareAtKobo !== undefined && input.compareAtKobo <= input.priceKobo) {
    throw new ServiceError("VALIDATION", "Compare-at price must be higher than the price", {
      compareAtKobo: "Must be higher than the price",
    });
  }
  const expected = allVariantKeys(input.options);
  const keys = new Set(input.variants.map((v) => v.key));
  if (expected.length !== keys.size || !expected.every((k) => keys.has(k))) {
    throw new ServiceError("VALIDATION", "Stock is missing for some option combinations.");
  }
  const kept = (input.keepImages ?? []) as ImageRef[];
  const uploaded: ImageRef[] = input.imageIds.map((id) => ({ kind: "blob", id }));
  const images = [...kept, ...uploaded];
  if (images.length === 0) {
    const cat = categoryById(input.category);
    images.push({
      kind: "art",
      motif: cat.motif,
      palette: cat.palette,
      seed: hashString(input.name),
    });
  }
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? newId("p"),
    brandId: brand.id,
    slug:
      existing && existing.name === input.name
        ? existing.slug
        : uniqueSlug(db, input.name, brand.handle, existing?.id),
    name: input.name,
    description: input.description,
    details: input.details,
    category: input.category,
    tags: input.tags,
    priceKobo: input.priceKobo,
    ...(input.compareAtKobo ? { compareAtKobo: input.compareAtKobo } : {}),
    images,
    options: input.options,
    variants: input.variants,
    status: input.status,
    rating: existing?.rating ?? 0,
    ratingCount: existing?.ratingCount ?? 0,
    salesCount: existing?.salesCount ?? 0,
    viewCount: existing?.viewCount ?? 0,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

function refreshCounts(db: DbSnapshot, brand: Brand) {
  brand.productCount = db.products.filter(
    (p) => p.brandId === brand.id && p.status === "published",
  ).length;
}

function balances(db: DbSnapshot, brand: Brand) {
  const net = (kobo: number) => Math.round(kobo * (1 - PLATFORM_FEE_PERCENT / 100));
  const orders = db.orders.filter((o) => o.brandId === brand.id);
  const earned = orders
    .filter((o) => o.status === "delivered")
    .reduce((n, o) => n + net(o.subtotalKobo - o.discountKobo + o.deliveryFeeKobo), 0);
  const pendingKobo = orders
    .filter((o) => isActive(o.status))
    .reduce((n, o) => n + net(o.subtotalKobo - o.discountKobo + o.deliveryFeeKobo), 0);
  // Seeded history: assume earlier earnings were already paid out.
  const paid = db.payouts
    .filter((p) => p.brandId === brand.id)
    .reduce((n, p) => n + p.amountKobo, 0);
  const recentWindow = Date.now() - 14 * DAY;
  const recentEarned = orders
    .filter((o) => o.status === "delivered" && Date.parse(o.placedAt) >= recentWindow)
    .reduce((n, o) => n + net(o.subtotalKobo - o.discountKobo + o.deliveryFeeKobo), 0);
  const processing = db.payouts
    .filter((p) => p.brandId === brand.id && p.status === "processing")
    .reduce((n, p) => n + p.amountKobo, 0);
  const availableKobo = Math.max(0, Math.min(earned - paid, recentEarned - processing));
  return { availableKobo, pendingKobo };
}

export const mockStudio: StudioService = {
  async createBrand(raw) {
    const { createBrandSchema } = await schemas();
    const parsed = createBrandSchema.safeParse(raw);
    if (!parsed.success) zodFail(parsed.error);
    const input = parsed.data;
    await latency(1.2);
    const db = await getDb();
    const user = await requireUser(db);
    if (user.brandIds.length >= 1)
      throw new ServiceError(
        "CONFLICT",
        "You already have a shop. Multiple shops are coming later.",
      );
    if (db.brands.some((b) => b.handle === input.handle)) {
      throw new ServiceError("CONFLICT", "That handle is taken.", {
        handle: "That handle is taken",
      });
    }
    const campusId = user.campusId ?? db.campuses[0]!.id;
    const cat = categoryById(input.category);
    const seed = hashString(input.handle);
    const brand: Brand = {
      id: newId("b"),
      ownerId: user.id,
      handle: input.handle,
      name: input.name,
      category: input.category,
      tagline: input.tagline,
      bio: input.bio,
      logo: input.logoImageId
        ? { kind: "blob", id: input.logoImageId }
        : { kind: "art", motif: "monogram", palette: cat.palette, seed },
      cover: input.coverImageId
        ? { kind: "blob", id: input.coverImageId }
        : { kind: "art", motif: cat.motif, palette: cat.palette, seed },
      campusId,
      fulfilment: input.fulfilment,
      openHours: { days: [1, 2, 3, 4, 5, 6], opens: "09:00", closes: "20:00" },
      vacation: false,
      rating: 0,
      ratingCount: 0,
      followerCount: 0,
      productCount: 0,
      createdAt: new Date().toISOString(),
      payoutAccount: null,
      verified: false,
    };
    db.brands.push(brand);
    user.brandIds = [...user.brandIds, brand.id];
    pushNotification(db, {
      userId: user.id,
      kind: "system",
      title: `${brand.name} is open`,
      body: "Add your first product so students can find you.",
      href: "/studio/products/new",
    });
    await commit("brands", "users", "notifications");
    return clone(brand);
  },

  async isHandleAvailable(handle) {
    const { handleSchema } = await schemas();
    const parsed = handleSchema.safeParse(handle);
    if (!parsed.success) return false;
    await quick();
    const db = await getDb();
    return !db.brands.some((b) => b.handle === parsed.data);
  },

  async getMyBrand() {
    await latency(0.5);
    const db = await getDb();
    const user = await requireUser(db);
    const b = db.brands.find((x) => user.brandIds.includes(x.id));
    return b ? clone(b) : null;
  },

  async updateBrand(raw) {
    const { updateBrandSchema } = await schemas();
    const parsed = updateBrandSchema.safeParse(raw);
    if (!parsed.success) zodFail(parsed.error);
    const input = parsed.data;
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    if (input.name !== undefined) brand.name = input.name;
    if (input.category !== undefined) brand.category = input.category;
    if (input.tagline !== undefined) brand.tagline = input.tagline;
    if (input.bio !== undefined) brand.bio = input.bio;
    if (input.logoImageId) brand.logo = { kind: "blob", id: input.logoImageId };
    if (input.coverImageId) brand.cover = { kind: "blob", id: input.coverImageId };
    if (input.fulfilment) brand.fulfilment = input.fulfilment;
    if (input.vacation !== undefined) brand.vacation = input.vacation;
    if (input.openHours) brand.openHours = input.openHours;
    if (input.payoutAccount) {
      brand.payoutAccount = {
        bankName: input.payoutAccount.bankName,
        accountLast4: input.payoutAccount.accountNumber.slice(-4),
        accountName: input.payoutAccount.accountName,
      };
    }
    // Keep denormalised copies in threads/orders fresh.
    for (const t of db.threads)
      if (t.brandId === brand.id)
        Object.assign(t, { brandName: brand.name, brandLogo: clone(brand.logo) });
    await commit("brands", "threads");
    return clone(brand);
  },

  async getSetup() {
    await quick();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const products = db.products.filter((p) => p.brandId === brand.id);
    return [
      { id: "shop", label: "Open your shop", done: true, href: "/studio/brand" },
      {
        id: "logo",
        label: "Upload a logo",
        done: brand.logo.kind !== "art",
        href: "/studio/brand#logo",
      },
      {
        id: "bio",
        label: "Tell your story in the bio",
        done: brand.bio.trim().length >= 40,
        href: "/studio/brand#bio",
      },
      {
        id: "product",
        label: "List your first product",
        done: products.length > 0,
        href: "/studio/products/new",
      },
      {
        id: "three",
        label: "Publish 3 products",
        done: products.filter((p) => p.status === "published").length >= 3,
        href: "/studio/products",
      },
      {
        id: "payout",
        label: "Add a payout account",
        done: !!brand.payoutAccount,
        href: "/studio/payouts",
      },
      {
        id: "promo",
        label: "Create a promo code",
        done: db.promos.some((p) => p.brandId === brand.id),
        href: "/studio/promotions",
      },
    ];
  },

  async getOverview(period) {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const days = periodDays[period];
    const cur = series(db, brand.id, days);
    const prev = series(db, brand.id, days, days);
    const since = Date.now() - days * DAY;
    const brandOrders = db.orders.filter((o) => o.brandId === brand.id);
    const units = new Map<string, { units: number; revenue: number }>();
    for (const o of brandOrders) {
      if (Date.parse(o.placedAt) < since || o.status === "declined" || o.status === "cancelled")
        continue;
      for (const it of o.items) {
        const u = units.get(it.productId) ?? { units: 0, revenue: 0 };
        u.units += it.quantity;
        u.revenue += it.unitPriceKobo * it.quantity;
        units.set(it.productId, u);
      }
    }
    const topProducts = [...units.entries()]
      .map(([id, u]) => ({
        product: db.products.find((p) => p.id === id),
        unitsSold: u.units,
        revenueKobo: u.revenue,
      }))
      .filter((x): x is { product: Product; unitsSold: number; revenueKobo: number } => !!x.product)
      .sort((a, b) => b.revenueKobo - a.revenueKobo)
      .slice(0, 5)
      .map((x) => ({ ...x, product: clone(x.product) }));
    const conv = (s: BrandMetric[]) => {
      const v = sum(s, "views");
      return v ? (sum(s, "orders") / v) * 100 : 0;
    };
    return {
      period,
      revenueKobo: sum(cur, "revenueKobo"),
      revenuePrevKobo: sum(prev, "revenueKobo"),
      orders: sum(cur, "orders"),
      ordersPrev: sum(prev, "orders"),
      conversion: conv(cur),
      conversionPrev: conv(prev),
      rating: brand.rating,
      ratingCount: brand.ratingCount,
      series: cur,
      topProducts,
      recentOrders: clone(
        brandOrders.sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)).slice(0, 6),
      ),
    };
  },

  async getAnalytics(period) {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const days = periodDays[period];
    const cur = series(db, brand.id, days);
    const prev = series(db, brand.id, days, days);
    const views = sum(cur, "views");
    const addToBag = sum(cur, "addToBag");
    const orders = sum(cur, "orders");
    const hourly = Array.from({ length: 24 }, (_, h) =>
      cur.reduce((n, m) => n + (m.hourly[h] ?? 0), 0),
    );
    const since = Date.now() - days * DAY;
    const byCampus = new Map<string, { orders: number; revenue: number }>();
    for (const o of db.orders) {
      if (
        o.brandId !== brand.id ||
        Date.parse(o.placedAt) < since ||
        o.status === "declined" ||
        o.status === "cancelled"
      )
        continue;
      const buyer = db.users.find((u) => u.id === o.buyerId);
      const cid = buyer?.campusId ?? o.fulfilment.campusId;
      const c = byCampus.get(cid) ?? { orders: 0, revenue: 0 };
      c.orders += 1;
      c.revenue += o.subtotalKobo - o.discountKobo;
      byCampus.set(cid, c);
    }
    const products = db.products.filter((p) => p.brandId === brand.id);
    return {
      period,
      views,
      viewsPrev: sum(prev, "views"),
      addToBag,
      addToBagRate: views ? (addToBag / views) * 100 : 0,
      orders,
      conversion: views ? (orders / views) * 100 : 0,
      series: cur,
      hourly,
      topCampuses: [...byCampus.entries()]
        .map(([campusId, v]) => ({
          campusId,
          name: db.campuses.find((c) => c.id === campusId)?.shortName ?? "Other",
          orders: v.orders,
          revenueKobo: v.revenue,
        }))
        .sort((a, b) => b.orders - a.orders)
        .slice(0, 6),
      topProducts: products
        .map((p) => ({
          product: clone(p),
          views: Math.round(p.viewCount * (days / 90)),
          addToBag: Math.round(p.salesCount * 1.6 * (days / 90)),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 6),
    };
  },

  async listProducts(query = {}) {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    let list = db.products.filter((p) => p.brandId === brand.id);
    if (query.status && query.status !== "all")
      list = list.filter((p) => p.status === query.status);
    if (query.category) list = list.filter((p) => p.category === query.category);
    if (query.q?.trim()) {
      const q = query.q.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return clone(list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  },

  async getProduct(id) {
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const p = db.products.find((x) => x.id === id && x.brandId === brand.id);
    if (!p) throw new ServiceError("NOT_FOUND", "Product not found.");
    return clone(p);
  },

  async createProduct(raw) {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const product = buildProduct(await schemas(), db, brand, raw);
    db.products.push(product);
    refreshCounts(db, brand);
    await commit("products", "brands");
    return clone(product);
  },

  async updateProduct(id, raw) {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const idx = db.products.findIndex((p) => p.id === id && p.brandId === brand.id);
    const existing = db.products[idx];
    if (!existing) throw new ServiceError("NOT_FOUND", "Product not found.");
    const next = buildProduct(await schemas(), db, brand, raw, existing);
    db.products[idx] = next;
    refreshCounts(db, brand);
    await commit("products", "brands");
    return clone(next);
  },

  async setProductsStatus(ids, status) {
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    for (const p of db.products)
      if (p.brandId === brand.id && ids.includes(p.id)) p.status = status;
    refreshCounts(db, brand);
    await commit("products", "brands");
  },

  async deleteProducts(ids) {
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    db.products = db.products.filter((p) => !(p.brandId === brand.id && ids.includes(p.id)));
    refreshCounts(db, brand);
    await commit("products", "brands");
  },

  async listOrders() {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    return clone(
      db.orders
        .filter((o) => o.brandId === brand.id)
        .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)),
    );
  },

  async updateOrderStatus(id, status) {
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const order = db.orders.find((o) => o.id === id && o.brandId === brand.id);
    if (!order) throw new ServiceError("NOT_FOUND", "Order not found.");
    const next = applySellerTransition(db, id, status);
    await commit("orders", "products", "notifications");
    return clone(next);
  },

  async listCustomers() {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const map = new Map<string, Customer>();
    for (const o of db.orders) {
      if (o.brandId !== brand.id || o.status === "declined" || o.status === "cancelled") continue;
      const buyer = db.users.find((u) => u.id === o.buyerId);
      const campus = db.campuses.find((c) => c.id === (buyer?.campusId ?? o.fulfilment.campusId));
      const c = map.get(o.buyerId) ?? {
        userId: o.buyerId,
        name: o.buyerName,
        campusName: campus?.shortName ?? "",
        orders: 0,
        spentKobo: 0,
        lastOrderAt: o.placedAt,
      };
      c.orders += 1;
      c.spentKobo += o.totalKobo;
      if (Date.parse(o.placedAt) > Date.parse(c.lastOrderAt)) c.lastOrderAt = o.placedAt;
      map.set(o.buyerId, c);
    }
    return [...map.values()].sort((a, b) => b.spentKobo - a.spentKobo);
  },

  async listReviews() {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    return clone(
      db.reviews
        .filter((r) => r.brandId === brand.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );
  },

  async replyToReview(reviewId, body) {
    const text = body.trim();
    if (text.length < 2) throw new ServiceError("VALIDATION", "Write a reply first.");
    if (text.length > 500)
      throw new ServiceError("VALIDATION", "Keep replies under 500 characters.");
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const r = db.reviews.find((x) => x.id === reviewId && x.brandId === brand.id);
    if (!r) throw new ServiceError("NOT_FOUND", "Review not found.");
    r.reply = { body: text, createdAt: new Date().toISOString() };
    pushNotification(db, {
      userId: r.userId,
      kind: "review",
      title: `${brand.name} replied to your review`,
      body: text.slice(0, 90),
      href: `/brands/${brand.handle}`,
    });
    await commit("reviews", "notifications");
    return clone(r);
  },

  async listPromos() {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    return clone(
      db.promos
        .filter((p) => p.brandId === brand.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    );
  },

  async createPromo(raw) {
    const { promoInputSchema } = await schemas();
    const parsed = promoInputSchema.safeParse(raw);
    if (!parsed.success) zodFail(parsed.error);
    const input = parsed.data;
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    if (db.promos.some((p) => p.code === input.code)) {
      throw new ServiceError("CONFLICT", "That code is already in use on Kiosk.", {
        code: "Already in use",
      });
    }
    const promo: Promo = {
      id: newId("pr"),
      code: input.code,
      brandId: brand.id,
      kind: input.kind,
      value: input.value,
      ...(input.maxDiscountKobo ? { maxDiscountKobo: input.maxDiscountKobo } : {}),
      minSubtotalKobo: input.minSubtotalKobo,
      active: input.active,
      usageCount: 0,
      ...(input.usageLimit ? { usageLimit: input.usageLimit } : {}),
      ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
      description: input.description,
      createdAt: new Date().toISOString(),
    };
    db.promos.push(promo);
    await commit("promos");
    return clone(promo);
  },

  async updatePromo(id, patch) {
    await latency(0.5);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const promo = db.promos.find((p) => p.id === id && p.brandId === brand.id);
    if (!promo) throw new ServiceError("NOT_FOUND", "Promo not found.");
    const { promoInputSchema } = await schemas();
    const merged = promoInputSchema.safeParse({ ...promo, ...patch, code: promo.code });
    if (!merged.success) zodFail(merged.error);
    Object.assign(promo, { ...merged.data, code: promo.code });
    await commit("promos");
    return clone(promo);
  },

  async deletePromo(id) {
    await latency(0.5);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    db.promos = db.promos.filter((p) => !(p.id === id && p.brandId === brand.id));
    await commit("promos");
  },

  async listPayouts() {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const { availableKobo, pendingKobo } = balances(db, brand);
    return {
      availableKobo,
      pendingKobo,
      payouts: clone(
        db.payouts
          .filter((p) => p.brandId === brand.id)
          .sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
      ),
    };
  },

  async requestPayout() {
    await latency(1.2);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    if (!brand.payoutAccount) throw new ServiceError("CONFLICT", "Add a payout account first.");
    const { availableKobo } = balances(db, brand);
    if (availableKobo < 100_000)
      throw new ServiceError("CONFLICT", "You need at least ₦1,000 available to request a payout.");
    // BACKEND-SEAM: payouts API (Paystack transfers). DEMO: no money moves.
    const payout = {
      id: newId("po"),
      brandId: brand.id,
      amountKobo: availableKobo,
      status: "processing" as const,
      at: new Date().toISOString(),
      reference: `PAY-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    };
    db.payouts.push(payout);
    await commit("payouts");
    return clone(payout);
  },
};
