/**
 * Typed mirror of the CSS design tokens in `src/app/globals.css`.
 * CSS variables are the source of truth for colour; this file exists so
 * TypeScript code (charts, generated art, motion) can reference tokens by name
 * without hardcoding values.
 */

export const color = {
  canvas: "var(--canvas)",
  canvasSunk: "var(--canvas-sunk)",
  surface: "var(--surface)",
  surface2: "var(--surface-2)",
  sand: "var(--sand)",
  line: "var(--line)",
  lineStrong: "var(--line-strong)",
  ink: "var(--ink)",
  ink2: "var(--ink-2)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  primary: "var(--primary)",
  onPrimary: "var(--on-primary)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  accentInk: "var(--accent-ink)",
  onAccent: "var(--on-accent)",
  studio: "var(--studio)",
  ember: "var(--ember)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
} as const;

export type ColorToken = keyof typeof color;

export const radius = { xs: 4, sm: 6, md: 8, lg: 10, xl: 12, "2xl": 16, "3xl": 20 } as const;

export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const zIndex = {
  raised: 10,
  sticky: 30,
  header: 40,
  overlay: 50,
  sheet: 60,
  popover: 70,
  toast: 80,
  curtain: 90,
  skip: 100,
} as const;

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, "2xl": 1536 } as const;

/**
 * Art palettes for generated product/brand imagery. Muted, warm, cohesive.
 * Each entry: [background, background-deep, object, object-shade, detail]
 */
export const artPalettes = {
  clay: ["#E9D5C3", "#D9BBA2", "#A6553A", "#7E3F2B", "#F6EBDD"],
  sage: ["#DCE3D3", "#C3CFB7", "#5E7553", "#45573D", "#F1F4EC"],
  ochre: ["#F0DDB4", "#E4C78C", "#B9822A", "#8B611E", "#FAF0D9"],
  dusk: ["#D9D3E0", "#C2B9CD", "#5D5175", "#463C59", "#EFEBF3"],
  sea: ["#D3E1E2", "#B5CDCF", "#2F6B70", "#234F53", "#ECF3F3"],
  rose: ["#F0D6D3", "#E3BAB5", "#B04F4A", "#863A36", "#F9ECEA"],
  ink: ["#D9D6D0", "#C2BEB6", "#2C2925", "#1B1814", "#F0EEEA"],
  palm: ["#D5E2CB", "#B9D0AA", "#3F7A3A", "#2E5B2A", "#EDF4E7"],
  sand: ["#EFE5D4", "#E0D1B7", "#8E6B47", "#6B5035", "#F8F2E7"],
  plum: ["#E6D2DC", "#D5B6C5", "#7D3B5C", "#5E2C45", "#F4EAEF"],
} as const satisfies Record<string, readonly [string, string, string, string, string]>;

export type ArtPalette = keyof typeof artPalettes;
