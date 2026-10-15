"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { Burst } from "./illustrations";

/**
 * Questions on the left, the answer in a big yellow panel on the right. On
 * phones the answer opens under its question instead.
 */
export function FaqPanel({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  const current = items[open];
  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-10">
      <div>
        <h2 className="text-[clamp(40px,6vw,68px)] leading-[0.95] font-extrabold tracking-[-0.055em] text-[#1b1f3b]">
          Got questions?
        </h2>
        <ul className="mt-8 flex flex-col gap-3">
          {items.map((f, i) => {
            const on = i === open;
            return (
              <li
                key={f.q}
                className={cn(
                  "overflow-hidden rounded-xl transition-[background-color,box-shadow] duration-300",
                  on
                    ? "bg-[#3a5bff]"
                    : "bg-white ring-1 ring-[#1b1f3b]/10",
                )}
              >
                <button
                  type="button"
                  id={`${base}-q${i}`}
                  aria-expanded={on}
                  aria-controls={`${base}-a${i}`}
                  onClick={() => setOpen(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[16px] font-bold md:text-[18px]",
                    on ? "text-white" : "text-[#1b1f3b]",
                  )}
                >
                  {f.q}
                  <Burst
                    className={cn(
                      "size-6 shrink-0 transition-transform duration-300",
                      on ? "scale-100 rotate-45" : "scale-0",
                    )}
                    color="#ffd23f"
                  />
                </button>
                {/* Phones: the answer unrolls from the bottom of the same card. */}
                <div
                  id={`${base}-a${i}`}
                  role="region"
                  aria-labelledby={`${base}-q${i}`}
                  aria-hidden={!on}
                  inert={!on}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
                    on ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p
                      className={cn(
                        "mx-2 mb-2 origin-top rounded-lg bg-[#ffd23f] p-4 text-[16px] leading-relaxed text-[#1b1f3b] transition-transform duration-400",
                        on
                          ? "[transform:perspective(600px)_rotateX(0deg)]"
                          : "[transform:perspective(600px)_rotateX(-70deg)]",
                      )}
                    >
                      {f.a}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="hidden md:block md:pt-24">
        <div
          key={open}
          className="sticky top-28 min-h-[340px] rounded-[26px] bg-[#ffd23f] p-9 text-[#1b1f3b] motion-safe:animate-[lp-answer_0.35s_ease-out]"
        >
          <Burst className="size-8" color="#1b1f3b" />
          <p className="mt-6 text-[22px] leading-snug font-medium">{current?.a}</p>
        </div>
      </div>
    </div>
  );
}
