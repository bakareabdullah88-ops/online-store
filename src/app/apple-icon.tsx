import { ImageResponse } from "next/og";
import { BrandMarkSvg } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS rounds the corners itself, so the tile is drawn square. */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex" }}>
      <BrandMarkSvg size={180} radius={0} />
    </div>,
    size,
  );
}
