"use client";

import { DashCard } from "@/components/dash/card";
import { WeekdayDots } from "@/components/dash/dot-matrix";
import { FunnelChart } from "@/components/dash/funnel-chart";
import { StepLine } from "@/components/dash/step-line";
import type { DayRange } from "@/domain/analytics";
import { weekdayName } from "@/domain/analytics";
import { formatNumber } from "@/lib/format";
import { useShopDashboard } from "@/queries/studio";

/** Shop-wide trends: how visits become orders, the busiest days, repeat buyers. */
export function ShopTrends({ range }: { range: DayRange }) {
  const { data: d } = useShopDashboard(range);
  if (!d) return null;
  const noTraffic = d.funnel.every((s) => s.value === 0 && s.prev === 0);
  return (
    <div className="grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <DashCard title="From views to orders" bodyClassName="pb-0 md:pb-0">
        <div className="relative">
          <FunnelChart
            steps={d.funnel}
            unit={(s) => (s.key === "views" ? "views" : s.key === "bag" ? "adds to bag" : "orders")}
          />
          {noTraffic && (
            <p className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-small text-muted">
              Views, adds to bag and orders show up here once people find your products.
            </p>
          )}
        </div>
      </DashCard>
      <div className="grid grid-cols-1">
        <DashCard title="Busiest days">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <WeekdayDots days={d.weekdays} peak={d.peakDay} />
            <p className="text-small text-muted">
              {d.peakDay === null
                ? "No orders in this range yet"
                : `Most orders on ${weekdayName(d.peakDay)}`}
            </p>
          </div>
        </DashCard>
        <DashCard title="Repeat buyers">
          <p className="text-small text-muted">
            {d.retention.rate === null
              ? "No buyers in this range yet"
              : `${Math.round(d.retention.rate)}% of this range's ${formatNumber(d.customers.value)} buyers had ordered before`}
          </p>
          <div className="relative mt-auto pt-10">
            <StepLine points={d.retention.series} />
          </div>
        </DashCard>
      </div>
    </div>
  );
}
