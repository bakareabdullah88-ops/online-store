/**
 * Money is always an integer number of kobo (1 naira = 100 kobo).
 * Never use floats for money; convert at the edges only.
 */
export type Kobo = number;

const KOBO_PER_NAIRA = 100;

const wholeFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const exactFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-NG", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function assertKobo(value: number): asserts value is Kobo {
  if (!Number.isInteger(value)) throw new TypeError(`Money must be integer kobo, got ${value}`);
}

export function naira(amount: number): Kobo {
  return Math.round(amount * KOBO_PER_NAIRA);
}

export function toNaira(kobo: Kobo): number {
  return kobo / KOBO_PER_NAIRA;
}

/** ₦4,500 (or ₦4,500.50 when there are kobo). */
export function formatNaira(kobo: Kobo, opts: { exact?: boolean } = {}): string {
  assertKobo(kobo);
  const value = kobo / KOBO_PER_NAIRA;
  const hasKobo = kobo % KOBO_PER_NAIRA !== 0;
  return (opts.exact || hasKobo ? exactFormatter : wholeFormatter).format(value);
}

/** ₦12.5k style for charts and dense UI. */
export function formatNairaCompact(kobo: Kobo): string {
  assertKobo(kobo);
  return `₦${compactFormatter.format(kobo / KOBO_PER_NAIRA)}`;
}

/** Percentage discount between a compare-at price and the price, rounded down. */
export function discountPercent(priceKobo: Kobo, compareAtKobo: Kobo | undefined): number | null {
  if (!compareAtKobo || compareAtKobo <= priceKobo) return null;
  return Math.floor(((compareAtKobo - priceKobo) / compareAtKobo) * 100);
}

/** Apply a percentage to an amount, rounding to the nearest kobo (half up). */
export function percentOf(kobo: Kobo, percent: number): Kobo {
  return Math.round((kobo * percent) / 100);
}

export function sumKobo(values: readonly Kobo[]): Kobo {
  let total = 0;
  for (const v of values) {
    assertKobo(v);
    total += v;
  }
  return total;
}

/** Parse "4,500" / "₦4500.50" from an input into kobo. Returns null when invalid. */
export function parseNairaInput(input: string): Kobo | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * KOBO_PER_NAIRA);
}
