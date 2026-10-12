import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Page } from "@/components/shell/page";
import { ExploreView } from "@/components/market/explore/explore-view";
import { ExploreSkeleton } from "@/components/market/explore/explore-skeleton";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Browse fashion, thrift, food, skincare, prints and tech from student brands on Nigerian campuses.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return (
    <Page>
      <Suspense fallback={<ExploreSkeleton />}>
        <ServerRendered />
      </Suspense>
    </Page>
  );
}

/**
 * Rendering per request lets the view (which reads the URL) render on the
 * server, so the heading and filters arrive in the HTML instead of after
 * hydration.
 */
async function ServerRendered() {
  await connection();
  return <ExploreView />;
}
