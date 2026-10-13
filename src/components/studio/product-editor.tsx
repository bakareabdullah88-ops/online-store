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
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, GripVertical, ImagePlus, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
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

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

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
      variants: [{ key: "default", stock: 10, priceDeltaKobo: 0 }],
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

function syncVariants(options: ProductOption[], previous: Variant[]): Variant[] {
  return allVariantKeys(options).map(
    (key) => previous.find((v) => v.key === key) ?? { key, stock: 10, priceDeltaKobo: 0 },
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
  images: Draft["images"];
  onChange: (v: Draft["images"]) => void;
}) {
  const upload = useUploadImage();
  const input = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 8 - images.length);
    const added: Draft["images"] = [];
    for (const f of list) {
      try {
        const r = await upload.mutateAsync(f);
        added.push({ key: uid("img"), ref: r.ref });
      } catch (e) {
        toast.error(`Couldn't add ${f.name}`, { description: errorMessage(e) });
      }
    }
    if (added.length) onChange([...images, ...added]);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = images.findIndex((i) => i.key === active.id);
    const to = images.findIndex((i) => i.key === over.id);
    onChange(arrayMove(images, from, to));
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
                onRemove={() => onChange(images.filter((x) => x.key !== img.key))}
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
                    void addFiles(e.dataTransfer.files);
                  }}
                  className={cn(
                    "flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-small text-muted transition-colors",
                    dragOver
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-line-strong hover:border-ink hover:text-ink",
                  )}
                >
                  {upload.isPending ? (
                    <Skeleton className="size-8" rounded="full" />
                  ) : (
                    <ImagePlus className="size-6" />
                  )}
                  <span className="px-2 text-center">
                    {upload.isPending ? "Adding…" : "Drop or tap to add"}
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
        onChange={(e) => e.target.files && void addFiles(e.target.files)}
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
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  label: string;
  max?: number;
}) {
  const [text, setText] = useState("");
  const add = () => {
    const parts = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const next = [...values];
    for (const p of parts)
      if (!next.some((v) => v.toLowerCase() === p.toLowerCase()) && next.length < max) next.push(p);
    onChange(next);
    setText("");
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-md bg-surface px-2 py-1.5 shadow-[inset_0_0_0_1px_var(--line-strong)] focus-within:shadow-[inset_0_0_0_1.5px_var(--ink),0_0_0_4px_var(--accent-soft)]">
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
              className="flex size-5 items-center justify-center rounded-full hover:bg-ink/10"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
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
        aria-label={label}
        className="h-8 min-w-24 flex-1 bg-transparent px-1 text-body outline-none placeholder:text-faint"
      />
    </div>
  );
}

/* ------------------------------ Options --------------------------------- */

function OptionsField({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: (fn: (d: Draft) => Draft) => void;
}) {
  const setOptions = (options: ProductOption[]) =>
    setDraft((d) => ({ ...d, options, variants: syncVariants(options, d.variants) }));
  return (
    <div className="flex flex-col gap-4">
      {draft.options.map((o, oi) => (
        <div key={o.id} className="rounded-md bg-surface-2 p-4 hairline">
          <div className="flex items-start gap-3">
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

function VariantsTable({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: (fn: (d: Draft) => Draft) => void;
}) {
  const update = (key: string, patch: Partial<Variant>) =>
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
    }));
  const valid = draft.options.every((o) => o.values.length > 0);
  if (!valid)
    return (
      <p className="text-small text-muted">
        Add values to every option to set stock per combination.
      </p>
    );
  return (
    <TableScroll label="Stock per variant" className="rounded-md hairline">
      <table className="w-full min-w-[420px] text-small">
        <thead>
          <tr className="border-b border-line text-left text-muted">
            <th scope="col" className="px-4 py-2.5 eyebrow font-medium">
              {draft.options.length ? "Combination" : "Item"}
            </th>
            <th scope="col" className="w-28 px-3 py-2.5 eyebrow font-medium">
              Stock
            </th>
            <th scope="col" className="w-36 px-3 py-2.5 eyebrow font-medium">
              Extra price (₦)
            </th>
          </tr>
        </thead>
        <tbody>
          {draft.variants.map((v) => (
            <tr key={v.key} className="border-b border-line last:border-0">
              <td className="px-4 py-2">{variantLabel(draft.options, v.key) || "Default"}</td>
              <td className="px-3 py-2">
                <Input
                  className="h-9 font-mono"
                  inputMode="numeric"
                  aria-label={`Stock for ${variantLabel(draft.options, v.key) || "default"}`}
                  value={String(v.stock)}
                  onChange={(e) =>
                    update(v.key, {
                      stock: Math.max(
                        0,
                        Math.min(9999, Number(e.target.value.replace(/\D/g, "")) || 0),
                      ),
                    })
                  }
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  className="h-9 font-mono"
                  inputMode="numeric"
                  aria-label={`Extra price for ${variantLabel(draft.options, v.key) || "default"}`}
                  value={String(v.priceDeltaKobo / 100)}
                  onChange={(e) =>
                    update(v.key, {
                      priceDeltaKobo: (Number(e.target.value.replace(/[^\d]/g, "")) || 0) * 100,
                    })
                  }
                />
              </td>
            </tr>
          ))}
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
    <section className="card p-5 md:p-6">
      <h2 className="text-title font-semibold">{title}</h2>
      {description && <p className="mt-1 text-small text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EditorForm({ product }: { product: Product | undefined }) {
  const { data: brand } = useMyBrand();
  const save = useSaveProduct();
  const router = useRouter();
  const [draft, setDraftState] = useState<Draft>(() =>
    toDraft(product, brand?.category ?? "fashion"),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [detailText, setDetailText] = useState("");
  const setDraft = (fn: (d: Draft) => Draft) => {
    setDirty(true);
    setDraftState(fn);
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const priceKobo = parseNairaInput(draft.price);
  const compareKobo = draft.compareAt ? parseNairaInput(draft.compareAt) : null;

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

  const submit = (status: "published" | "draft") => {
    const input = {
      name: draft.name,
      description: draft.description,
      details: draft.details,
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
    const e: Record<string, string> = {};
    if (priceKobo === null) e.priceKobo = "Enter a price, e.g. 4500";
    if (draft.compareAt && compareKobo === null) e.compareAtKobo = "Enter a number";
    if (compareKobo !== null && priceKobo !== null && compareKobo <= priceKobo)
      e.compareAtKobo = "Must be higher than the price";
    if (draft.options.some((o) => !o.name.trim() || o.values.length === 0))
      e.options = "Every option needs a name and at least one value";
    if (!parsed.success) for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
    if (Object.keys(e).length) {
      setErrors(e);
      toast.error("Check the highlighted fields", { description: Object.values(e)[0] });
      return;
    }
    setErrors({});
    save.mutate(
      { ...(product ? { id: product.id } : {}), input },
      {
        onSuccess: (p) => {
          setDirty(false);
          toast.success(
            product
              ? "Changes saved"
              : status === "published"
                ? "Product is live"
                : "Saved as draft",
            {
              description: status === "published" ? "Buyers can find it now." : undefined,
              action:
                status === "published"
                  ? { label: "View", onClick: () => router.push(`/products/${p.slug}`) }
                  : undefined,
            },
          );
          router.push("/studio/products");
        },
        onError: (err) => toast.error("Couldn't save", { description: errorMessage(err) }),
      },
    );
  };

  return (
    <div>
      <Link
        href="/studio/products"
        className="inline-flex items-center gap-1.5 text-small text-muted hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Products
      </Link>
      <NavPageHeader
        eyebrow={product ? "Edit product" : "New product"}
        title={product ? product.name : "Add a product"}
        actions={
          <>
            <Button
              variant="secondary"
              loading={save.isPending && save.variables?.input.status === "draft"}
              onClick={() => submit("draft")}
            >
              Save draft
            </Button>
            <Button
              loading={save.isPending && save.variables?.input.status === "published"}
              onClick={() => submit("published")}
            >
              {product?.status === "published" ? "Save & keep live" : "Publish"}
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Section
            title="Photos"
            description="Bright, natural light works best. Square-ish framing crops nicely."
          >
            <ImagesField
              images={draft.images}
              onChange={(images) => setDraft((d) => ({ ...d, images }))}
            />
          </Section>
          <Section title="Basics">
            <div className="flex flex-col gap-5">
              <Field label="Name" error={errors.name}>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Indigo Àdìrẹ Boxy Tee"
                  maxLength={80}
                />
              </Field>
              <Field
                label="Description"
                error={errors.description}
                hint="What is it, why is it good, how do people use it?"
              >
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  maxLength={1200}
                />
              </Field>
              <Field
                label="Details"
                optional
                hint="Short facts: materials, size guide, allergens. Press Enter to add."
              >
                <div className="flex flex-col gap-2">
                  {draft.details.map((d, i) => (
                    <div
                      key={`${d}-${i}`}
                      className="flex items-center gap-2 rounded-md bg-surface-2 px-3 py-2 text-small hairline"
                    >
                      <span className="flex-1">{d}</span>
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded-sm hover:bg-ink/[0.06]"
                        aria-label={`Remove detail ${d}`}
                        onClick={() =>
                          setDraft((x) => ({ ...x, details: x.details.filter((_, j) => j !== i) }))
                        }
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  {draft.details.length < 8 && (
                    <Input
                      value={detailText}
                      onChange={(e) => setDetailText(e.target.value)}
                      placeholder="e.g. 100% cotton, 220gsm"
                      maxLength={120}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && detailText.trim()) {
                          e.preventDefault();
                          setDraft((x) => ({ ...x, details: [...x.details, detailText.trim()] }));
                          setDetailText("");
                        }
                      }}
                    />
                  )}
                </div>
              </Field>
            </div>
          </Section>
          <Section title="Pricing">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Price (₦)" error={errors.priceKobo}>
                <Input
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  inputMode="decimal"
                  placeholder="4,500"
                  className="font-mono"
                />
              </Field>
              <Field
                label="Compare-at price (₦)"
                optional
                error={errors.compareAtKobo}
                hint="Shows a strike-through and a % off badge"
              >
                <Input
                  value={draft.compareAt}
                  onChange={(e) => setDraft((d) => ({ ...d, compareAt: e.target.value }))}
                  inputMode="decimal"
                  placeholder="6,000"
                  className="font-mono"
                />
              </Field>
            </div>
          </Section>
          <Section
            title="Options & stock"
            description="Add sizes, colours or flavours. Each combination gets its own stock."
          >
            <OptionsField draft={draft} setDraft={setDraft} />
            {errors.options && (
              <p className="mt-3 text-small font-medium text-danger">{errors.options}</p>
            )}
            <div className="mt-5">
              <VariantsTable draft={draft} setDraft={setDraft} />
            </div>
          </Section>
          <Section title="Organisation">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  label="Category"
                  value={draft.category}
                  onValueChange={(v) => setDraft((d) => ({ ...d, category: v as CategoryId }))}
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Field>
              <Field label="Tags" optional hint="Helps search, e.g. vintage, gift">
                <TagInput
                  label="Tags"
                  values={draft.tags}
                  onChange={(tags) => setDraft((d) => ({ ...d, tags }))}
                  placeholder="vintage, gift"
                  max={8}
                />
              </Field>
            </div>
          </Section>
        </div>
        <aside className="min-w-0">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="card p-5">
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
            <div className="card p-5">
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
              <Button
                className="mt-4 w-full"
                loading={save.isPending}
                onClick={() => submit(draft.status)}
              >
                {draft.status === "published"
                  ? product
                    ? "Save changes"
                    : "Publish"
                  : "Save draft"}
              </Button>
              {priceKobo !== null && (
                <p className="mt-3 text-center text-small text-muted">
                  Sells for {formatNaira(priceKobo)} · you keep 95%
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function ProductEditor({ id }: { id: string | null }) {
  const { data, isPending, error } = useStudioProduct(id);
  const { data: brand, isPending: brandPending } = useMyBrand();
  if ((id && isPending) || brandPending) {
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
  return <EditorForm key={data?.id ?? `new-${brand?.id}`} product={data} />;
}
