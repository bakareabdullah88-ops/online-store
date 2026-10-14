import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  env: {
    // The shared backend turns on by itself once a database is connected
    // (DATABASE_URL, from Neon). NEXT_PUBLIC_DATA_SOURCE still wins if set.
    NEXT_PUBLIC_DATA_SOURCE:
      process.env.NEXT_PUBLIC_DATA_SOURCE || (process.env.DATABASE_URL ? "remote" : "mock"),
  },
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "radix-ui"],
    // The Tailwind loader scans every source file for class names, but the build
    // cache only notices changes to the CSS file itself. With it on, builds
    // (including on Vercel, which restores .next/cache) shipped stale styles.
    turbopackFileSystemCacheForBuild: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
