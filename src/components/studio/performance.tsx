"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, ExternalLink, Plus, Star } from "lucide-react";
import { pagePad } from "@/components/app/layout";
import { DashCard } from "@/components/dash/card";
import { DateRangeControl, useRangeParam } from "@/components/dash/date-range";
import { HeroFigure } from "@/components/dash/hero";
import { SetupStrip } from "@/components/dash/setup";
import { DashboardSkeleton } from "@/components/dash/skeleton";
import { TodoList } from "@/components/dash/todo";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { ShareButton } from "@/components/market/share-button";
import { rangeLabel } from "@/domain/analytics";
import { formatNaira, formatNairaCompact } from "@/domain/money";
import { formatCompact, formatNumber } from "@/lib/format";
import { useMyBrand, useShopDashboard } from "@/queries/studio";
import type { Brand } from "@/services/types";
import { ShopInsights } from "./analytics";

/** Your shop the way students see it: cover photo, logo, the counts that matter, and a way to share it. No box around it. */
function ShopFront({ brand }: { brand: Brand | null | undefined }) {
  if (!brand) {
    return <Skeleton className="h-[188px] w-full md:h-[210px]" rounded="lg" />;
  }
  return (
    <section>
      <div className="relative h-24 overflow-hidden rounded-xl bg-surface-2 md:h-32">
        <AppImage
          image={brand.cover}
          alt=""
          variant="cover"
          sizes="(min-width: 1280px) 1200px, 100vw"
        />
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex min-w-0 flex-1 items-end gap-3.5">
          <span className="relative -mt-9 ml-4 size-[72px] shrink-0 overflow-hidden rounded-2xl bg-surface ring-4 ring-(--app-bg) md:-mt-11 md:ml-6 md:size-20">
            <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
          </span>
          <div className="min-w-0 pb-0.5">
            <h1 className="flex items-center gap-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em] md:text-[26px]">
              <span className="truncate">{brand.name}</span>
              {brand.verified && (
                <BadgeCheck className="size-5 shrink-0 text-accent" aria-label="Verified shop" />
              )}
            </h1>
            <p className="truncate text-small text-muted">kamplug/{brand.handle}</p>
          </div>
        </div>
        <dl className="flex items-center gap-5 text-center md:gap-7">
          <div>
            <dt className="text-[12px] text-muted">Followers</dt>
            <dd className="text-[17px] font-semibold tabular">
              {formatCompact(brand.followerCount)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted">Products</dt>
            <dd className="text-[17px] font-semibold tabular">
              {formatNumber(brand.productCount)}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted">Rating</dt>
            <dd className="flex items-center justify-center gap-1 text-[17px] font-semibold tabular">
              {brand.ratingCount ? (
                <>
                  <Star className="size-4 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
                  {brand.rating.toFixed(1)}
                </>
              ) : (
                <span className="text-muted">–</span>
              )}
            </dd>
          </div>
        </dl>
        <div className="flex gap-2">
          <ButtonLink
            href={`/brands/${brand.handle}`}
            variant="secondary"
            leadingIcon={<ExternalLink className="size-4" />}
            className="flex-1 md:flex-none"
          >
            View shop
          </ButtonLink>
          <ShareButton
            title={brand.name}
            text={`${brand.name} on Kamplug`}
            path={`/brands/${brand.handle}`}
          />
        </div>
      </div>
    </section>
  );
}

type View = "overview" | "insights";
const views = [
  { value: "overview", label: "Overview" },
  { value: "insights", label: "Insights" },
] as const;

/**
 * The shop's one dashboard. Overview: revenue, what needs doing, what's selling.
 * Insights: the funnel, busy days and how each product sells. Same date range for both.
 */
export function ShopPerformance() {
  const { preset, range, setPreset } = useRangeParam();
  const { data: brand } = useMyBrand();
  const { data: d } = useShopDashboard(range);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/studio";
  const view: View = params.get("view") === "insights" ? "insights" : "overview";
  const setView = (v: View) => {
    const next = new URLSearchParams(params.toString());
    if (v === "overview") next.delete("view");
    else next.set("view", v);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className={pagePad}>
      <ShopFront brand={brand} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl<View>
          value={view}
          onChange={setView}
          options={views}
          label="Dashboard view"
        />
        <DateRangeControl preset={preset} range={range} onChange={setPreset} />
      </div>
      {view === "insights" ? (
        <div className="mt-4">
          <ShopInsights range={range} />
        </div>
      ) : !d ? (
        <div className="mt-4">
          <DashboardSkeleton />
        </div>
      ) : (
        <div className="mt-4 flex flex-col">
          <HeroFigure
            label={`Revenue, ${rangeLabel(range)}`}
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
              <button
                type="button"
                onClick={() => setView("insights")}
                className="tap-area text-small font-medium text-accent-ink hover:underline"
              >
                See the funnel, busiest days and each product
              </button>
            }
          />

          <SetupStrip />

          <div className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
            <DashCard
              title="Needs your attention"
              aside={
                <Link
                  href="/studio/orders"
                  className="tap-area text-small font-medium text-accent-ink hover:underline"
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
                  className="tap-area text-small font-medium text-accent-ink hover:underline"
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
                <ol className="divide-y divide-line-thin">
                  {d.topProducts.map((p, i) => (
                    <li key={p.productId} className="flex items-center gap-3 py-3">
                      <span className="w-5 text-small text-muted tabular">{i + 1}</span>
                      <Link
                        href={`/studio/products/${p.productId}`}
                        className="tap-area min-w-0 flex-1 truncate text-[14px] font-medium hover:underline"
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
