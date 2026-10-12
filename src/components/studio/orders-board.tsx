"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Bike, Columns3, List, MapPin, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/overlay";
import { Dialog, ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { AppImage } from "@/components/ui/app-image";
import { StatusPill } from "@/components/orders/status-pill";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { brand as appBrand } from "@/config/brand";
import { spring } from "@/design/motion";
import { canTransition, nextSellerStatus, statusLabel, stepsFor } from "@/domain/orders";
import { formatNaira } from "@/domain/money";
import { formatDate, formatRelative, formatTime } from "@/lib/format";
import { useMounted, useNow } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useCampuses } from "@/queries/catalog";
import { useMyBrand, useStudioOrders, useUpdateOrderStatus } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { Order, OrderStatus } from "@/services/types";
import { usePrefs } from "@/stores/ui";
import { toast } from "@/stores/toast";
import { StudioHeaderBlock } from "./studio-shell";

type ColumnId = "new" | "accepted" | "preparing" | "ready" | "done";

const columns: { id: ColumnId; title: string; hint: string }[] = [
  { id: "new", title: "New", hint: "Accept or decline" },
  { id: "accepted", title: "Accepted", hint: "Start preparing" },
  { id: "preparing", title: "Preparing", hint: "Pack it up" },
  { id: "ready", title: "Ready / out", hint: "Hand over" },
  { id: "done", title: "Completed", hint: "Most recent" },
];

function columnOf(o: Order): ColumnId | null {
  switch (o.status) {
    case "placed":
      return "new";
    case "confirmed":
      return "accepted";
    case "preparing":
      return "preparing";
    case "ready":
    case "out_for_delivery":
      return "ready";
    case "delivered":
      return "done";
    default:
      return null;
  }
}

function targetStatus(o: Order, col: ColumnId): OrderStatus | null {
  switch (col) {
    case "accepted":
      return "confirmed";
    case "preparing":
      return "preparing";
    case "ready":
      return o.fulfilment.method === "pickup" ? "ready" : "out_for_delivery";
    case "done":
      return "delivered";
    default:
      return null;
  }
}

/** Forward path from the current status to `to` along the happy path. */
function pathTo(o: Order, to: OrderStatus): OrderStatus[] | null {
  const steps = stepsFor(o.fulfilment.method);
  const a = steps.indexOf(o.status);
  const b = steps.indexOf(to);
  if (a < 0 || b <= a) return null;
  return steps.slice(a + 1, b + 1);
}

function actionLabel(o: Order, s: OrderStatus) {
  switch (s) {
    case "confirmed":
      return "Accept";
    case "preparing":
      return "Start preparing";
    case "ready":
      return "Mark ready";
    case "out_for_delivery":
      return "Send out";
    case "delivered":
      return o.fulfilment.method === "pickup" ? "Mark picked up" : "Mark delivered";
    default:
      return statusLabel(s);
  }
}

function useAdvance() {
  const update = useUpdateOrderStatus();
  const advance = async (o: Order, path: OrderStatus[]) => {
    try {
      let current = o;
      for (const s of path) {
        if (!canTransition(current, s)) throw new Error(`Can't move to ${statusLabel(s, o.fulfilment.method)} yet`);
        current = await update.mutateAsync({ id: o.id, status: s });
      }
      const last = path[path.length - 1];
      if (last) toast.success(`${o.code} · ${statusLabel(last, o.fulfilment.method)}`, { description: `${o.buyerName} has been notified.` });
    } catch (e) {
      toast.error("Couldn't update the order", { description: errorMessage(e) });
    }
  };
  return { advance, pending: update.isPending };
}

function OrderCardContent({ o, now, dragging }: { o: Order; now: number | null; dragging?: boolean }) {
  const units = o.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <div className={cn("rounded-md bg-surface p-3.5 hairline", dragging && "rotate-[1.5deg] shadow-lg ring-2 ring-accent")}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-small font-semibold whitespace-nowrap">{o.code}</span>
        <span className="truncate text-[12px] text-muted">{now ? formatRelative(o.placedAt, now) : ""}</span>
      </div>
      <p className="mt-1 truncate text-small text-ink-2">{o.buyerName}</p>
      <div className="mt-2.5 flex items-center gap-1.5">
        {o.items.slice(0, 3).map((it) => (
          <span key={it.productId + it.variantKey} className="size-8 overflow-hidden rounded-xs">
            <AppImage image={it.image} alt="" />
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[12px] text-muted">
          {o.fulfilment.method === "delivery" ? <Bike className="size-3.5" /> : <MapPin className="size-3.5" />}
          {units} · <span className="font-mono text-ink">{formatNaira(o.totalKobo)}</span>
        </span>
      </div>
    </div>
  );
}

function DraggableCard({ o, now, onOpen, onAdvance, busy }: { o: Order; now: number | null; onOpen: () => void; onAdvance: (path: OrderStatus[]) => void; busy: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: o.id, data: { order: o } });
  const next = nextSellerStatus(o);
  return (
    <motion.li layout layoutId={`order-${o.id}`} transition={spring.smooth} className={cn("list-none", isDragging && "opacity-30")}>
      <div ref={setNodeRef} {...attributes} {...listeners} role="button" tabIndex={0} aria-label={`Order ${o.code} from ${o.buyerName}. Press space to drag, or enter to open.`} onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
        listeners?.onKeyDown?.(e);
      }} onClick={onOpen} className="cursor-grab touch-manipulation rounded-md outline-offset-2 active:cursor-grabbing">
        <OrderCardContent o={o} now={now} />
      </div>
      {(next || o.status === "placed") && (
        <div className="mt-1.5 flex gap-1.5">
          {o.status === "placed" && (
            <Button size="sm" variant="ghost" className="h-8 flex-1 text-danger" disabled={busy} onClick={() => onAdvance(["declined"])}>
              Decline
            </Button>
          )}
          {next && (
            <Button size="sm" variant="secondary" className="h-8 flex-1" disabled={busy} onClick={() => onAdvance([next])}>
              {actionLabel(o, next)}
            </Button>
          )}
        </div>
      )}
    </motion.li>
  );
}

function Column({ id, title, hint, orders, now, onOpen, onAdvance, busy }: { id: ColumnId; title: string; hint: string; orders: Order[]; now: number | null; onOpen: (o: Order) => void; onAdvance: (o: Order, path: OrderStatus[]) => void; busy: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <section aria-label={`${title}, ${orders.length} orders`} className="flex w-72 shrink-0 flex-col xl:w-auto xl:min-w-0 xl:flex-1">
      <header className="mb-3 flex items-baseline justify-between gap-2 px-1 whitespace-nowrap">
        <h2 className="text-small font-semibold">
          {title} <span className="ml-1 font-mono text-muted">{orders.length}</span>
        </h2>
        <span className="truncate text-[12px] text-muted">{hint}</span>
      </header>
      <ul
        ref={setNodeRef}
        className={cn("flex min-h-40 flex-1 flex-col gap-3 rounded-lg p-2 transition-colors duration-200", isOver ? "bg-accent-soft ring-2 ring-accent/40" : "bg-canvas-sunk")}
      >
        <AnimatePresence initial={false}>
          {orders.map((o) => (
            <DraggableCard key={o.id} o={o} now={now} onOpen={() => onOpen(o)} onAdvance={(p) => onAdvance(o, p)} busy={busy} />
          ))}
        </AnimatePresence>
        {orders.length === 0 && <li className="flex flex-1 items-center justify-center p-4 text-center text-[12px] text-faint">Drop orders here</li>}
      </ul>
    </section>
  );
}

function Receipt({ o, campusName }: { o: Order; campusName: string }) {
  const mounted = useMounted();
  return (
    <div id="receipt" className="mx-auto max-w-sm rounded-md bg-white p-6 font-mono text-[12px] leading-relaxed text-black shadow-sm ring-1 ring-black/10">
      <p className="text-center text-[14px] font-semibold uppercase tracking-widest">{o.brandName}</p>
      <p className="text-center">via {appBrand.name} · {campusName}</p>
      <p className="mt-3 border-y border-dashed border-black/40 py-2 text-center">
        ORDER {o.code}
        <br />
        {mounted ? `${formatDate(o.placedAt, { year: true })} ${formatTime(o.placedAt)}` : ""}
      </p>
      <table className="mt-3 w-full">
        <tbody>
          {o.items.map((it) => (
            <tr key={it.productId + it.variantKey} className="align-top">
              <td className="pr-2">
                {it.quantity}× {it.name}
                {it.variantLabel && <span className="block opacity-70">  {it.variantLabel}</span>}
              </td>
              <td className="text-right">{formatNaira(it.unitPriceKobo * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 border-t border-dashed border-black/40 pt-2">
        <p className="flex justify-between"><span>Subtotal</span><span>{formatNaira(o.subtotalKobo)}</span></p>
        <p className="flex justify-between"><span>{o.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}</span><span>{o.deliveryFeeKobo ? formatNaira(o.deliveryFeeKobo) : "FREE"}</span></p>
        {o.discountKobo > 0 && <p className="flex justify-between"><span>Discount {o.promoCode}</span><span>-{formatNaira(o.discountKobo)}</span></p>}
        <p className="mt-1 flex justify-between text-[14px] font-semibold"><span>TOTAL</span><span>{formatNaira(o.totalKobo)}</span></p>
        <p className="flex justify-between"><span>Payment</span><span className="uppercase">{o.payment.method.replace(/_/g, " ")} · {o.payment.status}</span></p>
      </div>
      <p className="mt-3 border-t border-dashed border-black/40 pt-2">
        {o.buyerName} · {o.buyerPhone}
        <br />
        {o.fulfilment.addressLine ?? "Pickup"}
        {o.fulfilment.note && (
          <>
            <br />Note: {o.fulfilment.note}
          </>
        )}
      </p>
      <p className="mt-3 text-center">Thank you! · Demo receipt</p>
    </div>
  );
}

function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const campuses = useCampuses();
  const { advance, pending } = useAdvance();
  const [receipt, setReceipt] = useState(false);
  const campus = campuses.data?.find((c) => c.id === order?.fulfilment.campusId);
  const zone = campus?.zones.find((z) => z.id === order?.fulfilment.zoneId);
  const point = campus?.pickupPoints.find((p) => p.id === order?.fulfilment.pickupPointId);
  const next = order ? nextSellerStatus(order) : null;
  return (
    <>
      <ResponsiveSheet
        open={!!order}
        onOpenChange={(v) => !v && onClose()}
        title={order ? `Order ${order.code}` : "Order"}
        description={order ? `${order.buyerName} · ${order.buyerPhone}` : undefined}
        width="md"
        footer={
          order && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" leadingIcon={<Printer className="size-4" />} onClick={() => setReceipt(true)}>
                Receipt
              </Button>
              {order.status === "placed" && (
                <Button variant="ghost" className="text-danger" loading={pending} onClick={() => void advance(order, ["declined"])}>
                  Decline
                </Button>
              )}
              {next && (
                <Button className="ml-auto" loading={pending} onClick={() => void advance(order, [next])}>
                  {actionLabel(order, next)}
                </Button>
              )}
            </div>
          )
        }
      >
        {order && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <StatusPill status={order.status} method={order.fulfilment.method} />
              <span className="text-small text-muted">{order.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}</span>
            </div>
            <ul className="divide-y divide-line rounded-md hairline">
              {order.items.map((it) => (
                <li key={it.productId + it.variantKey} className="flex items-center gap-3 p-3">
                  <span className="size-12 shrink-0 overflow-hidden rounded-xs">
                    <AppImage image={it.image} alt="" />
                  </span>
                  <span className="min-w-0 flex-1 text-small">
                    <span className="block font-medium">{it.name}</span>
                    <span className="text-muted">
                      {it.variantLabel && `${it.variantLabel} · `}× {it.quantity}
                    </span>
                  </span>
                  <span className="font-mono text-small tabular">{formatNaira(it.unitPriceKobo * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-small">
              <dt className="text-muted">{order.fulfilment.method === "delivery" ? "Deliver to" : "Pickup at"}</dt>
              <dd>{order.fulfilment.method === "delivery" ? `${zone?.name ?? ""} · ${order.fulfilment.addressLine ?? ""}` : point?.name}</dd>
              {order.fulfilment.note && (
                <>
                  <dt className="text-muted">Note</dt>
                  <dd>{order.fulfilment.note}</dd>
                </>
              )}
              <dt className="text-muted">Payment</dt>
              <dd className="capitalize">
                {order.payment.method.replace(/_/g, " ")} · {order.payment.status}
              </dd>
              <dt className="text-muted">Total</dt>
              <dd className="font-mono font-medium">{formatNaira(order.totalKobo)}</dd>
            </dl>
            <div>
              <h3 className="mb-4 text-small font-semibold">Timeline</h3>
              <OrderTimeline order={order} />
            </div>
          </div>
        )}
      </ResponsiveSheet>
      <Dialog
        open={receipt && !!order}
        onOpenChange={setReceipt}
        title="Receipt"
        description="Print it or save it as a PDF."
        className="print-receipt"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReceipt(false)}>
              Close
            </Button>
            <Button leadingIcon={<Printer className="size-4" />} onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      >
        {order && <Receipt o={order} campusName={campus?.shortName ?? ""} />}
      </Dialog>
    </>
  );
}

export function OrdersBoard() {
  const { data, isPending } = useStudioOrders();
  const { data: brand } = useMyBrand();
  const view = usePrefs((s) => s.studioOrdersView);
  const setPrefs = usePrefs((s) => s.set);
  const mounted = useMounted();
  const now = useNow(30_000);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/studio/orders";
  const openId = params.get("order");
  const { advance, pending } = useAdvance();
  const [dragging, setDragging] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const orders = useMemo(() => data ?? [], [data]);
  const open = orders.find((o) => o.id === openId) ?? null;
  const setOpen = (o: Order | null) => router.replace(o ? `${pathname}?order=${o.id}` : pathname, { scroll: false });

  const byColumn = useMemo(() => {
    const map: Record<ColumnId, Order[]> = { new: [], accepted: [], preparing: [], ready: [], done: [] };
    for (const o of orders) {
      const c = columnOf(o);
      if (c) map[c].push(o);
    }
    for (const k of Object.keys(map) as ColumnId[]) map[k].sort((a, b) => Date.parse(a.placedAt) - Date.parse(b.placedAt));
    // Completed: only the most recent few, newest first.
    map.done = map.done.sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)).slice(0, 6);
    return map;
  }, [orders]);

  const onDragStart = (e: DragStartEvent) => setDragging((e.active.data.current?.order as Order) ?? null);
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const o = e.active.data.current?.order as Order | undefined;
    const col = e.over?.id as ColumnId | undefined;
    if (!o || !col || columnOf(o) === col) return;
    const to = targetStatus(o, col);
    const path = to ? pathTo(o, to) : null;
    if (!path) {
      toast.error("Orders only move forward", { description: col === "new" ? "An accepted order can't go back to New." : "Use the buttons on the card to change its status." });
      return;
    }
    void advance(o, path);
  };

  const listRows = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);
  const currentView = mounted ? view : "board";

  return (
    <div>
      <StudioHeaderBlock
        eyebrow={brand?.name ?? "Orders"}
        title="Orders"
        description="Drag cards between columns, or use the buttons. Buyers are notified at every step."
        actions={
          <SegmentedControl
            size="sm"
            label="View"
            value={currentView}
            onChange={(v) => setPrefs({ studioOrdersView: v })}
            options={[
              { value: "board", label: "Board", icon: <Columns3 className="size-4" /> },
              { value: "list", label: "List", icon: <List className="size-4" /> },
            ]}
          />
        }
      />
      {isPending ? (
        <div className="flex gap-4 overflow-hidden">
          {columns.map((c) => (
            <Skeleton key={c.id} className="h-96 w-72 shrink-0 md:flex-1" rounded="lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState illustration="orders" title="No orders yet" body="When students order from your shop, they land here. Share your shop link to get started." />
      ) : currentView === "board" ? (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
          <div className="scrollbar-none -mx-(--gutter) flex gap-4 overflow-x-auto px-(--gutter) pb-4 md:-mx-8 md:px-8 xl:mx-0 xl:px-0">
            {columns.map((c) => (
              <Column key={c.id} {...c} orders={byColumn[c.id]} now={now} onOpen={setOpen} onAdvance={(o, p) => void advance(o, p)} busy={pending} />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22,1,0.36,1)" }}>{dragging ? <OrderCardContent o={dragging} now={now} dragging /> : null}</DragOverlay>
        </DndContext>
      ) : (
        <div>
          <div className="mb-4 w-56">
            <Select
              label="Filter by status"
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | OrderStatus)}
              className="h-9 text-small"
              options={[{ value: "all", label: "All statuses" }, ...(["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "declined", "cancelled"] as const).map((s) => ({ value: s, label: statusLabel(s) }))]}
            />
          </div>
          <div className="overflow-x-auto rounded-lg bg-surface hairline">
            <table className="w-full min-w-[720px] text-small">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th scope="col" className="eyebrow px-5 py-3 font-medium">Order</th>
                  <th scope="col" className="eyebrow px-3 py-3 font-medium">Customer</th>
                  <th scope="col" className="eyebrow px-3 py-3 font-medium">Method</th>
                  <th scope="col" className="eyebrow px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="eyebrow px-3 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="eyebrow px-5 py-3 text-right font-medium">Placed</th>
                </tr>
              </thead>
              <tbody>
                {listRows.slice(0, 80).map((o) => (
                  <tr key={o.id} className="cursor-pointer border-b border-line last:border-0 hover:bg-ink/[0.02]" onClick={() => setOpen(o)}>
                    <td className="px-5 py-3">
                      <button type="button" className="font-mono font-medium hover:underline" onClick={() => setOpen(o)}>
                        {o.code}
                      </button>
                    </td>
                    <td className="px-3 py-3">{o.buyerName}</td>
                    <td className="px-3 py-3 capitalize text-muted">{o.fulfilment.method}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={o.status} method={o.fulfilment.method} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono tabular">{formatNaira(o.totalKobo)}</td>
                    <td className="px-5 py-3 text-right text-muted">{now ? formatRelative(o.placedAt, now) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {listRows.length > 80 && <p className="mt-3 text-small text-muted">Showing the 80 most recent of {listRows.length} orders.</p>}
        </div>
      )}
      <OrderDrawer order={open} onClose={() => setOpen(null)} />
    </div>
  );
}
