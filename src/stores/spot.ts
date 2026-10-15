"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ID } from "@/services/types";

/**
 * Where someone wants things delivered (or wants to collect them), picked from
 * the landing page before they have an account: a hostel, faculty or other
 * campus checkpoint, or a street address off campus. Once they're signed in it
 * becomes their default saved place, so checkout starts with it.
 */
export type Spot = {
  campusId: ID;
  zoneId: ID;
  /** "Moremi Hall", or the street address for off-campus spots. */
  label: string;
  /** Room, block, landmark or street. Optional on campus. */
  addressLine: string;
  /** The account it was saved to, so it's only saved once. */
  savedFor?: ID;
};

type SpotState = {
  spot: Spot | null;
  setSpot: (spot: Spot) => void;
  markSaved: (userId: ID) => void;
};

export const useSpot = create<SpotState>()(
  persist(
    (set) => ({
      spot: null,
      setSpot: (spot) => set({ spot }),
      markSaved: (userId) => set((s) => (s.spot ? { spot: { ...s.spot, savedFor: userId } } : s)),
    }),
    {
      name: "kamplug-spot",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
