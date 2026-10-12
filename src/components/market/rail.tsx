"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Horizontal scroller with snap, edge fade and desktop arrow controls. */
export function Rail({
  children,
  label,
  className,
  itemClassName,
}: {
  children: ReactNode[];
  label: string;
  className?: string;
  itemClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: dir * el.clientWidth * 0.8,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={ref}
        onScroll={update}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="-mx-(--gutter) scrollbar-none flex snap-x snap-mandatory scroll-px-(--gutter) gap-4 overflow-x-auto px-(--gutter) pb-2 md:-mx-8 md:scroll-px-8 md:px-8 xl:-mx-12 xl:scroll-px-12 xl:px-12"
      >
        {children.map((c, i) => (
          <div key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {c}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute -top-14 right-0 hidden gap-2 md:flex">
        {([-1, 1] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => scroll(d)}
            disabled={d === -1 ? edges.start : edges.end}
            aria-label={d === -1 ? `Scroll ${label} back` : `Scroll ${label} forward`}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-surface text-ink hairline transition-opacity hover:shadow-[inset_0_0_0_1px_var(--ink)] disabled:opacity-35"
          >
            {d === -1 ? <ArrowLeft className="size-4.5" /> : <ArrowRight className="size-4.5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
