"use client";

import { useEffect, useState } from "react";
import { Chip } from "@/components/ui/chip";
import { RangeSlider, Switch } from "@/components/ui/controls";
import { Select } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNaira } from "@/domain/money";
import { useCampuses, usePriceRange } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import type { ExploreParams } from "./params";

function FilterGroup({
  title,
  children,
  aside,
}: {
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0 last:border-0">
      <div className="mb-3 flex items-center justify-between">
        <legend className="eyebrow text-muted">{title}</legend>
        {aside}
      </div>
      {children}
    </fieldset>
  );
}

function PriceFilter({
  params,
  update,
}: {
  params: ExploreParams;
  update: (p: Partial<ExploreParams>) => void;
}) {
  const range = usePriceRange();
  const lo = Math.floor((range.data?.minKobo ?? 0) / 100 / 500) * 500;
  const hi = Math.ceil((range.data?.maxKobo ?? 3_500_000) / 100 / 500) * 500;
  const [value, setValue] = useState<[number, number]>([params.min ?? lo, params.max ?? hi]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keep slider in sync with URL changes (e.g. "Clear")
    setValue([params.min ?? lo, params.max ?? hi]);
  }, [params.min, params.max, lo, hi]);
  if (range.isPending) return <Skeleton className="h-16 w-full" />;
  return (
    <div>
      <div className="flex justify-between font-mono text-small tabular">
        <span>{formatNaira(value[0] * 100)}</span>
        <span>
          {value[1] >= hi ? `${formatNaira(value[1] * 100)}+` : formatNaira(value[1] * 100)}
        </span>
      </div>
      <RangeSlider
        label="price"
        min={lo}
        max={hi}
        step={500}
        value={value}
        onValueChange={setValue}
        onValueCommit={([a, b]) => update({ min: a <= lo ? null : a, max: b >= hi ? null : b })}
        formatValue={(n) => formatNaira(n * 100)}
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {[
          ["Under ₦2k", null, 2000],
          ["₦2k–₦5k", 2000, 5000],
          ["₦5k–₦15k", 5000, 15000],
          ["₦15k+", 15000, null],
        ].map(([label, a, b]) => {
          const selected = params.min === a && params.max === b;
          return (
            <Chip
              key={label as string}
              className="h-8 px-3"
              selected={selected}
              onClick={() =>
                update(
                  selected
                    ? { min: null, max: null }
                    : { min: a as number | null, max: b as number | null },
                )
              }
            >
              {label as string}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}

export function ExploreFilters({
  params,
  update,
}: {
  params: ExploreParams;
  update: (p: Partial<ExploreParams>) => void;
}) {
  const campuses = useCampuses();
  const { user } = useSession();
  const campus = campuses.data?.find((c) => c.id === params.campus);
  return (
    <div>
      <FilterGroup title="Price">
        <PriceFilter params={params} update={update} />
      </FilterGroup>
      <FilterGroup
        title="Campus"
        aside={
          user?.campusId && params.campus !== user.campusId ? (
            <button
              type="button"
              className="text-small font-medium underline underline-offset-4"
              onClick={() => update({ campus: user.campusId })}
            >
              Use mine
            </button>
          ) : null
        }
      >
        <div className="flex flex-col gap-2.5">
          <Select
            label="Campus"
            value={params.campus ?? "all"}
            onValueChange={(v) => update({ campus: v === "all" ? null : v })}
            options={[
              { value: "all", label: "All campuses" },
              ...(campuses.data ?? []).map((c) => ({
                value: c.id,
                label: c.shortName,
                hint: c.city,
              })),
            ]}
          />
          {campus && (
            <Select
              label="Zone"
              value={params.zone ?? "all"}
              onValueChange={(v) => update({ zone: v === "all" ? null : v })}
              options={[
                { value: "all", label: "Any hostel or faculty" },
                ...campus.zones.map((z) => ({ value: z.id, label: z.name })),
              ]}
            />
          )}
          {campus && (
            <p className="text-small text-muted">
              Zone shows brands that deliver there or have a pickup point there.
            </p>
          )}
        </div>
      </FilterGroup>
      <FilterGroup title="Rating">
        <div className="flex flex-wrap gap-2">
          {[4.5, 4, 3].map((r) => (
            <Chip
              key={r}
              className="h-9"
              selected={params.rating === r}
              onClick={() => update({ rating: params.rating === r ? null : r })}
            >
              {r}★ & up
            </Chip>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Availability">
        <Switch
          checked={params.stock}
          onCheckedChange={(v) => update({ stock: v })}
          label="In stock only"
          description="Hide sold-out items"
        />
      </FilterGroup>
    </div>
  );
}
