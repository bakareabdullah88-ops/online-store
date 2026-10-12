"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { BarChart } from "@/components/charts/bar-chart";
import { spring } from "@/design/motion";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatCompact, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useAnalytics } from "@/queries/studio";
import type { StudioPeriod } from "@/services/contracts";
import { StudioHeaderBlock } from "./studio-shell";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-surface p-4 hairline md:p-5">
      <p className="text-small text-muted">{label}</p>
      <p className="mt-2 font-display text-display-sm tabular">{value}</p>
      {sub && <p className="mt-1 text-small text-muted">{sub}</p>}
    </div>
  );
}

function Funnel({ views, adds, orders }: { views: number; adds: number; orders: number }) {
  const rows = [
    { label: "Product views", value: views },
    { label: "Added to bag", value: adds },
    { label: "Orders", value: orders },
  ];
  return (
    <ol className="flex flex-col gap-3">
      {rows.map((r, i) => {
        const pct = views ? (r.value / views) * 100 : 0;
        return (
          <li key={r.label}>
            <div className="mb-1 flex justify-between text-small">
              <span>{r.label}</span>
              <span className="font-mono tabular">
                {formatNumber(r.value)} <span className="text-muted">· {pct.toFixed(i ? 1 : 0)}%</span>
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-sm bg-ink/[0.05]">
              <motion.div className={cn("h-full rounded-sm", i === 2 ? "bg-accent" : "bg-ink/[0.18]")} initial={{ width: 0 }} whileInView={{ width: `${Math.max(pct, 1)}%` }} viewport={{ once: true }} transition={{ ...spring.gentle, delay: i * 0.08 }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StudioAnalytics() {
  const [period, setPeriod] = useState<StudioPeriod>("30d");
  const { data, isPending, isPlaceholderData } = useAnalytics(period);
  const hourLabels = Array.from({ length: 24 }, (_, h) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`));
  const bestHour = data ? data.hourly.indexOf(Math.max(...data.hourly)) : 0;
  const viewsDelta = data && data.viewsPrev ? ((data.views - data.viewsPrev) / data.viewsPrev) * 100 : 0;

  return (
    <div>
      <StudioHeaderBlock
        eyebrow="Analytics"
        title="How buyers find you"
        actions={
          <SegmentedControl
            label="Period"
            size="sm"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "7d", label: "7 days" },
              { value: "30d", label: "30 days" },
              { value: "90d", label: "90 days" },
            ]}
          />
        }
      />
      {isPending || !data ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" rounded="lg" />
          ))}
        </div>
      ) : data.views === 0 && data.orders === 0 ? (
        <EmptyState illustration="customers" title="No visits yet" body="Share your shop link. Once students start viewing your products, you'll see the numbers here." />
      ) : (
        <div className={cn("flex flex-col gap-6 transition-opacity", isPlaceholderData && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Stat label="Product views" value={formatCompact(data.views)} sub={`${viewsDelta >= 0 ? "+" : ""}${viewsDelta.toFixed(1)}% vs previous`} />
            <Stat label="Add-to-bag rate" value={`${data.addToBagRate.toFixed(1)}%`} sub={`${formatNumber(data.addToBag)} adds`} />
            <Stat label="Conversion" value={`${data.conversion.toFixed(2)}%`} sub={`${formatNumber(data.orders)} orders`} />
            <Stat label="Busiest hour" value={hourLabels[bestHour] ?? "–"} sub="When most students browse" />
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <section aria-labelledby="views-title" className="rounded-lg bg-surface p-5 hairline xl:col-span-2">
              <h2 id="views-title" className="text-title font-semibold">
                Views per day
              </h2>
              <BarChart
                className="mt-8"
                height={200}
                label="Views per day"
                data={data.series.map((m) => ({ label: period === "7d" ? new Date(m.date).toLocaleDateString("en-NG", { weekday: "short" }) : String(new Date(m.date).getDate()), sublabel: formatDate(m.date), value: m.views }))}
                format={(n) => `${formatNumber(n)} views`}
              />
            </section>
            <section aria-labelledby="funnel-title" className="rounded-lg bg-surface p-5 hairline">
              <h2 id="funnel-title" className="mb-5 text-title font-semibold">
                Funnel
              </h2>
              <Funnel views={data.views} adds={data.addToBag} orders={data.orders} />
            </section>
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <section aria-labelledby="hours-title" className="rounded-lg bg-surface p-5 hairline">
              <h2 id="hours-title" className="text-title font-semibold">
                Best hours to post
              </h2>
              <p className="text-small text-muted">Views by hour of day</p>
              <BarChart className="mt-8" height={140} label="Views by hour" data={data.hourly.map((v, h) => ({ label: hourLabels[h] ?? "", value: v }))} highlight={bestHour} format={(n) => `${formatNumber(n)} views`} />
            </section>
            <section aria-labelledby="campus-title" className="rounded-lg bg-surface p-5 hairline">
              <h2 id="campus-title" className="mb-5 text-title font-semibold">
                Top campuses
              </h2>
              {data.topCampuses.length === 0 ? (
                <p className="text-small text-muted">No orders in this period.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {data.topCampuses.map((c, i) => {
                    const max = data.topCampuses[0]?.orders ?? 1;
                    return (
                      <li key={c.campusId}>
                        <div className="mb-1 flex justify-between text-small">
                          <span className="font-medium">{c.name}</span>
                          <span className="font-mono tabular text-muted">
                            {c.orders} orders · {formatNairaCompact(c.revenueKobo)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                          <motion.div className={cn("h-full rounded-full", i === 0 ? "bg-accent" : "bg-ink/25")} initial={{ width: 0 }} whileInView={{ width: `${(c.orders / max) * 100}%` }} viewport={{ once: true }} transition={{ ...spring.gentle, delay: i * 0.05 }} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </div>
          <section aria-labelledby="tp-title" className="rounded-lg bg-surface hairline">
            <h2 id="tp-title" className="p-5 text-title font-semibold">
              Most viewed products
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-small">
                <thead>
                  <tr className="border-y border-line text-left text-muted">
                    <th scope="col" className="eyebrow px-5 py-2.5 font-medium">Product</th>
                    <th scope="col" className="eyebrow px-3 py-2.5 text-right font-medium">Views</th>
                    <th scope="col" className="eyebrow px-3 py-2.5 text-right font-medium">Adds</th>
                    <th scope="col" className="eyebrow px-5 py-2.5 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((t) => (
                    <tr key={t.product.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-2.5">
                        <span className="flex items-center gap-3">
                          <span className="size-9 shrink-0 overflow-hidden rounded-xs">
                            <AppImage image={t.product.images[0]} alt="" />
                          </span>
                          <span className="truncate font-medium">{t.product.name}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular">{formatNumber(t.views)}</td>
                      <td className="px-3 py-2.5 text-right font-mono tabular">{formatNumber(t.addToBag)}</td>
                      <td className="px-5 py-2.5 text-right font-mono tabular">{formatNaira(t.product.priceKobo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
