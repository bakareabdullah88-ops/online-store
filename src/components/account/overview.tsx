"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart } from "@/components/charts/bar-chart";
import { ProductCard, ProductCardSkeleton } from "@/components/market/product-card";
import { Rail } from "@/components/market/rail";
import { OrderCard } from "@/components/orders/orders-list";
import { useReorder } from "@/components/orders/use-reorder";
import { accountNav } from "@/config/nav";
import { isActive as isOrderActive } from "@/domain/orders";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatDate } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useWallet } from "@/queries/inbox";
import { useMyOrders } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { useWishlist } from "@/queries/social";
import type { Order } from "@/services/types";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function spendByMonth(orders: Order[], now: number) {
  const months: { key: string; label: string; value: number }[] = [];
  const d = new Date(now);
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push({
      key: `${m.getFullYear()}-${m.getMonth()}`,
      label: m.toLocaleString("en-NG", { month: "short" }),
      value: 0,
    });
  }
  for (const o of orders) {
    if (o.status === "cancelled" || o.status === "declined") continue;
    const t = new Date(o.placedAt);
    const k = months.find((m) => m.key === `${t.getFullYear()}-${t.getMonth()}`);
    if (k) k.value += o.totalKobo;
  }
  return months;
}

export function AccountOverview() {
  const { user } = useSession();
  const orders = useMyOrders();
  const wishlist = useWishlist();
  const wallet = useWallet();
  const now = useNow(60_000);
  const reorder = useReorder();

  const list = orders.data ?? [];
  const active = list.filter((o) => isOrderActive(o.status));
  const delivered = list.filter((o) => o.status === "delivered");
  const months = now ? spendByMonth(list, now) : [];
  const spent = months.reduce((n, m) => n + m.value, 0);

  return (
    <div className="flex flex-col gap-12">
      <header>
        <p className="eyebrow text-muted">Dashboard</p>
        <h1 className="mt-2 font-display text-display-md">
          {now ? greeting(new Date(now).getHours()) : "Hello"}, {user?.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-body text-muted">
          {active.length
            ? `${active.length} order${active.length > 1 ? "s" : ""} on the way.`
            : "Nothing on the way right now."}
        </p>
      </header>

      {/* Mobile shortcuts (desktop uses the sidebar) */}
      <nav aria-label="Account shortcuts" className="grid grid-cols-3 gap-2 lg:hidden">
        {accountNav
          .filter((n) => n.href !== "/account")
          .slice(0, 6)
          .map((n) => {
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className="flex flex-col items-start gap-3 rounded-md bg-surface p-3 text-small font-medium hairline"
              >
                <Icon className="size-5 text-muted" />
                {n.label}
              </Link>
            );
          })}
      </nav>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-surface p-5 hairline md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-small text-muted">Spent in the last 6 months</p>
              <p className="mt-1 font-display text-display-sm">
                {orders.isPending ? "…" : formatNaira(spent)}
              </p>
            </div>
            <ButtonLink
              href="/orders"
              variant="ghost"
              size="sm"
              trailingIcon={<ArrowRight className="size-4" />}
            >
              History
            </ButtonLink>
          </div>
          {orders.isPending || !now ? (
            <Skeleton className="mt-6 h-36 w-full" />
          ) : (
            <BarChart
              className="mt-6"
              data={months.map((m) => ({ label: m.label, value: m.value }))}
              format={formatNairaCompact}
              height={140}
              label="Monthly spend"
            />
          )}
        </div>
        <Link
          href="/account/wallet"
          className="group flex flex-col justify-between rounded-lg bg-primary p-5 text-on-primary"
        >
          <div className="flex items-center justify-between">
            <p className="text-small opacity-70">Wallet</p>
            <span className="rounded-full bg-on-primary/15 px-2 py-0.5 font-mono text-[10px] tracking-wider uppercase">
              Demo
            </span>
          </div>
          <div>
            <p className="font-display text-display-md">
              {wallet.data ? formatNaira(wallet.data.balanceKobo) : "…"}
            </p>
            <p className="mt-2 flex items-center gap-1 text-small opacity-70">
              Top up or view activity{" "}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </p>
          </div>
        </Link>
      </div>

      <section aria-labelledby="active-title">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="active-title" className="text-title-lg font-semibold">
            On the way
          </h2>
          {active.length > 0 && (
            <Link
              href="/orders"
              className="text-small font-medium underline-offset-4 hover:underline"
            >
              All orders
            </Link>
          )}
        </div>
        {orders.isPending ? (
          <Skeleton className="h-40 w-full" rounded="lg" />
        ) : active.length === 0 ? (
          <div className="rounded-lg bg-surface hairline">
            <EmptyState
              compact
              illustration="orders"
              title="No active orders"
              body="Fancy something from your campus today?"
              action={<ButtonLink href="/explore">Explore</ButtonLink>}
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {active.slice(0, 3).map((o, i) => (
              <OrderCard key={o.id} order={o} index={i} />
            ))}
          </ul>
        )}
      </section>

      {delivered.length > 0 && (
        <section aria-labelledby="reorder-title">
          <h2 id="reorder-title" className="mb-4 text-title-lg font-semibold">
            Order again
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {delivered.slice(0, 4).map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-lg bg-surface p-3 hairline">
                <span className="size-14 shrink-0 overflow-hidden rounded-sm">
                  <AppImage image={o.items[0]?.image} alt="" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium">
                    {o.items.map((i) => i.name).join(", ")}
                  </p>
                  <p className="truncate text-small text-muted">
                    {o.brandName} · {now ? formatDate(o.placedAt) : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  aria-label={`Reorder from ${o.brandName}`}
                  onClick={() => void reorder(o)}
                  leadingIcon={<RotateCcw className="size-4" />}
                >
                  <span className="max-sm:sr-only">Reorder</span>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="saved-title">
        <div className="mb-8 flex items-end justify-between">
          <h2 id="saved-title" className="text-title-lg font-semibold">
            Saved for later
          </h2>
        </div>
        {wishlist.data?.length === 0 ? (
          <div className="rounded-lg bg-surface hairline">
            <EmptyState
              compact
              illustration="wishlist"
              title="Nothing saved yet"
              body="Tap the heart on anything you like."
            />
          </div>
        ) : (
          <Rail
            label="Saved for later"
            itemClassName="w-[42vw] sm:w-[28vw] md:w-[20vw] lg:w-[15vw] max-w-56"
          >
            {wishlist.isPending
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : (wishlist.data ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
          </Rail>
        )}
      </section>
    </div>
  );
}
