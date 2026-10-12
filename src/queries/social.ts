"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { services } from "@/services";
import type { Brand, User } from "@/services/types";
import { toast } from "@/stores/toast";
import { errorMessage } from "@/services/errors";
import { qk } from "./keys";
import { useSession } from "./session";

export function useWishlist() {
  const { isSignedIn } = useSession();
  return useQuery({ queryKey: qk.wishlist, queryFn: () => services.social.getWishlist(), enabled: isSignedIn });
}

export function useFollowing() {
  const { isSignedIn } = useSession();
  return useQuery({ queryKey: qk.following, queryFn: () => services.social.getFollowing(), enabled: isSignedIn });
}

/** Optimistic: the heart fills instantly; rolls back with a toast on failure. */
export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => services.social.toggleWishlist(productId),
    onMutate: async (productId) => {
      await qc.cancelQueries({ queryKey: qk.session });
      const prev = qc.getQueryData<User | null>(qk.session);
      if (prev) {
        const saved = prev.wishlistProductIds.includes(productId);
        qc.setQueryData<User>(qk.session, {
          ...prev,
          wishlistProductIds: saved
            ? prev.wishlistProductIds.filter((id) => id !== productId)
            : [productId, ...prev.wishlistProductIds],
        });
      }
      return { prev };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.session, ctx.prev);
      toast.error("Couldn't update your wishlist", { description: errorMessage(e) });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.wishlist }),
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (brand: Pick<Brand, "id" | "handle">) => services.social.toggleFollow(brand.id),
    onMutate: async (brand) => {
      const prev = qc.getQueryData<User | null>(qk.session);
      const prevBrand = qc.getQueryData<Brand>(qk.brand(brand.handle));
      if (prev) {
        const following = prev.followingBrandIds.includes(brand.id);
        qc.setQueryData<User>(qk.session, {
          ...prev,
          followingBrandIds: following
            ? prev.followingBrandIds.filter((id) => id !== brand.id)
            : [...prev.followingBrandIds, brand.id],
        });
        if (prevBrand) {
          qc.setQueryData<Brand>(qk.brand(brand.handle), {
            ...prevBrand,
            followerCount: prevBrand.followerCount + (following ? -1 : 1),
          });
        }
      }
      return { prev, prevBrand };
    },
    onError: (e, brand, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.session, ctx.prev);
      if (ctx?.prevBrand) qc.setQueryData(qk.brand(brand.handle), ctx.prevBrand);
      toast.error("Couldn't update follow", { description: errorMessage(e) });
    },
    onSuccess: (res, brand) => {
      const b = qc.getQueryData<Brand>(qk.brand(brand.handle));
      if (b) qc.setQueryData<Brand>(qk.brand(brand.handle), { ...b, followerCount: res.followerCount });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.following }),
  });
}
