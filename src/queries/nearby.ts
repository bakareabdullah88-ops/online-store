"use client";

import { useMemo } from "react";
import {
  arrivalMinutes,
  isOnMap,
  nearness,
  type BuyerPlace,
  type Nearness,
  type ShopPlace,
} from "@/domain/distance";
import type { Fulfilment, ID } from "@/services/types";
import { useSpot } from "@/stores/spot";
import { useCampuses } from "./catalog";
import { usePlaces } from "./inbox";
import { useSession } from "./session";

export type BuyerSpot = BuyerPlace & {
  campusId: ID | null;
  /** "Jaja Hall", for "650 m from Jaja Hall". */
  label: string | null;
  /** True when distances can be measured from where they are. */
  onMap: boolean;
};

/**
 * Where the buyer is right now, for distances: their default saved place, else
 * the spot they picked on the landing page, else their hall. Their hall and
 * faculty ride along for the "same hostel / same faculty" badges.
 */
export function useBuyerSpot(): BuyerSpot {
  const { user } = useSession();
  const places = usePlaces().data;
  const spot = useSpot((s) => s.spot);
  const campuses = useCampuses().data;
  return useMemo(() => {
    const home = places?.find((p) => p.isDefault) ?? places?.[0];
    const fromSpot = spot && (!user?.campusId || spot.campusId === user.campusId) ? spot : null;
    const zoneId = home?.zoneId ?? fromSpot?.zoneId ?? user?.hallZoneId ?? null;
    const campusId = home?.campusId ?? fromSpot?.campusId ?? user?.campusId ?? null;
    const campus = campuses?.find((c) => c.id === campusId);
    const label = zoneId ? (campus?.zones.find((z) => z.id === zoneId)?.name ?? null) : null;
    return {
      zoneId,
      campusId,
      label,
      onMap: isOnMap(zoneId),
      hallZoneId: user?.hallZoneId ?? null,
      facultyZoneId: user?.facultyZoneId ?? null,
    };
  }, [places, spot, user, campuses]);
}

/** The buyer's place as a product query filter, or nothing when we don't know it. */
export function useNearQuery() {
  const b = useBuyerSpot();
  return useMemo(
    () =>
      b.zoneId || b.hallZoneId || b.facultyZoneId
        ? { zoneId: b.zoneId, hallZoneId: b.hallZoneId, facultyZoneId: b.facultyZoneId }
        : undefined,
    [b.zoneId, b.hallZoneId, b.facultyZoneId],
  );
}

export type ShopNearness = Nearness & {
  /** Minutes from ordering until it reaches you (or is ready to collect). */
  etaMin: number | null;
};

/** How far a shop is from the buyer, and how soon an order gets to them. */
export function useNearness(
  f: (ShopPlace & Partial<Pick<Fulfilment, "prepMinutes" | "delivery">>) | undefined,
  campusId: ID | null | undefined,
): ShopNearness {
  const buyer = useBuyerSpot();
  const campus = useCampuses().data?.find((c) => c.id === campusId);
  return useMemo(() => {
    const n = nearness(f, campus, buyer);
    const etaMin =
      f?.prepMinutes !== undefined
        ? arrivalMinutes({ prepMinutes: f.prepMinutes, delivery: !!f.delivery }, n)
        : null;
    return { ...n, etaMin };
  }, [f, campus, buyer]);
}
