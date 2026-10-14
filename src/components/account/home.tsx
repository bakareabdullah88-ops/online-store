"use client";

import { useState } from "react";
import {
  Activity,
  CalendarDays,
  Compass,
  Filter,
  Heart,
  LayoutGrid,
  MapPin,
  PieChart,
  Receipt,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { pagePad } from "@/components/app/layout";
import { Stagger, StaggerItem } from "@/components/app/stagger";
import { useNavBadges } from "@/components/app/nav-badges";
import { HatchedBars } from "@/components/dash/bars";
import { DashCard, StatCard } from "@/components/dash/card";
import { DateRangeControl, useRangeParam } from "@/components/dash/date-range";
import { DailyDots, WeekdayDots } from "@/components/dash/dot-matrix";
import { FunnelChart } from "@/components/dash/funnel-chart";
import { InsightCard } from "@/components/dash/insight";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { TodoList, type Todo } from "@/components/dash/todo";
import { ButtonLink } from "@/components/ui/button";
import { categories } from "@/config/categories";
import { rangeLabel } from "@/domain/analytics";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatNumber } from "@/lib/format";
import { greet } from "@/lib/greeting";
import { useMounted } from "@/lib/hooks";
import { useCampus } from "@/queries/catalog";
import { usePlaces } from "@/queries/inbox";
import { useBuyerDashboard, useMyOrders } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { useFollowing } from "@/queries/social";

const kobo = (n: number) => Math.round(n);

/** A greeting picked once per visit: it changes with the time, the day and the mood. */
function Greeting({ name }: { name: string }) {
  const [text] = useState(() => greet(name));
  return <>{text}</>;
}

/** First steps for a new account, replaced by live tasks once they order. */
function useStarterTodos(): Todo[] {
  const { user } = useSession();
  const following = useFollowing().data ?? [];
  const places = usePlaces().data ?? [];
  const hasShop = !!user && user.brandIds.length > 0;
  return [
    {
      id: "explore",
      label: "Discover shops on your campus",
      detail: "Browse by category or search",
      href: "/explore",
      count: 1,
    },
    {
      id: "follow",
      label: "Follow a shop you like",
      detail: "Get their new drops first",
      href: "/explore",
      count: following.length ? 0 : 1,
    },
    {
      id: "place",
      label: "Save a delivery address",
      detail: "Your hostel, room or a pickup spot",
      href: "/account/places",
      count: places.length ? 0 : 1,
    },
    {
      id: "shop",
      label: hasShop ? "Your shop is open" : "Sell something yourself",
      detail: "Open a shop in a few minutes",
      href: hasShop ? "/studio" : "/open-shop",
      count: hasShop ? 0 : 1,
    },
  ];
}

/** Buyer home (image 3 layout over real order data). */
export function BuyerHome() {
  const mounted = useMounted();
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const { preset, range, setPreset } = useRangeParam();
  const { data: d } = useBuyerDashboard(range);
  const allOrders = useMyOrders().data;
  const badges = useNavBadges();
  const starter = useStarterTodos();
  const firstName = user?.name.split(" ")[0] ?? "";
  const hasOrdered = (allOrders?.length ?? 0) > 0;

  const live: Todo[] = d
    ? [
        {
          id: "active",
          label: "Orders on the way",
          detail: "Track them live",
          href: "/orders?tab=active",
          count: d.active,
        },
        {
          id: "review",
          label: "Rate what you got",
          detail: "Help the next student decide",
          href: "/orders?tab=past",
          count: d.toReview,
        },
        {
          id: "bag",
          label: "Finish checking out",
          detail: "Items waiting in your bag",
          href: "/bag",
          count: badges.bag,
        },
        {
          id: "messages",
          label: "Unread messages",
          detail: "Replies from shops",
          href: "/messages",
          count: badges.messages,
        },
      ]
    : [];

  return (
    <div className={pagePad}>
      <PageHeader
        icon={LayoutGrid}
        crumbs={[{ label: "Market", href: "/home" }, { label: "Home" }]}
        title={mounted && firstName ? <Greeting name={firstName} /> : "Home"}
        description={campus ? `Shopping at ${campus.name}` : "Your orders and spending at a glance"}
        actions={<DateRangeControl preset={preset} range={range} onChange={setPreset} />}
      />

      {!d ? (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      ) : (
        <Stagger className="mt-6 grid grid-cols-1 gap-4">
          <StaggerItem className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              icon={<Wallet />}
              label="Spent"
              value={d.spent.value}
              format={(n) => formatNaira(Math.round(n))}
              tone="var(--chart-blue)"
              spark={d.daily.map((p) => p.amountKobo)}
              change={d.spent.change}
              compare={`vs ${formatNairaCompact(kobo(d.spent.prev))} before`}
            />
            <StatCard
              icon={<Receipt />}
              label="Orders"
              value={d.orders.value}
              format={(n) => formatNumber(Math.round(n))}
              tone="var(--chart-orange)"
              spark={d.daily.map((p) => p.orders)}
              change={d.orders.change}
              compare={`vs ${formatNumber(d.orders.prev)} before`}
            />
            <StatCard
              icon={<ShoppingBag />}
              label="Average order"
              value={d.avgOrder.value}
              format={(n) => formatNaira(Math.round(n))}
              tone="var(--chart-violet)"
              spark={d.daily.map((p) => (p.orders ? p.amountKobo / p.orders : 0))}
              change={d.avgOrder.change}
              compare={`vs ${formatNairaCompact(kobo(d.avgOrder.prev))} before`}
            />
            <StatCard
              icon={<Store />}
              label="Shops"
              value={d.shops.value}
              format={(n) => formatNumber(Math.round(n))}
              tone="var(--chart-green)"
              spark={d.weekdays.map((w) => w.orders)}
              change={d.shops.change}
              compare={`vs ${formatNumber(d.shops.prev)} before`}
            />
          </StaggerItem>

          <StaggerItem className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
            <DashCard
              title="Your orders"
              icon={<Filter />}
              tone="var(--chart-blue)"
              actions={[{ label: "All orders", href: "/orders", icon: <Receipt /> }]}
            >
              <div className="relative">
                <FunnelChart steps={d.statusFunnel} unit={() => "orders"} />
                {d.orders.value === 0 && d.statusFunnel.every((s) => s.value === 0) && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-3 rounded-2xl glass px-6 py-5 text-center shadow-lg ring-1 ring-line">
                      <p className="max-w-64 text-small text-ink-2">
                        Each order moves through these steps. Your first one will show up here.
                      </p>
                      <ButtonLink
                        href="/explore"
                        size="sm"
                        leadingIcon={<Compass className="size-4" />}
                      >
                        Discover shops
                      </ButtonLink>
                    </div>
                  </div>
                )}
              </div>
            </DashCard>
            <DashCard
              title="Spending by category"
              icon={<PieChart />}
              tone="var(--chart-green)"
              actions={[{ label: "Discover", href: "/explore", icon: <Compass /> }]}
            >
              <p className="text-[40px] leading-none font-medium tracking-[-0.04em] tabular md:text-[52px]">
                {formatNaira(kobo(d.categories.totalKobo))}
              </p>
              <p className="mt-2 text-small text-muted">{rangeLabel(range)}</p>
              <div className="my-6 h-px bg-line" />
              {d.categories.parts.length ? (
                <HatchedBars parts={d.categories.parts} />
              ) : (
                <HatchedBars
                  parts={categories
                    .slice(0, 3)
                    .map((c) => ({ key: c.id, label: c.name, valueKobo: 0, share: 0 }))}
                />
              )}
            </DashCard>
          </StaggerItem>

          <StaggerItem className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
            <DashCard
              title="When you order"
              icon={<CalendarDays />}
              tone="var(--chart-orange)"
              actions={[{ label: "All orders", href: "/orders", icon: <Receipt /> }]}
            >
              <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                <p className="text-[52px] leading-none font-medium tracking-[-0.04em] tabular md:text-[64px]">
                  {formatNumber(d.orders.value)}
                </p>
                <WeekdayDots days={d.weekdays} peak={d.peakDay} />
                <div className="text-right">
                  <p className="text-small text-muted">vs last period</p>
                  <p className="mt-1 text-[22px] font-medium tabular">
                    {d.orders.value - d.orders.prev >= 0 ? "+" : "−"}
                    {formatNumber(Math.abs(d.orders.value - d.orders.prev))}
                  </p>
                </div>
              </div>
            </DashCard>
            <DashCard title={hasOrdered ? "To do" : "Get started"}>
              <TodoList items={hasOrdered ? live : starter} />
            </DashCard>
            <InsightCard
              className="md:col-span-2 xl:col-span-1"
              value={d.insight?.value ?? "—"}
              label={d.insight?.label ?? "Your favourite shop shows up here after a few orders."}
              href={d.insight ? "/account/following" : "/explore"}
              empty={!d.insight}
            />
          </StaggerItem>

          <StaggerItem>
            <DashCard
              title="Spending by day"
              icon={<Activity />}
              tone="var(--chart-violet)"
              actions={[
                { label: "Saved items", href: "/wishlist", icon: <Heart /> },
                { label: "Addresses", href: "/account/places", icon: <MapPin /> },
              ]}
            >
              <DailyDots points={d.daily} format={(v) => formatNaira(kobo(v))} />
            </DashCard>
          </StaggerItem>
        </Stagger>
      )}
    </div>
  );
}
