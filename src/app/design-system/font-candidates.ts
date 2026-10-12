/**
 * Shortlist for the font lab on /design-system. These load on that page only
 * (and are never preloaded), so they cost the rest of the app nothing.
 * Add a candidate by importing it here and listing it below.
 */
import {
  Bricolage_Grotesque,
  Cormorant_Garamond,
  DM_Sans,
  DM_Serif_Display,
  Fraunces,
  Geist,
  Inter,
  Instrument_Serif,
  Manrope,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Work_Sans,
  Young_Serif,
} from "next/font/google";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--cand-instrument-serif",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-fraunces",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-playfair",
});
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--cand-dm-serif",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "600",
  variable: "--cand-cormorant",
});
const youngSerif = Young_Serif({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--cand-young-serif",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-bricolage",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-space-grotesk",
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-geist",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-inter",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-dm-sans",
});
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-manrope",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-jakarta",
});
const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--cand-work-sans",
});

export type FontCandidate = {
  family: string;
  /** Export name in next/font/google */
  importName: string;
  /** Static families need a weight in the config */
  weight?: string;
  cssVar: string;
  className: string;
  note: string;
};

const c = (
  family: string,
  importName: string,
  font: { variable: string },
  cssVar: string,
  note: string,
  weight?: string,
): FontCandidate => ({
  family,
  importName,
  cssVar,
  className: font.variable,
  note,
  ...(weight ? { weight } : {}),
});

export const displayCandidates: FontCandidate[] = [
  c(
    "Instrument Serif",
    "Instrument_Serif",
    instrumentSerif,
    "--cand-instrument-serif",
    "Current. Condensed, editorial",
    "400",
  ),
  c("Fraunces", "Fraunces", fraunces, "--cand-fraunces", "Warm, soft, friendly serif"),
  c(
    "Playfair Display",
    "Playfair_Display",
    playfair,
    "--cand-playfair",
    "Classic high-contrast magazine",
  ),
  c(
    "DM Serif Display",
    "DM_Serif_Display",
    dmSerif,
    "--cand-dm-serif",
    "Bold, punchy headlines",
    "400",
  ),
  c(
    "Cormorant Garamond",
    "Cormorant_Garamond",
    cormorant,
    "--cand-cormorant",
    "Elegant, fashion-led",
    "600",
  ),
  c(
    "Young Serif",
    "Young_Serif",
    youngSerif,
    "--cand-young-serif",
    "Chunky, playful, retro",
    "400",
  ),
  c(
    "Bricolage Grotesque",
    "Bricolage_Grotesque",
    bricolage,
    "--cand-bricolage",
    "Sans with character",
  ),
  c(
    "Space Grotesk",
    "Space_Grotesk",
    spaceGrotesk,
    "--cand-space-grotesk",
    "Techy, geometric sans",
  ),
];

export const bodyCandidates: FontCandidate[] = [
  c("Geist", "Geist", geist, "--cand-geist", "Current. Neutral, crisp"),
  c("Inter", "Inter", inter, "--cand-inter", "The safe, very legible default"),
  c("DM Sans", "DM_Sans", dmSans, "--cand-dm-sans", "Rounder, friendlier"),
  c("Manrope", "Manrope", manrope, "--cand-manrope", "Modern, slightly wide"),
  c("Plus Jakarta Sans", "Plus_Jakarta_Sans", jakarta, "--cand-jakarta", "Warm geometric"),
  c("Work Sans", "Work_Sans", workSans, "--cand-work-sans", "Plain, sturdy, readable"),
];
