"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ExternalLink,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import { CardMenu } from "@/components/dash/card";
import { Gauge } from "@/components/dash/gauge";
import { DataTable, FilterMenu, StatusTag, type Column } from "@/components/table/data-table";
import { TableEmpty } from "@/components/table/empty";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/sheet";
import { categories } from "@/config/categories";
import { presetRange } from "@/domain/analytics";
import { formatNaira } from "@/domain/money";
import { stockState, totalStock } from "@/domain/variants";
import { formatDate } from "@/lib/format";
import { useBulkProducts, useProductAnalytics, useStudioProducts } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { CategoryId, Product } from "@/services/types";
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
  const [q, setQ] = useState(params.get("q") ?? "");
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
          <span className="size-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
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
    { key: "stock", header: "Stock", align: "center", csv: (p) => totalStock(p), cell: stockTag },
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
            <span className="size-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
              <AppImage image={p.images[0]} alt="" name={p.name} sizes="56px" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="mt-0.5 text-[12.5px] text-muted tabular">
                {formatNaira(p.priceKobo)} · {totalStock(p)} in stock
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
