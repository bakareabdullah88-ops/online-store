"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownUp, Boxes, Eye, Search, ShoppingBag, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { NavPageHeader } from "@/components/app/nav-header";
import { Stagger, StaggerItem } from "@/components/app/stagger";
import { DashCard } from "@/components/dash/card";
import { DateRangeControl, useRangeParam } from "@/components/dash/date-range";
import { Gauge } from "@/components/dash/gauge";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/overlay";
import type { Performance, ProductStat } from "@/domain/analytics";
import { formatNaira } from "@/domain/money";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { formatCompact, formatNumber } from "@/lib/format";
import { useProductAnalytics, useStudioProducts } from "@/queries/studio";
import type { Product } from "@/services/types";

type Sort = "score" | "views" | "sold" | "revenue" | "name";
const sorts: { value: Sort; label: string }[] = [
  { value: "score", label: "Performance" },
  { value: "views", label: "Most viewed" },
  { value: "sold", label: "Most sold" },
  { value: "revenue", label: "Revenue" },
  { value: "name", label: "Name" },
];

const perfTone: Record<Performance, string> = {
  Excellent: "text-success",
  Good: "text-success",
  Fair: "text-warning",
  Low: "text-danger",
  New: "text-muted",
};

const stock = (p: Product) => p.variants.reduce((n, v) => n + v.stock, 0);

function Divider() {
  return <span className="hidden h-10 w-px shrink-0 bg-line lg:block" aria-hidden />;
}

function Row({ p, s, i }: { p: Product; s: ProductStat; i: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.smooth, delay: Math.min(i * 0.04, 0.4) }}
      className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-4 gap-y-3 border-b border-line py-4 last:border-0 lg:flex lg:gap-6"
    >
      <Link
        href={`/studio/products/${p.id}`}
        aria-label={`Edit ${p.name}`}
        className="size-16 overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-line"
      >
        <AppImage image={p.images[0]} alt="" name={p.name} sizes="64px" />
      </Link>
      <div className="min-w-0 lg:w-56 lg:shrink-0">
        <Link
          href={`/studio/products/${p.id}`}
          className="block truncate text-[16px] font-medium hover:underline"
        >
          {p.name}
        </Link>
        <p className="mt-1 flex items-center gap-1 text-[13.5px] text-muted">
          Review :{" "}
          <span className="font-medium text-ink tabular">
            {p.ratingCount ? p.rating.toFixed(1) : "–"}
          </span>
          <Star className="size-3.5 fill-ink text-ink" />
          {p.status === "draft" && (
            <span className="ml-2 rounded-full bg-ink/[0.06] px-2 py-0.5 text-[11px] font-semibold text-ink-2">
              Draft
            </span>
          )}
        </p>
      </div>
      <Divider />
      <div className="col-span-2 flex min-w-0 flex-1 items-center justify-between gap-4 lg:col-span-1">
        <div className="min-w-0">
          <p className="text-[14px]">
            Performance <span className={cn("ml-1", perfTone[s.performance])}>{s.performance}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-[14px] tabular">
            <Eye className="size-4 text-muted" aria-label="Views" /> {formatCompact(s.views)}
            <span className="size-1 rounded-full bg-line-strong" aria-hidden />
            <ShoppingBag className="size-4 text-muted" aria-label="Added to bag" />{" "}
            {formatCompact(s.addToBag)}
          </p>
        </div>
        <Gauge value={s.score} size={72} label={`Score ${s.score} of 100`} />
      </div>
      <Divider />
      <div className="text-center lg:w-20">
        <p className="text-[13px] text-muted">Stock</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-[15px] font-medium tabular">
          <Boxes className="size-4 text-muted" /> {formatNumber(stock(p))}
        </p>
      </div>
      <Divider />
      <div className="text-center lg:w-24">
        <p className="text-[13px] text-muted">Sold</p>
        <p className="mt-1 text-[15px] font-medium tabular">{formatNumber(s.unitsSold)}</p>
      </div>
      <Divider />
      <div className="text-right lg:w-28">
        <p className="text-[13px] text-muted">Price</p>
        <p className="mt-1 text-[15px] font-medium tabular">{formatNaira(p.priceKobo)}</p>
      </div>
    </motion.li>
  );
}

function HourlyBars({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  const peak = hours.indexOf(Math.max(...hours));
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]">
        {hours.map((v, h) => (
          <motion.span
            key={h}
            title={`${h}:00 · ${v} views`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ ...spring.smooth, delay: h * 0.015 }}
            className={cn(
              "flex-1 origin-bottom rounded-t-md",
              h === peak && v > 0
                ? "bg-chart-blue"
                : "bg-chart-blue/10 hatch [--hatch:var(--chart-blue-2)]",
            )}
            style={{ height: `${Math.max((v / max) * 100, 3)}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted tabular">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
}

/** "All Product List" with a statistic strip and performance gauges (image 2). */
export function StudioAnalytics() {
  const { preset, range, setPreset } = useRangeParam();
  const { data } = useProductAnalytics(range);
  const products = useStudioProducts({}).data;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("score");

  const rows = useMemo(() => {
    if (!data || !products) return [];
    const byId = new Map(data.stats.map((s) => [s.productId, s]));
    const list = products
      .filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
      .map((p) => ({ p, s: byId.get(p.id)! }))
      .filter((r) => r.s);
    const key: Record<Sort, (r: (typeof list)[number]) => number | string> = {
      score: (r) => -r.s.score,
      views: (r) => -r.s.views,
      sold: (r) => -r.s.unitsSold,
      revenue: (r) => -r.s.revenueKobo,
      name: (r) => r.p.name.toLowerCase(),
    };
    return list.sort((a, b) =>
      key[sort](a) < key[sort](b) ? -1 : key[sort](a) > key[sort](b) ? 1 : 0,
    );
  }, [data, products, q, sort]);

  const stats = data?.stats ?? [];
  const active = products?.filter((p) => p.status === "published").length ?? 0;
  const winner = [...stats].sort((a, b) => b.revenueKobo - a.revenueKobo || b.score - a.score)[0];
  const winnerProduct =
    winner && (winner.revenueKobo > 0 || winner.views > 0)
      ? products?.find((p) => p.id === winner.productId)
      : undefined;
  const scored = stats.filter((s) => s.performance !== "New");
  const avg = scored.length
    ? Math.round(scored.reduce((n, s) => n + s.score, 0) / scored.length)
    : 0;
  const avgLabel = !scored.length
    ? "No data"
    : avg >= 70
      ? "Excellent!"
      : avg >= 40
        ? "Good!"
        : avg >= 15
          ? "Fair"
          : "Low";
  const sold = stats.reduce((n, s) => n + s.unitsSold, 0);

  return (
    <>
      <NavPageHeader
        title="Analytics"
        description="How each product turns views into sales."
        actions={<DateRangeControl preset={preset} range={range} onChange={setPreset} />}
      />
      {!data || !products ? (
        <DashboardSkeleton />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4">
          <StaggerItem className="rounded-[24px] bg-surface-2/70 p-5 ring-1 ring-line md:p-6">
            <h2 className="text-[19px] font-semibold">Product statistic</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 lg:grid-cols-4 lg:divide-x lg:divide-line">
              <div className="lg:pr-6">
                <dt className="text-small text-muted">Active products</dt>
                <dd className="mt-1.5 text-[26px] font-medium tabular">
                  {formatNumber(active)}{" "}
                  <span className="text-small text-ink-2">
                    {active === 1 ? "product" : "products"}
                  </span>
                </dd>
              </div>
              <div className="min-w-0 lg:px-6">
                <dt className="text-small text-muted">Winning product</dt>
                <dd className="mt-1.5 flex min-w-0 items-center gap-2.5">
                  {winnerProduct ? (
                    <>
                      <span className="size-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                        <AppImage
                          image={winnerProduct.images[0]}
                          alt=""
                          name={winnerProduct.name}
                          sizes="36px"
                        />
                      </span>
                      <Link
                        href={`/studio/products/${winnerProduct.id}`}
                        className="truncate text-[22px] font-medium hover:underline"
                      >
                        {winnerProduct.name}
                      </Link>
                    </>
                  ) : (
                    <span className="text-[22px] font-medium text-muted">Not yet</span>
                  )}
                </dd>
              </div>
              <div className="lg:px-6">
                <dt className="text-small text-muted">Average performance</dt>
                <dd className="mt-1.5 flex items-center gap-2.5">
                  <Gauge value={avg} size={52} />
                  <span className="text-[22px] font-medium">{avgLabel}</span>
                </dd>
              </div>
              <div className="lg:pl-6">
                <dt className="text-small text-muted">Products sold</dt>
                <dd className="mt-1.5 text-[26px] font-medium tabular">
                  {formatNumber(sold)} <span className="text-small text-ink-2">items</span>
                </dd>
              </div>
            </dl>
          </StaggerItem>

          <StaggerItem className="rounded-[24px] p-1 ring-1 ring-line md:p-2">
            <div className="flex flex-col gap-3 px-4 pt-4 md:flex-row md:items-center md:px-4">
              <h2 className="flex-1 text-[19px] font-semibold">All product list</h2>
              <label className="flex h-10 items-center gap-2 rounded-xl bg-surface px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-accent/40 md:w-72">
                <Search className="size-4 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search product"
                  aria-label="Search product"
                  className="min-w-0 flex-1 bg-transparent text-small outline-none placeholder:text-faint"
                />
              </label>
              <div className="flex items-center gap-2">
                <ArrowDownUp className="size-4 text-muted" aria-hidden />
                <Select<Sort>
                  label="Sort by"
                  value={sort}
                  onValueChange={setSort}
                  options={sorts}
                  className="h-10 w-44 rounded-xl"
                />
              </div>
            </div>
            {products.length === 0 ? (
              <div className="flex flex-col items-start gap-3 px-4 py-10">
                <p className="text-body text-muted">
                  Add a product and its views, adds to bag and sales will be scored here.
                </p>
                <ButtonLink href="/studio/products/new">Add a product</ButtonLink>
              </div>
            ) : rows.length === 0 ? (
              <p className="px-4 py-10 text-body text-muted">No products match “{q}”.</p>
            ) : (
              <ul className="px-4">
                {rows.map((r, i) => (
                  <Row key={r.p.id} p={r.p} s={r.s} i={i} />
                ))}
              </ul>
            )}
          </StaggerItem>

          <StaggerItem className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <DashCard
              title="Views by hour"
              actions={[{ label: "All products", href: "/studio/products" }]}
            >
              <HourlyBars hours={data.hourly} />
            </DashCard>
            <DashCard
              title="Orders by campus"
              actions={[{ label: "See customers", href: "/studio/customers" }]}
            >
              {data.campuses.length === 0 ? (
                <p className="text-small text-muted">
                  Where your buyers order from shows up after your first order.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.campuses.map((c) => {
                    const max = Math.max(...data.campuses.map((x) => x.revenueKobo), 1);
                    return (
                      <li key={c.campusId}>
                        <div className="flex justify-between text-small">
                          <span className="truncate">{c.name}</span>
                          <span className="text-muted tabular">
                            {c.orders} · {formatNaira(c.revenueKobo)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-chart-track">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.revenueKobo / max) * 100}%` }}
                            transition={spring.smooth}
                            className="h-full rounded-full bg-chart-violet/25 hatch [--hatch:var(--chart-violet)]"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </DashCard>
          </StaggerItem>
        </Stagger>
      )}
    </>
  );
}
