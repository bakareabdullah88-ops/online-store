"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/sheet";
import { useUi } from "@/stores/ui";
import { BagContents, BagSummary } from "./bag-contents";
import { useBagView } from "./use-bag-view";

export function BagDrawer() {
  const open = useUi((s) => s.bagOpen);
  const setOpen = useUi((s) => s.setBagOpen);
  const pathname = usePathname();
  const { isEmpty, groups } = useBagView();
  const close = () => setOpen(false);

  // Close on any navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  const blocked = groups.some(
    (g) => g.blockedReason || g.items.some((i) => i.unavailable || i.line.quantity > i.stock),
  );

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={setOpen}
      title="Your bag"
      width="md"
      footer={
        isEmpty ? undefined : (
          <div className="flex flex-col gap-4">
            <BagSummary />
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href="/bag" variant="secondary" onClick={close}>
                View bag
              </ButtonLink>
              <ButtonLink
                href="/checkout"
                onClick={close}
                aria-disabled={blocked || undefined}
                tabIndex={blocked ? -1 : undefined}
              >
                Checkout
              </ButtonLink>
            </div>
          </div>
        )
      }
    >
      <BagContents onNavigate={close} />
    </ResponsiveSheet>
  );
}
