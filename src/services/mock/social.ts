import type { SocialService } from "../contracts";
import { ServiceError } from "../errors";
import { commit, getDb } from "./db";
import { clone, requireUser } from "./context";
import { latency, quick } from "./latency";
import { withBrand } from "./catalog";

export const mockSocial: SocialService = {
  async toggleFollow(brandId) {
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    const brand = db.brands.find((b) => b.id === brandId);
    if (!brand) throw new ServiceError("NOT_FOUND", "Brand not found.");
    if (user.brandIds.includes(brandId))
      throw new ServiceError("FORBIDDEN", "You can't follow your own shop.");
    const following = user.followingBrandIds.includes(brandId);
    user.followingBrandIds = following
      ? user.followingBrandIds.filter((id) => id !== brandId)
      : [...user.followingBrandIds, brandId];
    brand.followerCount = Math.max(0, brand.followerCount + (following ? -1 : 1));
    await commit("users", "brands");
    return { following: !following, followerCount: brand.followerCount };
  },

  async toggleWishlist(productId) {
    await quick();
    const db = await getDb();
    const user = await requireUser(db);
    if (!db.products.some((p) => p.id === productId))
      throw new ServiceError("NOT_FOUND", "Product not found.");
    const saved = user.wishlistProductIds.includes(productId);
    user.wishlistProductIds = saved
      ? user.wishlistProductIds.filter((id) => id !== productId)
      : [productId, ...user.wishlistProductIds];
    await commit("users");
    return { saved: !saved };
  },

  async getWishlist() {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    return user.wishlistProductIds
      .map((id) => db.products.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((p) => withBrand(db, p));
  },

  async getFollowing() {
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    return clone(db.brands.filter((b) => user.followingBrandIds.includes(b.id)));
  },
};
