"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Prefs = {
  recentSearches: string[];
  exploreView: "grid" | "list";
  studioProductsView: "table" | "grid";
  studioOrdersView: "board" | "list";
  /** Where to return when switching modes. */
  lastBuyingPath: string;
  lastSellingPath: string;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  set: (patch: Partial<Omit<Prefs, "set" | "addRecentSearch" | "clearRecentSearches">>) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      recentSearches: [],
      exploreView: "grid",
      studioProductsView: "table",
      studioOrdersView: "board",
      lastBuyingPath: "/explore",
      lastSellingPath: "/studio",
      addRecentSearch: (q) =>
        set((s) => {
          const t = q.trim();
          if (!t) return s;
          return {
            recentSearches: [
              t,
              ...s.recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase()),
            ].slice(0, 6),
          };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      set: (patch) => set(patch),
    }),
    {
      name: "kiosk-prefs",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** Transient UI (not persisted). */
type Ui = {
  bagOpen: boolean;
  commandOpen: boolean;
  accountOpen: boolean;
  /** Increments to trigger the bag-icon bump after a fly-to-bag. */
  bagPulse: number;
  /** Set while the open-shop success screen is showing (suppresses the "already has a shop" redirect). */
  shopJustOpened: boolean;
  setBagOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setAccountOpen: (v: boolean) => void;
  pulseBag: () => void;
};

export const useUi = create<Ui>((set) => ({
  bagOpen: false,
  commandOpen: false,
  accountOpen: false,
  bagPulse: 0,
  shopJustOpened: false,
  setBagOpen: (bagOpen) => set({ bagOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setAccountOpen: (accountOpen) => set({ accountOpen }),
  pulseBag: () => set((s) => ({ bagPulse: s.bagPulse + 1 })),
}));
