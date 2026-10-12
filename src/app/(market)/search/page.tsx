import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { ExploreView } from "@/components/market/explore/explore-view";
import { ExploreSkeleton } from "@/components/market/explore/explore-skeleton";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default function SearchPage() {
  return (
    <Page>
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreView mode="search" />
      </Suspense>
    </Page>
  );
}
