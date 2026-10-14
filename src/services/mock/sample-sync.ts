import type { DbSnapshot } from "./seed";
import { generateSample, isSampleId as s } from "./seed/sample";

/** How often the sample data is rebuilt, so dates stay current and the preview resets. */
export const SAMPLE_TTL_MS = 3 * 86_400_000;

/**
 * Takes the sample data out of a database.
 * - "refresh": also drops what the preview account did (its orders, shop
 *   edits, messages), but keeps real accounts' links to sample shops, since
 *   those come back with the same ids.
 * - "remove": takes out everything that touches a sample shop or account.
 */
export function stripSample(db: DbSnapshot, mode: "refresh" | "remove") {
  const all = mode === "remove";
  db.users = db.users.filter((u) => !s(u.id));
  db.brands = db.brands.filter((b) => !s(b.id));
  db.products = db.products.filter((p) => !s(p.id) && !s(p.brandId));
  db.reviews = db.reviews.filter((r) => !s(r.id) && !s(r.userId) && !(all && s(r.brandId)));
  db.orders = db.orders.filter((o) => !s(o.id) && !s(o.buyerId) && !(all && s(o.brandId)));
  db.threads = db.threads.filter((t) => !s(t.id) && !s(t.buyerId) && !(all && s(t.brandId)));
  db.promos = db.promos.filter((p) => !s(p.id) && !(p.brandId && s(p.brandId)));
  db.notifications = db.notifications.filter((n) => !s(n.id) && !s(n.userId));
  db.places = db.places.filter((p) => !s(p.id) && !s(p.userId));
  db.events = db.events.filter((e) => !s(e.brandId));
  if (all) {
    for (const u of db.users) {
      u.followingBrandIds = u.followingBrandIds.filter((id) => !s(id));
      u.wishlistProductIds = u.wishlistProductIds.filter((id) => !s(id));
    }
  }
}

export function hasSample(db: DbSnapshot) {
  return db.brands.some((b) => s(b.id)) || db.users.some((u) => s(u.id));
}

/** Replaces the sample data with a fresh set dated around `now`. */
export function refreshSample(db: DbSnapshot, now: number = Date.now()) {
  stripSample(db, "refresh");
  const sample = generateSample(db.campuses, now);
  db.users.push(...sample.users);
  db.brands.push(...sample.brands);
  db.products.push(...sample.products);
  db.reviews.push(...sample.reviews);
  db.orders.push(...sample.orders);
  db.promos.push(...sample.promos);
  db.notifications.push(...sample.notifications);
  db.threads.push(...sample.threads);
  db.places.push(...sample.places);
  db.events.push(...sample.events);
  // Real people's reviews of sample products still count.
  for (const p of sample.products) {
    const rs = db.reviews.filter((r) => r.productId === p.id);
    p.ratingCount = rs.length;
    p.rating = rs.length
      ? Math.round((rs.reduce((n, r) => n + r.rating, 0) / rs.length) * 10) / 10
      : 0;
  }
}
