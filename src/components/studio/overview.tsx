"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NumberTicker, ProgressBar } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { BarChart, Sparkline } from "@/components/charts/bar-chart";
import { StatusPill } from "@/components/orders/status-pill";
import { spring, stagger } from "@/design/motion";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatDate, formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
import { useMyBrand, useOverview, useSetup } from "@/queries/studio";
import type { StudioPeriod } from "@/services/contracts";
import type { BrandMetric } from "@/services/types";
import { StudioHeaderBlock } from "./studio-shell";
import { TableScroll } from "@/components/ui/table-scroll";

const periods: { value: StudioPeriod; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

function delta(cur: number, prev: number): number | null {
  if (cur === 0 && prev === 0) return null;
  if (prev === 0) return 100;
  return ((cur - prev) / prev) * 100;
}

function Kpi({
  label,
  value,
  format,
  change,
  spark,
  index,
  suffix,
  step,
}: {
  step?: number;
  label: string;
  value: number;
  format: (n: number) => string;
  change: number | null;
  spark: number[];
  index: number;
  suffix?: string;
}) {
  const up = (change ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.smooth, delay: stagger(index) }}
      className="flex flex-col rounded-lg bg-surface p-4 hairline md:p-5"
    >
      <p className="text-small text-muted">{label}</p>
      <p className="mt-2 font-display text-display-sm tabular">
        <NumberTicker value={value} format={format} step={step} />
        {suffix && <span className="ml-1 font-sans text-small text-muted">{suffix}</span>}
      </p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        {change !== null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium",
              up ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change).toFixed(1)}%
          </span>
        ) : (
          <span />
        )}
        <div className="w-24">
          {spark.some((v) => v > 0) && <Sparkline values={spark} positive={up} />}
        </div>
      </div>
    </motion.div>
  );
}

function bucket(series: BrandMetric[], period: StudioPeriod) {
  if (period !== "90d") {
    return series.map((m) => ({
      label:
        period === "7d"
          ? new Date(m.date).toLocaleDateString("en-NG", { weekday: "short" })
          : String(new Date(m.date).getDate()),
      sublabel: formatDate(m.date),
      value: m.revenueKobo,
    }));
  }
  const weeks: { label: string; sublabel: string; value: number }[] = [];
  for (let i = 0; i < series.length; i += 7) {
    const chunk = series.slice(i, i + 7);
    weeks.push({
      label: formatDate(chunk[0]!.date).split(" ")[0] ?? "",
      sublabel: `Week of ${formatDate(chunk[0]!.date)}`,
      value: chunk.reduce((n, m) => n + m.revenueKobo, 0),
    });
  }
  return weeks;
}

function SetupCard() {
  const { data, isPending } = useSetup();
  if (isPending) return <Skeleton className="h-64 w-full" rounded="lg" />;
  if (!data) return null;
  const done = data.filter((s) => s.done).length;
  if (done === data.length) return null;
  return (
    <section aria-labelledby="setup" className="rounded-lg bg-surface p-5 hairline">
      <p className="eyebrow text-muted">Shop setup</p>
      <h2 id="setup" className="mt-2 text-title-lg font-semibold">
        {done} of {data.length} steps complete
      </h2>
      <ProgressBar value={done} max={data.length} label="Shop setup progress" className="mt-4" />
      <ol className="mt-5 flex flex-col gap-1">
        {data.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-2 py-2 text-small transition-colors hover:bg-ink/[0.04]",
                s.done && "text-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full",
                  s.done
                    ? "bg-accent text-on-accent"
                    : "shadow-[inset_0_0_0_1.5px_var(--line-strong)]",
                )}
              >
                {s.done && <Check className="size-3" strokeWidth={3} />}
              </span>
              <span className={cn("flex-1", s.done && "line-through decoration-line-strong")}>
                {s.label}
              </span>
              {!s.done && (
                <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StudioOverview() {
  const [period, setPeriod] = useState<StudioPeriod>("30d");
  const { data, isPending, isPlaceholderData } = useOverview(period);
  const { data: brand } = useMyBrand();
  const { user } = useSession();
  const now = useNow(60_000);
  const hour = now ? new Date(now).getHours() : 12;
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const bars = data ? bucket(data.series, period) : [];
  const peak = bars.reduce((best, b, i) => (b.value > (bars[best]?.value ?? -1) ? i : best), 0);
  const sparkOf = (k: "revenueKobo" | "orders" | "views") => (data?.series ?? []).map((m) => m[k]);

  return (
    <div>
      <StudioHeaderBlock
        eyebrow={brand?.name ?? "Shop Studio"}
        title={`${hello}, ${user?.name.split(" ")[0] ?? ""}`}
        description="Here's how your shop is doing."
        actions={
          <>
            <SegmentedControl
              label="Period"
              value={period}
              onChange={setPeriod}
              options={periods}
              size="sm"
            />
            <ButtonLink
              href="/studio/products/new"
              size="sm"
              leadingIcon={<Plus className="size-4" />}
            >
              New product
            </ButtonLink>
          </>
        }
      />

      {isPending || !data ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" rounded="lg" />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 transition-opacity xl:grid-cols-4",
            isPlaceholderData && "opacity-60",
          )}
        >
          <Kpi
            index={0}
            label="Revenue"
            value={data.revenueKobo}
            format={formatNaira}
            step={100}
            change={delta(data.revenueKobo, data.revenuePrevKobo)}
            spark={sparkOf("revenueKobo")}
          />
          <Kpi
            index={1}
            label="Orders"
            value={data.orders}
            format={(n) => String(n)}
            change={delta(data.orders, data.ordersPrev)}
            spark={sparkOf("orders")}
          />
          <Kpi
            index={2}
            label="Conversion"
            value={Math.round(data.conversion * 100)}
            format={(n) => `${(n / 100).toFixed(2)}%`}
            change={delta(data.conversion, data.conversionPrev)}
            spark={sparkOf("views")}
          />
          <Kpi
            index={3}
            label="Rating"
            value={Math.round(data.rating * 10)}
            format={(n) => (n / 10).toFixed(1)}
            change={null}
            spark={[]}
            suffix={`${data.ratingCount} reviews`}
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section aria-labelledby="rev" className="rounded-lg bg-surface p-5 hairline xl:col-span-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="rev" className="text-title font-semibold">
                Revenue
              </h2>
              <p className="text-small text-muted">
                {period === "90d" ? "Weekly" : "Daily"}, before Kiosk fees
              </p>
            </div>
            {data && bars[peak] && bars[peak].value > 0 && (
              <p className="text-small text-muted">
                Best {period === "90d" ? "week" : "day"}:{" "}
                <span className="font-mono text-ink">{formatNaira(bars[peak].value)}</span>
              </p>
            )}
          </div>
          {isPending || !data ? (
            <Skeleton className="mt-6 h-56 w-full" />
          ) : data.revenueKobo === 0 ? (
            <EmptyState
              compact
              illustration="products"
              title="No sales yet"
              body="Once orders come in, you'll see revenue by day here."
            />
          ) : (
            <BarChart
              className="mt-8"
              data={bars}
              format={formatNairaCompact}
              highlight={peak}
              height={220}
              label={`Revenue over the last ${period}`}
            />
          )}
        </section>
        <SetupCard />
        {!isPending && data && (
          <section
            aria-labelledby="top"
            className="rounded-lg bg-surface p-5 hairline xl:col-span-1"
          >
            <h2 id="top" className="text-title font-semibold">
              Top products
            </h2>
            {data.topProducts.length === 0 ? (
              <p className="mt-4 text-small text-muted">No sales in this period yet.</p>
            ) : (
              <ol className="mt-4 flex flex-col">
                {data.topProducts.map((t, i) => (
                  <li
                    key={t.product.id}
                    className="flex items-center gap-3 border-b border-line py-2.5 last:border-0"
                  >
                    <span className="w-4 font-mono text-small text-muted">{i + 1}</span>
                    <span className="size-10 shrink-0 overflow-hidden rounded-sm">
                      <AppImage image={t.product.images[0]} alt="" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/studio/products/${t.product.id}`}
                        className="block truncate text-small font-medium hover:underline"
                      >
                        {t.product.name}
                      </Link>
                      <span className="text-small text-muted">{t.unitsSold} sold</span>
                    </span>
                    <span className="font-mono text-small tabular">
                      {formatNairaCompact(t.revenueKobo)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>

      {!isPending && data && (
        <section aria-labelledby="recent" className="mt-6 rounded-lg bg-surface hairline">
          <div className="flex items-center justify-between p-5">
            <h2 id="recent" className="text-title font-semibold">
              Recent orders
            </h2>
            <ButtonLink
              href="/studio/orders"
              variant="ghost"
              size="sm"
              trailingIcon={<ArrowRight className="size-4" />}
            >
              All orders
            </ButtonLink>
          </div>
          {data.recentOrders.length === 0 ? (
            <EmptyState
              compact
              illustration="orders"
              title="No orders yet"
              body="Share your shop link in your hall group chat to get your first order."
            />
          ) : (
            <TableScroll label="Recent orders">
              <table className="w-full min-w-[640px] text-small">
                <thead>
                  <tr className="border-y border-line text-left text-muted">
                    <th scope="col" className="px-5 py-2.5 eyebrow font-medium">
                      Order
                    </th>
                    <th scope="col" className="px-3 py-2.5 eyebrow font-medium">
                      Customer
                    </th>
                    <th scope="col" className="px-3 py-2.5 eyebrow font-medium">
                      Items
                    </th>
                    <th scope="col" className="px-3 py-2.5 eyebrow font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-2.5 text-right eyebrow font-medium">
                      Total
                    </th>
                    <th scope="col" className="px-5 py-2.5 text-right eyebrow font-medium">
                      Placed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-line last:border-0 hover:bg-ink/[0.02]"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/studio/orders?order=${o.id}`}
                          className="font-mono font-medium hover:underline"
                        >
                          {o.code}
                        </Link>
                      </td>
                      <td className="px-3 py-3">{o.buyerName}</td>
                      <td className="max-w-56 truncate px-3 py-3 text-muted">
                        {o.items.map((i) => i.name).join(", ")}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={o.status} method={o.fulfilment.method} />
                      </td>
                      <td className="px-3 py-3 text-right font-mono tabular">
                        {formatNaira(o.totalKobo)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted">
                        {now ? formatRelative(o.placedAt, now) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </section>
      )}
    </div>
  );
}
