"use client";

import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { Button } from "./button";
import { Dialog } from "./sheet";

/** Where an in-app link click would take the user, or null when it should go ahead untouched. */
function inAppDestination(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = e.target instanceof Element ? e.target.closest("a") : null;
  if (!a || !a.href || a.hasAttribute("download")) return null;
  if (a.target && a.target !== "_self") return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  // Same page (or only the #hash changes): nothing is lost.
  if (url.pathname === window.location.pathname && url.search === window.location.search)
    return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * Asks "Discard changes?" before leaving a form with unsaved edits: in-app
 * links are held back until the user confirms, and the browser warns before a
 * reload or closing the tab. Render the returned `dialog` somewhere in the form.
 *
 * The listeners live in an Effect, so they stop as soon as the router hides
 * this screen (cacheComponents keeps it mounted inside <Activity>).
 */
export function useUnsavedChangesGuard(
  dirty: boolean,
  { onDiscard }: { onDiscard?: () => void } = {},
): { dialog: ReactNode } {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const hold = useEffectEvent((e: MouseEvent) => {
    const href = inAppDestination(e);
    if (!href) return;
    e.preventDefault();
    e.stopPropagation();
    setPending(href);
  });

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    const onClick = (e: MouseEvent) => hold(e);
    window.addEventListener("beforeunload", warn);
    // Capture phase on the document runs before React (and next/link) see the click.
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const discard = () => {
    const href = pending;
    setPending(null);
    onDiscard?.();
    if (href) router.push(href);
  };

  const dialog = (
    <Dialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
      title="Discard changes?"
      description="You have changes that aren't saved yet. If you leave now, they're gone."
      footer={
        <>
          <Button variant="secondary" onClick={() => setPending(null)}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={discard}>
            Discard changes
          </Button>
        </>
      }
    >
      <p className="text-small text-muted">Save first if you want to keep them.</p>
    </Dialog>
  );

  return { dialog };
}
