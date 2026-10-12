"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/misc";
import { Select } from "@/components/ui/overlay";
import { Dialog, ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { useCampuses } from "@/queries/catalog";
import { usePlaces, useRemovePlace, useSavePlace } from "@/queries/inbox";
import { useSession } from "@/queries/session";
import { placeSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type { SavedPlace } from "@/services/types";
import { toast } from "@/stores/toast";
import { DashboardHeader } from "./dashboard-shell";

type Draft = { id?: string; label: string; campusId: string; zoneId: string; pickupPointId: string; addressLine: string; isDefault: boolean };

function PlaceForm({ draft, onDone }: { draft: Draft; onDone: () => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const campuses = useCampuses();
  const save = useSavePlace();
  const campus = campuses.data?.find((c) => c.id === d.campusId);
  const submit = () => {
    const parsed = placeSchema.safeParse({ ...d, pickupPointId: d.pickupPointId || undefined });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      return;
    }
    save.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(d.id ? "Place updated" : "Place saved");
        onDone();
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Field label="Name" error={errors.label} hint="e.g. Hostel, Department, Cousin's place">
        <Input value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} maxLength={30} />
      </Field>
      <Field label="Campus">
        <Select value={d.campusId} onValueChange={(v) => setD({ ...d, campusId: v, zoneId: "", pickupPointId: "" })} options={(campuses.data ?? []).map((c) => ({ value: c.id, label: c.shortName, hint: c.city }))} label="Campus" />
      </Field>
      <Field label="Hostel, faculty or area" error={errors.zoneId}>
        <Select value={d.zoneId || undefined} onValueChange={(v) => setD({ ...d, zoneId: v })} placeholder="Choose a zone" options={(campus?.zones ?? []).map((z) => ({ value: z.id, label: z.name }))} label="Zone" />
      </Field>
      <Field label="Room, block or landmark" error={errors.addressLine}>
        <Input value={d.addressLine} onChange={(e) => setD({ ...d, addressLine: e.target.value })} placeholder="Room 12, Block C" maxLength={120} />
      </Field>
      <Field label="Preferred pickup point" optional>
        <Select
          value={d.pickupPointId || "none"}
          onValueChange={(v) => setD({ ...d, pickupPointId: v === "none" ? "" : v })}
          options={[{ value: "none", label: "No preference" }, ...(campus?.pickupPoints ?? []).map((p) => ({ value: p.id, label: p.name }))]}
          label="Pickup point"
        />
      </Field>
      <Checkbox checked={d.isDefault} onCheckedChange={(v) => setD({ ...d, isDefault: v })} label="Use as my default" description="Checkout fills this in for brands on this campus." />
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

  const blank: Draft = { label: "", campusId: user?.campusId ?? campuses.data?.[0]?.id ?? "", zoneId: "", pickupPointId: "", addressLine: "", isDefault: !data?.length };

  return (
    <div>
      <DashboardHeader
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
        <EmptyState illustration="places" title="No saved places" body="Add your hostel room or a favourite pickup point." action={<Button onClick={() => setEditing(blank)}>Add a place</Button>} />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {data.map((p) => {
              const campus = campuses.data?.find((c) => c.id === p.campusId);
              const zone = campus?.zones.find((z) => z.id === p.zoneId);
              const point = campus?.pickupPoints.find((x) => x.id === p.pickupPointId);
              return (
                <motion.li key={p.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={spring.smooth} className="flex flex-col rounded-lg bg-surface p-5 hairline">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
                      <MapPin className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-body font-semibold">
                        {p.label} {p.isDefault && <Pill tone="accent">Default</Pill>}
                      </p>
                      <p className="mt-1 text-small text-ink-2">{p.addressLine}</p>
                      <p className="text-small text-muted">
                        {zone?.name} · {campus?.shortName}
                      </p>
                      {point && <p className="mt-1 text-small text-muted">Pickup: {point.name}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-1 border-t border-line pt-3">
                    <Button size="sm" variant="ghost" leadingIcon={<Pencil className="size-4" />} onClick={() => setEditing({ ...p, pickupPointId: p.pickupPointId ?? "" })}>
                      Edit
                    </Button>
                    {!p.isDefault && (
                      <SetDefaultButton place={p} />
                    )}
                    <Button size="sm" variant="ghost" className="ml-auto text-danger" leadingIcon={<Trash2 className="size-4" />} onClick={() => setConfirm(p)}>
                      Delete
                    </Button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
      <ResponsiveSheet open={!!editing} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? "Edit place" : "Add a place"}>
        {editing && <PlaceForm key={editing.id ?? "new"} draft={editing} onDone={() => setEditing(null)} />}
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
      onClick={() => save.mutate({ ...place, isDefault: true }, { onSuccess: () => toast.success(`${place.label} is now your default`) })}
    >
      Make default
    </Button>
  );
}
