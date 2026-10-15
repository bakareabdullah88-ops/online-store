"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type From = "up" | "left" | "right" | "top";
const offsets: Record<From, { x: string; y: string; rx?: string }> = {
  up: { x: "0px", y: "28px" },
  left: { x: "-40px", y: "0px" },
  right: { x: "40px", y: "0px" },
  /** Swings down from above, tilted back, like a card flipping into place. */
  top: { x: "0px", y: "-36px", rx: "34deg" },
};

/**
 * Slides its content in when it scrolls into view. Server-rendered visible, so nothing
 * is lost without JavaScript; only elements that start below the fold are hidden first.
 */
export function Reveal({
  children,
  from = "up",
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  from?: From;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top > window.innerHeight * 0.9) setState("hidden");
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (state !== "hidden" || !el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [state]);

  const o = offsets[from];
  return (
    <Tag
      // The ref type is shared by every allowed tag.
      ref={ref as React.RefObject<HTMLDivElement & HTMLLIElement>}
      data-reveal={state === "idle" ? undefined : state}
      className={cn(className)}
      style={
        {
          "--reveal-x": o.x,
          "--reveal-y": o.y,
          "--reveal-rx": o.rx ?? "0deg",
          transitionDelay: state === "shown" ? `${delay}ms` : undefined,
        } as React.CSSProperties
      }
    >
      {children}
    </Tag>
  );
}
