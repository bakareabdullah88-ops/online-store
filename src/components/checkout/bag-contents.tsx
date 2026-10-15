"use client";

import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { AlertCircle, Trash2 } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NumberTicker, QuantityStepper } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { spring, stagger } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import { MAX_LINE_QUANTITY } from "@/domain/bag";
import { cn } from "@/lib/cn";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { useBagView, type BagGroupView, type BagItemView } from "./use-bag-view";

function useRemoveWithUndo() {
  const remove = useBag((s) => s.remove);
  const restore = useBag((s) => s.restore);
  return (item: BagItemView) => {
    const line = remove(item.id);
    if (!line) return;
    toast("Removed from bag", {
      description: item.product?.name,
      action: { label: "Undo", onClick: () => restore(line) },
    });
  };
}

function LineItem({
  item,
  index,
  onNavigate,
}: {
  item: BagItemView;
  index: number;
  onNavigate?: () => void;
}) {
  const setQuantity = useBag((s) => s.setQuantity);
  const removeWithUndo = useRemoveWithUndo();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const reveal = useTransform(x, [-120, -40, 0], [1, 0.6, 0]);
  const p = item.product;

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { ...spring.smooth, delay: stagger(index) } }}
      exit={
        reduce
          ? { opacity: 0 }
          : { opacity: 0, x: -80, height: 0, marginTop: 0, transition: { duration: 0.22 } }
      }
      className="relative overflow-hidden rounded-md"
    >
      {/* Swipe-to-remove backdrop (touch) */}
      <motion.div
        style={{ opacity: reveal }}
        className="absolute inset-0 flex items-center justify-end rounded-md bg-danger pr-5 text-white"
        aria-hidden
      >
        <Trash2 className="size-5" />
      </motion.div>
      <motion.div
        style={{ x }}
        drag={reduce ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.6, right: 0.05 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -110 || info.velocity.x < -600) removeWithUndo(item);
        }}
        className="relative flex touch-pan-y gap-3.5 bg-[var(--row-bg,var(--surface))] py-3"
      >
        <Link
          href={p ? `/products/${p.slug}` : "#"}
          onClick={onNavigate}
          className="block size-20 shrink-0 overflow-hidden rounded-sm"
          tabIndex={-1}
          aria-hidden
        >
          {p ? <AppImage image={p.images[0]} alt="" /> : <Skeleton className="size-full" />}
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {p ? (
                <Link
                  href={`/products/${p.slug}`}
                  onClick={onNavigate}
                  className="line-clamp-2 text-small font-medium text-ink hover:underline"
                >
                  {p.name}
                </Link>
              ) : item.unavailable ? (
                <p className="text-small font-medium text-muted">No longer available</p>
              ) : (
                <Skeleton className="h-4 w-36" />
              )}
              {item.label && <p className="mt-1 eyebrow text-muted">{item.label}</p>}
            </div>
            <span className="shrink-0 font-mono text-small font-medium tabular">
              {p ? (
                <NumberTicker value={item.totalKobo} format={(n) => formatNaira(n)} step={100} />
              ) : null}
            </span>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            {p && !item.unavailable ? (
              <QuantityStepper
                size="sm"
                value={item.line.quantity}
                max={Math.max(1, Math.min(item.stock, MAX_LINE_QUANTITY))}
                onChange={(q) => setQuantity(item.id, q)}
                label={`Quantity of ${p.name}`}
              />
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => removeWithUndo(item)}
              className="flex h-9 items-center gap-1.5 rounded-sm px-2 text-small text-muted hover:bg-ink/[0.05] hover:text-ink"
              aria-label={`Remove ${p?.name ?? "item"} from bag`}
            >
              <Trash2 className="size-4" />
              <span className="max-sm:sr-only">Remove</span>
            </button>
          </div>
          {p && item.line.quantity > item.stock && (
            <p className="mt-1.5 flex items-center gap-1.5 text-small text-danger">
              <AlertCircle className="size-3.5" />
              {item.stock === 0 ? "Sold out. Remove to continue." : `Only ${item.stock} left`}
            </p>
          )}
        </div>
      </motion.div>
    </motion.li>
  );
}

function GroupCard({ group, onNavigate }: { group: BagGroupView; onNavigate?: () => void }) {
  const b = group.brand;
  return (
    <motion.section layout="position" className="card pt-4 pb-1">
      <header className="flex items-center gap-3 border-b border-line-thin pb-3">
        <span className="size-8 shrink-0 overflow-hidden rounded-full">
          <AppImage image={b?.logo} alt="" variant="logo" name={b?.name ?? ""} />
        </span>
        <div className="min-w-0 flex-1">
          {b ? (
            <Link
              href={`/brands/${b.handle}`}
              onClick={onNavigate}
              className="block truncate text-small font-semibold hover:underline"
            >
              {b.name}
            </Link>
          ) : (
            <Skeleton className="h-4 w-28" />
          )}
          <p className="eyebrow text-muted">
            Separate order · {group.count} item{group.count === 1 ? "" : "s"}
          </p>
        </div>
        <span className="font-mono text-small text-ink-2 tabular">
          {formatNaira(group.subtotalKobo)}
        </span>
      </header>
      {group.blockedReason && (
        <p className="mt-3 flex items-start gap-2 rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {group.blockedReason}
        </p>
      )}
      <ul className="divide-y divide-line-thin">
        <AnimatePresence initial={false}>
          {group.items.map((item, i) => (
            <LineItem key={item.id} item={item} index={i} onNavigate={onNavigate} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}

export function BagSkeleton() {
  return (
    <div className="flex flex-col" aria-hidden>
      {[0, 1].map((g) => (
        <div key={g} className="card pt-4 pb-3">
          <div className="flex items-center gap-3 border-b border-line-thin pb-3">
            <Skeleton className="size-8" rounded="full" />
            <Skeleton className="h-4 w-32" />
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3.5 py-3">
              <Skeleton className="size-20" />
              <div className="flex-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-16" />
                <Skeleton className="mt-5 h-9 w-28" rounded="full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Bag body: groups by brand. Used by the drawer and the /bag page. */
export function BagContents({ onNavigate }: { onNavigate?: () => void }) {
  const { groups, isEmpty, loading } = useBagView();
  if (isEmpty) {
    return (
      <EmptyState
        illustration="bag"
        title="Your bag is empty"
        body="Find something from a brand on your campus. Most orders are ready the same day."
        action={
          <ButtonLink href="/explore" onClick={onNavigate}>
            Start exploring
          </ButtonLink>
        }
      />
    );
  }
  if (loading && groups.every((g) => g.items.every((i) => !i.product))) return <BagSkeleton />;
  return (
    <div className="flex flex-col">
      {groups.length > 1 && (
        <p className="pb-4 text-small text-muted">
          Your bag has items from {groups.length} brands, so you&apos;ll get {groups.length}{" "}
          separate orders, each tracked on its own.
        </p>
      )}
      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <GroupCard key={g.brandId} group={g} onNavigate={onNavigate} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function BagSummary({ className }: { className?: string }) {
  const { subtotalKobo, count, groups } = useBagView();
  const blocked = groups.some(
    (g) => g.blockedReason || g.items.some((i) => i.unavailable || i.line.quantity > i.stock),
  );
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-small text-muted">
          Subtotal · {count} item{count === 1 ? "" : "s"}
        </span>
        <span className="font-display text-display-sm">
          <NumberTicker value={subtotalKobo} format={(n) => formatNaira(n)} step={100} />
        </span>
      </div>
      <p className="text-small text-muted">Delivery and promo codes are applied at checkout.</p>
      {blocked && <p className="text-small text-warning">Fix the highlighted items to continue.</p>}
    </div>
  );
}
