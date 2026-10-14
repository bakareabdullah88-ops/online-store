/**
 * A greeting that changes with the time of day and the day itself, so the app
 * feels like it is glad to see you rather than reading out the clock.
 */

type Line = (name: string) => string;

const LATE: Line[] = [
  (n) => `Up late, ${n}? 🌙`,
  (n) => `Night owl mode, ${n} 🦉`,
  (n) => `Still awake, ${n}? Let's be quick`,
];

const MORNING: Line[] = [
  (n) => `Good morning, ${n} ☀️`,
  (n) => `Morning, ${n}. Fresh start today`,
  (n) => `Hey ${n}, early bird today?`,
  (n) => `Rise and shine, ${n}`,
  (n) => `Morning, ${n}. Breakfast sorted?`,
];

const AFTERNOON: Line[] = [
  (n) => `Good afternoon, ${n}`,
  (n) => `Welcome back, ${n}`,
  (n) => `Hey ${n}, lunch break?`,
  (n) => `Afternoon, ${n} 👋`,
  (n) => `Hope the lectures are kind today, ${n}`,
];

const EVENING: Line[] = [
  (n) => `Good evening, ${n}`,
  (n) => `Hey ${n}, good to see you`,
  (n) => `Evening, ${n}. Winding down?`,
  (n) => `Hey ${n}, how did today go?`,
  (n) => `Welcome back, ${n} ✨`,
];

const NIGHT: Line[] = [
  (n) => `Late one, ${n}?`,
  (n) => `One more look before bed, ${n}? 🌙`,
  (n) => `Evening, ${n}. Take it easy`,
];

/** Extra lines for particular days, mixed in with the time-of-day ones. */
const DAYS: Record<number, Line[]> = {
  0: [(n) => `Easy Sunday, ${n}`],
  1: [(n) => `New week, ${n}. Let's go`],
  5: [(n) => `Happy Friday, ${n} 🎉`, (n) => `TGIF, ${n}!`],
  6: [(n) => `Happy weekend, ${n}`],
};

function linesFor(now: Date): Line[] {
  const h = now.getHours();
  const base = h < 5 ? LATE : h < 12 ? MORNING : h < 17 ? AFTERNOON : h < 22 ? EVENING : NIGHT;
  // Day lines only during waking hours.
  const day = h >= 5 && h < 22 ? (DAYS[now.getDay()] ?? []) : [];
  return [...base, ...day];
}

const LAST_KEY = "kiosk:last-greeting";

/**
 * Picks a greeting for `name`. Call once per visit (for example in a
 * useState initialiser) so it doesn't change while you look at it. Avoids
 * repeating the last one this browser saw when it can.
 */
export function greet(name: string, now: Date = new Date(), random: () => number = Math.random) {
  const options = linesFor(now).map((l) => l(name));
  let last: string | null = null;
  try {
    last = localStorage.getItem(LAST_KEY);
  } catch {
    // Storage blocked: any greeting will do.
  }
  const pool = options.length > 1 ? options.filter((o) => o !== last) : options;
  const pick = pool[Math.floor(random() * pool.length)] ?? options[0] ?? `Hi, ${name}`;
  try {
    localStorage.setItem(LAST_KEY, pick);
  } catch {
    // Not remembered; fine.
  }
  return pick;
}

/** Every line a given moment can produce (for tests). */
export function greetingOptions(name: string, now: Date) {
  return linesFor(now).map((l) => l(name));
}
