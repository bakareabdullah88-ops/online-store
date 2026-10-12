import type { Metadata } from "next";
import { StudioShell } from "@/components/studio/studio-shell";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: { default: brand.sellerProductName, template: `%s · ${brand.sellerProductName}` },
  robots: { index: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioShell>{children}</StudioShell>;
}
