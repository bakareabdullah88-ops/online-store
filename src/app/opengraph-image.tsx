import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";
import { BrandMarkSvg, brandColors } from "@/lib/brand-mark";
import { defaultFontPreset, emphasis, getFontPreset } from "@/config/font-presets";

export const alt = `${brand.name}: buy from student brands on your campus`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Loads the display font from Google Fonts; falls back to the default face if offline at build. */
async function loadFont(
  family: string,
  weight: number,
  italic: boolean,
): Promise<ArrayBuffer | null> {
  "use cache";
  try {
    const query = `${family.replace(/ /g, "+")}:ital,wght@${italic ? 1 : 0},${weight}`;
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${query}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    return await (await fetch(src)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const { family, weight } = getFontPreset(defaultFontPreset).display;
  const [regular, italic] = await Promise.all([
    loadFont(family, weight, false),
    emphasis === "italic" ? loadFont(family, weight, true) : Promise.resolve(null),
  ]);
  const serif = regular ? family : "serif";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: brandColors.paper,
        padding: 72,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* A large mark bleeding off the right edge: the brand, not decoration. */}
      <div style={{ position: "absolute", right: -90, top: 70, display: "flex" }}>
        <BrandMarkSvg size={520} radius={120} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "62%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <BrandMarkSvg size={64} />
          <div
            style={{
              display: "flex",
              fontFamily: serif,
              fontSize: 54,
              letterSpacing: -2.5,
              color: brandColors.ink,
            }}
          >
            kam<span style={{ color: brandColors.green }}>plug</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: serif,
            fontSize: 92,
            lineHeight: 0.98,
            color: brandColors.ink,
            letterSpacing: -3,
          }}
        >
          <span>Your campus plug.</span>
          <span style={{ color: brandColors.green }}>Buy and sell on campus.</span>
        </div>
        <div style={{ fontFamily: serif, fontSize: 30, color: "#545862" }}>
          Food, fashion, thrift and more, from students near you
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        ...(regular
          ? [
              {
                name: family,
                data: regular,
                style: "normal" as const,
                weight,
              },
            ]
          : []),
        ...(italic
          ? [
              {
                name: family,
                data: italic,
                style: "italic" as const,
                weight,
              },
            ]
          : []),
      ],
    },
  );
}
