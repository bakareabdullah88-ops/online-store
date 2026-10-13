"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { useMemo } from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/overlay";
import {
  presetRange,
  previousRange,
  rangeLabel,
  type DayRange,
  type RangePreset,
} from "@/domain/analytics";
import { cn } from "@/lib/cn";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "month", label: "This month" },
  { value: "lastMonth", label: "Last month" },
  { value: "year", label: "This year" },
];

const isPreset = (v: string | null): v is RangePreset => RANGE_PRESETS.some((p) => p.value === v);

/** The dashboard range lives in the URL (?range=30d) so it survives reloads and can be shared. */
export function useRangeParam(fallback: RangePreset = "30d") {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const raw = params.get("range");
  const preset = isPreset(raw) ? raw : fallback;
  // Recomputed once per preset; the day boundary is fine to pick up on next change.
  const range = useMemo(() => presetRange(preset), [preset]);
  const setPreset = (p: RangePreset) => {
    const next = new URLSearchParams(params.toString());
    next.set("range", p);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  return { preset, range, setPreset };
}

const chip =
  "flex h-9 items-center gap-2 rounded-xl bg-surface px-3 text-[13px] font-medium shadow-xs ring-1 ring-line";

/** "Jan 01 – Jul 31 ⌄  compared to  Dec 03 – Dec 31" (image 3). */
export function DateRangeControl({
  preset,
  range,
  onChange,
  className,
}: {
  preset: RangePreset;
  range: DayRange;
  onChange: (p: RangePreset) => void;
  className?: string;
}) {
  const prev = previousRange(range);
  const current = RANGE_PRESETS.find((p) => p.value === preset);
  return (
    <div
      className={cn("flex items-center rounded-2xl bg-surface-2 p-1 ring-1 ring-line", className)}
    >
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            className={cn(chip, "hover:ring-line-strong")}
            aria-label={`Date range: ${current?.label}`}
          >
            <CalendarDays className="size-4 text-muted" />
            <span className="tabular">{rangeLabel(range)}</span>
            <ChevronDown className="size-3.5 text-muted" />
          </button>
        </MenuTrigger>
        <MenuContent align="end">
          {RANGE_PRESETS.map((p) => (
            <MenuItem
              key={p.value}
              onSelect={() => onChange(p.value)}
              icon={p.value === preset ? <Check /> : <span className="block size-4" />}
            >
              {p.label}
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
      <span className="hidden px-3 text-[13px] text-muted sm:block">compared to</span>
      <span
        className={cn(chip, "hidden text-ink-2 shadow-none sm:flex")}
        title="The same number of days just before"
      >
        <CalendarDays className="size-4 text-muted" />
        <span className="tabular">{rangeLabel(prev)}</span>
      </span>
    </div>
  );
}
