"use client";

import Link from "next/link";
import {
  BarChart3,
  Download,
  Gauge,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader, pagePad } from "@/components/app/page-header";
import { Stagger, StaggerItem } from "@/components/app/stagger";
import { DashCard, StatCard } from "@/components/dash/card";
import { DateRangeControl, useRangeParam } from "@/components/dash/date-range";
import { DailyDots, WeekdayDots } from "@/components/dash/dot-matrix";
import { HatchedBars } from "@/components/dash/bars";
import { FunnelChart } from "@/components/dash/funnel-chart";
import { InsightCard } from "@/components/dash/insight";
import { QuickJump } from "@/components/dash/quick-jump";
import { SetupStrip } from "@/components/dash/setup";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { StepLine } from "@/components/dash/step-line";
import { TodoList } from "@/components/dash/todo";
import { ButtonLink } from "@/components/ui/button";
import { rangeLabel, weekdayName, type SellerDashboard } from "@/domain/analytics";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatNumber } from "@/lib/format";
import { useMyBrand, useShopDashboard } from "@/queries/studio";

const kobo = (n: number) => Math.round(n);

function downloadCsv(d: SellerDashboard) {
  const rows = [
    ["date", "orders", "revenue_naira"],
    ...d.daily.map((p) => [p.date, String(p.orders), (p.amountKobo / 100).toFixed(2)]),
  ];
  const blob = new Blob([rows.map((r) => r.join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `performance-${d.range.from}-to-${d.range.to}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-small text-muted">
      {children}
    </p>
  );
}

/** Shop "Performance" dashboard (image 3 + the video's overview). */
export function ShopPerformance() {
  const { preset, range, setPreset } = useRangeParam();
  const { data: brand } = useMyBrand();
  const { data: d } = useShopDashboard(range);
  const compare = (v: string) => `vs ${v} before`;
  const noTraffic = !!d && d.funnel.every((s) => s.value === 0 && s.prev === 0);
  const noOrders = !!d && d.orders.value === 0;

  return (
    <div className={pagePad}>
      <PageHeader
        icon={Gauge}
        crumbs={[{ label: brand?.name ?? "Shop", href: "/studio" }, { label: "Performance" }]}
        title="Performance"
        description={`How ${brand?.name ?? "your shop"} did from ${rangeLabel(range)}`}
        actions={<DateRangeControl preset={preset} range={range} onChange={setPreset} />}
      />
      {!d ? (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      ) : (
        <Stagger className="mt-6 grid grid-cols-1 gap-4">
          <StaggerItem>
            <SetupStrip />
          </StaggerItem>
          <StaggerItem className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              icon={<Receipt />}
              label="Revenue"
              value={formatNaira(kobo(d.revenue.value))}
              change={d.revenue.change}
              compare={compare(formatNairaCompact(kobo(d.revenue.prev)))}
            />
            <StatCard
              icon={<ShoppingBag />}
              label="Orders"
              value={formatNumber(d.orders.value)}
              change={d.orders.change}
              compare={compare(formatNumber(d.orders.prev))}
            />
            <StatCard
              icon={<Users />}
              label="Customers"
              value={formatNumber(d.customers.value)}
              change={d.customers.change}
              compare={compare(formatNumber(d.customers.prev))}
            />
            <StatCard
              icon={<BarChart3 />}
              label="Conversion"
              value={`${d.conversion.value.toFixed(1)}%`}
              change={d.conversion.change}
              compare={compare(`${d.conversion.prev.toFixed(1)}%`)}
            />
          </StaggerItem>

          <StaggerItem className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
            <DashCard
              title="Sales funnel"
              bodyClassName="px-0 pb-0 md:px-0 md:pb-0"
              actions={[
                {
                  label: "See product analytics",
                  href: `/studio/analytics?range=${preset}`,
                  icon: <BarChart3 />,
                },
                { label: "Open orders", href: "/studio/orders", icon: <Receipt /> },
              ]}
            >
              <div className="relative px-5 md:px-6">
                <FunnelChart
                  steps={d.funnel}
                  unit={(s) =>
                    s.key === "views" ? "views" : s.key === "bag" ? "adds to bag" : "orders"
                  }
                />
                {noTraffic && (
                  <Empty>
                    Views, adds to bag and orders show up here once people find your products.
                  </Empty>
                )}
              </div>
              <QuickJump
                prompt="What would you like to check next?"
                placeholder="Search your products, or type / for shortcuts"
                search={(q) => `/studio/products?q=${encodeURIComponent(q)}`}
                shortcuts={[
                  { token: "new orders", href: "/studio/orders?status=placed" },
                  {
                    token: "orders",
                    href: "/studio/orders",
                    withQuery: (q) => `/studio/orders?q=${encodeURIComponent(q)}`,
                  },
                  { token: "low stock", href: "/studio/products?stock=low" },
                  { token: "drafts", href: "/studio/products?status=draft" },
                  {
                    token: "customers",
                    href: "/studio/customers",
                    withQuery: (q) => `/studio/customers?q=${encodeURIComponent(q)}`,
                  },
                  { token: "reviews", href: "/studio/reviews" },
                ]}
              />
            </DashCard>
            <DashCard
              title="Gross volume"
              actions={[{ label: "Finance", href: "/studio/finance", icon: <Receipt /> }]}
            >
              <p className="text-[40px] leading-none font-medium tracking-[-0.04em] tabular md:text-[52px]">
                {formatNaira(kobo(d.volume.totalKobo))}
              </p>
              <p className="mt-2 text-small text-muted">Order totals, {rangeLabel(range)}</p>
              <div className="my-6 h-px bg-line" />
              <HatchedBars parts={d.volume.parts} />
            </DashCard>
          </StaggerItem>

          <StaggerItem className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)]">
            <DashCard
              title="Repeat buyers"
              actions={[{ label: "See customers", href: "/studio/customers", icon: <Users /> }]}
            >
              <p className="text-small text-muted">
                {d.retention.rate === null
                  ? "No buyers in this range yet"
                  : `${Math.round(d.retention.rate)}% of this range's buyers had ordered before`}
              </p>
              <div className="relative mt-auto pt-12">
                <StepLine points={d.retention.series} />
              </div>
            </DashCard>
            <DashCard
              title="Orders by day"
              actions={[{ label: "Open orders", href: "/studio/orders", icon: <Receipt /> }]}
            >
              <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                <p className="text-[52px] leading-none font-medium tracking-[-0.04em] tabular md:text-[64px]">
                  {formatNumber(d.orders.value)}
                </p>
                <div className="relative">
                  <WeekdayDots days={d.weekdays} peak={d.peakDay} />
                </div>
                <div className="text-right">
                  <p className="text-small text-muted">vs last period</p>
                  <p className="mt-1 text-[22px] font-medium tabular">
                    {d.orders.value - d.orders.prev >= 0 ? "+" : "−"}
                    {formatNumber(Math.abs(d.orders.value - d.orders.prev))}
                  </p>
                </div>
              </div>
              {d.peakDay !== null && (
                <p className="sr-only">Busiest day: {weekdayName(d.peakDay)}</p>
              )}
            </DashCard>
            <InsightCard
              className="md:col-span-2 xl:col-span-1"
              value={d.insight?.value ?? "—"}
              label={
                d.insight?.label ?? "Your completion rate appears after your first finished order."
              }
              href="/studio/orders"
              empty={!d.insight}
            />
          </StaggerItem>

          <StaggerItem className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <DashCard
              title="Revenue by day"
              actions={[
                { label: "Download CSV", onSelect: () => downloadCsv(d), icon: <Download /> },
              ]}
            >
              <div className="relative">
                <DailyDots points={d.daily} format={(v) => formatNaira(kobo(v))} />
                {noOrders && <Empty>No sales in this range yet.</Empty>}
              </div>
            </DashCard>
            <DashCard
              title="To do"
              aside={
                <Link
                  href="/studio/orders"
                  className="text-small font-medium text-accent hover:underline"
                >
                  See all
                </Link>
              }
            >
              <TodoList items={d.todo} />
            </DashCard>
          </StaggerItem>

          <StaggerItem>
            <DashCard
              title="Top products"
              actions={[{ label: "All products", href: "/studio/products", icon: <Package /> }]}
            >
              {d.topProducts.length === 0 ? (
                <div className="flex flex-col items-start gap-3 py-2">
                  <p className="text-small text-muted">
                    Your best sellers in this range will be listed here.
                  </p>
                  <ButtonLink
                    href="/studio/products/new"
                    size="sm"
                    leadingIcon={<Sparkles className="size-4" />}
                  >
                    Add a product
                  </ButtonLink>
                </div>
              ) : (
                <ol className="divide-y divide-line">
                  {d.topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3 py-3">
                      <span className="grid size-7 place-items-center rounded-full bg-surface text-[12px] font-semibold tabular ring-1 ring-line">
                        {i + 1}
                      </span>
                      <Link
                        href={`/studio/products/${p.productId}`}
                        className="min-w-0 flex-1 truncate text-[14px] font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="text-small text-muted tabular">{p.unitsSold} sold</span>
                      <span className="w-24 text-right text-[14px] font-semibold tabular">
                        {formatNaira(kobo(p.revenueKobo))}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </DashCard>
          </StaggerItem>
        </Stagger>
      )}
    </div>
  );
}
