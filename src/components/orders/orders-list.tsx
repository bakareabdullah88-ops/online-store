"use client";

import { SceneBanner, RouteScene } from "@/components/scenes/campus-scenes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Compass, Eye, MessageCircle, Receipt, RotateCcw, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import { paymentTag, statusTag } from "@/components/studio/orders-board";
import { DataTable, FilterMenu, type Column } from "@/components/table/data-table";
import { TableEmpty } from "@/components/table/empty";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/sheet";
import { canBuyerCancel, isActive } from "@/domain/orders";
import { formatNaira } from "@/domain/money";
import { formatDate, formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useStartThread } from "@/queries/inbox";
import { useCancelOrder, useMyOrders } from "@/queries/orders";
import { errorMessage } from "@/services/errors";
import type { Order } from "@/services/types";
import { toast } from "@/stores/toast";
import { ReviewDialog } from "./review-dialog";
import { useReorder } from "./use-reorder";

export function formatEta(seconds: number) {
  if (seconds < 60) return "under a minute";
  return `~${Math.round(seconds / 60)} min`;
}

export function etaLine(order: Order, eta: number | null) {
  if (order.fulfilment.method === "pickup" && order.status === "ready")
    return "Ready to collect now";
  if (!order.autoProgress) return "The brand updates this order as it moves.";
  if (eta === null) return "\u00a0";
  return order.fulfilment.method === "pickup"
    ? `Ready to collect in ${formatEta(eta)}`
    : `Arriving in ${formatEta(eta)}`;
}

type Tab = "all" | "active" | "past";

/** Your orders as a table (image 4); each row opens live tracking. */
export function OrdersList() {
  const { data, isPending } = useMyOrders();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/orders";
  const now = useNow(30_000);
  const { reorder } = useReorder();
  const startThread = useStartThread();
  const cancel = useCancelOrder();
  const [q, setQ] = useState("");
  const [reviewing, setReviewing] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const raw = params.get("tab");
  const tab: Tab = raw === "active" || raw === "past" ? raw : "all";

  const orders = useMemo(
    () => [...(data ?? [])].sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt)),
    [data],
  );
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (tab === "all" || (tab === "active" ? isActive(o.status) : !isActive(o.status))) &&
        (!t ||
          o.code.toLowerCase().includes(t) ||
          o.brandName.toLowerCase().includes(t) ||
          o.items.some((i) => i.name.toLowerCase().includes(t))),
    );
  }, [orders, q, tab]);
  const activeCount = orders.filter((o) => isActive(o.status)).length;

  const message = (o: Order) =>
    void startThread.mutateAsync({ brandId: o.brandId }).then(
      (t) => router.push(`/messages?thread=${t.id}`),
      (e) => toast.error(errorMessage(e)),
    );

  const columns: Column<Order>[] = [
    {
      key: "code",
      header: "Order",
      csv: (o) => o.code,
      cell: (o) => <span className="font-mono font-medium whitespace-nowrap">{o.code}</span>,
    },
    {
      key: "shop",
      header: "Shop",
      csv: (o) => o.brandName,
      cell: (o) => (
        <span className="inline-flex items-center gap-2">
          <span className="size-6 overflow-hidden rounded-full">
            <AppImage image={o.brandLogo} alt="" variant="logo" name={o.brandName} />
          </span>
          <span className="max-w-36 truncate font-medium">{o.brandName}</span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      csv: (o) => o.items.map((i) => `${i.quantity}x ${i.name}`).join("; "),
      cell: (o) => (
        <span className="max-w-44 truncate text-ink-2">
          {o.items[0]?.name}
          {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
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
      key: "total",
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
  ];

  return (
    <div>
      <SceneBanner className="-mt-5 mb-3 h-[170px] sm:h-[210px] md:-mt-7 md:h-[22vw] md:max-h-[320px]">
        <RouteScene className="absolute inset-0" />
      </SceneBanner>
      <NavPageHeader
        title="Orders"
        description={
          activeCount
            ? `${activeCount} on the way. Open one to follow it live.`
            : "Everything you've ordered, newest first."
        }
      />
      <DataTable
        label="Your orders"
        loading={isPending}
        rows={rows}
        columns={columns}
        getId={(o) => o.id}
        rowLabel={(o) => `order ${o.code}`}
        exportName="my-orders"
        onRowClick={(o) => router.push(`/orders/${o.id}`)}
        search={{ value: q, onChange: setQ, placeholder: "Search orders…" }}
        filters={
          <FilterMenu<Tab>
            label="All orders"
            value={tab}
            onChange={(v) =>
              router.replace(v === "all" ? pathname : `${pathname}?tab=${v}`, { scroll: false })
            }
            options={[
              { value: "all", label: "All orders" },
              { value: "active", label: `On the way (${activeCount})` },
              { value: "past", label: "Completed or closed" },
            ]}
          />
        }
        rowActions={(o) => [
          { label: "Track order", icon: <Eye />, href: `/orders/${o.id}` },
          { label: "Message the shop", icon: <MessageCircle />, onSelect: message },
          {
            label: "Rate your items",
            icon: <Star />,
            hidden: o.status !== "delivered",
            onSelect: setReviewing,
          },
          {
            label: "Order again",
            icon: <RotateCcw />,
            hidden: isActive(o.status),
            onSelect: (x) => void reorder(x),
          },
          {
            label: "Cancel order",
            icon: <X />,
            danger: true,
            hidden: !canBuyerCancel(o),
            onSelect: setCancelling,
          },
        ]}
        card={(o) => (
          <div className="flex items-center gap-3">
            <span className="size-11 shrink-0 overflow-hidden rounded-md">
              <AppImage
                image={o.items[0]?.image}
                alt=""
                name={o.items[0]?.name ?? o.brandName}
                sizes="44px"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">{o.brandName}</span>
                {statusTag(o)}
              </div>
              <div className="mt-1">{paymentTag(o)}</div>
              <p className="mt-1 truncate text-[12.5px] text-muted">
                {o.code} · {now ? formatRelative(o.placedAt, now) : ""} ·{" "}
                <b className="font-semibold text-ink">{formatNaira(o.totalKobo)}</b>
              </p>
            </div>
          </div>
        )}
        empty={
          orders.length === 0 ? (
            <TableEmpty
              icon={Receipt}
              title="No orders yet"
              body="When you order from a shop on your campus, you'll follow it here from placed to delivered."
              action={
                <ButtonLink href="/explore" leadingIcon={<Compass className="size-4" />}>
                  Discover shops
                </ButtonLink>
              }
            />
          ) : (
            <TableEmpty icon={Receipt} title="Nothing here" body="No orders match this filter." />
          )
        }
      />
      {reviewing && (
        <ReviewDialog order={reviewing} open onOpenChange={(v) => !v && setReviewing(null)} />
      )}
      <Dialog
        open={!!cancelling}
        onOpenChange={(v) => !v && setCancelling(null)}
        title={`Cancel order ${cancelling?.code ?? ""}?`}
        description="The shop hasn't accepted it yet, so you can still cancel."
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelling(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={cancel.isPending}
              onClick={() =>
                cancelling &&
                cancel.mutate(cancelling.id, {
                  onSuccess: () => {
                    setCancelling(null);
                    toast("Order cancelled");
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Cancel order
            </Button>
          </>
        }
      >
        <p className="text-small text-muted">The shop will be told straight away.</p>
      </Dialog>
    </div>
  );
}
