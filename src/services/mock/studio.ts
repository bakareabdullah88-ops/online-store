import { allVariantKeys } from "@/domain/variants";
import { counts, hourlyViews, inRange, productStats, sellerDashboard } from "@/domain/analytics";
import { newId, slugify } from "@/lib/ids";
import { hashString } from "@/lib/random";
import { categoryById } from "@/config/categories";
import type { Customer, StudioService } from "../contracts";
import type { CreateBrandInput } from "../inputs";
import { ServiceError } from "../errors";
import { schemas, type Schemas } from "./schemas";
import type { Brand, Campus, Fulfilment, ImageRef, Product, Promo } from "../types";
import { commit, getDb } from "./db";
import { clone, requireBrand, requireUser } from "./context";
import { latency, quick } from "./latency";
import { applySellerTransition } from "./orders";
import { pushNotification } from "./notify";
import type { DbSnapshot } from "./seed";

function zodFail(error: { issues: { path: PropertyKey[]; message: string }[] }): never {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[i.path.map(String).join(".") || "form"] ??= i.message;
  throw new ServiceError("VALIDATION", Object.values(fields)[0] ?? "Check the form", fields);
}

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
  // The editor sends every photo, in the order the seller arranged them. Keep
  // ones the product already has (any kind), and new uploads, which are
  // always { kind: "blob", id }. Anything else (an outside URL, made-up art)
  // is dropped, so nobody can attach arbitrary images.
  const same = (a: ImageRef, b: unknown) => {
    const r = b as Partial<Record<string, unknown>> | null;
    if (!r || r.kind !== a.kind) return false;
    if (a.kind === "blob") return r.id === a.id;
    if (a.kind === "url") return r.src === a.src;
    return r.seed === a.seed && r.motif === a.motif && r.palette === a.palette;
  };
  const upload = (b: unknown): ImageRef | null => {
    const r = b as Partial<Record<string, unknown>> | null;
    return r?.kind === "blob" && typeof r.id === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(r.id)
      ? { kind: "blob", id: r.id }
      : null;
  };
  const kept = (input.keepImages ?? []).flatMap((k) => {
    const had = existing?.images.find((img) => same(img, k));
    const ref = had ?? upload(k);
    return ref ? [ref] : [];
  });
  const uploaded: ImageRef[] = input.imageIds.map((id) => ({ kind: "blob", id }));
  const seen = new Set<string>();
  const images = [...kept, ...uploaded]
    .filter((img) => {
      const key = JSON.stringify(img);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
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

/** Keep only pickup points and spots that exist on the shop's campus. */
function cleanFulfilment(
  f: CreateBrandInput["fulfilment"],
  campus: Campus | undefined,
): Fulfilment {
  const zones = new Set(campus?.zones.map((z) => z.id));
  const points = new Set(campus?.pickupPoints.map((p) => p.id));
  const base = f.baseZoneId && zones.has(f.baseZoneId) ? f.baseZoneId : undefined;
  const pickupPointIds = f.pickupPointIds.filter((id) => points.has(id));
  const zoneIds = f.zoneIds.filter((id) => zones.has(id));
  if (f.pickup && pickupPointIds.length === 0)
    throw new ServiceError("VALIDATION", "Choose at least one pickup point", {
      pickupPointIds: "Choose at least one pickup point",
    });
  if (f.delivery && zoneIds.length === 0)
    throw new ServiceError("VALIDATION", "Choose at least one zone you deliver to", {
      zoneIds: "Choose at least one zone you deliver to",
    });
  return {
    pickup: f.pickup,
    delivery: f.delivery,
    deliveryFeeKobo: f.deliveryFeeKobo,
    prepMinutes: f.prepMinutes,
    pickupPointIds,
    zoneIds,
    ...(base ? { baseZoneId: base } : {}),
  };
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
      fulfilment: cleanFulfilment(
        input.fulfilment,
        db.campuses.find((c) => c.id === campusId),
      ),
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
    if (input.fulfilment)
      brand.fulfilment = cleanFulfilment(
        input.fulfilment,
        db.campuses.find((c) => c.id === brand.campusId),
      );
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
        label: "Add payout details",
        done: !!brand.payoutAccount,
        href: "/studio/finance",
      },
      {
        id: "promo",
        label: "Create a promo code",
        done: db.promos.some((p) => p.brandId === brand.id),
        href: "/studio/promotions",
      },
    ];
  },

  async getDashboard(range) {
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const dashboard = sellerDashboard({
      orders: db.orders.filter((o) => o.brandId === brand.id),
      events: db.events.filter((e) => e.brandId === brand.id),
      products: db.products.filter((p) => p.brandId === brand.id),
      range,
    });
    dashboard.todo.push(
      {
        id: "messages",
        label: "Reply to messages",
        detail: "Customers waiting on you",
        href: "/studio/messages",
        count: db.threads.filter((t) => t.brandId === brand.id && t.unreadForBrand > 0).length,
      },
      {
        id: "reviews",
        label: "Answer reviews",
        detail: "A reply shows you care",
        href: "/studio/reviews",
        count: db.reviews.filter((r) => r.brandId === brand.id && !r.reply).length,
      },
    );
    return dashboard;
  },

  async getProductAnalytics(range) {
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const orders = db.orders.filter((o) => o.brandId === brand.id);
    const events = db.events.filter((e) => e.brandId === brand.id);
    const byCampus = new Map<string, { orders: number; revenue: number }>();
    for (const o of orders) {
      if (!counts(o) || !inRange(o.placedAt, range)) continue;
      const buyer = db.users.find((u) => u.id === o.buyerId);
      const cid = buyer?.campusId ?? o.fulfilment.campusId;
      const c = byCampus.get(cid) ?? { orders: 0, revenue: 0 };
      c.orders += 1;
      c.revenue += o.totalKobo;
      byCampus.set(cid, c);
    }
    return {
      stats: productStats({
        orders,
        events,
        products: db.products.filter((p) => p.brandId === brand.id),
        range,
      }),
      hourly: hourlyViews(events, range),
      campuses: [...byCampus.entries()]
        .map(([campusId, v]) => ({
          campusId,
          name: db.campuses.find((c) => c.id === campusId)?.shortName ?? "Other",
          orders: v.orders,
          revenueKobo: v.revenue,
        }))
        .sort((a, b) => b.orders - a.orders),
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
    if (status !== "published" && status !== "draft")
      throw new ServiceError("VALIDATION", "Choose published or draft.");
    if (!Array.isArray(ids)) throw new ServiceError("VALIDATION", "Choose some products.");
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

  async updateOrderStatus(id, status, note) {
    if (note !== undefined && typeof note !== "string")
      throw new ServiceError("VALIDATION", "Write the reason as text.");
    const reason = note?.trim() || undefined;
    if (reason && reason.length > 200)
      throw new ServiceError("VALIDATION", "Keep the reason under 200 characters.");
    if (reason && status !== "declined" && status !== "cancelled")
      throw new ServiceError("VALIDATION", "A reason only goes with declining or cancelling.");
    await latency(0.6);
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const order = db.orders.find((o) => o.id === id && o.brandId === brand.id);
    if (!order) throw new ServiceError("NOT_FOUND", "Order not found.");
    const next = applySellerTransition(db, id, status, reason);
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
      throw new ServiceError("CONFLICT", "That code is already in use on Kamplug.", {
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

  async getFinance() {
    await latency();
    const db = await getDb();
    const { brand } = await requireBrand(db);
    const orders = db.orders.filter((o) => o.brandId === brand.id);
    const done = orders.filter((o) => o.status === "delivered");
    const inProgress = ["confirmed", "preparing", "ready", "out_for_delivery"];
    const now = new Date();
    const byMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return {
        month: new Intl.DateTimeFormat("en-NG", { month: "short" }).format(d),
        amountKobo: done
          .filter((o) => o.placedAt.slice(0, 7) === key)
          .reduce((n, o) => n + o.totalKobo, 0),
      };
    });
    return {
      earnedKobo: done.reduce((n, o) => n + o.totalKobo, 0),
      pendingKobo: orders
        .filter((o) => inProgress.includes(o.status))
        .reduce((n, o) => n + o.totalKobo, 0),
      completedOrders: done.length,
      byMonth,
      payoutAccount: clone(brand.payoutAccount),
    };
  },
};
