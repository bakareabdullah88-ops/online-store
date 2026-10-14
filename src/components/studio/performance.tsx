"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { pagePad } from "@/components/app/layout";
import { DashCard } from "@/components/dash/card";
import { DateRangeControl, useRangeParam } from "@/components/dash/date-range";
import { HeroFigure } from "@/components/dash/hero";
import { SetupStrip } from "@/components/dash/setup";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { TodoList } from "@/components/dash/todo";
import { ButtonLink } from "@/components/ui/button";
import { rangeLabel } from "@/domain/analytics";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatNumber } from "@/lib/format";
import { useMyBrand, useShopDashboard } from "@/queries/studio";

/**
 * The shop's home: revenue first, then what needs doing and what's selling.
 * The detailed charts (funnel, days, repeat buyers) live on Analytics.
 */
export function ShopPerformance() {
  const { preset, range, setPreset } = useRangeParam();
  const { data: brand } = useMyBrand();
  const { data: d } = useShopDashboard(range);

  return (
    <div className={pagePad}>
      <PageHeader
        crumbs={[{ label: brand?.name ?? "Shop", href: "/studio" }, { label: "Performance" }]}
        title={brand?.name ?? "Your shop"}
        description={`How your shop did, ${rangeLabel(range)}`}
        actions={<DateRangeControl preset={preset} range={range} onChange={setPreset} />}
      />
      {!d ? (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <HeroFigure
            label="Revenue"
            valueKobo={d.revenue.value}
            change={d.revenue.change}
            compare={`vs ${formatNairaCompact(Math.round(d.revenue.prev))} the period before`}
            points={d.daily}
            stats={[
              { label: "Orders", value: formatNumber(d.orders.value) },
              { label: "Customers", value: formatNumber(d.customers.value) },
              { label: "Conversion", value: `${d.conversion.value.toFixed(1)}%` },
            ]}
            footer={
              <Link
                href={`/studio/analytics?range=${preset}`}
                className="inline-flex items-center gap-1.5 text-small font-medium text-accent-ink hover:underline"
              >
                Funnel, busiest days and repeat buyers <ArrowRight className="size-4" />
              </Link>
            }
          />

          <SetupStrip />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DashCard
              title="Needs your attention"
              aside={
                <Link
                  href="/studio/orders"
                  className="text-small font-medium text-accent-ink hover:underline"
                >
                  All orders
                </Link>
              }
            >
              <TodoList items={d.todo} />
            </DashCard>

            <DashCard
              title="Top products"
              aside={
                <Link
                  href="/studio/products"
                  className="text-small font-medium text-accent-ink hover:underline"
                >
                  All products
                </Link>
              }
            >
              {d.topProducts.length === 0 ? (
                <div className="flex flex-col items-start gap-3 py-2">
                  <p className="text-small text-muted">
                    Your best sellers in this range will be listed here.
                  </p>
                  <ButtonLink
                    href="/studio/products/new"
                    size="sm"
                    leadingIcon={<Plus className="size-4" />}
                  >
                    Add a product
                  </ButtonLink>
                </div>
              ) : (
                <ol className="divide-y divide-line">
                  {d.topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3 py-3">
                      <span className="w-5 text-small text-muted tabular">{i + 1}</span>
                      <Link
                        href={`/studio/products/${p.productId}`}
                        className="min-w-0 flex-1 truncate text-[14px] font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="text-small text-muted tabular">{p.unitsSold} sold</span>
                      <span className="w-24 text-right text-[14px] font-semibold tabular">
                        {formatNaira(Math.round(p.revenueKobo))}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </DashCard>
          </div>
        </div>
      )}
    </div>
  );
}
