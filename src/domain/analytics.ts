/**
 * Dashboard maths. Pure functions over real orders and analytics events, so
 * the same code can run in the browser today and on the server later
 * (BACKEND-SEAM: move behind /api/v1/dashboard).
 */
import type { AnalyticsEvent, Order, Product } from "@/services/types";
import { isActive } from "./orders";

/* --------------------------------- Ranges --------------------------------- */

/** Inclusive range of local calendar days, as YYYY-MM-DD. */
export type DayRange = { from: string; to: string };
export type RangePreset = "7d" | "30d" | "90d" | "month" | "lastMonth" | "year";

const DAY = 86_400_000;

export function dayKey(d: Date | number | string): string {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}

function parseDay(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function presetRange(preset: RangePreset, now: number = Date.now()): DayRange {
  const today = dayKey(now);
  const d = new Date(now);
  switch (preset) {
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "90d":
      return { from: addDays(today, -89), to: today };
    case "month":
      return { from: dayKey(new Date(d.getFullYear(), d.getMonth(), 1)), to: today };
    case "lastMonth":
      return {
        from: dayKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
        to: dayKey(new Date(d.getFullYear(), d.getMonth(), 0)),
      };
    case "year":
      return { from: dayKey(new Date(d.getFullYear(), 0, 1)), to: today };
  }
}

export function rangeDays(r: DayRange): string[] {
  const out: string[] = [];
  for (let k = r.from; k <= r.to && out.length < 800; k = addDays(k, 1)) out.push(k);
  return out;
}

/** The same number of days immediately before `r`. */
export function previousRange(r: DayRange): DayRange {
  const n = rangeDays(r).length;
  return { from: addDays(r.from, -n), to: addDays(r.from, -1) };
}

export function inRange(at: string | number, r: DayRange): boolean {
  const k = dayKey(at);
  return k >= r.from && k <= r.to;
}

const monthDay = new Intl.DateTimeFormat("en-NG", { month: "short", day: "2-digit" });
export function rangeLabel(r: DayRange): string {
  return `${monthDay.format(parseDay(r.from))} – ${monthDay.format(parseDay(r.to))}`;
}

/* --------------------------------- Shapes --------------------------------- */

export type Delta = {
  value: number;
  prev: number;
  /** Percent change; null when there is nothing to compare against. */
  change: number | null;
};

export function delta(value: number, prev: number): Delta {
  return {
    value,
    prev,
    change: prev === 0 ? (value === 0 ? 0 : null) : ((value - prev) / prev) * 100,
  };
}

export type FunnelStep = {
  key: string;
  label: string;
  value: number;
  /** Share of the previous step that made it here (%); null for the first step. */
  conversion: number | null;
  /** Percentage points lost from the previous step; null for the first step. */
  dropOff: number | null;
  /** The same step in the comparison period. */
  prev: number;
};

export function funnel(
  steps: { key: string; label: string; value: number; prev?: number }[],
): FunnelStep[] {
  return steps.map((s, i) => {
    const prev = i > 0 ? steps[i - 1]!.value : null;
    const conversion =
      prev === null ? null : prev === 0 ? 0 : Math.min(100, (s.value / prev) * 100);
    return {
      ...s,
      prev: s.prev ?? 0,
      conversion,
      dropOff: conversion === null ? null : conversion - 100,
    };
  });
}

export type Part = { key: string; label: string; valueKobo: number; share: number };
export type DailyPoint = { date: string; amountKobo: number; orders: number };
export type WeekdayCount = { day: number; label: string; orders: number };
export type RatePoint = { label: string; rate: number | null };
export type Insight = { value: string; label: string };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Orders that count towards money and volume (not declined or cancelled). */
export function counts(o: Order): boolean {
  return o.status !== "declined" && o.status !== "cancelled";
}

function reached(o: Order, status: Order["status"]): boolean {
  return o.timeline.some((t) => t.status === status);
}

function parts(entries: [string, string, number][]): Part[] {
  const total = entries.reduce((n, [, , v]) => n + v, 0);
  return entries.map(([key, label, valueKobo]) => ({
    key,
    label,
    valueKobo,
    share: total ? (valueKobo / total) * 100 : 0,
  }));
}

function daily(orders: Order[], r: DayRange): DailyPoint[] {
  const map = new Map(rangeDays(r).map((d) => [d, { date: d, amountKobo: 0, orders: 0 }]));
  for (const o of orders) {
    const p = map.get(dayKey(o.placedAt));
    if (!p) continue;
    p.amountKobo += o.totalKobo;
    p.orders += 1;
  }
  return [...map.values()];
}

function byWeekday(orders: Order[]): { days: WeekdayCount[]; peak: number | null } {
  const days = WEEKDAYS.map((label, day) => ({ day, label, orders: 0 }));
  for (const o of orders) days[new Date(o.placedAt).getDay()]!.orders += 1;
  const max = Math.max(...days.map((d) => d.orders));
  return { days, peak: max > 0 ? days.findIndex((d) => d.orders === max) : null };
}

/** Share of orders in each bucket that came from someone who had ordered before. */
function returningSeries(all: Order[], r: DayRange, key: (o: Order) => string): RatePoint[] {
  const days = rangeDays(r);
  const weekly = days.length <= 120;
  const buckets = new Map<string, { total: number; returning: number }>();
  const label = (d: string) => {
    const date = parseDay(d);
    if (!weekly) return new Intl.DateTimeFormat("en-NG", { month: "short" }).format(date);
    const start = new Date(date);
    start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return monthDay.format(start);
  };
  for (const d of days)
    if (!buckets.has(label(d))) buckets.set(label(d), { total: 0, returning: 0 });
  const sorted = [...all].sort((a, b) => Date.parse(a.placedAt) - Date.parse(b.placedAt));
  const seen = new Set<string>();
  for (const o of sorted) {
    const who = key(o);
    if (inRange(o.placedAt, r)) {
      const b = buckets.get(label(dayKey(o.placedAt)));
      if (b) {
        b.total += 1;
        if (seen.has(who)) b.returning += 1;
      }
    }
    seen.add(who);
  }
  return [...buckets.entries()].map(([l, b]) => ({
    label: l,
    rate: b.total ? (b.returning / b.total) * 100 : null,
  }));
}

/* -------------------------------- Seller --------------------------------- */

export type TodoItem = { id: string; label: string; detail: string; href: string; count: number };

export type SellerDashboard = {
  range: DayRange;
  prevRange: DayRange;
  revenue: Delta;
  orders: Delta;
  customers: Delta;
  avgOrder: Delta;
  conversion: Delta;
  funnel: FunnelStep[];
  volume: { totalKobo: number; parts: Part[] };
  daily: DailyPoint[];
  retention: { rate: number | null; series: RatePoint[] };
  weekdays: WeekdayCount[];
  peakDay: number | null;
  todo: TodoItem[];
  insight: Insight | null;
  topProducts: { productId: string; name: string; unitsSold: number; revenueKobo: number }[];
};

export function sellerDashboard(input: {
  orders: Order[];
  events: AnalyticsEvent[];
  products: Product[];
  range: DayRange;
}): SellerDashboard {
  const { range } = input;
  const prevRange = previousRange(range);
  const inR = input.orders.filter((o) => inRange(o.placedAt, range));
  const inP = input.orders.filter((o) => inRange(o.placedAt, prevRange));
  const cur = inR.filter(counts);
  const prev = inP.filter(counts);
  const money = (os: Order[]) => os.reduce((n, o) => n + o.totalKobo, 0);
  const people = (os: Order[]) => new Set(os.map((o) => o.buyerId)).size;
  const avg = (os: Order[]) => (os.length ? money(os) / os.length : 0);
  const ev = (type: AnalyticsEvent["type"], r: DayRange) =>
    input.events.filter((e) => e.type === type && inRange(e.at, r)).length;
  const conv = (os: Order[], r: DayRange) => {
    const v = ev("view", r);
    return v ? (os.length / v) * 100 : 0;
  };

  const retention = returningSeries(input.orders.filter(counts), range, (o) => o.buyerId);
  const repeatBuyers = (() => {
    const counted = new Map<string, number>();
    for (const o of input.orders.filter(counts)) {
      if (dayKey(o.placedAt) > range.to) continue;
      counted.set(o.buyerId, (counted.get(o.buyerId) ?? 0) + 1);
    }
    const active = new Set(cur.map((o) => o.buyerId));
    if (!active.size) return null;
    return ([...active].filter((b) => (counted.get(b) ?? 0) > 1).length / active.size) * 100;
  })();

  const wk = byWeekday(cur);
  const units = new Map<string, { units: number; revenue: number }>();
  for (const o of cur)
    for (const it of o.items) {
      const u = units.get(it.productId) ?? { units: 0, revenue: 0 };
      u.units += it.quantity;
      u.revenue += it.unitPriceKobo * it.quantity;
      units.set(it.productId, u);
    }
  const names = new Map(input.products.map((p) => [p.id, p.name]));
  for (const o of input.orders)
    for (const it of o.items) if (!names.has(it.productId)) names.set(it.productId, it.name);

  const delivered = inR.filter((o) => o.status === "delivered").length;
  const decided = inR.filter((o) => !isActive(o.status)).length;

  const statusCount = (s: Order["status"]) => input.orders.filter((o) => o.status === s).length;
  const lowStock = input.products.filter(
    (p) => p.status === "published" && p.variants.reduce((n, v) => n + v.stock, 0) <= 3,
  ).length;
  const todo: TodoItem[] = [
    {
      id: "accept",
      label: "Accept new orders",
      detail: "Waiting for you to confirm",
      href: "/studio/orders?status=placed",
      count: statusCount("placed"),
    },
    {
      id: "prepare",
      label: "Orders to prepare",
      detail: "Accepted and in progress",
      href: "/studio/orders?status=active",
      count: statusCount("confirmed") + statusCount("preparing"),
    },
    {
      id: "handover",
      label: "Ready to hand over",
      detail: "Waiting for pickup or delivery",
      href: "/studio/orders?status=ready",
      count: statusCount("ready") + statusCount("out_for_delivery"),
    },
    {
      id: "stock",
      label: "Low stock",
      detail: "3 or fewer left",
      href: "/studio/products?stock=low",
      count: lowStock,
    },
  ];

  return {
    range,
    prevRange,
    revenue: delta(money(cur), money(prev)),
    orders: delta(cur.length, prev.length),
    customers: delta(people(cur), people(prev)),
    avgOrder: delta(avg(cur), avg(prev)),
    conversion: delta(conv(cur, range), conv(prev, prevRange)),
    funnel: funnel([
      {
        key: "views",
        label: "Product views",
        value: ev("view", range),
        prev: ev("view", prevRange),
      },
      {
        key: "bag",
        label: "Added to bag",
        value: ev("add_to_bag", range),
        prev: ev("add_to_bag", prevRange),
      },
      { key: "placed", label: "Orders placed", value: inR.length, prev: inP.length },
      {
        key: "accepted",
        label: "Accepted",
        value: inR.filter((o) => reached(o, "confirmed")).length,
        prev: inP.filter((o) => reached(o, "confirmed")).length,
      },
      {
        key: "completed",
        label: "Completed",
        value: delivered,
        prev: inP.filter((o) => o.status === "delivered").length,
      },
    ]),
    volume: {
      totalKobo: money(cur),
      parts: parts([
        [
          "delivery",
          "Delivery orders",
          money(cur.filter((o) => o.fulfilment.method === "delivery")),
        ],
        ["pickup", "Pickup orders", money(cur.filter((o) => o.fulfilment.method === "pickup"))],
        ["discounts", "Promo discounts", cur.reduce((n, o) => n + o.discountKobo, 0)],
      ]),
    },
    daily: daily(cur, range),
    retention: { rate: repeatBuyers, series: retention },
    weekdays: wk.days,
    peakDay: wk.peak,
    todo,
    insight:
      decided > 0
        ? {
            value: `${Math.round((delivered / decided) * 100)}%`,
            label: "of finished orders were completed, not declined or cancelled",
          }
        : null,
    topProducts: [...units.entries()]
      .map(([productId, u]) => ({
        productId,
        name: names.get(productId) ?? "Product",
        unitsSold: u.units,
        revenueKobo: u.revenue,
      }))
      .sort((a, b) => b.revenueKobo - a.revenueKobo)
      .slice(0, 5),
  };
}

/* ---------------------------- Product analytics --------------------------- */

export type Performance = "Excellent" | "Good" | "Fair" | "Low" | "New";

export type ProductStat = {
  productId: string;
  views: number;
  addToBag: number;
  unitsSold: number;
  revenueKobo: number;
  /** Units sold per 100 views. */
  conversion: number;
  /** 0–100, from conversion and add-to-bag rate. */
  score: number;
  performance: Performance;
};

export function productStats(input: {
  orders: Order[];
  events: AnalyticsEvent[];
  products: Product[];
  range: DayRange;
}): ProductStat[] {
  return input.products.map((p) => {
    const evs = input.events.filter((e) => e.productId === p.id && inRange(e.at, input.range));
    const views = evs.filter((e) => e.type === "view").length;
    const addToBag = evs.filter((e) => e.type === "add_to_bag").length;
    let unitsSold = 0;
    let revenueKobo = 0;
    for (const o of input.orders) {
      if (!counts(o) || !inRange(o.placedAt, input.range)) continue;
      for (const it of o.items)
        if (it.productId === p.id) {
          unitsSold += it.quantity;
          revenueKobo += it.unitPriceKobo * it.quantity;
        }
    }
    const conversion = views ? (unitsSold / views) * 100 : 0;
    const bagRate = views ? (addToBag / views) * 100 : 0;
    const score = Math.round(Math.min(100, conversion * 5 + bagRate * 1.5));
    const performance: Performance =
      views + unitsSold === 0
        ? "New"
        : score >= 70
          ? "Excellent"
          : score >= 40
            ? "Good"
            : score >= 15
              ? "Fair"
              : "Low";
    return {
      productId: p.id,
      views,
      addToBag,
      unitsSold,
      revenueKobo,
      conversion,
      score,
      performance,
    };
  });
}

/** Views per hour of day (0–23) in the range. */
export function hourlyViews(events: AnalyticsEvent[], r: DayRange): number[] {
  const hours = Array.from({ length: 24 }, () => 0);
  for (const e of events)
    if (e.type === "view" && inRange(e.at, r)) hours[new Date(e.at).getHours()]! += 1;
  return hours;
}

/* --------------------------------- Buyer ---------------------------------- */

export type BuyerDashboard = {
  range: DayRange;
  prevRange: DayRange;
  spent: Delta;
  orders: Delta;
  avgOrder: Delta;
  shops: Delta;
  statusFunnel: FunnelStep[];
  categories: { totalKobo: number; parts: Part[] };
  daily: DailyPoint[];
  weekdays: WeekdayCount[];
  peakDay: number | null;
  active: number;
  toReview: number;
  insight: Insight | null;
};

export function buyerDashboard(input: {
  orders: Order[];
  categoryOf: (productId: string) => string | undefined;
  categoryName: (id: string) => string;
  range: DayRange;
}): BuyerDashboard {
  const { range } = input;
  const prevRange = previousRange(range);
  const inR = input.orders.filter((o) => inRange(o.placedAt, range));
  const cur = inR.filter(counts);
  const inP = input.orders.filter((o) => inRange(o.placedAt, prevRange));
  const prev = inP.filter(counts);
  const money = (os: Order[]) => os.reduce((n, o) => n + o.totalKobo, 0);
  const shops = (os: Order[]) => new Set(os.map((o) => o.brandId)).size;
  const avg = (os: Order[]) => (os.length ? money(os) / os.length : 0);

  const byCat = new Map<string, number>();
  for (const o of cur)
    for (const it of o.items) {
      const c = input.categoryOf(it.productId) ?? "other";
      byCat.set(c, (byCat.get(c) ?? 0) + it.unitPriceKobo * it.quantity);
    }
  const catParts = parts(
    [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k, v]) => [k, k === "other" ? "Other" : input.categoryName(k), v]),
  );

  const favourite = (() => {
    const m = new Map<string, { name: string; n: number }>();
    for (const o of cur) m.set(o.brandId, { name: o.brandName, n: (m.get(o.brandId)?.n ?? 0) + 1 });
    const top = [...m.values()].sort((a, b) => b.n - a.n)[0];
    return top
      ? { value: top.name, label: `your most-ordered shop (${top.n} order${top.n > 1 ? "s" : ""})` }
      : null;
  })();

  const wk = byWeekday(cur);
  return {
    range,
    prevRange,
    spent: delta(money(cur), money(prev)),
    orders: delta(cur.length, prev.length),
    avgOrder: delta(avg(cur), avg(prev)),
    shops: delta(shops(cur), shops(prev)),
    statusFunnel: funnel(
      (
        [
          ["placed", "Placed", () => true],
          ["accepted", "Accepted", (o) => reached(o, "confirmed")],
          ["prepared", "Prepared", (o) => reached(o, "ready") || reached(o, "out_for_delivery")],
          ["delivered", "Delivered", (o) => o.status === "delivered"],
          ["reviewed", "Reviewed", (o) => o.reviewed],
        ] as [string, string, (o: Order) => boolean][]
      ).map(([key, label, test]) => ({
        key,
        label,
        value: inR.filter(test).length,
        prev: inP.filter(test).length,
      })),
    ),
    categories: { totalKobo: money(cur), parts: catParts },
    daily: daily(cur, range),
    weekdays: wk.days,
    peakDay: wk.peak,
    active: input.orders.filter((o) => isActive(o.status)).length,
    toReview: input.orders.filter((o) => o.status === "delivered" && !o.reviewed).length,
    insight: favourite,
  };
}

export const weekdayName = (d: number) =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d] ?? "";

export { DAY as MS_PER_DAY };
