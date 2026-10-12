const dateFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" });
const dateYearFmt = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true });
const weekdayFmt = new Intl.DateTimeFormat("en-NG", { weekday: "short" });
const numberFmt = new Intl.NumberFormat("en-NG");
const compactFmt = new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 });
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });

export function formatDate(iso: string | number, opts: { year?: boolean } = {}) {
  const d = new Date(iso);
  return (opts.year ? dateYearFmt : dateFmt).format(d);
}

export function formatTime(iso: string | number) {
  return timeFmt.format(new Date(iso));
}

export function formatWeekday(iso: string | number) {
  return weekdayFmt.format(new Date(iso));
}

export function formatNumber(n: number) {
  return numberFmt.format(n);
}

export function formatCompact(n: number) {
  return compactFmt.format(n);
}

export function formatPercent(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

/** "just now", "5 min ago", "yesterday", "12 Mar". `now` is injectable for tests. */
export function formatRelative(iso: string | number, now: number = Date.now()) {
  const t = new Date(iso).getTime();
  const diff = Math.round((t - now) / 1000);
  const abs = Math.abs(diff);
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 6) return rtf.format(Math.round(diff / 86400), "day");
  return formatDate(t, { year: new Date(t).getFullYear() !== new Date(now).getFullYear() });
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (first + last).toUpperCase();
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`;
}
