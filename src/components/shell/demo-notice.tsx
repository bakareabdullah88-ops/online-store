import { Info } from "lucide-react";

/**
 * Site-wide notice that this is a preview. Remove it from the root layout
 * once real accounts, payments and orders are live.
 */
export function DemoNotice() {
  return (
    <div role="note" aria-label="Demo notice" className="bg-notice text-on-notice">
      <p className="container-page flex min-h-9 items-center justify-center gap-2 py-1.5 text-center text-[12.5px] leading-snug font-medium">
        <Info className="size-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Demo preview.</span>{" "}
          <span className="max-sm:hidden">
            Kiosk is still being built: accounts, payments and orders are simulated and nothing is
            charged.
          </span>
          <span className="sm:hidden">Full app in progress. Nothing is charged.</span>
        </span>
      </p>
    </div>
  );
}
