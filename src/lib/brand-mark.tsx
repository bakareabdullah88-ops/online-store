/**
 * The Kamplug mark: a K whose arm ends in a plug (body and two prongs).
 * One geometry, used by the in-app mark, the favicon, app icons and share images.
 * Pure SVG so it also renders inside ImageResponse.
 */
export const brandColors = {
  /** Campus green: the brand colour on light backgrounds and on the mark tile. */
  green: "#0E7A4F",
  /** The same green, lifted for dark backgrounds. */
  greenBright: "#3DD68C",
  ink: "#0F1115",
  paper: "#F6F8F7",
} as const;

/** Strokes of the K on a 64×64 grid. `w` is the main stroke width. */
export function MarkStrokes({ color, w = 7.5 }: { color: string; w?: number }) {
  return (
    <g stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M21 13 V51" strokeWidth={w} />
      <path d="M27.5 31.5 L43 51" strokeWidth={w} />
      <path d="M21 36.5 L33.5 24" strokeWidth={w} />
      <path d="M29.8 20.3 L37.2 27.7" strokeWidth={w} strokeLinecap="butt" />
      <path d="M34.6 19.4 L39.2 14.8 M38.6 23.4 L43.2 18.8" strokeWidth={w * 0.48} />
    </g>
  );
}

/** The app-icon tile: green rounded square, white K. */
export function BrandMarkSvg({ size, radius = 15 }: { size: number; radius?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx={radius} fill={brandColors.green} />
      <MarkStrokes color="#ffffff" />
    </svg>
  );
}
