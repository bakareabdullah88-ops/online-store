/**
 * How each kind of campus spot looks and reads: its icon, its name, the label
 * for its group in a list, and what the "detail line" under it asks for.
 * Shared by the landing spot picker and the address picker used everywhere else.
 */
import {
  BookOpen,
  Building2,
  DoorOpen,
  Home,
  Landmark,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { Campus, ID, ZoneKind } from "@/services/types";

export const kindIcon: Record<ZoneKind, LucideIcon> = {
  hostel: Building2,
  faculty: BookOpen,
  landmark: Landmark,
  gate: DoorOpen,
  market: Store,
  offcampus: Home,
};

export const kindLabel: Record<ZoneKind, string> = {
  hostel: "Hostel",
  faculty: "Faculty",
  landmark: "Landmark",
  gate: "Gate",
  market: "Market",
  offcampus: "Off campus",
};

/** Heading for a group of spots in a list. */
export const kindGroupLabel: Record<ZoneKind, string> = {
  hostel: "Halls",
  faculty: "Faculties",
  landmark: "Landmarks",
  gate: "Gates",
  market: "Markets",
  offcampus: "Off campus",
};

/** The order groups appear in: where students live, then study, then everywhere else. */
export const kindOrder: readonly ZoneKind[] = [
  "hostel",
  "faculty",
  "landmark",
  "market",
  "gate",
  "offcampus",
];

export type SpotOption = {
  zoneId: ID;
  name: string;
  kind: ZoneKind;
  /** "Pickup: Engineering foyer", when the spot has a pickup point. */
  hint?: string;
};

export type SpotGroup = { kind: ZoneKind; label: string; options: SpotOption[] };

const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** True when every word typed starts a word of the spot's name, kind or pickup point. */
export function matchesSpot(o: SpotOption, query: string): boolean {
  const typed = words(query);
  if (!typed.length) return true;
  const hay = words(`${o.name} ${kindLabel[o.kind]} ${kindGroupLabel[o.kind]} ${o.hint ?? ""}`);
  return typed.every((t) => hay.some((w) => w.startsWith(t)));
}

/**
 * The spots on a campus a picker offers, grouped by kind and sorted by name.
 * `kinds` and `zoneIds` narrow the list (e.g. only halls, or only the spots a
 * shop delivers to); `query` filters it as the user types.
 */
export function spotGroups(
  campus: Campus | undefined,
  opts: {
    kinds?: readonly ZoneKind[] | undefined;
    zoneIds?: readonly ID[] | undefined;
    query?: string;
  } = {},
): SpotGroup[] {
  if (!campus) return [];
  const options = campus.zones
    .filter((z) => !opts.kinds || opts.kinds.includes(z.kind))
    .filter((z) => !opts.zoneIds || opts.zoneIds.includes(z.id))
    .map<SpotOption>((z) => {
      const pp = campus.pickupPoints.find((p) => p.zoneId === z.id);
      return {
        zoneId: z.id,
        name: z.name,
        kind: z.kind,
        ...(pp ? { hint: `Pickup: ${pp.name}` } : {}),
      };
    })
    .filter((o) => matchesSpot(o, opts.query ?? ""));
  return kindOrder
    .map((kind) => ({
      kind,
      label: kindGroupLabel[kind],
      options: options
        .filter((o) => o.kind === kind)
        .sort((a, b) => a.name.localeCompare(b.name, "en")),
    }))
    .filter((g) => g.options.length > 0);
}

export type DetailCopy = {
  label: string;
  placeholder: string;
  autoComplete: string;
  /** Off campus, the area alone won't find you: the street is needed. */
  required: boolean;
};

/** What the line under a spot asks for, by the kind of spot picked. */
export function detailCopy(kind: ZoneKind | undefined): DetailCopy {
  switch (kind) {
    case "hostel":
      return {
        label: "Room and block",
        placeholder: "e.g. Block C, Room 214",
        autoComplete: "address-line2",
        required: false,
      };
    case "faculty":
      return {
        label: "Department or lecture theatre",
        placeholder: "e.g. Chemistry department, LT 2",
        autoComplete: "address-line2",
        required: false,
      };
    case "landmark":
    case "gate":
    case "market":
      return {
        label: "Where exactly",
        placeholder: "e.g. by the fountain",
        autoComplete: "address-line2",
        required: false,
      };
    case "offcampus":
      return {
        label: "Street address",
        placeholder: "e.g. 12 Herbert Macaulay Way, Yaba",
        autoComplete: "street-address",
        required: true,
      };
    default:
      return {
        label: "Room, block or landmark",
        placeholder: "e.g. Block C, Room 214",
        autoComplete: "address-line2",
        required: false,
      };
  }
}
