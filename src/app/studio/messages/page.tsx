import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { InboxView } from "@/components/messages/inbox-view";
import { StudioHeaderBlock } from "@/components/studio/studio-shell";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Messages" };

export default function Route() {
  return (
    <Page>
      <StudioHeaderBlock
        eyebrow="Messages"
        title="Customer messages"
        description="Quick replies win orders. Buyers see when you last replied."
      />
      <Suspense fallback={<Skeleton className="h-[60dvh] w-full" rounded="lg" />}>
        <InboxView
          as="brand"
          title="Conversations"
          emptyBody="When buyers message your shop, conversations show up here."
        />
      </Suspense>
    </Page>
  );
}
