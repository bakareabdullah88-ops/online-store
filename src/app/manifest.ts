import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${brand.name} · ${brand.tagline}`,
    short_name: brand.name,
    description: brand.description,
    start_url: "/explore",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f6f8f7",
    theme_color: "#f6f8f7",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Explore", url: "/explore" },
      { name: "Orders", url: "/orders" },
      { name: brand.sellerProductName, url: "/studio" },
    ],
  };
}
