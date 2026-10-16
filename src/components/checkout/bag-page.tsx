"use client";

import { pagePad } from "@/components/app/layout";
import { NavPageHeader } from "@/components/app/nav-header";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { BagContents, BagSummary } from "./bag-contents";
import { useBagView } from "./use-bag-view";

export function BagPage() {
  const { isEmpty, groups, count } = useBagView();
  const blocked = groups.some(
    (g) => g.blockedReason || g.items.some((i) => i.unavailable || i.line.quantity > i.stock),
  );
  return (
    <div className={pagePad}>
      <NavPageHeader
        title="Your bag"
        current="Bag"
        description={
          isEmpty
            ? "Things you add from shops land here."
            : `${count} item${count === 1 ? "" : "s"} from ${groups.length} shop${groups.length === 1 ? "" : "s"}`
        }
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 [--row-bg:var(--app-bg)] lg:col-span-7">
          <BagContents />
        </div>
        {!isEmpty && (
          <aside className="lg:col-span-5">
            <div className="card py-6 lg:sticky lg:top-24">
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
                <ShieldCheck className="size-4" /> You pay the seller when you get your order.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
