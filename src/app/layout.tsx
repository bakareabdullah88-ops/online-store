import type { Metadata, Viewport } from "next";
import { brand } from "@/config/brand";
import { emphasis, fontClassNames } from "@/config/fonts";
import { siteUrl } from "@/env";
import { Providers } from "@/components/providers";
import { themeBootScript } from "@/components/providers/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${brand.name} · ${brand.tagline}`,
    template: `%s${brand.titleSeparator}${brand.name}`,
  },
  description: brand.description,
  applicationName: brand.name,
  openGraph: {
    type: "website",
    siteName: brand.name,
    title: `${brand.name} · ${brand.tagline}`,
    description: brand.description,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    site: brand.social.twitter,
    title: brand.name,
    description: brand.shortDescription,
  },
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e9" },
    { media: "(prefers-color-scheme: dark)", color: "#141210" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" suppressHydrationWarning className={fontClassNames} data-emphasis={emphasis}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
