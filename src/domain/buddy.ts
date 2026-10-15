/**
 * Buddies: the animated cartoon characters customers get as a profile picture
 * until they upload a photo. Seven shapes, seven colours. Everyone starts with
 * one picked from their account id, and can change it in Settings.
 */

export const BUDDY_SHAPES = ["blob", "bean", "cube", "cloud", "star", "drop", "heart"] as const;
export const BUDDY_COLORS = [
  "mint",
  "sun",
  "coral",
  "sky",
  "grape",
  "bubblegum",
  "tangerine",
] as const;

export type BuddyShape = (typeof BUDDY_SHAPES)[number];
export type BuddyColor = (typeof BUDDY_COLORS)[number];
export type Buddy = { shape: BuddyShape; color: BuddyColor };

export const buddyShapeNames: Record<BuddyShape, string> = {
  blob: "Blob",
  bean: "Bean",
  cube: "Cube",
  cloud: "Cloud",
  star: "Star",
  drop: "Drop",
  heart: "Heart",
};

/** light: highlight side of the body, base: the body, shade: arms and shading, bg: the circle behind. */
export const buddyColors: Record<
  BuddyColor,
  { name: string; light: string; base: string; shade: string; bg: string }
> = {
  mint: { name: "Mint", light: "#9ff5c8", base: "#3dd68c", shade: "#159a5c", bg: "#dcf8e9" },
  sun: { name: "Sun", light: "#fff3a6", base: "#ffd23f", shade: "#d49a00", bg: "#fff6d1" },
  coral: { name: "Coral", light: "#ffc2b8", base: "#ff7a68", shade: "#d64a38", bg: "#ffe4df" },
  sky: { name: "Sky", light: "#bfe6ff", base: "#5bb8ff", shade: "#2a7fd0", bg: "#dff1ff" },
  grape: { name: "Grape", light: "#dccfff", base: "#a78bfa", shade: "#6d4bd1", bg: "#ece6ff" },
  bubblegum: {
    name: "Bubblegum",
    light: "#ffd0e8",
    base: "#ff8cc6",
    shade: "#d1508f",
    bg: "#ffe5f2",
  },
  tangerine: {
    name: "Tangerine",
    light: "#ffd6a8",
    base: "#ff9f43",
    shade: "#cf6b12",
    bg: "#ffead3",
  },
};

function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The buddy someone starts with: always the same one for the same account. */
export function defaultBuddy(userId: string): Buddy {
  const h = hash(userId);
  return {
    shape: BUDDY_SHAPES[h % BUDDY_SHAPES.length]!,
    color: BUDDY_COLORS[Math.floor(h / BUDDY_SHAPES.length) % BUDDY_COLORS.length]!,
  };
}

export function isBuddy(v: unknown): v is Buddy {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  return (
    BUDDY_SHAPES.includes(b.shape as BuddyShape) && BUDDY_COLORS.includes(b.color as BuddyColor)
  );
}
