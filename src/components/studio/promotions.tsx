"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioCards, Switch } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { Pill, ProgressBar } from "@/components/ui/misc";
import { Dialog, ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { formatNaira, parseNairaInput } from "@/domain/money";
import { formatDate } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useDeletePromo, usePromos, useSavePromo } from "@/queries/studio";
import { promoInputSchema, type PromoInput } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type { Promo, PromoKind } from "@/services/types";
import { toast } from "@/stores/toast";
import { StudioHeaderBlock } from "./studio-shell";

type Draft = { id?: string; code: string; kind: PromoKind; value: string; min: string; max: string; limit: string; expires: string; description: string; active: boolean };

const blank: Draft = { code: "", kind: "percent", value: "10", min: "", max: "", limit: "", expires: "", description: "", active: true };

function describe(p: Pick<Promo, "kind" | "value" | "minSubtotalKobo" | "maxDiscountKobo">) {
  const base = p.kind === "percent" ? `${p.value}% off` : p.kind === "fixed" ? `${formatNaira(p.value)} off` : "Free delivery";
  const min = p.minSubtotalKobo ? ` orders over ${formatNaira(p.minSubtotalKobo)}` : " any order";
  const cap = p.kind === "percent" && p.maxDiscountKobo ? ` (max ${formatNaira(p.maxDiscountKobo)})` : "";
  return `${base}${cap} on${min}`;
}

function PromoForm({ draft, onDone }: { draft: Draft; onDone: () => void }) {
  const [d, setD] = useState(draft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useSavePromo();
  const submit = () => {
    const value = d.kind === "percent" ? Number(d.value) : d.kind === "fixed" ? (parseNairaInput(d.value) ?? 0) : 0;
    const input: PromoInput = {
      code: d.code,
      kind: d.kind,
      value,
      minSubtotalKobo: d.min ? (parseNairaInput(d.min) ?? 0) : 0,
      ...(d.kind === "percent" && d.max ? { maxDiscountKobo: parseNairaInput(d.max) ?? 0 } : {}),
      ...(d.limit ? { usageLimit: Number(d.limit) } : {}),
      ...(d.expires ? { expiresAt: new Date(`${d.expires}T23:59:59`).toISOString() } : {}),
      description: d.description,
      active: d.active,
    };
    const parsed = promoInputSchema.safeParse(input);
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      return;
    }
    setErrors({});
    save.mutate(
      { ...(d.id ? { id: d.id } : {}), input },
      {
        onSuccess: () => {
          toast.success(d.id ? "Promo updated" : `${input.code.toUpperCase()} is live`, { description: "Buyers can use it at checkout right now." });
          onDone();
        },
        onError: (e) => {
          const err = e as { fields?: Record<string, string> };
          if (err.fields) setErrors(err.fields);
          toast.error(errorMessage(e));
        },
      },
    );
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
      <Field label="Code" error={errors.code} hint={d.id ? "Codes can't be changed after creation." : "Letters and numbers, e.g. HALLWEEK"}>
        <Input value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })} readOnly={!!d.id} className="font-mono uppercase" maxLength={16} />
      </Field>
      <RadioCards
        label="Discount type"
        value={d.kind}
        onChange={(kind) => setD({ ...d, kind, value: kind === "percent" ? "10" : kind === "fixed" ? "500" : "0" })}
        options={[
          { value: "percent", title: "Percentage", description: "e.g. 15% off" },
          { value: "fixed", title: "Fixed amount", description: "e.g. ₦500 off" },
          { value: "free_delivery", title: "Free delivery", description: "Waives your delivery fee" },
        ]}
      />
      {d.kind !== "free_delivery" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={d.kind === "percent" ? "Percent off" : "Amount off (₦)"} error={errors.value}>
            <Input value={d.value} onChange={(e) => setD({ ...d, value: e.target.value })} inputMode="numeric" className="font-mono" />
          </Field>
          {d.kind === "percent" && (
            <Field label="Max discount (₦)" optional>
              <Input value={d.max} onChange={(e) => setD({ ...d, max: e.target.value })} inputMode="numeric" className="font-mono" placeholder="2,000" />
            </Field>
          )}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Minimum order (₦)" optional>
          <Input value={d.min} onChange={(e) => setD({ ...d, min: e.target.value })} inputMode="numeric" className="font-mono" placeholder="5,000" />
        </Field>
        <Field label="Usage limit" optional error={errors.usageLimit}>
          <Input value={d.limit} onChange={(e) => setD({ ...d, limit: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className="font-mono" placeholder="100" />
        </Field>
      </div>
      <Field label="Expires" optional>
        <Input type="date" value={d.expires} onChange={(e) => setD({ ...d, expires: e.target.value })} />
      </Field>
      <Field label="Note for buyers" optional>
        <Input value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} maxLength={80} placeholder="Hall week special" />
      </Field>
      <Switch checked={d.active} onCheckedChange={(active) => setD({ ...d, active })} label="Active" description="Inactive codes are rejected at checkout." />
      <Button type="submit" size="lg" loading={save.isPending}>
        {d.id ? "Save promo" : "Create promo"}
      </Button>
    </form>
  );
}

export function StudioPromotions() {
  const { data, isPending } = usePromos();
  const save = useSavePromo();
  const remove = useDeletePromo();
  const mounted = useMounted();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<Promo | null>(null);

  return (
    <div>
      <StudioHeaderBlock
        eyebrow="Promotions"
        title="Promo codes"
        description="Codes you create here work at checkout immediately, for your shop only."
        actions={
          <Button leadingIcon={<Plus className="size-4.5" />} onClick={() => setEditing(blank)}>
            New code
          </Button>
        }
      />
      {isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-44" rounded="lg" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState illustration="promos" title="No promo codes yet" body="A small discount is a great way to get your first orders or reward regulars." action={<Button onClick={() => setEditing(blank)}>Create a code</Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          <AnimatePresence initial={false}>
            {data.map((p) => (
              <motion.li key={p.id} layout exit={{ opacity: 0, scale: 0.95 }} transition={spring.smooth} className="relative overflow-hidden rounded-lg bg-surface hairline">
                <div className="flex items-start justify-between gap-3 border-b border-dashed border-line-strong p-5">
                  <div>
                    <button
                      type="button"
                      className="group inline-flex items-center gap-2 font-mono text-title-lg font-semibold tracking-wider"
                      onClick={() => void navigator.clipboard?.writeText(p.code).then(() => toast.success(`${p.code} copied`))}
                      aria-label={`Copy code ${p.code}`}
                    >
                      {p.code}
                      <Copy className="size-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                    <p className="mt-1 text-small text-muted">{p.description || describe(p)}</p>
                  </div>
                  <Switch hideLabel label={`${p.code} active`} checked={p.active} onCheckedChange={(active) => save.mutate({ id: p.id, input: { active } }, { onSuccess: () => toast(active ? `${p.code} is active` : `${p.code} paused`) })} />
                </div>
                <div className="p-5">
                  <p className="text-small">{describe(p)}</p>
                  <div className="mt-3 flex items-center gap-3">
                    {p.usageLimit ? <ProgressBar value={p.usageCount} max={p.usageLimit} label={`${p.code} usage`} className="flex-1" /> : <span className="flex-1" />}
                    <span className="font-mono text-small text-muted tabular">
                      {p.usageCount}
                      {p.usageLimit ? `/${p.usageLimit}` : ""} used
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {p.active ? <Pill tone="success" dot>Active</Pill> : <Pill>Paused</Pill>}
                    {p.expiresAt && mounted && <span className="text-small text-muted">Ends {formatDate(p.expiresAt)}</span>}
                    <span className="ml-auto flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${p.code}`}
                        onClick={() =>
                          setEditing({
                            id: p.id,
                            code: p.code,
                            kind: p.kind,
                            value: p.kind === "fixed" ? String(p.value / 100) : String(p.value),
                            min: p.minSubtotalKobo ? String(p.minSubtotalKobo / 100) : "",
                            max: p.maxDiscountKobo ? String(p.maxDiscountKobo / 100) : "",
                            limit: p.usageLimit ? String(p.usageLimit) : "",
                            expires: p.expiresAt ? p.expiresAt.slice(0, 10) : "",
                            description: p.description,
                            active: p.active,
                          })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label={`Delete ${p.code}`} onClick={() => setConfirm(p)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      <ResponsiveSheet open={!!editing} onOpenChange={(v) => !v && setEditing(null)} title={editing?.id ? `Edit ${editing.code}` : "New promo code"}>
        {editing && <PromoForm key={editing.id ?? "new"} draft={editing} onDone={() => setEditing(null)} />}
      </ResponsiveSheet>
      <Dialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={`Delete ${confirm?.code}?`}
        description="Buyers won't be able to use it anymore."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Keep
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => confirm && remove.mutate(confirm.id, { onSuccess: () => { setConfirm(null); toast("Promo deleted"); } })}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">Pausing keeps its history. Delete only if you won&apos;t use it again.</p>
      </Dialog>
    </div>
  );
}
