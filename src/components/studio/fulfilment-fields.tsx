"use client";

import { AnimatePresence, motion } from "motion/react";
import { Chip } from "@/components/ui/chip";
import { Checkbox, Switch } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/overlay";
import { spring } from "@/design/motion";
import type { Campus, Fulfilment } from "@/services/types";

export type FulfilmentDraft = Omit<Fulfilment, "deliveryFeeKobo"> & { deliveryFee: string };

export const prepOptions = [
  { value: "30", label: "About 30 minutes" },
  { value: "60", label: "About an hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "Half a day" },
  { value: "1440", label: "Next day" },
] as const;

/** Pickup points, delivery zones, fee and prep time. Used by onboarding and settings. */
export function FulfilmentFields({
  value,
  onChange,
  campus,
  errors = {},
}: {
  value: FulfilmentDraft;
  onChange: (v: FulfilmentDraft) => void;
  campus: Campus | undefined;
  errors?: Record<string, string>;
}) {
  const set = (patch: Partial<FulfilmentDraft>) => onChange({ ...value, ...patch });
  if (!campus) return <p className="text-small text-muted">Loading your campus…</p>;
  return (
    <div className="flex flex-col divide-y divide-line-thin">
      <div className="py-4 first:pt-0 last:pb-0">
        <Switch
          checked={value.pickup}
          onCheckedChange={(pickup) =>
            set({
              pickup,
              pickupPointIds:
                pickup && value.pickupPointIds.length === 0
                  ? campus.pickupPoints.slice(0, 1).map((p) => p.id)
                  : value.pickupPointIds,
            })
          }
          label="Free pickup"
          description={`Buyers collect from a pickup point on ${campus.shortName}.`}
        />
        <AnimatePresence initial={false}>
          {value.pickup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.smooth}
              className="overflow-hidden"
            >
              <fieldset className="mt-4 flex flex-col gap-3 border-t border-line-thin pt-4">
                <legend className="sr-only">Pickup points</legend>
                {campus.pickupPoints.map((p) => (
                  <Checkbox
                    key={p.id}
                    checked={value.pickupPointIds.includes(p.id)}
                    onCheckedChange={(on) =>
                      set({
                        pickupPointIds: on
                          ? [...value.pickupPointIds, p.id]
                          : value.pickupPointIds.filter((x) => x !== p.id),
                      })
                    }
                    label={p.name}
                    description={p.hint}
                  />
                ))}
                {errors.pickupPointIds && (
                  <p className="text-small font-medium text-danger">{errors.pickupPointIds}</p>
                )}
              </fieldset>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="py-4 first:pt-0 last:pb-0">
        <Switch
          checked={value.delivery}
          onCheckedChange={(delivery) =>
            set({
              delivery,
              zoneIds:
                delivery && value.zoneIds.length === 0
                  ? campus.zones.map((z) => z.id)
                  : value.zoneIds,
            })
          }
          label="Delivery"
          description="You (or a friend) drop orders at hostels and faculties."
        />
        <AnimatePresence initial={false}>
          {value.delivery && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring.smooth}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col gap-4 border-t border-line-thin pt-4">
                <div>
                  <p className="mb-2 text-small font-medium">Zones you deliver to</p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Delivery zones">
                    {campus.zones.map((z) => (
                      <Chip
                        key={z.id}
                        selected={value.zoneIds.includes(z.id)}
                        onClick={() =>
                          set({
                            zoneIds: value.zoneIds.includes(z.id)
                              ? value.zoneIds.filter((x) => x !== z.id)
                              : [...value.zoneIds, z.id],
                          })
                        }
                      >
                        {z.name}
                      </Chip>
                    ))}
                  </div>
                  {errors.zoneIds && (
                    <p className="mt-2 text-small font-medium text-danger">{errors.zoneIds}</p>
                  )}
                </div>
                <Field
                  label="Delivery fee (₦)"
                  error={errors.deliveryFeeKobo}
                  hint="Most campus brands charge ₦300–₦600"
                >
                  <Input
                    value={value.deliveryFee}
                    onChange={(e) => set({ deliveryFee: e.target.value.replace(/[^\d]/g, "") })}
                    inputMode="numeric"
                    className="max-w-40 font-mono"
                  />
                </Field>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {errors.pickup && <p className="text-small font-medium text-danger">{errors.pickup}</p>}
      <Field label="Usual prep time">
        <Select
          label="Usual prep time"
          value={String(value.prepMinutes)}
          onValueChange={(v) => set({ prepMinutes: Number(v) })}
          options={
            prepOptions.some((o) => o.value === String(value.prepMinutes))
              ? prepOptions
              : [
                  ...prepOptions,
                  { value: String(value.prepMinutes), label: `${value.prepMinutes} minutes` },
                ]
          }
        />
      </Field>
    </div>
  );
}

export function toFulfilment(d: FulfilmentDraft): Fulfilment {
  const { deliveryFee, ...rest } = d;
  return {
    ...rest,
    deliveryFeeKobo: d.delivery ? (Number(deliveryFee) || 0) * 100 : 0,
    pickupPointIds: d.pickup ? d.pickupPointIds : [],
    zoneIds: d.delivery ? d.zoneIds : [],
  };
}

export function fromFulfilment(f: Fulfilment): FulfilmentDraft {
  const { deliveryFeeKobo, ...rest } = f;
  return { ...rest, deliveryFee: String(deliveryFeeKobo / 100) };
}
