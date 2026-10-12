/**
 * ─────────────────────────────────────────────────────────────────────────
 *  FONT STYLES
 * ─────────────────────────────────────────────────────────────────────────
 *  Visitors can switch between these in Settings → Appearance. The site
 *  starts with `defaultFontPreset`: change that one word to change the
 *  default for everyone, then push.
 *
 *  Each style points at faces loaded in src/config/fonts.ts (by CSS
 *  variable). To add a new font, load it there first, then add a style here.
 */
export const fontPresets = [
  {
    id: "modern",
    label: "Modern",
    description: "Bold geometric sans",
    display: {
      family: "Plus Jakarta Sans",
      cssVar: "--ff-jakarta",
      weight: 700,
      tracking: "-0.035em",
    },
    body: { family: "Plus Jakarta Sans", cssVar: "--ff-jakarta" },
  },
  {
    id: "clean",
    label: "Clean",
    description: "Neutral and very readable",
    display: { family: "Inter", cssVar: "--ff-inter", weight: 700, tracking: "-0.04em" },
    body: { family: "Inter", cssVar: "--ff-inter" },
  },
  {
    id: "friendly",
    label: "Friendly",
    description: "Round and relaxed",
    display: { family: "DM Sans", cssVar: "--ff-dm-sans", weight: 700, tracking: "-0.04em" },
    body: { family: "DM Sans", cssVar: "--ff-dm-sans" },
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Magazine serif headlines",
    display: {
      family: "Instrument Serif",
      cssVar: "--ff-instrument",
      weight: 400,
      tracking: "-0.01em",
    },
    body: { family: "Geist", cssVar: "--ff-geist" },
  },
  {
    id: "classic",
    label: "Classic",
    description: "Warm serif, soft text",
    display: { family: "Fraunces", cssVar: "--ff-fraunces", weight: 600, tracking: "-0.025em" },
    body: { family: "DM Sans", cssVar: "--ff-dm-sans" },
  },
] as const;

export type FontPresetId = (typeof fontPresets)[number]["id"];
export type FontPreset = (typeof fontPresets)[number];

/** The style every visitor starts with. */
export const defaultFontPreset: FontPresetId = "modern";

/**
 * How emphasised words in headlines are set (e.g. "in your hostel." on the
 * landing page): "upright" keeps the accent colour without slanting.
 */
export const emphasis: "upright" | "italic" = "upright";

export const FONT_STORAGE_KEY = "kiosk-font";

export function getFontPreset(id: string | null | undefined): FontPreset {
  return (
    fontPresets.find((p) => p.id === id) ?? fontPresets.find((p) => p.id === defaultFontPreset)!
  );
}

/** CSS that maps each style to the faces and headline weight it uses. */
export function fontPresetCss(): string {
  return fontPresets
    .map(
      (p) =>
        `html[data-font="${p.id}"]{--font-display-face:var(${p.display.cssVar});--font-body-face:var(${p.body.cssVar});--display-weight:${p.display.weight};--display-tracking:${p.display.tracking}}`,
    )
    .join("");
}
