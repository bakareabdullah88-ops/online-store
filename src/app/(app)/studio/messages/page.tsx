import type { Metadata } from "next";
import { Suspense } from "react";
import { Page } from "@/components/shell/page";
import { pagePad } from "@/components/app/layout";
import { InboxView } from "@/components/messages/inbox-view";
import { NavPageHeader } from "@/components/app/nav-header";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = { title: "Messages" };

export default function Route() {
  return (
    <Page className={pagePad}>
      <NavPageHeader
        title="Inbox"
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
