"use client";

import { BookOpen, Building2, Clock, Footprints, MapPin } from "lucide-react";
import { formatMetres, formatWhen, relationLabel, type Relation } from "@/domain/distance";
import { cn } from "@/lib/cn";
import { useNearness } from "@/queries/nearby";
import type { Fulfilment, ID } from "@/services/types";

type ShopFulfilment = Partial<
  Pick<Fulfilment, "baseZoneId" | "pickupPointIds" | "prepMinutes" | "delivery">
>;

const relationIcon: Record<Relation, typeof Building2> = {
  same_hostel: Building2,
  same_faculty: BookOpen,
  same_spot: MapPin,
};

/** "Same hostel" / "Same faculty": a small solid tag for photos and rows. */
export function RelationBadge({
  relation,
  className,
}: {
  relation: Relation | null;
  className?: string;
}) {
  if (!relation) return null;
  const Icon = relationIcon[relation];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-[#ffd84d] px-2 py-0.5 text-[11.5px] font-bold text-[#1b1f3b]",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {relationLabel[relation]}
    </span>
  );
}

/** "Arrives in about 25 min" for delivery; "Yours in about 25 min" (ready + your walk) for pickup. */
export function etaText(min: number, delivery: boolean) {
  return `${delivery ? "Arrives" : "Yours"} ${formatWhen(min)}`;
}

/**
 * "650 m · 8 min walk · ~25 min" for a shop, measured from the buyer's spot.
 * Renders nothing when either side isn't on the campus map, so there are no
 * made-up numbers.
 */
export function DistanceLine({
  fulfilment,
  campusId,
  eta = false,
  badge = false,
  className,
}: {
  fulfilment: ShopFulfilment | undefined;
  campusId: ID | null | undefined;
  /** Also show how long an order takes to reach you. */
  eta?: boolean;
  /** Also show "Same hostel" / "Same faculty". */
  badge?: boolean;
  className?: string;
}) {
  const n = useNearness(fulfilment, campusId);
  if (n.metres === null && !(badge && n.relation)) return null;
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ink-2",
        className,
      )}
    >
      {badge && <RelationBadge relation={n.relation} />}
      {n.metres !== null && n.walkMin !== null && (
        <span className="inline-flex items-center gap-1">
          <Footprints className="size-3.5 text-accent" aria-hidden />
          <span className="tabular">
            {n.metres === 0 ? "Right by you" : `${formatMetres(n.metres)} · ${n.walkMin} min walk`}
          </span>
        </span>
      )}
      {eta && n.etaMin !== null && (
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5 text-accent" aria-hidden />
          <span className="tabular">{etaText(n.etaMin, !!fulfilment?.delivery)}</span>
        </span>
      )}
    </span>
  );
}
