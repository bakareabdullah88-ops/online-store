import { ShopGate } from "@/components/studio/shop-gate";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <ShopGate>{children}</ShopGate>;
}
