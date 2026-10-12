import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#1b1814" }}>
      <svg width="180" height="180" viewBox="0 0 64 64">
        <path
          d="M20 14 V50 M20 34 L40 14 M27 28 L42 50"
          stroke="#f6f1e9"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="48" cy="46" r="5" fill="#e0532a" />
      </svg>
    </div>,
    size,
  );
}
