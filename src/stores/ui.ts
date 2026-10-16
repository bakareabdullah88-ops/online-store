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
  /** Conversations you starred, on this device. */
  starredThreads: string[];
  toggleStar: (threadId: string) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  set: (
    patch: Partial<Omit<Prefs, "set" | "addRecentSearch" | "clearRecentSearches" | "toggleStar">>,
  ) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      recentSearches: [],
      exploreView: "grid",
      studioProductsView: "table",
      studioOrdersView: "board",
      lastBuyingPath: "/home",
      lastSellingPath: "/studio",
      starredThreads: [],
      toggleStar: (id) =>
        set((s) => ({
          starredThreads: s.starredThreads.includes(id)
            ? s.starredThreads.filter((x) => x !== id)
            : [id, ...s.starredThreads],
        })),
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
  /** The phone menu. Shared, so a side kept alive in the background can't come back with it open. */
  menuOpen: boolean;
  /** True between signing out (or deleting the account) and leaving the app, so the auth gate doesn't bounce to /login. */
  leaving: boolean;
  /** Increments to trigger the bag-icon bump after a fly-to-bag. */
  bagPulse: number;
  /** Set while the open-shop success screen is showing (suppresses the "already has a shop" redirect). */
  shopJustOpened: boolean;
  setBagOpen: (v: boolean) => void;
  setCommandOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  setLeaving: (v: boolean) => void;
  pulseBag: () => void;
};

export const useUi = create<Ui>((set) => ({
  bagOpen: false,
  commandOpen: false,
  menuOpen: false,
  leaving: false,
  bagPulse: 0,
  shopJustOpened: false,
  setBagOpen: (bagOpen) => set({ bagOpen }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setLeaving: (leaving) => set({ leaving }),
  pulseBag: () => set((s) => ({ bagPulse: s.bagPulse + 1 })),
}));
