"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { AddressFields } from "@/components/address/address-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/overlay";
import { Dialog, ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { kindIcon, kindLabel } from "@/config/zone-kinds";
import { spring } from "@/design/motion";
import { useCampuses } from "@/queries/catalog";
import { usePlaces, useRemovePlace, useSavePlace } from "@/queries/inbox";
import { useSession } from "@/queries/session";
import { placeSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type { CampusZone, SavedPlace } from "@/services/types";
import { toast } from "@/stores/toast";
import { NavPageHeader } from "@/components/app/nav-header";

type Draft = {
  id?: string;
  label: string;
  campusId: string;
  zoneId: string;
  pickupPointId: string;
  addressLine: string;
  isDefault: boolean;
};

/** A short name for a place at this spot, within the 30 characters a name may have. */
function spotName(z: CampusZone) {
  return z.name.length <= 30 ? z.name : kindLabel[z.kind];
}

function PlaceForm({ draft, onDone }: { draft: Draft; onDone: () => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const campuses = useCampuses();
  const save = useSavePlace();
  const campus = campuses.data?.find((c) => c.id === d.campusId);
  const kind = campus?.zones.find((z) => z.id === d.zoneId)?.kind;
  const submit = () => {
    const parsed = placeSchema.safeParse({ ...d, pickupPointId: d.pickupPointId || undefined });
    const e: Record<string, string> = {};
    if (!parsed.success) for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
    // Off campus, the area alone won't find you.
    if (kind === "offcampus" && d.addressLine.trim().length < 3)
      e.addressLine = "Add your street address";
    if (!parsed.success || Object.keys(e).length) {
      setErrors(e);
      return;
    }
    save.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(d.id ? "Place updated" : "Place saved");
        onDone();
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };
  const pickZone = (zoneId: string) =>
    setD((v) => {
      const from = campus?.zones.find((z) => z.id === v.zoneId);
      const to = campus?.zones.find((z) => z.id === zoneId);
      const pointAt = (id: string | undefined) =>
        campus?.pickupPoints.find((p) => p.zoneId === id)?.id ?? "";
      // Name it after the spot, and prefer the spot's pickup point, unless they chose otherwise.
      const autoLabel = !v.label.trim() || (!!from && v.label === spotName(from));
      const autoPoint = !v.pickupPointId || v.pickupPointId === pointAt(from?.id);
      return {
        ...v,
        zoneId,
        label: autoLabel && to ? spotName(to) : v.label,
        pickupPointId: autoPoint ? pointAt(zoneId) : v.pickupPointId,
      };
    });
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {(campuses.data?.length ?? 0) > 1 && (
        <Field label="Campus">
          <Select
            value={d.campusId}
            onValueChange={(v) => setD({ ...d, campusId: v, zoneId: "", pickupPointId: "" })}
            options={(campuses.data ?? []).map((c) => ({
              value: c.id,
              label: c.shortName,
              hint: c.city,
            }))}
            label="Campus"
          />
        </Field>
      )}
      <AddressFields
        campus={campus}
        zoneId={d.zoneId}
        detail={d.addressLine}
        onZoneChange={pickZone}
        onDetailChange={(addressLine) => setD((v) => ({ ...v, addressLine }))}
        label="Hall, faculty or area"
        errors={{ zoneId: errors.zoneId, addressLine: errors.addressLine }}
        detailRequired
      />
      <Field label="Name" error={errors.label} hint="e.g. Hostel, Department, Cousin's place">
        <Input
          value={d.label}
          onChange={(e) => setD({ ...d, label: e.target.value })}
          maxLength={30}
          className="h-11 text-[16px] sm:text-body"
        />
      </Field>
      {(campus?.pickupPoints.length ?? 0) > 0 && (
        <Field label="Preferred pickup point" optional>
          <Select
            value={d.pickupPointId || "none"}
            onValueChange={(v) => setD({ ...d, pickupPointId: v === "none" ? "" : v })}
            options={[
              { value: "none", label: "No preference" },
              ...(campus?.pickupPoints ?? []).map((p) => ({ value: p.id, label: p.name })),
            ]}
            label="Pickup point"
          />
        </Field>
      )}
      <Checkbox
        checked={d.isDefault}
        onCheckedChange={(v) => setD({ ...d, isDefault: v })}
        label="Use as my default"
        description="Checkout starts with this place, and distances are measured from it."
      />
      <Button type="submit" size="lg" loading={save.isPending}>
        {d.id ? "Save changes" : "Save place"}
      </Button>
    </form>
  );
}

export function PlacesView() {
  const { data, isPending } = usePlaces();
  const campuses = useCampuses();
  const { user } = useSession();
  const remove = useRemovePlace();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<SavedPlace | null>(null);

  const blank: Draft = {
    label: "",
    campusId:
      campuses.data?.find((c) => c.id === user?.campusId)?.id ?? campuses.data?.[0]?.id ?? "",
    zoneId: "",
    pickupPointId: "",
    addressLine: "",
    isDefault: !data?.length,
  };

  return (
    <div>
      <NavPageHeader
        eyebrow="Addresses"
        title="Addresses & pickup points"
        description="Save the places you order to. Checkout fills them in for you."
        actions={
          <Button leadingIcon={<Plus className="size-4.5" />} onClick={() => setEditing(blank)}>
            Add a place
          </Button>
        }
      />
      {isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36" rounded="lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          illustration="places"
          title="No saved places"
          body="Add your hostel room or a favourite pickup point."
          action={<Button onClick={() => setEditing(blank)}>Add a place</Button>}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {data.map((p) => {
              const campus = campuses.data?.find((c) => c.id === p.campusId);
              const zone = campus?.zones.find((z) => z.id === p.zoneId);
              const point = campus?.pickupPoints.find((x) => x.id === p.pickupPointId);
              const KindIcon = zone ? kindIcon[zone.kind] : MapPin;
              return (
                <motion.li
                  key={p.id}
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={spring.smooth}
                  className="card flex flex-col py-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                      <KindIcon className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-body font-semibold">
                        <span className="min-w-0 break-words">{p.label}</span>
                        {p.isDefault && (
                          <span className="inline-flex items-center gap-1 text-small font-medium text-accent-ink">
                            <Star className="size-3.5 fill-current" aria-hidden />
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-small text-muted">
                        {[zone?.name, (campuses.data?.length ?? 0) > 1 ? campus?.shortName : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {p.addressLine && p.addressLine !== zone?.name && (
                        <p className="mt-1 text-small break-words text-ink-2">{p.addressLine}</p>
                      )}
                      {point && <p className="mt-1 text-small text-muted">Pickup: {point.name}</p>}
                    </div>
                  </div>
                  <div className="-mx-3 mt-3 flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      leadingIcon={<Pencil className="size-4" />}
                      onClick={() =>
                        setEditing(
                          campus
                            ? { ...p, pickupPointId: p.pickupPointId ?? "" }
                            : // A campus we no longer offer: pick the spot again here.
                              { ...p, campusId: blank.campusId, zoneId: "", pickupPointId: "" },
                        )
                      }
                    >
                      Edit
                    </Button>
                    {!p.isDefault && <SetDefaultButton place={p} />}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-danger"
                      leadingIcon={<Trash2 className="size-4" />}
                      onClick={() => setConfirm(p)}
                    >
                      Delete
                    </Button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
      <ResponsiveSheet
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? "Edit place" : "Add a place"}
      >
        {editing && (
          <PlaceForm key={editing.id ?? "new"} draft={editing} onDone={() => setEditing(null)} />
        )}
      </ResponsiveSheet>
      <Dialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={`Delete “${confirm?.label}”?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() =>
                confirm &&
                remove.mutate(confirm.id, {
                  onSuccess: () => {
                    setConfirm(null);
                    toast("Place deleted");
                  },
                })
              }
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">You can add it again any time.</p>
      </Dialog>
    </div>
  );
}

function SetDefaultButton({ place }: { place: SavedPlace }) {
  const save = useSavePlace();
  return (
    <Button
      size="sm"
      variant="ghost"
      loading={save.isPending}
      leadingIcon={<Star className="size-4" />}
      onClick={() =>
        save.mutate(
          { ...place, isDefault: true },
          { onSuccess: () => toast.success(`${place.label} is now your default`) },
        )
      }
    >
      Make default
    </Button>
  );
}
