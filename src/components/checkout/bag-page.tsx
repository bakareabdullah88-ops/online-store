"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { BagContents, BagSummary } from "./bag-contents";
import { useBagView } from "./use-bag-view";

export function BagPage() {
  const { isEmpty, groups, count } = useBagView();
  const blocked = groups.some((g) => g.blockedReason || g.items.some((i) => i.unavailable || i.line.quantity > i.stock));
  return (
    <div className="container-page pt-6 md:pt-10">
      <header className="mb-8">
        <p className="eyebrow text-muted">Bag</p>
        <h1 className="mt-2 font-display text-display-lg">Your bag</h1>
        {!isEmpty && (
          <p className="mt-2 text-body text-muted">
            {count} item{count === 1 ? "" : "s"} from {groups.length} brand{groups.length === 1 ? "" : "s"}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-7">
          <BagContents />
        </div>
        {!isEmpty && (
          <aside className="lg:col-span-5">
            <div className="rounded-lg bg-surface p-6 hairline lg:sticky lg:top-24">
              <h2 className="text-title font-semibold">Summary</h2>
              <BagSummary className="mt-4" />
              <ButtonLink
                href="/checkout"
                size="lg"
                className="mt-6 w-full"
                trailingIcon={<ArrowRight className="size-4.5" />}
                aria-disabled={blocked || undefined}
                tabIndex={blocked ? -1 : undefined}
              >
                Go to checkout
              </ButtonLink>
              <p className="mt-4 flex items-center gap-2 text-small text-muted">
                <ShieldCheck className="size-4" /> Demo checkout: nothing is charged.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
