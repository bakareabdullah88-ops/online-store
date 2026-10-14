"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Construction, X } from "lucide-react";
import { features } from "@/config/features";
import { useSession } from "@/queries/session";
import { useUi } from "@/stores/ui";

/**
 * SAMPLE DATA: tells people the app is still being built and that what they
 * see is sample data. Hidden until the next visit once dismissed.
 */
export function PreviewNotice() {
  const { user } = useSession();
  const hidden = useUi((s) => s.previewNoticeHidden);
  const hide = useUi((s) => s.hidePreviewNotice);
  if (!features.sampleData) return null;
  return (
    <AnimatePresence initial={false}>
      {!hidden && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-[color-mix(in_oklab,var(--warning)_25%,transparent)] bg-warning-soft text-[13px] text-ink"
          role="status"
        >
          <div className="mx-auto flex max-w-[1400px] items-center gap-2.5 px-4 py-2 md:px-6">
            <Construction className="size-4 shrink-0 text-warning" aria-hidden />
            <p className="min-w-0 flex-1">
              <b className="font-semibold">We&apos;re still building Kamplug.</b>{" "}
              <span className="text-ink-2">
                {user?.preview
                  ? "Shops, orders and numbers here are sample data, so feel free to click around."
                  : "Shops and products from other people are sample data for now."}
              </span>
            </p>
            {user?.preview && (
              <Link
                href="/login"
                className="hidden shrink-0 font-semibold underline-offset-2 hover:underline sm:inline"
              >
                Have a login? Log in
              </Link>
            )}
            <button
              type="button"
              onClick={hide}
              aria-label="Hide this notice"
              className="grid size-7 shrink-0 pressable place-items-center rounded-lg text-ink-2 hover:bg-ink/[0.06]"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
