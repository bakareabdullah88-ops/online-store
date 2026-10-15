"use client";

import { create } from "zustand";

export type HomeSort = "nearest" | "popular" | "rating" | "newest";

/** How the home feed is sorted and narrowed. Kept for the visit, not saved. */
type HomeFilters = {
  /** Null until the buyer picks: then "nearest" if we know where they are, else "popular". */
  sort: HomeSort | null;
  walking: boolean;
  set: (patch: Partial<Pick<HomeFilters, "sort" | "walking">>) => void;
  reset: () => void;
};

export const useHomeFilters = create<HomeFilters>()((set) => ({
  sort: null,
  walking: false,
  set: (patch) => set(patch),
  reset: () => set({ sort: null, walking: false }),
}));
