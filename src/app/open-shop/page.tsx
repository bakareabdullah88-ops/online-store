import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { X } from "lucide-react";
import { Logo } from "@/components/shell/logo";
import { Page } from "@/components/shell/page";
import { OpenShopGate } from "@/components/studio/open-shop-gate";
import { OpenShopWizard } from "@/components/studio/open-shop";

export const metadata: Metadata = {
  title: "Open your shop",
  description: "Open a free shop on Kiosk and sell to students on your campus.",
};

export default function OpenShopPage() {
  return (
    <div data-mode="selling" className="min-h-dvh bg-canvas">
      <header className="flex h-16 items-center justify-between px-(--gutter) md:px-10">
        <Logo suffix="Open a shop" />
        <Link href="/" className="flex size-10 items-center justify-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink" aria-label="Exit setup">
          <X className="size-5" />
        </Link>
      </header>
      <Page className="mx-auto max-w-6xl px-(--gutter) pt-6 pb-20 md:px-10 md:pt-10">
        <Suspense>
          <OpenShopGate>
            <OpenShopWizard />
          </OpenShopGate>
        </Suspense>
      </Page>
    </div>
  );
}
