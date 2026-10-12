import type { MetadataRoute } from "next";
import { siteUrl } from "@/env";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/studio", "/checkout", "/orders", "/bag", "/messages", "/notifications", "/wishlist", "/welcome", "/design-system"] }],
    sitemap: new URL("/sitemap.xml", base).toString(),
  };
}
