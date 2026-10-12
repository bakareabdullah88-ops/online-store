/**
 * ─────────────────────────────────────────────────────────────────────────
 *  FONTS: change the look of the whole app from this one file.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  To switch a font:
 *    1. Pick any family on https://fonts.google.com (or compare the shortlist
 *       live at /design-system → "Try a font").
 *    2. Change the import and the function call below. Google Fonts names use
 *       underscores here: "Playfair Display" → Playfair_Display.
 *    3. Update the matching `family` name in `fontNames` (used by the share image).
 *    4. Save. In dev the page reloads; on Vercel, push and it redeploys.
 *
 *  Keep the `variable` names as they are: the design tokens read them.
 *  Static (non-variable) families need a `weight`, e.g. weight: "400".
 */
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

/** Headlines, big numbers, the logo. */
export const displayFont = Instrument_Serif({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: "400",
  // Add "italic" here only if you set `emphasis` to "italic" below.
  style: ["normal"],
  display: "swap",
});

/** Everything else: body copy, buttons, forms. */
export const bodyFont = Geist({
  variable: "--font-body-face",
  subsets: ["latin"],
  display: "swap",
});

/** Labels, prices in tables, order codes, status pills. */
export const monoFont = Geist_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
  display: "swap",
});

export const fontNames = {
  display: "Instrument Serif",
  body: "Geist",
  mono: "Geist Mono",
} as const;

/**
 * How emphasised words in headlines are set (e.g. "in your hostel." on the
 * landing page). "upright" keeps the accent colour without slanting the
 * letters; "italic" slants them (also add "italic" to displayFont's style).
 */
export const emphasis: "upright" | "italic" = "upright";

export const fontClassNames = `${displayFont.variable} ${bodyFont.variable} ${monoFont.variable}`;
