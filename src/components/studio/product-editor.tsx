"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  useEffectEvent,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { ArrowLeft, Copy, GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { useUnsavedChangesGuard } from "@/components/ui/unsaved-guard";
import { ProductCard } from "@/components/market/product-card";
import { categories } from "@/config/categories";
import { spring } from "@/design/motion";
import { formatNaira, parseNairaInput } from "@/domain/money";
import { allVariantKeys, variantLabel } from "@/domain/variants";
import { cn } from "@/lib/cn";
import { useMyBrand, useSaveProduct, useStudioProduct, useUploadImage } from "@/queries/studio";
import { productInputSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type {
  CategoryId,
  ImageRef,
  Product,
  ProductOption,
  ProductWithBrand,
  Variant,
} from "@/services/types";
import { toast } from "@/stores/toast";
import { NavPageHeader } from "@/components/app/nav-header";
import { TableScroll } from "@/components/ui/table-scroll";

type Draft = {
  name: string;
  description: string;
  details: string[];
  category: CategoryId;
  tags: string[];
  price: string;
  compareAt: string;
  images: { key: string; ref: ImageRef }[];
  options: ProductOption[];
  variants: Variant[];
  status: "published" | "draft";
};

type Images = Draft["images"];
type Errors = Record<string, string>;

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

/** One-off pieces (thrift) usually come in ones; everything else starts at 10. */
const defaultStock = (category: CategoryId) => (category === "thrift" ? 1 : 10);

function toDraft(p: Product | undefined, fallbackCategory: CategoryId): Draft {
  if (!p) {
    return {
      name: "",
      description: "",
      details: [],
      category: fallbackCategory,
      tags: [],
      price: "",
      compareAt: "",
      images: [],
      options: [],
      variants: [{ key: "default", stock: defaultStock(fallbackCategory), priceDeltaKobo: 0 }],
      status: "published",
    };
  }
  return {
    name: p.name,
    description: p.description,
    details: p.details,
    category: p.category,
    tags: p.tags,
    price: String(p.priceKobo / 100),
    compareAt: p.compareAtKobo ? String(p.compareAtKobo / 100) : "",
    images: p.images.map((ref) => ({ key: uid("img"), ref })),
    options: p.options,
    variants: p.variants,
    status: p.status,
  };
}

/** A new product prefilled from another one. Only uploaded photos carry over; the server keeps those. */
function copyDraft(p: Product): Draft {
  const d = toDraft(p, p.category);
  return { ...d, images: d.images.filter((i) => i.ref.kind === "blob"), status: "published" };
}

function syncVariants(options: ProductOption[], previous: Variant[]): Variant[] {
  return allVariantKeys(options).map(
    (key) => previous.find((v) => v.key === key) ?? { key, stock: 10, priceDeltaKobo: 0 },
  );
}

/* ---------------------------- Number inputs ----------------------------- */

type NumberInputProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "inputMode">;

/**
 * A whole-number field (stock) that keeps what the user typed while they type,
 * so clearing it to type a new number doesn't snap back to 0.
 */
function CountInput({
  value,
  onChange,
  max = 9999,
  ...rest
}: NumberInputProps & { value: number; onChange: (n: number) => void; max?: number }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <Input
      {...rest}
      inputMode="numeric"
      value={text ?? String(value)}
      onChange={(e) => {
        const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
        setText(clean);
        if (clean) onChange(Math.min(max, Number(clean)));
      }}
      onBlur={(e) => {
        if (text !== null) onChange(text ? Math.min(max, Number(text)) : 0);
        setText(null);
        rest.onBlur?.(e);
      }}
    />
  );
}

/**
 * Extra price per variant, in naira. It can be negative (a smaller size that
 * costs less): the sign button flips it, and typing "-" works too. The text is
 * kept while typing and read properly on blur.
 */
function PriceDeltaInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (kobo: number) => void;
  label: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const [negative, setNegative] = useState(value < 0);
  const neg = value < 0 || (value === 0 && negative);
  const magnitude = Math.abs(value) / 100;
  const commit = (raw: string, isNeg: boolean) => {
    const n = raw === "" || raw === "." ? 0 : Number(raw);
    if (Number.isFinite(n)) onChange(Math.round(n * 100) * (isNeg ? -1 : 1));
  };
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => {
          setNegative(!neg);
          onChange(-value);
        }}
        aria-pressed={neg}
        aria-label={`${label}: ${neg ? "cheaper than the base price" : "more than the base price"}. Tap to switch.`}
        className="relative grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface-2 font-mono text-body font-semibold hairline after:absolute after:-inset-1 after:content-[''] hover:bg-ink/[0.06]"
      >
        {neg ? "−" : "+"}
      </button>
      <Input
        className="h-9 font-mono"
        inputMode="decimal"
        aria-label={label}
        value={text ?? (magnitude ? String(magnitude) : "0")}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          let raw = e.target.value.replace(/[₦,\s]/g, "");
          let isNeg = neg;
          if (raw.startsWith("-")) {
            isNeg = !neg;
            raw = raw.replace(/-/g, "");
            setNegative(isNeg);
          }
          if (!/^\d*(\.\d{0,2})?$/.test(raw)) return;
          setText(raw);
          commit(raw, isNeg);
        }}
        onBlur={() => {
          if (text !== null) commit(text, neg);
          setText(null);
        }}
      />
    </div>
  );
}

/* ------------------------------- Images --------------------------------- */

function SortableImage({
  id,
  img,
  index,
  onRemove,
}: {
  id: string;
  img: ImageRef;
  index: number;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-[4/5] overflow-hidden rounded-md bg-sand",
        isDragging && "z-10 shadow-lg ring-2 ring-accent",
      )}
    >
      <AppImage image={img} alt={`Product image ${index + 1}`} />
      {index === 0 && (
        <span className="absolute bottom-2 left-2 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] text-on-primary uppercase">
          Cover
        </span>
      )}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-1.5 left-1.5 flex size-8 cursor-grab touch-none items-center justify-center rounded-sm bg-surface/90 text-ink shadow-xs active:cursor-grabbing"
        aria-label={`Reorder image ${index + 1}. Use arrow keys after pressing space.`}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-sm bg-surface/90 text-ink shadow-xs hover:text-danger"
        aria-label={`Remove image ${index + 1}`}
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

function ImagesField({
  images,
  onChange,
}: {
  images: Images;
  /** Functional, so uploads finishing one by one never undo a removal or reorder made meanwhile. */
  onChange: (fn: (prev: Images) => Images) => void;
}) {
  const upload = useUploadImage();
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [adding, setAdding] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = async (files: File[]) => {
    const list = files.slice(0, Math.max(0, 8 - images.length));
    setAdding((n) => n + list.length);
    for (const f of list) {
      try {
        const r = await upload.mutateAsync(f);
        const item = { key: uid("img"), ref: r.ref };
        onChange((prev) => (prev.length >= 8 ? prev : [...prev, item]));
      } catch (e) {
        toast.error(`Couldn't add ${f.name}`, { description: errorMessage(e) });
      } finally {
        setAdding((n) => n - 1);
      }
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    onChange((prev) => {
      const from = prev.findIndex((i) => i.key === active.id);
      const to = prev.findIndex((i) => i.key === over.id);
      return from < 0 || to < 0 ? prev : arrayMove(prev, from, to);
    });
  };

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((i) => i.key)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {images.map((img, i) => (
              <SortableImage
                key={img.key}
                id={img.key}
                img={img.ref}
                index={i}
                onRemove={() => onChange((prev) => prev.filter((x) => x.key !== img.key))}
              />
            ))}
            {images.length < 8 && (
              <li>
                <button
                  type="button"
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    void addFiles(Array.from(e.dataTransfer.files));
                  }}
                  className={cn(
                    "flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-small text-muted transition-colors",
                    dragOver
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line-strong hover:border-ink hover:text-ink",
                  )}
                >
                  {adding > 0 ? (
                    <Skeleton className="size-8" rounded="full" />
                  ) : (
                    <ImagePlus className="size-6" />
                  )}
                  <span className="px-2 text-center">
                    {adding > 0 ? "Adding…" : "Drop or tap to add"}
                  </span>
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="sr-only"
        aria-label="Add product images"
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          // Clear it so picking the same photo again (after removing it) still fires.
          e.currentTarget.value = "";
          if (files.length) void addFiles(files);
        }}
      />
      <p className="mt-2 text-small text-muted">
        Up to 8 images · drag to reorder · the first is the cover. Real photos sell far better than
        none.
      </p>
      {images[0] && (
        <div className="mt-5">
          <p className="mb-2 eyebrow text-muted">Crop preview</p>
          <div className="flex items-end gap-4">
            <figure>
              <div className="aspect-[4/5] w-24 overflow-hidden rounded-md ring-1 ring-line">
                <AppImage image={images[0].ref} alt="" />
              </div>
              <figcaption className="mt-1 text-[11px] text-muted">Card · 4:5</figcaption>
            </figure>
            <figure>
              <div className="aspect-square w-16 overflow-hidden rounded-sm ring-1 ring-line">
                <AppImage image={images[0].ref} alt="" />
              </div>
              <figcaption className="mt-1 text-[11px] text-muted">Bag · 1:1</figcaption>
            </figure>
            <figure>
              <div className="size-10 overflow-hidden rounded-full ring-1 ring-line">
                <AppImage image={images[0].ref} alt="" />
              </div>
              <figcaption className="mt-1 text-[11px] text-muted">Search</figcaption>
            </figure>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Tag input ------------------------------- */

function TagInput({
  values,
  onChange,
  placeholder,
  label,
  max = 12,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  label: string;
  max?: number;
  /** Set by <Field>, so its label and error point at the text box. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!parts.length) {
      setText("");
      return;
    }
    const next = [...values];
    for (const p of parts)
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.length < max) next.push(p);
    onChange(next);
    setText("");
  };
  return (
    <div
      className={cn(
        "flex min-h-11 flex-wrap items-center gap-1.5 rounded-md bg-surface px-2 py-1.5 shadow-[inset_0_0_0_1px_var(--line-strong)] focus-within:shadow-[inset_0_0_0_1.5px_var(--ink),0_0_0_4px_var(--accent-soft)]",
        invalid && "shadow-[inset_0_0_0_1.5px_var(--danger)]",
      )}
    >
      <AnimatePresence initial={false}>
        {values.map((v) => (
          <motion.span
            key={v}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={spring.snappy}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-ink/[0.07] pr-1 pl-2.5 text-small"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              // Small to look at, 44px to tap.
              className="relative flex size-5 items-center justify-center rounded-full after:absolute after:-inset-3 after:content-[''] hover:bg-ink/10"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !text && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={add}
        placeholder={values.length ? "" : placeholder}
        aria-label={id ? undefined : label}
        className="h-8 min-w-24 flex-1 bg-transparent px-1 text-body outline-none placeholder:text-faint"
      />
    </div>
  );
}

/* ------------------------------ Options --------------------------------- */

type SetDraft = (fn: (d: Draft) => Draft, ...clear: string[]) => void;

function OptionsField({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const setOptions = (options: ProductOption[]) =>
    setDraft(
      (d) => ({ ...d, options, variants: syncVariants(options, d.variants) }),
      "options",
      "variants",
    );
  return (
    <div className="flex flex-col gap-4">
      {draft.options.map((o, oi) => (
        <div key={o.id} className="border-t border-line-thin pt-4 first:border-t-0 first:pt-0">
          <div className="flex items-start gap-3 max-sm:flex-wrap">
            <Field label="Option name" className="w-40 shrink-0">
              <Input
                value={o.name}
                onChange={(e) =>
                  setOptions(
                    draft.options.map((x, i) => (i === oi ? { ...x, name: e.target.value } : x)),
                  )
                }
                placeholder="Size"
                maxLength={20}
              />
            </Field>
            <Field label="Values" className="min-w-0 flex-1" hint="Press Enter after each value">
              <TagInput
                label={`${o.name || "Option"} values`}
                values={o.values.map((v) => v.label)}
                placeholder="S, M, L"
                onChange={(labels) =>
                  setOptions(
                    draft.options.map((x, i) =>
                      i === oi
                        ? {
                            ...x,
                            values: labels.map(
                              (l) =>
                                x.values.find((v) => v.label === l) ?? { id: uid("val"), label: l },
                            ),
                          }
                        : x,
                    ),
                  )
                }
              />
            </Field>
            <Button
              variant="ghost"
              size="icon-sm"
              className="mt-7"
              aria-label={`Remove option ${o.name}`}
              onClick={() => setOptions(draft.options.filter((_, i) => i !== oi))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      {draft.options.length < 3 && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          leadingIcon={<Plus className="size-4" />}
          onClick={() =>
            setOptions([
              ...draft.options,
              { id: uid("opt"), name: draft.options.length ? "Colour" : "Size", values: [] },
            ])
          }
        >
          Add an option (size, colour, flavour…)
        </Button>
      )}
    </div>
  );
}

function VariantsTable({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const update = (key: string, patch: Partial<Variant>) =>
    setDraft(
      (d) => ({
        ...d,
        variants: d.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
      }),
      "variants",
    );
  const valid = draft.options.every((o) => o.values.length > 0);
  if (!valid)
    return (
      <p className="text-small text-muted">
        Add values to every option to set stock per combination.
      </p>
    );
  return (
    <TableScroll label="Stock per variant" className="border-y border-line-thin">
      <table className="w-full min-w-[420px] text-small">
        <thead>
          <tr className="border-b border-line-thin text-left text-muted">
            <th scope="col" className="py-2.5 pr-3 eyebrow font-medium">
              Combination
            </th>
            <th scope="col" className="w-28 px-3 py-2.5 eyebrow font-medium">
              Stock
            </th>
            <th scope="col" className="w-44 py-2.5 pl-3 eyebrow font-medium">
              Extra price (₦)
            </th>
          </tr>
        </thead>
        <tbody>
          {draft.variants.map((v) => {
            const name = variantLabel(draft.options, v.key) || "Default";
            return (
              <tr key={v.key} className="border-b border-line-thin last:border-0">
                <td className="py-2 pr-3">{name}</td>
                <td className="px-3 py-2">
                  <CountInput
                    className="h-9 font-mono"
                    aria-label={`Stock for ${name}`}
                    value={v.stock}
                    onChange={(stock) => update(v.key, { stock })}
                  />
                </td>
                <td className="py-2 pl-3">
                  <PriceDeltaInput
                    label={`Extra price for ${name}`}
                    value={v.priceDeltaKobo}
                    onChange={(priceDeltaKobo) => update(v.key, { priceDeltaKobo })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableScroll>
  );
}

/* ------------------------------- Editor --------------------------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card py-6 md:py-8">
      <h2 className="text-title font-semibold">{title}</h2>
      {description && <p className="mt-1 text-small text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FieldError({ id, children }: { id: string; children: string | undefined }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-small font-medium text-danger">
      {children}
    </p>
  );
}

/** Which form field each validation error belongs to (zod paths use the input names). */
const errorKey = (path: PropertyKey | undefined) => {
  const k = String(path ?? "form");
  return k === "keepImages" || k === "imageIds" ? "images" : k;
};

function EditorForm({
  product,
  template,
}: {
  product: Product | undefined;
  /** A product to copy from ("Duplicate"); only for new products. */
  template?: Product | undefined;
}) {
  const { data: brand } = useMyBrand();
  const save = useSaveProduct();
  const router = useRouter();
  const brandCategory = brand?.category ?? "fashion";
  const [copiedFrom, setCopiedFrom] = useState<Product | null>(product ? null : (template ?? null));
  const initial = () =>
    product ? toDraft(product, brandCategory) : copiedFrom ? copyDraft(copiedFrom) : null;
  const [draft, setDraftState] = useState<Draft>(
    () => initial() ?? toDraft(undefined, brandCategory),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [detailText, setDetailText] = useState("");
  /** Left with unsaved changes and came back: ask before carrying on. */
  const [leftUnsaved, setLeftUnsaved] = useState(false);
  const [seededAt, setSeededAt] = useState(product?.updatedAt);
  const [anotherPending, setAnotherPending] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const detailsId = useId();

  /** An error goes away as soon as its field is edited. */
  const clearErrors = (...keys: string[]) =>
    setErrors((e) => {
      if (!keys.some((k) => k in e)) return e;
      const next = { ...e };
      for (const k of keys) delete next[k];
      return next;
    });
  const setDraft: SetDraft = (fn, ...clear) => {
    setDirty(true);
    setDraftState(fn);
    if (clear.length) clearErrors(...clear);
  };

  /** Back to a clean form: the saved product, or an empty one (keeping the category). */
  const reset = (opts: { fresh?: boolean; category?: CategoryId } = {}) => {
    const fresh = opts.fresh || (!product && !copiedFrom);
    if (opts.fresh) setCopiedFrom(null);
    setDraftState((fresh ? null : initial()) ?? toDraft(undefined, opts.category ?? brandCategory));
    setErrors({});
    setDetailText("");
    setDirty(false);
    setLeftUnsaved(false);
    setSeededAt(product?.updatedAt);
  };

  // The saved product changed (saved elsewhere, refetched) and nothing here is edited: show it.
  if (product && product.updatedAt !== seededAt && !dirty) {
    setSeededAt(product.updatedAt);
    setDraftState(toDraft(product, brandCategory));
  }

  // The router keeps this screen mounted (hidden) after navigating away. When it hides, start
  // clean next time unless there are unsaved changes; those wait behind a "Keep editing?" banner.
  const onHide = useEffectEvent(() => {
    if (dirty) setLeftUnsaved(true);
    else reset();
  });
  useLayoutEffect(() => () => onHide(), []);

  const guard = useUnsavedChangesGuard(dirty, { onDiscard: () => reset() });

  const priceKobo = parseNairaInput(draft.price);
  const compareKobo = draft.compareAt ? parseNairaInput(draft.compareAt) : null;
  const noOptions = draft.options.length === 0;

  const preview = useMemo<ProductWithBrand | null>(() => {
    if (!brand) return null;
    return {
      id: product?.id ?? "preview",
      brandId: brand.id,
      slug: product?.slug ?? "preview",
      name: draft.name || "Your product name",
      description: draft.description,
      details: draft.details,
      category: draft.category,
      tags: draft.tags,
      priceKobo: priceKobo ?? 0,
      ...(compareKobo ? { compareAtKobo: compareKobo } : {}),
      images: draft.images.map((i) => i.ref),
      options: draft.options,
      variants: draft.variants,
      status: draft.status,
      rating: product?.rating ?? 0,
      ratingCount: product?.ratingCount ?? 0,
      salesCount: product?.salesCount ?? 0,
      viewCount: 0,
      createdAt: product?.createdAt ?? "",
      updatedAt: "",
      brand: {
        id: brand.id,
        handle: brand.handle,
        name: brand.name,
        logo: brand.logo,
        campusId: brand.campusId,
        vacation: brand.vacation,
        rating: brand.rating,
        verified: brand.verified,
      },
    };
  }, [brand, draft, priceKobo, compareKobo, product]);

  const focusFirstError = (keys: string[]) =>
    requestAnimationFrame(() => {
      const fields = formRef.current?.querySelectorAll<HTMLElement>("[data-field]") ?? [];
      const el = Array.from(fields).find((f) => keys.includes(f.dataset.field ?? ""));
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.querySelector<HTMLElement>(
        "input:not([type=file]), textarea, button[role=combobox], button",
      )?.focus({ preventScroll: true });
    });

  const submit = (status: "published" | "draft", { another = false } = {}) => {
    // One save at a time: a double tap must not create the product twice.
    if (submitting.current || save.isPending) return;
    // A detail typed but not yet added with Enter still counts.
    const pendingDetail = detailText.trim();
    const details =
      pendingDetail && draft.details.length < 8 ? [...draft.details, pendingDetail] : draft.details;
    if (details !== draft.details) {
      setDraftState((d) => ({ ...d, details }));
      setDetailText("");
    }
    const input = {
      name: draft.name,
      description: draft.description,
      details,
      category: draft.category,
      tags: draft.tags,
      priceKobo: priceKobo ?? 0,
      ...(compareKobo ? { compareAtKobo: compareKobo } : {}),
      imageIds: [],
      keepImages: draft.images.map((i) => i.ref),
      options: draft.options,
      variants: draft.variants,
      status,
    };
    const parsed = productInputSchema.safeParse(input);
    const e: Errors = {};
    if (priceKobo === null) e.priceKobo = "Enter a price, e.g. 4500";
    if (draft.compareAt && compareKobo === null) e.compareAtKobo = "Enter a number";
    if (compareKobo !== null && priceKobo !== null && compareKobo <= priceKobo)
      e.compareAtKobo = "Must be higher than the price";
    if (draft.options.some((o) => !o.name.trim() || o.values.length === 0))
      e.options = "Every option needs a name and at least one value";
    if (!parsed.success) for (const i of parsed.error.issues) e[errorKey(i.path[0])] ??= i.message;
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error("Check the highlighted fields", { description: Object.values(e)[0] });
      focusFirstError(Object.keys(e));
      return;
    }
    setErrors({});
    submitting.current = true;
    setAnotherPending(another);
    const category = draft.category;
    save.mutate(
      { ...(product ? { id: product.id } : {}), input },
      {
        onSuccess: (p) => {
          const view =
            status === "published"
              ? { label: "View", onClick: () => router.push(`/products/${p.slug}`) }
              : undefined;
          if (another) {
            reset({ fresh: true, category });
            toast.success(
              status === "published"
                ? "Published. Ready for the next one."
                : "Saved as draft. Ready for the next one.",
              { action: view },
            );
            window.scrollTo({ top: 0, behavior: "smooth" });
            nameRef.current?.focus({ preventScroll: true });
            return;
          }
          if (product) setDirty(false);
          // A new product is saved: this screen stays mounted, so clear it for next time.
          else reset({ fresh: true, category });
          toast.success(
            product
              ? "Changes saved"
              : status === "published"
                ? "Product is live"
                : "Saved as draft",
            {
              description: status === "published" ? "Buyers can find it now." : undefined,
              action: view,
            },
          );
          router.push("/studio/products");
        },
        onError: (err) => {
          const fields = (err as { fields?: Record<string, string> }).fields;
          if (fields) {
            const mapped: Errors = {};
            for (const [k, v] of Object.entries(fields)) mapped[errorKey(k.split(".")[0])] ??= v;
            setErrors(mapped);
            focusFirstError(Object.keys(mapped));
          }
          toast.error("That didn't go through. Try again?", { description: errorMessage(err) });
        },
        onSettled: () => {
          submitting.current = false;
        },
      },
    );
  };

  const publishing = draft.status === "published";
  const primaryLabel = publishing
    ? product?.status === "published"
      ? "Save changes"
      : "Publish"
    : "Save draft";
  const showSaveDraft = publishing && product?.status !== "published";
  const busy = save.isPending;
  const pendingStatus = busy ? save.variables?.input.status : undefined;
  const addingAnother = busy && anotherPending;

  const primary = (className?: string) => (
    <Button
      className={className}
      loading={busy && pendingStatus === draft.status && !addingAnother}
      disabled={busy}
      onClick={() => submit(draft.status)}
    >
      {primaryLabel}
    </Button>
  );
  const saveDraft = (className?: string) =>
    showSaveDraft && (
      <Button
        variant="secondary"
        className={className}
        loading={busy && pendingStatus === "draft" && !addingAnother}
        disabled={busy}
        onClick={() => submit("draft")}
      >
        Save draft
      </Button>
    );

  const stock = draft.variants[0]?.stock ?? 0;

  return (
    <div ref={formRef}>
      <Link
        href="/studio/products"
        className="tap-area inline-flex items-center gap-1.5 text-small text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>
      <NavPageHeader
        eyebrow={product ? "Edit product" : "New product"}
        title={product ? product.name : "Add a product"}
      />
      <AnimatePresence initial={false}>
        {leftUnsaved && dirty && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring.snappy}
            role="status"
            className="mb-6 flex flex-wrap items-center gap-3 rounded-md bg-warning-soft px-4 py-3 text-small text-warning"
          >
            <span className="min-w-0 flex-1 font-medium">
              {product
                ? "You have unsaved changes to this product."
                : "You have an unsaved product."}
            </span>
            <Button size="sm" variant="secondary" onClick={() => setLeftUnsaved(false)}>
              Keep editing
            </Button>
            <Button size="sm" variant="ghost" onClick={() => reset({ fresh: !product })}>
              {product ? "Discard changes" : "Start fresh"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      {copiedFrom && !product && (
        <p className="mb-6 flex items-center gap-2 rounded-md bg-accent-soft px-4 py-3 text-small text-accent-ink">
          <Copy className="size-4 shrink-0" />
          <span>
            Copied from <strong className="font-semibold">{copiedFrom.name}</strong>. Change
            what&apos;s different, then save.
          </span>
        </p>
      )}
      <div className="grid grid-cols-1 gap-x-12 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col">
          <Section
            title="Photos"
            description="Bright, natural light works best. Square-ish framing crops nicely."
          >
            <div data-field="images">
              <ImagesField
                images={draft.images}
                onChange={(fn) => setDraft((d) => ({ ...d, images: fn(d.images) }), "images")}
              />
              <FieldError id={`${detailsId}-images`}>{errors.images}</FieldError>
            </div>
          </Section>
          <Section title="Basics">
            <div className="flex flex-col gap-5">
              <div data-field="name">
                <Field label="Name" error={errors.name}>
                  <Input
                    ref={nameRef}
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }), "name")}
                    placeholder="Indigo Àdìrẹ Boxy Tee"
                    maxLength={80}
                  />
                </Field>
              </div>
              <div data-field="description">
                <Field
                  label="Description"
                  error={errors.description}
                  hint="What is it, why is it good, how do people use it?"
                >
                  <Textarea
                    value={draft.description}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, description: e.target.value }), "description")
                    }
                    maxLength={1200}
                  />
                </Field>
              </div>
              <div data-field="details" className="flex flex-col gap-1.5">
                <label htmlFor={detailsId} className="text-small font-medium text-ink">
                  Details
                  <span className="ml-1.5 font-normal text-muted"> (optional)</span>
                </label>
                {draft.details.map((d, i) => (
                  <div
                    key={`${d}-${i}`}
                    className="flex items-center gap-2 border-b border-line-thin py-2 text-small"
                  >
                    <span className="flex-1">{d}</span>
                    <button
                      type="button"
                      className="relative flex size-7 items-center justify-center rounded-sm after:absolute after:-inset-2 after:content-[''] hover:bg-ink/[0.06]"
                      aria-label={`Remove detail ${d}`}
                      onClick={() =>
                        setDraft(
                          (x) => ({ ...x, details: x.details.filter((_, j) => j !== i) }),
                          "details",
                        )
                      }
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <Input
                  id={detailsId}
                  value={detailText}
                  onChange={(e) => {
                    setDetailText(e.target.value);
                    setDirty(true);
                    clearErrors("details");
                  }}
                  placeholder={
                    draft.details.length < 8
                      ? "e.g. 100% cotton, 220gsm"
                      : "That's the most details you can add"
                  }
                  disabled={draft.details.length >= 8}
                  maxLength={120}
                  aria-invalid={errors.details ? true : undefined}
                  aria-describedby={errors.details ? `${detailsId}-error` : `${detailsId}-hint`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && detailText.trim()) {
                      e.preventDefault();
                      setDraft(
                        (x) => ({ ...x, details: [...x.details, detailText.trim()] }),
                        "details",
                      );
                      setDetailText("");
                    }
                  }}
                />
                {errors.details ? (
                  <p
                    id={`${detailsId}-error`}
                    role="alert"
                    className="text-small font-medium text-danger"
                  >
                    {errors.details}
                  </p>
                ) : (
                  <p id={`${detailsId}-hint`} className="text-small text-muted">
                    Short facts: materials, size guide, allergens. Press Enter to add.
                  </p>
                )}
              </div>
            </div>
          </Section>
          <Section title="Pricing">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div data-field="priceKobo">
                <Field label="Price (₦)" error={errors.priceKobo}>
                  <Input
                    value={draft.price}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, price: e.target.value }), "priceKobo")
                    }
                    inputMode="decimal"
                    placeholder="4,500"
                    className="font-mono"
                  />
                </Field>
              </div>
              <div data-field="compareAtKobo">
                <Field
                  label="Compare-at price (₦)"
                  optional
                  error={errors.compareAtKobo}
                  hint="Shows a strike-through and a % off badge"
                >
                  <Input
                    value={draft.compareAt}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, compareAt: e.target.value }), "compareAtKobo")
                    }
                    inputMode="decimal"
                    placeholder="6,000"
                    className="font-mono"
                  />
                </Field>
              </div>
              {noOptions && (
                <div data-field="variants">
                  <Field
                    label="How many do you have?"
                    error={errors.variants}
                    hint={
                      draft.category === "thrift"
                        ? "One-off pieces: leave it at 1."
                        : "Buyers can't order more than this. It goes down with each order."
                    }
                  >
                    <CountInput
                      className="font-mono"
                      value={stock}
                      onChange={(n) =>
                        setDraft(
                          (d) => ({
                            ...d,
                            variants: d.variants.map((v, i) =>
                              i === 0 ? { ...v, stock: n, priceDeltaKobo: 0 } : v,
                            ),
                          }),
                          "variants",
                        )
                      }
                    />
                  </Field>
                </div>
              )}
            </div>
          </Section>
          <Section
            title="Options & stock"
            description="Add sizes, colours or flavours. Each combination gets its own stock and can cost more or less."
          >
            <div data-field="options">
              <OptionsField draft={draft} setDraft={setDraft} />
              <FieldError id={`${detailsId}-options`}>{errors.options}</FieldError>
            </div>
            {!noOptions && (
              <div className="mt-5" data-field="variants">
                <VariantsTable draft={draft} setDraft={setDraft} />
                <FieldError id={`${detailsId}-variants`}>{errors.variants}</FieldError>
              </div>
            )}
          </Section>
          <Section title="Organisation">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div data-field="category">
                <Field label="Category" error={errors.category}>
                  <Select
                    label="Category"
                    value={draft.category}
                    onValueChange={(v) =>
                      setDraft((d) => {
                        const category = v as CategoryId;
                        // Stock still at the old category's starting number: follow the new one.
                        const only = d.options.length === 0 ? d.variants[0] : undefined;
                        const variants =
                          !product && only && only.stock === defaultStock(d.category)
                            ? [{ ...only, stock: defaultStock(category) }]
                            : d.variants;
                        return { ...d, category, variants };
                      }, "category")
                    }
                    options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Field>
              </div>
              <div data-field="tags">
                <Field
                  label="Tags"
                  optional
                  error={errors.tags}
                  hint="Helps search, e.g. vintage, gift"
                >
                  <TagInput
                    label="Tags"
                    values={draft.tags}
                    onChange={(tags) => setDraft((d) => ({ ...d, tags }), "tags")}
                    placeholder="vintage, gift"
                    max={8}
                  />
                </Field>
              </div>
            </div>
          </Section>
        </div>
        <aside className="min-w-0">
          <div className="sticky top-24 flex flex-col">
            <div className="card py-6">
              <p className="mb-4 eyebrow text-muted">Live preview</p>
              {preview ? (
                <div className="pointer-events-none mx-auto max-w-56" aria-hidden inert>
                  <ProductCard product={preview} />
                </div>
              ) : (
                <Skeleton className="aspect-[4/5] w-full" />
              )}
              <p className="mt-4 text-small text-muted">
                This is exactly how buyers see it in Explore and search.
              </p>
            </div>
            <div className="card py-6">
              <p className="mb-3 text-small font-medium">Visibility</p>
              <SegmentedControl
                label="Visibility"
                value={draft.status}
                onChange={(status) => setDraft((d) => ({ ...d, status }))}
                options={[
                  { value: "published", label: "Live" },
                  { value: "draft", label: "Draft" },
                ]}
                className="w-full [&>button]:flex-1"
              />
              <p className="mt-3 text-small text-muted">
                {publishing ? "Buyers can find and order it." : "Only you can see it for now."}
              </p>
              <div className="mt-4 flex flex-col gap-2 max-xl:hidden">
                {primary("w-full")}
                {saveDraft("w-full")}
              </div>
              {!product && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  loading={addingAnother}
                  disabled={busy}
                  onClick={() => submit(draft.status, { another: true })}
                >
                  {publishing ? "Publish & add another" : "Save & add another"}
                </Button>
              )}
              {priceKobo !== null && (
                <p className="mt-3 text-center text-small text-muted">
                  Sells for {formatNaira(priceKobo)} · you keep 95%
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
      {/* One place to save on phones and tablets, always in reach. */}
      <div className="sticky bottom-0 z-(--z-sticky) -mx-1 mt-6 flex items-center justify-end gap-2 border-t border-line-thin bg-[color-mix(in_oklab,var(--app-bg)_92%,transparent)] px-1 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur xl:hidden">
        <span className="mr-auto text-small text-muted">
          {publishing ? "Live when saved" : "Draft when saved"}
        </span>
        {saveDraft()}
        {primary("min-w-32")}
      </div>
      {guard.dialog}
    </div>
  );
}

export function ProductEditor({
  id,
  fromId = null,
}: {
  id: string | null;
  fromId?: string | null;
}) {
  const { data, isPending, error } = useStudioProduct(id);
  const source = useStudioProduct(id ? null : fromId);
  const { data: brand, isPending: brandPending } = useMyBrand();
  if ((id && isPending) || (!id && fromId && source.isPending) || brandPending) {
    return (
      <div className="flex flex-col gap-6" aria-hidden>
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" rounded="lg" />
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>
    );
  }
  if (id && (error || !data)) {
    return (
      <EmptyState
        illustration="products"
        title="Product not found"
        body="It may have been deleted."
        action={<Button onClick={() => history.back()}>Go back</Button>}
      />
    );
  }
  return (
    <EditorForm
      key={data?.id ?? `new-${brand?.id}-${source.data?.id ?? ""}`}
      product={data}
      template={source.data}
    />
  );
}
