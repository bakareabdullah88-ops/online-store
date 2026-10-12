import type { Metadata } from "next";
import { DesignSystemView } from "./view";

export const metadata: Metadata = {
  title: "Design system",
  description: "Every primitive and state of the Kiosk design system, in light and dark.",
  robots: { index: false },
};

export default function DesignSystemPage() {
  return <DesignSystemView />;
}
