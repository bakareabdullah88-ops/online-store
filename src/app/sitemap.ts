import type { MetadataRoute } from "next";
import { categories } from "@/config/categories";
import { siteUrl } from "@/env";

/**
 * Public, indexable routes. Product and brand pages render from data that
 * lives in the browser in this demo, so they're discovered through Explore.
 * BACKEND-SEAM: with a real API, list published brands and products here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const url = (p: string) => new URL(p, base).toString();
  return [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/explore"), changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: url(`/explore?category=${c.id}`), changeFrequency: "daily" as const, priority: 0.7 })),
    { url: url("/open-shop"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/signup"), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/login"), changeFrequency: "monthly", priority: 0.3 },
  ];
}
