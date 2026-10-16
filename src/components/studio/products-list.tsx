"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Ban,
  Boxes,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import { CardMenu } from "@/components/dash/card";
import { Gauge } from "@/components/dash/gauge";
import { DataTable, FilterMenu, StatusTag, type Column } from "@/components/table/data-table";
import { TableEmpty } from "@/components/table/empty";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover } from "@/components/ui/overlay";
import { Dialog } from "@/components/ui/sheet";
import { categories } from "@/config/categories";
import { presetRange } from "@/domain/analytics";
import { formatNaira } from "@/domain/money";
import { stockState, totalStock, variantLabel } from "@/domain/variants";
import { formatDate } from "@/lib/format";
import { useMediaQuery } from "@/lib/use-media-query";
import {
  useBulkProducts,
  useProductAnalytics,
  useSaveProduct,
  useStudioProducts,
} from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { ProductInput } from "@/services/inputs";
import type { CategoryId, Product, Variant } from "@/services/types";
import { toast } from "@/stores/toast";

type Status = "all" | "published" | "draft";
type Stock = "all" | "low" | "out";
const range = presetRange("30d");

function stockTag(p: Product) {
  const n = totalStock(p);
  const s = stockState(n);
  if (s === "sold_out") return <StatusTag tone="red">Sold out</StatusTag>;
  if (s === "low") return <StatusTag tone="amber">{n} left</StatusTag>;
  return <span className="tabular">{n}</span>;
}

/** The whole product as a save input, with some fields changed. */
function asInput(p: Product, patch: Partial<ProductInput>): ProductInput {
  return {
    name: p.name,
    description: p.description,
    details: p.details,
    category: p.category,
    tags: p.tags,
    priceKobo: p.priceKobo,
    ...(p.compareAtKobo ? { compareAtKobo: p.compareAtKobo } : {}),
    imageIds: [],
    keepImages: p.images,
    options: p.options,
    variants: p.variants,
    status: p.status,
    ...patch,
  };
}

/** Saves new stock numbers for a product, with an Undo that puts the old ones back. */
function useSetStock() {
  const save = useSaveProduct();
  const setStock = (p: Product, variants: Variant[], message: string, done?: () => void) =>
    save.mutate(
      { id: p.id, input: asInput(p, { variants }) },
      {
        onSuccess: () => {
          done?.();
          toast.success(message, {
            action: {
              label: "Undo",
              onClick: () =>
                save.mutate(
                  { id: p.id, input: asInput(p, { variants: p.variants }) },
                  {
                    onError: (e) =>
                      toast.error("Couldn't undo that", { description: errorMessage(e) }),
                  },
                ),
            },
          });
        },
        onError: (e) =>
          toast.error("That didn't go through. Try again?", { description: errorMessage(e) }),
      },
    );
  return { setStock, pending: save.isPending };
}

/** "Edit stock": a small popover with one number per variant. */
function StockPopover({
  product,
  open,
  onOpenChange,
  trigger,
}: {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
}) {
  const { setStock, pending } = useSetStock();
  const [values, setValues] = useState<Record<string, string>>({});
  const valueOf = (v: Variant) => values[v.key] ?? String(v.stock);
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (!o) setValues({});
        onOpenChange(o);
      }}
      align="end"
      className="w-72"
      trigger={trigger}
    >
      <form
        // Rendered in a portal, but React still bubbles clicks to the row (which opens the editor).
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          const variants = product.variants.map((v) => ({
            ...v,
            stock: Math.min(9999, Number(valueOf(v)) || 0),
          }));
          setStock(product, variants, `Stock updated for ${product.name}`, () => {
            setValues({});
            onOpenChange(false);
          });
        }}
      >
        <p className="text-small font-semibold">How many do you have?</p>
        <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
          {product.variants.map((v) => {
            const name = variantLabel(product.options, v.key) || product.name;
            return (
              <label key={v.key} className="flex items-center justify-between gap-3 text-small">
                <span className="min-w-0 truncate">{name}</span>
                <Input
                  className="h-9 w-20 shrink-0 font-mono"
                  inputMode="numeric"
                  aria-label={`Stock for ${name}`}
                  value={valueOf(v)}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) =>
                    setValues((x) => ({
                      ...x,
                      [v.key]: e.target.value.replace(/\D/g, "").slice(0, 4),
                    }))
                  }
                />
              </label>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" type="submit" loading={pending}>
            Save
          </Button>
        </div>
      </form>
    </Popover>
  );
}

/** Shop products as a table (image 4) with each product's performance gauge (image 2). */
export function StudioProducts() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/studio/products";
  const status = (
    ["published", "draft"].includes(params.get("status") ?? "") ? params.get("status") : "all"
  ) as Status;
  const stock = (
    ["low", "out"].includes(params.get("stock") ?? "") ? params.get("stock") : "all"
  ) as Stock;
  const category = (
    categories.some((c) => c.id === params.get("category")) ? params.get("category") : "all"
  ) as CategoryId | "all";
  // Search follows the URL (links like ?q=…), and can be typed over.
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [seenQ, setSeenQ] = useState(urlQ);
  if (urlQ !== seenQ) {
    setSeenQ(urlQ);
    setQ(urlQ);
  }
  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const { data, isPending } = useStudioProducts({});
  const stats = useProductAnalytics(range).data?.stats;
  const bulk = useBulkProducts();
  const [confirmDelete, setConfirmDelete] = useState<Product[] | null>(null);
  const { setStock } = useSetStock();
  const wide = useMediaQuery("(min-width: 768px)");
  /** The open stock popover: which product, anchored in the table or on a phone card. */
  const [stockFor, setStockFor] = useState<{ id: string; where: "table" | "card" } | null>(null);
  const stockEditor = (p: Product, where: "table" | "card", trigger: ReactNode) => (
    <StockPopover
      product={p}
      open={stockFor?.id === p.id && stockFor.where === where}
      onOpenChange={(o) => setStockFor(o ? { id: p.id, where } : null)}
      trigger={trigger}
    />
  );

  const scoreOf = useMemo(() => new Map((stats ?? []).map((s) => [s.productId, s])), [stats]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (category !== "all" && p.category !== category) return false;
      const st = stockState(totalStock(p));
      if (stock === "low" && st !== "low") return false;
      if (stock === "out" && st !== "sold_out") return false;
      return (
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [data, q, status, category, stock]);

  const run = (items: Product[], action: "publish" | "draft" | "delete", done?: () => void) =>
    bulk.mutate(
      { ids: items.map((p) => p.id), action },
      {
        onSuccess: () => {
          done?.();
          const n = items.length;
          toast.success(
            action === "delete"
              ? `Deleted ${n} product${n > 1 ? "s" : ""}`
              : action === "publish"
                ? `Published ${n}`
                : `Moved ${n} to drafts`,
          );
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  const columns: Column<Product>[] = [
    {
      key: "product",
      header: "Product",
      csv: (p) => p.name,
      cell: (p) => (
        <Link
          href={`/studio/products/${p.id}`}
          className="flex min-w-0 items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="size-10 shrink-0 overflow-hidden rounded-md bg-sand">
            <AppImage image={p.images[0]} alt="" name={p.name} sizes="40px" />
          </span>
          <span className="min-w-0">
            <span className="block max-w-56 truncate font-medium hover:underline">{p.name}</span>
            <span className="block text-[12px] text-muted">Updated {formatDate(p.updatedAt)}</span>
          </span>
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      csv: (p) => p.category,
      cell: (p) => categories.find((c) => c.id === p.category)?.name ?? p.category,
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      csv: (p) => p.priceKobo / 100,
      cell: (p) => <span className="font-medium tabular">{formatNaira(p.priceKobo)}</span>,
    },
    {
      key: "stock",
      header: "Stock",
      align: "center",
      csv: (p) => totalStock(p),
      cell: (p) =>
        stockEditor(
          p,
          "table",
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Edit stock for ${p.name}, ${totalStock(p)} in stock`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 hover:bg-ink/[0.05]"
          >
            {stockTag(p)}
          </button>,
        ),
    },
    {
      key: "performance",
      header: "Performance",
      csv: (p) => scoreOf.get(p.id)?.score ?? 0,
      cell: (p) => {
        const s = scoreOf.get(p.id);
        return (
          <span className="flex items-center gap-2.5">
            <Gauge value={s?.score ?? 0} size={44} />
            <span className="text-[12.5px] leading-tight">
              <span className="block font-medium">{s?.performance ?? "New"}</span>
              <span className="text-muted tabular">{s?.views ?? 0} views</span>
            </span>
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      csv: (p) => p.status,
      cell: (p) =>
        p.status === "published" ? (
          <StatusTag tone="green">Published</StatusTag>
        ) : (
          <StatusTag tone="grey">Draft</StatusTag>
        ),
    },
  ];

  return (
    <div>
      <NavPageHeader
        title="All products"
        description="Everything in your shop. Drafts aren't visible to buyers."
        actions={
          <>
            <ButtonLink href="/studio/products/new" leadingIcon={<Plus className="size-4.5" />}>
              Add product
            </ButtonLink>
            <CardMenu
              label="Products"
              actions={[
                { label: "Product analytics", href: "/studio/analytics", icon: <BarChart3 /> },
                { label: "Promotions", href: "/studio/promotions", icon: <Tag /> },
              ]}
            />
          </>
        }
      />
      <DataTable
        label="Products"
        loading={isPending}
        rows={rows}
        columns={columns}
        getId={(p) => p.id}
        rowLabel={(p) => p.name}
        exportName="products"
        onRowClick={(p) => router.push(`/studio/products/${p.id}`)}
        search={{ value: q, onChange: setQ, placeholder: "Search products…" }}
        filters={
          <>
            <FilterMenu<Status>
              label="Status"
              value={status}
              onChange={(v) => setParam("status", v, "all")}
              options={[
                { value: "all", label: "All statuses" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Drafts" },
              ]}
            />
            <FilterMenu<CategoryId | "all">
              label="Category"
              value={category}
              onChange={(v) => setParam("category", v, "all")}
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <FilterMenu<Stock>
              label="Stock"
              value={stock}
              onChange={(v) => setParam("stock", v, "all")}
              options={[
                { value: "all", label: "Any stock" },
                { value: "low", label: "Low stock" },
                { value: "out", label: "Sold out" },
              ]}
            />
          </>
        }
        bulkActions={(sel, clear) => (
          <>
            <Button
              size="sm"
              variant="secondary"
              loading={bulk.isPending}
              onClick={() => run(sel, "publish", clear)}
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={bulk.isPending}
              onClick={() => run(sel, "draft", clear)}
            >
              Move to drafts
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(sel)}>
              Delete
            </Button>
          </>
        )}
        rowActions={(p) => [
          { label: "Edit", icon: <Pencil />, href: `/studio/products/${p.id}` },
          { label: "Duplicate", icon: <Copy />, href: `/studio/products/new?from=${p.id}` },
          {
            label: "Edit stock",
            icon: <Boxes />,
            onSelect: () => setStockFor({ id: p.id, where: wide ? "table" : "card" }),
          },
          {
            label: "Mark sold out",
            icon: <Ban />,
            hidden: totalStock(p) === 0,
            onSelect: () =>
              setStock(
                p,
                p.variants.map((v) => ({ ...v, stock: 0 })),
                `${p.name} is sold out`,
              ),
          },
          {
            label: "View in the market",
            icon: <ExternalLink />,
            href: `/products/${p.slug}`,
            hidden: p.status !== "published",
          },
          p.status === "published"
            ? { label: "Move to drafts", icon: <EyeOff />, onSelect: () => run([p], "draft") }
            : { label: "Publish", icon: <Eye />, onSelect: () => run([p], "publish") },
          {
            label: "Delete",
            icon: <Trash2 />,
            danger: true,
            onSelect: () => setConfirmDelete([p]),
          },
        ]}
        card={(p) => (
          <div className="flex items-center gap-3">
            <span className="size-14 shrink-0 overflow-hidden rounded-md bg-sand">
              <AppImage image={p.images[0]} alt="" name={p.name} sizes="56px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="mt-0.5 text-[12.5px] text-muted tabular">
                {formatNaira(p.priceKobo)} ·{" "}
                {stockEditor(
                  p,
                  "card",
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Edit stock for ${p.name}`}
                    className="relative underline decoration-line-strong underline-offset-2 after:absolute after:-inset-x-2 after:-inset-y-3 after:content-['']"
                  >
                    {totalStock(p) ? `${totalStock(p)} in stock` : "Sold out"}
                  </button>,
                )}
              </p>
              <div className="mt-1.5">
                {p.status === "published" ? (
                  <StatusTag tone="green">Published</StatusTag>
                ) : (
                  <StatusTag tone="grey">Draft</StatusTag>
                )}
              </div>
            </div>
            <Gauge value={scoreOf.get(p.id)?.score ?? 0} size={48} />
          </div>
        )}
        empty={
          (data?.length ?? 0) === 0 ? (
            <TableEmpty
              icon={Package}
              title="No products yet"
              body="Add your first product with a photo, a price and how many you have."
              action={
                <ButtonLink href="/studio/products/new" leadingIcon={<Plus className="size-4" />}>
                  Add a product
                </ButtonLink>
              }
            />
          ) : (
            <TableEmpty
              icon={Package}
              title="Nothing matches"
              body="Try another search or clear the filters."
              action={
                <ButtonLink href="/studio/products" variant="secondary">
                  Clear filters
                </ButtonLink>
              }
            />
          )
        }
      />
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.length === 1 ? `“${confirmDelete[0]!.name}”` : `${confirmDelete?.length ?? 0} products`}?`}
        description="They'll disappear from your shop and the market. Past orders keep their details."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={bulk.isPending}
              onClick={() =>
                confirmDelete && run(confirmDelete, "delete", () => setConfirmDelete(null))
              }
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-small text-muted">This can&apos;t be undone.</p>
      </Dialog>
    </div>
  );
}
