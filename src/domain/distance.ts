/**
 * How far a shop is from a buyer, in metres and minutes on foot.
 *
 * Distances are straight lines between campus spots, stretched by a path
 * factor because nobody walks through buildings, then rounded so they read as
 * the estimates they are. Pure functions: the server sorts with them and the
 * UI labels with them, so both always agree.
 */
import { zonePoints, type LatLng } from "@/config/campus-map";
import type { Campus, Fulfilment, ID, ZoneKind } from "@/services/types";

/** Paths bend around buildings and fences. */
const PATH_FACTOR = 1.3;
/** An unhurried walk, about 4.8 km/h. */
export const WALK_METRES_PER_MIN = 80;
/** "Walking distance" means at most this many minutes on foot. */
export const WALKING_MINUTES = 12;

export function pointOf(zoneId: ID | null | undefined): LatLng | null {
  return zoneId && Object.hasOwn(zonePoints, zoneId) ? zonePoints[zoneId]! : null;
}

/** Walking metres between two spots, or null when either isn't on the map. */
export function walkMetres(from: ID | null | undefined, to: ID | null | undefined): number | null {
  if (!from || !to) return null;
  const a = pointOf(from);
  const b = pointOf(to);
  if (!a || !b) return null;
  if (from === to) return 0;
  const R = 6_371_000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  const straight = 2 * R * Math.asin(Math.sqrt(h));
  return Math.round((straight * PATH_FACTOR) / 50) * 50;
}

export function walkMinutes(metres: number): number {
  return Math.max(1, Math.round(metres / WALK_METRES_PER_MIN));
}

/** The part of the brand that says where it works from. */
export type ShopPlace = Partial<Pick<Fulfilment, "baseZoneId" | "pickupPointIds">>;

/**
 * Where a shop is: the spot the seller chose, else its first pickup point's
 * spot (that's where buyers go to collect, so it's a fair stand-in).
 */
export function shopZoneId(f: ShopPlace | undefined, campus: Campus | undefined): ID | null {
  if (!f) return null;
  if (f.baseZoneId) return f.baseZoneId;
  const pp = f.pickupPointIds?.[0];
  if (!pp || !campus) return null;
  return campus.pickupPoints.find((p) => p.id === pp)?.zoneId ?? null;
}

/** Where the buyer is and the two spots that make a shop feel like "theirs". */
export type BuyerPlace = {
  zoneId?: ID | null | undefined;
  hallZoneId?: ID | null | undefined;
  facultyZoneId?: ID | null | undefined;
};

export type Relation = "same_spot" | "same_hostel" | "same_faculty";

export type Nearness = {
  /** Null when we can't place one side on the map. */
  metres: number | null;
  walkMin: number | null;
  walking: boolean;
  relation: Relation | null;
};

export function relationTo(
  shopZone: ID | null,
  buyer: BuyerPlace,
  kindOf: (zoneId: ID) => ZoneKind | undefined,
): Relation | null {
  if (!shopZone) return null;
  if (buyer.facultyZoneId === shopZone) return "same_faculty";
  if (buyer.hallZoneId === shopZone) return "same_hostel";
  if (buyer.zoneId === shopZone) {
    const kind = kindOf(shopZone);
    if (kind === "faculty") return "same_faculty";
    if (kind === "hostel") return "same_hostel";
    // Off campus is a whole district, not one spot.
    if (kind === "offcampus") return null;
    return "same_spot";
  }
  return null;
}

export function nearness(
  f: ShopPlace | undefined,
  campus: Campus | undefined,
  buyer: BuyerPlace,
): Nearness {
  const shop = shopZoneId(f, campus);
  const metres = walkMetres(buyer.zoneId, shop);
  const walkMin = metres === null ? null : walkMinutes(metres);
  const kindOf = (id: ID) => campus?.zones.find((z) => z.id === id)?.kind;
  return {
    metres,
    walkMin,
    walking: walkMin !== null && walkMin <= WALKING_MINUTES,
    relation: relationTo(shop, buyer, kindOf),
  };
}

/**
 * Order shops for a buyer: their own faculty first, then their hall, then the
 * closest. Shops we can't place keep their order at the end.
 */
export function compareNearness(a: Nearness, b: Nearness): number {
  const rank = (n: Nearness) =>
    n.relation === "same_faculty" ? 0 : n.relation === "same_hostel" ? 1 : 2;
  return (
    rank(a) - rank(b) ||
    (a.metres ?? Number.POSITIVE_INFINITY) - (b.metres ?? Number.POSITIVE_INFINITY)
  );
}

/** Minutes from ordering until it reaches the buyer, or until it's ready to collect. */
export function arrivalMinutes(
  f: Pick<Fulfilment, "prepMinutes" | "delivery"> | undefined,
  n: Nearness,
): number | null {
  if (!f || n.walkMin === null) return null;
  // Delivery: prep, then the seller walks it over. Pickup: prep, then the buyer walks.
  return f.prepMinutes + n.walkMin;
}

export function formatMetres(m: number): string {
  if (m === 0) return "Right here";
  if (m < 1000) return `${m} m`;
  return `${(m / 1000).toFixed(m < 10_000 ? 1 : 0)} km`;
}

export function formatWalk(min: number): string {
  return `${min} min walk`;
}

/** Whether distances can be measured from this spot. */
export function isOnMap(zoneId: ID | null | undefined): boolean {
  return pointOf(zoneId) !== null;
}

/** "25 min", "1 h 10 min", "Next day", "2 days". */
export function formatEta(min: number): string {
  if (min >= 36 * 60) return `${Math.round(min / (24 * 60))} days`;
  if (min >= 18 * 60) return "Next day";
  if (min < 60) return `${Math.max(1, Math.round(min))} min`;
  const r = Math.round(min / 5) * 5;
  const h = Math.floor(r / 60);
  const m = r % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "in about 25 min", "by the next day", "in about 2 days": reads after "Ready". */
export function formatWhen(min: number): string {
  const t = formatEta(min);
  if (t === "Next day") return "by the next day";
  return `in about ${t}`;
}

export const relationLabel: Record<Relation, string> = {
  same_spot: "Same spot",
  same_hostel: "Same hostel",
  same_faculty: "Same faculty",
};
