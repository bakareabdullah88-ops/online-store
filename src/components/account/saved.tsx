"use client";

import { AnimatePresence, motion } from "motion/react";
import { ButtonLink, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BrandCard, BrandCardSkeleton } from "@/components/market/brand-card";
import { ProductCard, ProductCardSkeleton } from "@/components/market/product-card";
import { spring } from "@/design/motion";
import { useSession } from "@/queries/session";
import { useFollowing, useToggleFollow, useWishlist } from "@/queries/social";
import { DashboardHeader } from "./dashboard-shell";

export function WishlistView() {
  const { data, isPending } = useWishlist();
  const { user } = useSession();
  // Hide items the user just un-hearted (optimistic), before the refetch lands.
  const items = (data ?? []).filter((p) => user?.wishlistProductIds.includes(p.id));
  return (
    <div>
      <DashboardHeader eyebrow="Saved" title="Saved for later" description="Everything you've hearted. Prices and stock are live." />
      {isPending ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState illustration="wishlist" title="Nothing saved yet" body="Tap the heart on anything you like and it'll wait for you here." action={<ButtonLink href="/explore">Find something</ButtonLink>} />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {items.map((p) => (
              <motion.li key={p.id} layout exit={{ opacity: 0, scale: 0.9 }} transition={spring.smooth}>
                <ProductCard product={p} morph />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

export function FollowingView() {
  const { data, isPending } = useFollowing();
  const { user } = useSession();
  const toggle = useToggleFollow();
  const brands = (data ?? []).filter((b) => user?.followingBrandIds.includes(b.id));
  return (
    <div>
      <DashboardHeader eyebrow="Following" title="Brands you follow" description="New drops from these brands show up in your notifications." />
      {isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <BrandCardSkeleton key={i} />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <EmptyState illustration="following" title="Not following anyone yet" body="Follow brands to hear about new drops first." action={<ButtonLink href="/explore">Discover brands</ButtonLink>} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {brands.map((b) => (
              <motion.li key={b.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={spring.smooth} className="flex flex-col gap-2">
                <BrandCard brand={b} />
                <Button variant="ghost" size="sm" className="self-start" onClick={() => toggle.mutate(b)}>
                  Unfollow {b.name}
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
