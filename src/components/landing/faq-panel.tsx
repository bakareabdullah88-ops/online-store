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
              <li key={f.q}>
                <button
                  type="button"
                  id={`${base}-q${i}`}
                  aria-expanded={on}
                  aria-controls={`${base}-a${i}`}
                  onClick={() => setOpen(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-[16px] font-bold transition-[transform,background-color] md:text-[18px]",
                    on
                      ? "bg-[#3a5bff] text-white shadow-[0_5px_0_#1f37b8]"
                      : "bg-white text-[#1b1f3b] shadow-[0_3px_0_rgba(27,31,59,0.12)] ring-1 ring-[#1b1f3b]/10 hover:-translate-y-0.5",
                  )}
                >
                  {f.q}
                  {on && <Burst className="size-6 shrink-0" color="#ffd23f" />}
                </button>
                <div
                  id={`${base}-a${i}`}
                  role="region"
                  aria-labelledby={`${base}-q${i}`}
                  hidden={!on}
                  className="mt-3 rounded-xl bg-[#ffd23f] p-5 text-[16px] leading-relaxed text-[#1b1f3b] md:hidden"
                >
                  {f.a}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="hidden md:block md:pt-24">
        <div
          key={open}
          className="sticky top-28 min-h-[340px] rounded-[26px] bg-[#ffd23f] p-9 text-[#1b1f3b] shadow-[0_10px_0_#d9a800] motion-safe:animate-[lp-answer_0.35s_ease-out]"
        >
          <Burst className="size-8" color="#1b1f3b" />
          <p className="mt-6 text-[22px] leading-snug font-medium">{current?.a}</p>
        </div>
      </div>
    </div>
  );
}
