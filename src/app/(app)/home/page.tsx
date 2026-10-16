import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { DiscoverHome } from "@/components/market/discover-home";
import { ExploreSkeleton } from "@/components/market/explore/explore-skeleton";

export const metadata: Metadata = { title: "Home", robots: { index: false } };

export default function HomeRoute() {
  return (
    <Page>
      <Suspense fallback={<ExploreSkeleton />}>
        <DiscoverHome />
      </Suspense>
    </Page>
  );
}
