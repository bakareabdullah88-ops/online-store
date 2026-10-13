"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bike, Check, Eye, MapPin, Printer, Receipt as ReceiptIcon, X } from "lucide-react";
import { useMemo, useState } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import {
  DataTable,
  FilterMenu,
  PersonChip,
  StatusTag,
  type Column,
} from "@/components/table/data-table";
import { TableEmpty } from "@/components/table/empty";
import { Button } from "@/components/ui/button";
import { Dialog, ResponsiveSheet } from "@/components/ui/sheet";
import { AppImage } from "@/components/ui/app-image";
import { StatusPill } from "@/components/orders/status-pill";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { brand as appBrand } from "@/config/brand";
import { canTransition, isActive, nextSellerStatus, statusLabel } from "@/domain/orders";
import { formatNaira } from "@/domain/money";
import { formatDate, formatRelative, formatTime } from "@/lib/format";
import { useMounted, useNow } from "@/lib/hooks";
import { useCampuses } from "@/queries/catalog";
import { useStudioOrders, useUpdateOrderStatus } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { Order, OrderStatus } from "@/services/types";
import { toast } from "@/stores/toast";

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
        if (!canTransition(current, s))
          throw new Error(`Can't move to ${statusLabel(s, o.fulfilment.method)} yet`);
        current = await update.mutateAsync({ id: o.id, status: s });
      }
      const last = path[path.length - 1];
      if (last)
        toast.success(`${o.code} · ${statusLabel(last, o.fulfilment.method)}`, {
          description: `${o.buyerName} has been notified.`,
        });
    } catch (e) {
      toast.error("Couldn't update the order", { description: errorMessage(e) });
    }
  };
  return { advance, pending: update.isPending };
}

function Receipt({ o, campusName }: { o: Order; campusName: string }) {
  const mounted = useMounted();
  return (
    <div
      id="receipt"
      className="mx-auto max-w-sm rounded-md bg-white p-6 font-mono text-[12px] leading-relaxed text-black shadow-sm ring-1 ring-black/10"
    >
      <p className="text-center text-[14px] font-semibold tracking-widest uppercase">
        {o.brandName}
      </p>
      <p className="text-center">
        via {appBrand.name} · {campusName}
      </p>
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
                {it.variantLabel && <span className="block opacity-70"> {it.variantLabel}</span>}
              </td>
              <td className="text-right">{formatNaira(it.unitPriceKobo * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 border-t border-dashed border-black/40 pt-2">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatNaira(o.subtotalKobo)}</span>
        </p>
        <p className="flex justify-between">
          <span>{o.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}</span>
          <span>{o.deliveryFeeKobo ? formatNaira(o.deliveryFeeKobo) : "FREE"}</span>
        </p>
        {o.discountKobo > 0 && (
          <p className="flex justify-between">
            <span>Discount {o.promoCode}</span>
            <span>-{formatNaira(o.discountKobo)}</span>
          </p>
        )}
        <p className="mt-1 flex justify-between text-[14px] font-semibold">
          <span>TOTAL</span>
          <span>{formatNaira(o.totalKobo)}</span>
        </p>
        <p className="flex justify-between">
          <span>Payment</span>
          <span className="uppercase">
            {o.payment.method.replace(/_/g, " ")} · {o.payment.status}
          </span>
        </p>
      </div>
      <p className="mt-3 border-t border-dashed border-black/40 pt-2">
        {o.buyerName} · {o.buyerPhone}
        <br />
        {o.fulfilment.addressLine ?? "Pickup"}
        {o.fulfilment.note && (
          <>
            <br />
            Note: {o.fulfilment.note}
          </>
        )}
      </p>
      <p className="mt-3 text-center">Thank you!</p>
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
              <Button
                variant="secondary"
                leadingIcon={<Printer className="size-4" />}
                onClick={() => setReceipt(true)}
              >
                Receipt
              </Button>
              {order.status === "placed" && (
                <Button
                  variant="ghost"
                  className="text-danger"
                  loading={pending}
                  onClick={() => void advance(order, ["declined"])}
                >
                  Decline
                </Button>
              )}
              {next && (
                <Button
                  className="ml-auto"
                  loading={pending}
                  onClick={() => void advance(order, [next])}
                >
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
              <span className="text-small text-muted">
                {order.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}
              </span>
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
                  <span className="font-mono text-small tabular">
                    {formatNaira(it.unitPriceKobo * it.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-small">
              <dt className="text-muted">
                {order.fulfilment.method === "delivery" ? "Deliver to" : "Pickup at"}
              </dt>
              <dd>
                {order.fulfilment.method === "delivery"
                  ? `${zone?.name ?? ""} · ${order.fulfilment.addressLine ?? ""}`
                  : point?.name}
              </dd>
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

type StatusFilter = "all" | "placed" | "active" | "ready" | "done" | "closed";
type MethodFilter = "all" | "delivery" | "pickup";
type WhenFilter = "all" | "today" | "7d" | "30d";

const statusGroups: Record<Exclude<StatusFilter, "all">, (o: Order) => boolean> = {
  placed: (o) => o.status === "placed",
  active: (o) => o.status === "confirmed" || o.status === "preparing",
  ready: (o) => o.status === "ready" || o.status === "out_for_delivery",
  done: (o) => o.status === "delivered",
  closed: (o) => o.status === "declined" || o.status === "cancelled",
};

export function statusTag(o: Order) {
  const label = statusLabel(o.status, o.fulfilment.method);
  switch (o.status) {
    case "placed":
      return <StatusTag tone="blue">New</StatusTag>;
    case "confirmed":
    case "preparing":
      return <StatusTag tone="amber">{label}</StatusTag>;
    case "ready":
    case "out_for_delivery":
      return <StatusTag tone="violet">{label}</StatusTag>;
    case "delivered":
      return <StatusTag tone="green">{label}</StatusTag>;
    default:
      return <StatusTag tone="red">{label}</StatusTag>;
  }
}

export function paymentTag(o: Order) {
  const how =
    o.payment.method === "pay_on_pickup"
      ? "At pickup"
      : o.payment.method === "pay_on_delivery"
        ? "On delivery"
        : "Online";
  if (o.status === "declined" || o.status === "cancelled")
    return <StatusTag tone="grey">{how} · Void</StatusTag>;
  return o.payment.status === "paid" ? (
    <StatusTag tone="green">{how} · Paid</StatusTag>
  ) : (
    <StatusTag tone="amber">{how} · Due</StatusTag>
  );
}

/** Shop orders as a table (image 4). Next steps are one click; details open in a drawer. */
export function OrdersBoard() {
  const { data, isPending } = useStudioOrders();
  const now = useNow(30_000);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/studio/orders";
  const { advance, pending } = useAdvance();
  const raw = params.get("status");
  const status = (raw && raw in statusGroups ? raw : "all") as StatusFilter;
  const [method, setMethod] = useState<MethodFilter>("all");
  const [when, setWhen] = useState<WhenFilter>("all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const openId = params.get("order");

  const setQuery = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const orders = useMemo(
    () => [...(data ?? [])].sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)),
    [data],
  );
  const open = orders.find((o) => o.id === openId) ?? null;
  const counts = {
    placed: orders.filter(statusGroups.placed).length,
    active: orders.filter((o) => isActive(o.status)).length,
  };

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const since =
      when === "all" || !now
        ? 0
        : when === "today"
          ? new Date(now).setHours(0, 0, 0, 0)
          : now - (when === "7d" ? 7 : 30) * 86_400_000;
    return orders.filter(
      (o) =>
        (status === "all" || statusGroups[status](o)) &&
        (method === "all" || o.fulfilment.method === method) &&
        Date.parse(o.placedAt) >= since &&
        (!term ||
          o.code.toLowerCase().includes(term) ||
          o.buyerName.toLowerCase().includes(term) ||
          o.items.some((i) => i.name.toLowerCase().includes(term))),
    );
  }, [orders, q, status, method, when, now]);

  const columns: Column<Order>[] = [
    {
      key: "code",
      header: "Order",
      csv: (o) => o.code,
      cell: (o) => <span className="font-mono font-medium whitespace-nowrap">{o.code}</span>,
    },
    {
      key: "buyer",
      header: "Customer",
      csv: (o) => o.buyerName,
      cell: (o) => <PersonChip name={o.buyerName} />,
    },
    {
      key: "items",
      header: "Items",
      csv: (o) => o.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
      cell: (o) => (
        <span className="flex items-center gap-2">
          <span className="flex -space-x-2">
            {o.items.slice(0, 3).map((it) => (
              <span
                key={it.productId + it.variantKey}
                className="size-7 overflow-hidden rounded-lg ring-2 ring-surface"
              >
                <AppImage image={it.image} alt="" name={it.name} sizes="28px" />
              </span>
            ))}
          </span>
          <span className="max-w-36 truncate text-ink-2">
            {o.items[0]?.name}
            {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
          </span>
        </span>
      ),
    },
    {
      key: "method",
      header: "Fulfilment",
      csv: (o) => o.fulfilment.method,
      cell: (o) => (
        <span className="flex items-center gap-1.5 text-ink-2">
          {o.fulfilment.method === "delivery" ? (
            <Bike className="size-4 text-muted" />
          ) : (
            <MapPin className="size-4 text-muted" />
          )}
          {o.fulfilment.method === "delivery" ? "Delivery" : "Pickup"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      csv: (o) => o.placedAt,
      cell: (o) => (
        <span className="whitespace-nowrap text-ink-2">
          {now ? formatRelative(o.placedAt, now) : formatDate(o.placedAt)}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      csv: (o) => o.totalKobo / 100,
      cell: (o) => <span className="font-semibold tabular">{formatNaira(o.totalKobo)}</span>,
    },
    {
      key: "payment",
      header: "Payment",
      csv: (o) => `${o.payment.method} ${o.payment.status}`,
      cell: paymentTag,
    },
    { key: "status", header: "Status", csv: (o) => o.status, cell: statusTag },
    {
      key: "next",
      header: "Next step",
      cell: (o) => {
        const next = nextSellerStatus(o);
        if (!next) return <span className="text-muted">–</span>;
        return (
          <Button
            size="sm"
            variant={o.status === "placed" ? "primary" : "secondary"}
            disabled={pending}
            onClick={(e) => {
              e.stopPropagation();
              void advance(o, [next]);
            }}
          >
            {actionLabel(o, next)}
          </Button>
        );
      },
    },
  ];

  return (
    <div>
      <NavPageHeader
        title="Orders"
        description={
          counts.placed
            ? `${counts.placed} new ${counts.placed === 1 ? "order needs" : "orders need"} you. Buyers are notified at every step.`
            : "Accept, prepare and hand over. Buyers are notified at every step."
        }
      />
      <DataTable
        label="Orders"
        loading={isPending}
        rows={rows}
        columns={columns}
        getId={(o) => o.id}
        rowLabel={(o) => `order ${o.code}`}
        exportName="orders"
        onRowClick={(o) => setQuery({ order: o.id })}
        search={{ value: q, onChange: setQ, placeholder: "Search orders…" }}
        filters={
          <>
            <FilterMenu<StatusFilter>
              label="Status"
              value={status}
              onChange={(v) => setQuery({ status: v === "all" ? null : v })}
              options={[
                { value: "all", label: "All statuses" },
                { value: "placed", label: `New (${counts.placed})` },
                { value: "active", label: "Accepted / preparing" },
                { value: "ready", label: "Ready or on the way" },
                { value: "done", label: "Completed" },
                { value: "closed", label: "Declined or cancelled" },
              ]}
            />
            <FilterMenu<MethodFilter>
              label="Fulfilment"
              value={method}
              onChange={setMethod}
              options={[
                { value: "all", label: "Delivery and pickup" },
                { value: "delivery", label: "Delivery" },
                { value: "pickup", label: "Pickup" },
              ]}
            />
            <FilterMenu<WhenFilter>
              label="Any time"
              value={when}
              onChange={setWhen}
              options={[
                { value: "all", label: "Any time" },
                { value: "today", label: "Today" },
                { value: "7d", label: "Last 7 days" },
                { value: "30d", label: "Last 30 days" },
              ]}
            />
          </>
        }
        bulkActions={(sel, clear) => {
          const acceptable = sel.filter((o) => o.status === "placed");
          return (
            <Button
              size="sm"
              variant="secondary"
              disabled={!acceptable.length}
              loading={pending}
              leadingIcon={<Check className="size-4" />}
              onClick={async () => {
                for (const o of acceptable) await advance(o, ["confirmed"]);
                clear();
              }}
            >
              Accept {acceptable.length || ""} new
            </Button>
          );
        }}
        rowActions={(o) => [
          { label: "View details", icon: <Eye />, onSelect: () => setQuery({ order: o.id }) },
          {
            label: "Decline",
            icon: <X />,
            danger: true,
            hidden: o.status !== "placed",
            onSelect: () => void advance(o, ["declined"]),
          },
          {
            label: "Cancel order",
            icon: <X />,
            danger: true,
            hidden: !canTransition(o, "cancelled"),
            onSelect: () => void advance(o, ["cancelled"]),
          },
        ]}
        card={(o) => {
          const next = nextSellerStatus(o);
          return (
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[13px] font-semibold">{o.code}</span>
                {statusTag(o)}
              </div>
              <div className="mt-1.5">{paymentTag(o)}</div>
              <p className="mt-1.5 truncate text-[13px] text-ink-2">
                {o.buyerName} · {o.items.reduce((n, i) => n + i.quantity, 0)} items ·{" "}
                <b className="font-semibold">{formatNaira(o.totalKobo)}</b>
              </p>
              {next && (
                <Button
                  size="sm"
                  className="mt-2.5"
                  variant={o.status === "placed" ? "primary" : "secondary"}
                  disabled={pending}
                  onClick={(e) => {
                    e.stopPropagation();
                    void advance(o, [next]);
                  }}
                >
                  {actionLabel(o, next)}
                </Button>
              )}
            </div>
          );
        }}
        empty={
          orders.length === 0 ? (
            <TableEmpty
              icon={ReceiptIcon}
              title="No orders yet"
              body="When students order from your shop, they land here. Share your shop link to get started."
            />
          ) : (
            <TableEmpty
              icon={ReceiptIcon}
              title="No orders match"
              body="Try another status or search."
            />
          )
        }
      />
      <OrderDrawer order={open} onClose={() => setQuery({ order: null })} />
    </div>
  );
}
