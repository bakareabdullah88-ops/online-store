import type { DbSnapshot } from "./seed";

/**
 * Kamplug briefly shipped sample shops, orders and a shared preview account.
 * Every sample record's id contains "_demo_". They're gone from the app; this
 * takes them out of any database (or browser) that still has them, keeping
 * everything real accounts created.
 */
export const isSampleId = (id: string) => id.includes("_demo_");

export function hasSample(db: DbSnapshot) {
  return db.brands.some((b) => isSampleId(b.id)) || db.users.some((u) => isSampleId(u.id));
}

export function stripSample(db: DbSnapshot) {
  const s = isSampleId;
  db.users = db.users.filter((u) => !s(u.id));
  db.brands = db.brands.filter((b) => !s(b.id));
  db.products = db.products.filter((p) => !s(p.id) && !s(p.brandId));
  db.reviews = db.reviews.filter((r) => !s(r.id) && !s(r.userId) && !s(r.brandId));
  db.orders = db.orders.filter((o) => !s(o.id) && !s(o.buyerId) && !s(o.brandId));
  db.threads = db.threads.filter((t) => !s(t.id) && !s(t.buyerId) && !s(t.brandId));
  db.promos = db.promos.filter((p) => !s(p.id) && !(p.brandId && s(p.brandId)));
  db.notifications = db.notifications.filter((n) => !s(n.id) && !s(n.userId));
  db.places = db.places.filter((p) => !s(p.id) && !s(p.userId));
  db.events = db.events.filter((e) => !s(e.brandId) && !s(e.productId));
  for (const u of db.users) {
    u.followingBrandIds = u.followingBrandIds.filter((id) => !s(id));
    u.wishlistProductIds = u.wishlistProductIds.filter((id) => !s(id));
  }
}
