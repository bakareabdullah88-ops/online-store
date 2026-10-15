"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { kindIcon, kindLabel } from "@/config/zone-kinds";
import { cn } from "@/lib/cn";
import { useCampuses } from "@/queries/catalog";
import type { ZoneKind } from "@/services/types";
import { useSpot } from "@/stores/spot";

type Option = {
  key: string;
  campusId: string;
  zoneId: string;
  name: string;
  campus: string;
  kind: ZoneKind;
  /** A named pickup point inside the zone, shown under the zone name. */
  hint?: string;
};

/**
 * "Where should we bring it?" Students pick their hostel, faculty or another
 * checkpoint on campus; people off campus pick their area and type a street
 * address. The choice is remembered: it opens the shops that serve that spot
 * now, and becomes the default delivery place at checkout after signing up.
 */
export function SpotPicker() {
  const router = useRouter();
  const campuses = useCampuses().data;
  const setSpot = useSpot((s) => s.setSpot);
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState<Option | null>(null);
  const [street, setStreet] = useState("");

  const options = useMemo<Option[]>(() => {
    const all = (campuses ?? []).flatMap((c) =>
      c.zones.map((z) => {
        const pp = c.pickupPoints.find((p) => p.zoneId === z.id);
        return {
          key: `${c.id}:${z.id}`,
          campusId: c.id,
          zoneId: z.id,
          name: z.name,
          campus: c.shortName,
          kind: z.kind,
          ...(pp ? { hint: `Pickup: ${pp.name}` } : {}),
        };
      }),
    );
    const t = q.trim().toLowerCase();
    if (!t) return all.slice(0, 8);
    return all
      .filter((o) => `${o.name} ${o.campus} ${kindLabel[o.kind]}`.toLowerCase().includes(t))
      .slice(0, 8);
  }, [campuses, q]);

  const go = (o: Option, addressLine = "") => {
    setSpot({
      campusId: o.campusId,
      zoneId: o.zoneId,
      label: o.kind === "offcampus" && addressLine ? addressLine : o.name,
      addressLine,
    });
    router.push(`/explore?campus=${o.campusId}&zone=${o.zoneId}`);
  };

  const choose = (o: Option) => {
    setOpen(false);
    setQ(`${o.name}, ${o.campus}`);
    if (o.kind === "offcampus") {
      setPicked(o);
      return;
    }
    go(o);
  };

  const current = options[active];

  return (
    <div className="relative w-full max-w-[600px] text-left">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (picked) go(picked, street.trim());
          else if (current) choose(current);
        }}
        className="flex h-16 w-full items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-[0_6px_0_rgba(27,31,59,0.12),0_18px_40px_-20px_rgba(27,31,59,0.35)] ring-1 ring-[#1b1f3b]/10 md:h-[68px]"
      >
        <MapPin className="size-5 shrink-0 text-[#3a5bff]" aria-hidden />
        <label htmlFor="spot-q" className="sr-only">
          Your hostel, faculty or address
        </label>
        {picked ? (
          <input
            id="spot-street"
            autoFocus
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={`Street address near ${picked.name.replace(/\s*\(off campus\)/i, "")}`}
            aria-label="Street address"
            autoComplete="street-address"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#1b1f3b] outline-none placeholder:text-[#6b6f86] md:text-[17px]"
          />
        ) : (
          <input
            id="spot-q"
            role="combobox"
            aria-expanded={open && options.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && current ? `${listId}-${current.key}` : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
                setActive((a) => Math.min(a + 1, options.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder="Your hostel, faculty or address"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#1b1f3b] outline-none placeholder:text-[#6b6f86] md:text-[17px]"
          />
        )}
        {picked && (
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setStreet("");
              setQ("");
            }}
            className="hidden shrink-0 px-2 text-[14px] font-semibold text-[#3a5bff] hover:underline sm:block"
          >
            Change
          </button>
        )}
        <button
          type="submit"
          className="flex h-full shrink-0 items-center gap-1.5 rounded-full bg-[#3a5bff] px-5 text-[15px] font-bold text-white transition-colors hover:bg-[#2a45d6] md:px-6 md:text-[16px]"
        >
          <span className="max-sm:sr-only">Find shops</span>
          <ArrowRight className="size-5 sm:hidden" aria-hidden />
        </button>
      </form>

      {/* Suggestions drop down from the bar, tilted back like a card turning over. */}
      <ul
        id={listId}
        role="listbox"
        aria-label="Places on campus"
        className={cn(
          "absolute inset-x-0 top-[calc(100%+10px)] z-20 max-h-[320px] origin-top overflow-auto rounded-2xl bg-white p-2 shadow-[0_10px_0_rgba(27,31,59,0.08),0_24px_48px_-16px_rgba(27,31,59,0.35)] ring-1 ring-[#1b1f3b]/10 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && !picked && options.length > 0
            ? "[transform:perspective(800px)_rotateX(0deg)] opacity-100"
            : "pointer-events-none [transform:perspective(800px)_rotateX(-30deg)] opacity-0",
        )}
      >
        {options.map((o, i) => {
          const Icon = kindIcon[o.kind];
          return (
            <li
              key={o.key}
              id={`${listId}-${o.key}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                i === active ? "bg-[#eef1ff]" : "",
              )}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f4f5f8] text-[#3a5bff]">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-[#1b1f3b]">
                  {o.name}
                </span>
                <span className="block truncate text-[13px] text-[#5a5f78]">
                  {kindLabel[o.kind]} · {o.campus}
                  {o.hint ? ` · ${o.hint}` : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {picked && (
        <p className="mt-3 text-center text-[14px] text-[#5a5f78]">
          Delivering off campus near {picked.campus}. Type your street, then find shops.
        </p>
      )}
    </div>
  );
}
