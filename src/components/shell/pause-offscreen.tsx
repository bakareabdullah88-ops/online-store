"use client";

import { useEffect } from "react";

/**
 * Pauses CSS animations in any section that's scrolled out of view, so drifting
 * clouds and scenery only cost anything while you can see them. Phones feel the
 * difference most. Sections are picked up as pages change.
 */
export function PauseOffscreen() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-paused", !e.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    const seen = new WeakSet<Element>();
    const scan = () => {
      for (const el of document.querySelectorAll("section, [data-anim]")) {
        if (seen.has(el)) continue;
        seen.add(el);
        io.observe(el);
      }
    };
    scan();
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(queued);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return null;
}
