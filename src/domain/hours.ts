import type { OpenHours } from "@/services/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatClock(hhmm: string) {
  const total = minutes(hhmm);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}

export type OpenState = { open: boolean; label: string };

/** "Open · closes 8pm" / "Closed · opens Mon 9am". Pure, `now` injectable. */
export function openState(hours: OpenHours, vacation: boolean, now: Date): OpenState {
  if (vacation) return { open: false, label: "On a break" };
  const day = now.getDay();
  const mins = now.getHours() * 60 + now.getMinutes();
  const o = minutes(hours.opens);
  const c = minutes(hours.closes);
  if (hours.days.includes(day) && mins >= o && mins < c) {
    return { open: true, label: `Open · closes ${formatClock(hours.closes)}` };
  }
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    if (!hours.days.includes(d)) continue;
    if (i === 0 && mins >= o) continue;
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAYS[d];
    return { open: false, label: `Closed · opens ${when} ${formatClock(hours.opens)}` };
  }
  return { open: false, label: "Closed" };
}

export function describeDays(days: number[]) {
  const sorted = [...days].sort();
  if (sorted.length === 7) return "Every day";
  if (sorted.join() === "1,2,3,4,5") return "Mon–Fri";
  if (sorted.join() === "1,2,3,4,5,6") return "Mon–Sat";
  return sorted.map((d) => DAYS[d]).join(", ");
}
