import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { ExploreView } from "@/components/market/explore/explore-view";
import { ExploreSkeleton } from "@/components/market/explore/explore-skeleton";

export const metadata: Metadata = {
  title: "Explore",
  description: "Browse fashion, thrift, food, skincare, prints and tech from student brands on Nigerian campuses.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return (
    <Page>
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreView />
      </Suspense>
    </Page>
  );
}
