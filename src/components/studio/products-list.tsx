"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { Eye, EyeOff, LayoutGrid, List, MoreHorizontal, Pencil, Plus, Trash2, ExternalLink } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/input";
import { Pill } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, Select } from "@/components/ui/overlay";
import { Dialog } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { categories } from "@/config/categories";
import { spring } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import { stockState, totalStock } from "@/domain/variants";
import { formatDate } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useBulkProducts, useStudioProducts } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { CategoryId, Product } from "@/services/types";
import { usePrefs } from "@/stores/ui";
import { toast } from "@/stores/toast";
import { StudioHeaderBlock } from "./studio-shell";

function StockLabel({ p }: { p: Product }) {
  const n = totalStock(p);
  const s = stockState(n);
  return <span className={cn("font-mono tabular", s === "sold_out" ? "text-danger" : s === "low" ? "text-warning" : "text-ink-2")}>{s === "sold_out" ? "Sold out" : `${n} in stock`}</span>;
}

function RowMenu({ p, onDelete, onToggle }: { p: Product; onDelete: () => void; onToggle: () => void }) {
  const router = useRouter();
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}>
          <MoreHorizontal className="size-4.5" />
        </Button>
      </MenuTrigger>
      <MenuContent>
        <MenuItem icon={<Pencil />} onSelect={() => router.push(`/studio/products/${p.id}`)}>
          Edit
        </MenuItem>
        {p.status === "published" && (
          <MenuItem icon={<ExternalLink />} onSelect={() => window.open(`/products/${p.slug}`, "_blank", "noopener")}>
            View on Kiosk
          </MenuItem>
        )}
        <MenuItem icon={p.status === "published" ? <EyeOff /> : <Eye />} onSelect={onToggle}>
          {p.status === "published" ? "Move to drafts" : "Publish"}
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<Trash2 />} danger onSelect={onDelete}>
          Delete
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function StudioProducts() {
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const view = usePrefs((s) => s.studioProductsView);
  const setPrefs = usePrefs((s) => s.set);
  const mounted = useMounted();
  const { data, isPending } = useStudioProducts({ q: deferredQ, status, ...(category !== "all" ? { category } : {}) });
  const bulk = useBulkProducts();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);

  const items = useMemo(() => data ?? [], [data]);
  const visibleSelected = items.filter((p) => selected.has(p.id)).map((p) => p.id);
  const allChecked = items.length > 0 && visibleSelected.length === items.length;

  const run = (ids: string[], action: "publish" | "draft" | "delete") =>
    bulk.mutate(
      { ids, action },
      {
        onSuccess: () => {
          setSelected(new Set());
          toast.success(
            action === "delete" ? `Deleted ${ids.length} product${ids.length > 1 ? "s" : ""}` : action === "publish" ? `Published ${ids.length}` : `Moved ${ids.length} to drafts`,
          );
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <StudioHeaderBlock
        eyebrow="Products"
        title="Products"
        description="Everything in your shop. Drafts aren't visible to buyers."
        actions={
          <ButtonLink href="/studio/products/new" leadingIcon={<Plus className="size-4.5" />}>
            New product
          </ButtonLink>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-72">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} onClear={() => setQ("")} placeholder="Search your products" aria-label="Search products" inputSize="md" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            size="sm"
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "published", label: "Live" },
              { value: "draft", label: "Drafts" },
            ]}
          />
          <div className="w-44">
            <Select label="Category" value={category} onValueChange={(v) => setCategory(v as CategoryId | "all")} className="h-9 text-small" options={[{ value: "all", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
          </div>
        </div>
        <SegmentedControl
          size="sm"
          className="lg:ml-auto"
          label="View"
          value={mounted ? view : "table"}
          onChange={(v) => setPrefs({ studioProductsView: v })}
          options={[
            { value: "table", label: "Table", icon: <List className="size-4" /> },
            { value: "grid", label: "Grid", icon: <LayoutGrid className="size-4" /> },
          ]}
        />
      </div>

      <AnimatePresence>
        {visibleSelected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={spring.snappy}
            className="sticky top-20 z-(--z-sticky) mb-4 flex flex-wrap items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-on-primary shadow-md"
            role="region"
            aria-label="Bulk actions"
          >
            <span className="mr-2 text-small font-medium">{visibleSelected.length} selected</span>
            <Button size="sm" variant="ghost" className="text-on-primary hover:bg-on-primary/10" onClick={() => run(visibleSelected, "publish")}>
              Publish
            </Button>
            <Button size="sm" variant="ghost" className="text-on-primary hover:bg-on-primary/10" onClick={() => run(visibleSelected, "draft")}>
              Move to drafts
            </Button>
            <Button size="sm" variant="ghost" className="text-on-primary hover:bg-on-primary/10" onClick={() => setConfirmDelete(visibleSelected)}>
              Delete
            </Button>
            <Button size="sm" variant="ghost" className="ml-auto text-on-primary hover:bg-on-primary/10" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" rounded="md" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          illustration="products"
          title={q || status !== "all" || category !== "all" ? "No products match" : "No products yet"}
          body={q || status !== "all" || category !== "all" ? "Try a different search or filter." : "Add your first product. It takes about two minutes."}
          action={<ButtonLink href="/studio/products/new">Add a product</ButtonLink>}
        />
      ) : (mounted ? view : "table") === "table" ? (
        <div className="overflow-x-auto rounded-lg bg-surface hairline">
          <table className="w-full min-w-[720px] text-small">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th scope="col" className="w-12 px-4 py-3">
                  <Checkbox hideLabel label="Select all products" checked={allChecked ? true : visibleSelected.length ? "indeterminate" : false} onCheckedChange={(v) => setSelected(v ? new Set(items.map((p) => p.id)) : new Set())} />
                </th>
                <th scope="col" className="eyebrow py-3 font-medium">Product</th>
                <th scope="col" className="eyebrow px-3 py-3 font-medium">Status</th>
                <th scope="col" className="eyebrow px-3 py-3 font-medium">Stock</th>
                <th scope="col" className="eyebrow px-3 py-3 text-right font-medium">Price</th>
                <th scope="col" className="eyebrow px-3 py-3 text-right font-medium">Sold</th>
                <th scope="col" className="eyebrow px-3 py-3 font-medium">Updated</th>
                <th scope="col" className="w-12 px-3 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {items.map((p) => (
                  <motion.tr key={p.id} layout="position" exit={{ opacity: 0 }} className={cn("border-b border-line last:border-0", selected.has(p.id) ? "bg-accent-soft/50" : "hover:bg-ink/[0.02]")}>
                    <td className="px-4 py-2.5">
                      <Checkbox hideLabel label={`Select ${p.name}`} checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                    </td>
                    <td className="py-2.5">
                      <Link href={`/studio/products/${p.id}`} className="flex items-center gap-3">
                        <span className="size-11 shrink-0 overflow-hidden rounded-sm">
                          <AppImage image={p.images[0]} alt="" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium hover:underline">{p.name}</span>
                          <span className="block text-muted capitalize">{p.category}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">{p.status === "published" ? <Pill tone="success" dot>Live</Pill> : <Pill>Draft</Pill>}</td>
                    <td className="px-3 py-2.5">
                      <StockLabel p={p} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono tabular">{formatNaira(p.priceKobo)}</td>
                    <td className="px-3 py-2.5 text-right font-mono tabular">{p.salesCount}</td>
                    <td className="px-3 py-2.5 text-muted">{mounted ? formatDate(p.updatedAt) : ""}</td>
                    <td className="px-3 py-2.5">
                      <RowMenu p={p} onDelete={() => setConfirmDelete([p.id])} onToggle={() => run([p.id], p.status === "published" ? "draft" : "publish")} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <li key={p.id} className={cn("relative overflow-hidden rounded-lg bg-surface hairline", selected.has(p.id) && "ring-2 ring-accent")}>
              <Link href={`/studio/products/${p.id}`} className="block">
                <div className="aspect-[4/5]">
                  <AppImage image={p.images[0]} alt="" />
                </div>
                <div className="p-3">
                  <p className="truncate text-small font-medium">{p.name}</p>
                  <p className="mt-1 flex items-center justify-between text-small">
                    <span className="font-mono tabular">{formatNaira(p.priceKobo)}</span>
                    <StockLabel p={p} />
                  </p>
                </div>
              </Link>
              <div className="absolute top-2 left-2 rounded-xs bg-surface/90 p-1">
                <Checkbox hideLabel label={`Select ${p.name}`} checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
              </div>
              <div className="absolute top-2 right-2">{p.status === "published" ? <Pill tone="success">Live</Pill> : <Pill className="bg-surface">Draft</Pill>}</div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
        title={`Delete ${confirmDelete?.length === 1 ? "this product" : `${confirmDelete?.length} products`}?`}
        description="Buyers won't see it anymore. Past orders keep their details."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={bulk.isPending}
              onClick={() => {
                if (confirmDelete) run(confirmDelete, "delete");
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">Tip: move it to drafts instead if you might sell it again.</p>
      </Dialog>
    </div>
  );
}
