"use client";

import { SceneBanner, LibraryScene } from "@/components/scenes/campus-scenes";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { pagePad } from "@/components/app/layout";
import { useNavBadges } from "@/components/app/nav-badges";
import { HatchedBars } from "@/components/dash/bars";
import { DashCard } from "@/components/dash/card";
import { DateRangeControl, useRangeParam } from "@/components/dash/date-range";
import { HeroFigure } from "@/components/dash/hero";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { TodoList, type Todo } from "@/components/dash/todo";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { rangeLabel } from "@/domain/analytics";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { isActive, statusLabel } from "@/domain/orders";
import { formatNumber } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useCampus } from "@/queries/catalog";
import { usePlaces } from "@/queries/inbox";
import { useBuyerDashboard, useMyOrders } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { useFollowing } from "@/queries/social";
import type { Order } from "@/services/types";

const kobo = (n: number) => Math.round(n);

/** A plain, one-line hello for the time of day. */
function Greeting({ name }: { name: string }) {
  const [text] = useState(() => {
    const h = new Date().getHours();
    const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    return `${part}, ${name}`;
  });
  return <>{text}</>;
}

const today = new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long" });

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

/** Orders that haven't arrived yet, newest first. */
function OnTheWay({ orders }: { orders: Order[] }) {
  if (!orders.length) {
    return (
      <div className="flex flex-col items-start gap-3 py-2">
        <p className="text-small text-muted">
          Nothing on the way. When you order, you can follow it here from placed to delivered.
        </p>
        <ButtonLink href="/explore" size="sm" leadingIcon={<Compass className="size-4" />}>
          Discover shops
        </ButtonLink>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line-thin">
      {orders.slice(0, 5).map((o) => (
        <li key={o.id}>
          <Link
            href={`/orders/${o.id}`}
            className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-ink/[0.03]"
          >
            <span className="size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
              <AppImage image={o.brandLogo} alt="" variant="logo" name={o.brandName} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">{o.brandName}</span>
              <span className="block font-mono text-[12px] text-muted">{o.code}</span>
            </span>
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-ink">
              {statusLabel(o.status, o.fulfilment.method)}
            </span>
            <span className="hidden w-20 text-right text-[14px] font-semibold tabular sm:block">
              {formatNaira(o.totalKobo)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The buyer's home: what they spent, what's on its way, what to do next. */
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
  const onTheWay = (allOrders ?? [])
    .filter((o) => isActive(o.status))
    .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt));

  const live: Todo[] = d
    ? [
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
      <SceneBanner className="-mt-5 mb-3 h-[170px] sm:h-[210px] md:-mt-7 md:h-[22vw] md:max-h-[320px]">
        <LibraryScene className="absolute inset-0" />
      </SceneBanner>
      <PageHeader
        crumbs={[{ label: "Market", href: "/home" }, { label: "Dashboard" }]}
        title={mounted && firstName ? <Greeting name={firstName} /> : "Home"}
        description={
          mounted
            ? [today.format(new Date()), campus?.name].filter(Boolean).join(" · ")
            : (campus?.name ?? "Your orders and spending")
        }
        actions={<DateRangeControl preset={preset} range={range} onChange={setPreset} />}
      />

      {!d ? (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      ) : (
        <div className="mt-6 flex flex-col">
          <HeroFigure
            label={`Spent, ${rangeLabel(range)}`}
            valueKobo={d.spent.value}
            change={d.spent.change}
            compare={`vs ${formatNairaCompact(kobo(d.spent.prev))} the period before`}
            points={d.daily}
            stats={[
              { label: "Orders", value: formatNumber(d.orders.value) },
              { label: "Average order", value: formatNairaCompact(kobo(d.avgOrder.value)) },
              { label: "Shops", value: formatNumber(d.shops.value) },
            ]}
            footer={
              <Link
                href="/orders"
                className="tap-area inline-flex items-center gap-1.5 text-small font-medium text-accent-ink hover:underline"
              >
                All your orders <ArrowRight className="size-4" />
              </Link>
            }
          />

          <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
            <DashCard
              title="On the way"
              aside={
                onTheWay.length > 0 && (
                  <Link
                    href="/orders?tab=active"
                    className="tap-area text-small font-medium text-accent-ink hover:underline"
                  >
                    Track
                  </Link>
                )
              }
            >
              <OnTheWay orders={onTheWay} />
            </DashCard>
            <DashCard title={hasOrdered ? "To do" : "Get started"}>
              <TodoList items={hasOrdered ? live : starter} checklist={!hasOrdered} />
            </DashCard>
          </div>

          {d.categories.parts.length > 0 && (
            <DashCard title="Where your money goes">
              <HatchedBars parts={d.categories.parts} />
            </DashCard>
          )}
        </div>
      )}
    </div>
  );
}
