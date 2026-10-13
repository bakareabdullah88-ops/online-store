import { totalStock } from "@/domain/variants";
import type { CatalogService } from "../contracts";
import { ServiceError } from "../errors";
import type { Brand, Product, ProductWithBrand, RatingBreakdown, Review } from "../types";
import { newId } from "@/lib/ids";
import { commit, getDb } from "./db";
import { clone, currentUser } from "./context";
import { latency, quick } from "./latency";
import type { DbSnapshot } from "./seed";

export function withBrand(db: DbSnapshot, p: Product): ProductWithBrand {
  const b = db.brands.find((x) => x.id === p.brandId);
  if (!b) throw new ServiceError("NOT_FOUND", "Brand not found.");
  return {
    ...clone(p),
    brand: {
      id: b.id,
      handle: b.handle,
      name: b.name,
      logo: clone(b.logo),
      campusId: b.campusId,
      vacation: b.vacation,
      rating: b.rating,
      verified: b.verified,
    },
  };
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Lightweight relevance: name > tags/category > brand > description. */
export function scoreProduct(p: Product, brand: Brand | undefined, q: string): number {
  const terms = normalize(q).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;
  const name = normalize(p.name);
  const hay = {
    tags: normalize(`${p.tags.join(" ")} ${p.category}`),
    brand: normalize(brand ? `${brand.name} ${brand.handle}` : ""),
    desc: normalize(p.description),
  };
  let score = 0;
  for (const t of terms) {
    let s = 0;
    if (name.startsWith(t)) s = 10;
    else if (name.includes(` ${t}`) || name.includes(t)) s = 7;
    else if (hay.tags.includes(t)) s = 5;
    else if (hay.brand.includes(t)) s = 4;
    else if (hay.desc.includes(t)) s = 2;
    if (s === 0) return 0; // every term must match somewhere
    score += s;
  }
  return score;
}

export function breakdown(reviews: Review[]): RatingBreakdown {
  const histogram: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const r of reviews) histogram[Math.min(5, Math.max(1, r.rating)) - 1]! += 1;
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((n, r) => n + r.rating, 0) / count) * 10) / 10
    : 0;
  return { average, count, histogram };
}

function isVisible(db: DbSnapshot, p: Product) {
  return p.status === "published" && db.brands.some((b) => b.id === p.brandId);
}

export const mockCatalog: CatalogService = {
  async listCampuses() {
    await quick();
    const db = await getDb();
    return clone(db.campuses);
  },

  async getProducts(query) {
    await latency();
    const db = await getDb();
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 24));
    const brandsById = new Map(db.brands.map((b) => [b.id, b]));

    let list = db.products.filter((p) => (query.includeDrafts ? true : isVisible(db, p)));
    if (query.ids) {
      const set = new Set(query.ids);
      list = list.filter((p) => set.has(p.id));
    }
    if (query.category) list = list.filter((p) => p.category === query.category);
    if (query.brandId) list = list.filter((p) => p.brandId === query.brandId);
    if (query.campusId)
      list = list.filter((p) => brandsById.get(p.brandId)?.campusId === query.campusId);
    if (query.zoneId) {
      list = list.filter((p) => {
        const b = brandsById.get(p.brandId);
        if (!b) return false;
        const pickupZones = db.campuses
          .find((c) => c.id === b.campusId)
          ?.pickupPoints.filter((pp) => b.fulfilment.pickupPointIds.includes(pp.id))
          .map((pp) => pp.zoneId);
        return (
          b.fulfilment.zoneIds.includes(query.zoneId!) ||
          (pickupZones ?? []).includes(query.zoneId!)
        );
      });
    }
    if (query.minPriceKobo !== undefined)
      list = list.filter((p) => p.priceKobo >= query.minPriceKobo!);
    if (query.maxPriceKobo !== undefined)
      list = list.filter((p) => p.priceKobo <= query.maxPriceKobo!);
    if (query.minRating) list = list.filter((p) => p.rating >= query.minRating!);
    if (query.inStock) list = list.filter((p) => totalStock(p) > 0);

    const scores = new Map<string, number>();
    if (query.q?.trim()) {
      for (const p of list) scores.set(p.id, scoreProduct(p, brandsById.get(p.brandId), query.q));
      list = list.filter((p) => (scores.get(p.id) ?? 0) > 0);
    }

    const sort = query.sort ?? (query.q ? "relevance" : "popular");
    const byPopular = (a: Product, b: Product) =>
      b.salesCount + b.ratingCount * 8 - (a.salesCount + a.ratingCount * 8);
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "relevance":
          return (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0) || byPopular(a, b);
        case "newest":
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        case "price_asc":
          return a.priceKobo - b.priceKobo;
        case "price_desc":
          return b.priceKobo - a.priceKobo;
        case "rating":
          return b.rating - a.rating || b.ratingCount - a.ratingCount;
        default:
          return byPopular(a, b);
      }
    });

    const total = list.length;
    const items = list.slice((page - 1) * pageSize, page * pageSize).map((p) => withBrand(db, p));
    return { items, total, page, pageSize, hasMore: page * pageSize < total };
  },

  async getProduct(slug) {
    await latency();
    const db = await getDb();
    const p = db.products.find((x) => x.slug === slug || x.id === slug);
    if (!p) throw new ServiceError("NOT_FOUND", "We couldn't find that product.");
    if (p.status !== "published") {
      const user = await currentUser(db);
      if (!user?.brandIds.includes(p.brandId))
        throw new ServiceError("NOT_FOUND", "We couldn't find that product.");
    }
    return withBrand(db, p);
  },

  async getRelatedProducts(productId, limit = 8) {
    await latency(0.8);
    const db = await getDb();
    const p = db.products.find((x) => x.id === productId);
    if (!p) return [];
    const related = db.products
      .filter((x) => x.id !== p.id && x.brandId !== p.brandId && isVisible(db, x))
      .map((x) => ({
        x,
        s:
          (x.category === p.category ? 5 : 0) +
          x.tags.filter((t) => p.tags.includes(t)).length * 2 +
          Math.max(0, 3 - Math.abs(x.priceKobo - p.priceKobo) / Math.max(p.priceKobo, 1)) +
          x.rating / 5,
      }))
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map(({ x }) => withBrand(db, x));
    return related;
  },

  async getBrands(query = {}) {
    await latency();
    const db = await getDb();
    let list = [...db.brands];
    if (query.ids) list = list.filter((b) => query.ids!.includes(b.id));
    if (query.category) list = list.filter((b) => b.category === query.category);
    if (query.campusId) list = list.filter((b) => b.campusId === query.campusId);
    if (query.featured) {
      list = list
        .filter((b) => b.productCount > 0 && !b.vacation)
        .sort(
          (a, b) =>
            Number(b.verified) - Number(a.verified) ||
            b.followerCount * b.rating - a.followerCount * a.rating,
        );
    } else {
      list.sort((a, b) => b.followerCount - a.followerCount);
    }
    return clone(query.limit ? list.slice(0, query.limit) : list);
  },

  async getBrand(handle) {
    await latency();
    const db = await getDb();
    const b = db.brands.find((x) => x.handle === handle.toLowerCase());
    if (!b) throw new ServiceError("NOT_FOUND", "We couldn't find that brand.");
    return clone(b);
  },

  async getProductReviews(productId) {
    await latency(0.8);
    const db = await getDb();
    const reviews = db.reviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return { reviews: clone(reviews), breakdown: breakdown(reviews) };
  },

  async getBrandReviews(brandId) {
    await latency(0.8);
    const db = await getDb();
    const reviews = db.reviews
      .filter((r) => r.brandId === brandId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return { reviews: clone(reviews), breakdown: breakdown(reviews) };
  },

  async search(q, limit = 6) {
    await quick();
    const db = await getDb();
    const query = q.trim();
    if (!query) return { products: [], brands: [] };
    const brandsById = new Map(db.brands.map((b) => [b.id, b]));
    // BACKEND-SEAM: replace with a search service (Typesense/Meilisearch/Postgres FTS).
    const products = db.products
      .filter((p) => isVisible(db, p))
      .map((p) => ({ p, s: scoreProduct(p, brandsById.get(p.brandId), query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.p.salesCount - a.p.salesCount)
      .slice(0, limit)
      .map((x) => withBrand(db, x.p));
    const nq = normalize(query);
    const brands = db.brands
      .filter((b) => normalize(`${b.name} ${b.handle} ${b.tagline} ${b.category}`).includes(nq))
      .slice(0, Math.max(3, Math.floor(limit / 2)));
    return { products, brands: clone(brands) };
  },

  async recordEvent(event) {
    const db = await getDb();
    const p = db.products.find((x) => x.id === event.productId);
    if (!p) return;
    const user = await currentUser(db);
    // A shop owner looking at their own products isn't a customer.
    if (user?.brandIds.includes(p.brandId)) return;
    if (event.type === "view") p.viewCount += 1;
    db.events.push({
      id: newId("ev"),
      type: event.type,
      productId: p.id,
      brandId: p.brandId,
      userId: user?.id ?? null,
      at: new Date().toISOString(),
    });
    await commit("products", "events");
  },

  async getPriceRange() {
    const db = await getDb();
    const prices = db.products.filter((p) => isVisible(db, p)).map((p) => p.priceKobo);
    return { minKobo: Math.min(...prices, 0), maxKobo: Math.max(...prices, 0) };
  },
};
