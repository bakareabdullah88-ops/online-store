import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const alt = `${brand.name}: buy from student brands on your campus`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Loads Instrument Serif (regular + italic); falls back to the default face if offline at build. */
async function loadFont(italic: boolean): Promise<ArrayBuffer | null> {
  "use cache";
  try {
    const family = italic ? "Instrument+Serif:ital@1" : "Instrument+Serif";
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}`)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    return await (await fetch(src)).arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  const [regular, italic] = await Promise.all([loadFont(false), loadFont(true)]);
  const serif = regular ? "Instrument Serif" : "serif";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f6f1e9", padding: 72, position: "relative" }}>
        <div style={{ position: "absolute", right: -120, top: -120, width: 560, height: 560, borderRadius: 999, background: "#ede4d6" }} />
        <div style={{ position: "absolute", right: 96, bottom: 96, width: 260, height: 320, borderRadius: 24, background: "#2f6b70", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="200" height="250" viewBox="0 0 400 500">
            <path d="M128 152 L170 130 Q200 156 230 130 L272 152 L322 206 L284 238 L268 222 L268 386 Q200 396 132 386 L132 222 L116 238 L78 206 Z" fill="#d3e1e2" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "68%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: serif, fontSize: 48, color: "#1b1814" }}>
            {brand.name}
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#bf3e18" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: serif, fontSize: 96, lineHeight: 0.95, color: "#1b1814", letterSpacing: -2 }}>
            <span>Buy from the brands</span>
            <span style={{ color: "#bf3e18", fontStyle: "italic" }}>in your hostel.</span>
          </div>
          <div style={{ fontFamily: serif, fontSize: 30, color: "#5f574d" }}>Thrift · food · skincare · prints · tech, from students on your campus</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(regular ? [{ name: "Instrument Serif", data: regular, style: "normal" as const, weight: 400 as const }] : []),
        ...(italic ? [{ name: "Instrument Serif", data: italic, style: "italic" as const, weight: 400 as const }] : []),
      ],
    },
  );
}
