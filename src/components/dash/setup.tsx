"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useSetup } from "@/queries/studio";

/** Shop set-up steps, shown until they are all done. */
export function SetupStrip() {
  const { data } = useSetup();
  if (!data || data.every((s) => s.done)) return null;
  const done = data.filter((s) => s.done).length;
  return (
    <section
      aria-labelledby="setup-title"
      className="rounded-[24px] bg-surface-2/70 p-5 ring-1 ring-line md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="setup-title" className="text-[17px] font-semibold">
            Get your shop ready
          </h2>
          <p className="text-small text-muted">
            {done} of {data.length} done. Shops with a logo, a bio and three products get far more
            views.
          </p>
        </div>
        <div
          className="h-2 w-40 overflow-hidden rounded-full bg-chart-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={data.length}
          aria-valuenow={done}
          aria-label="Set-up progress"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(done / data.length) * 100}%` }}
            transition={spring.smooth}
            className="h-full rounded-full bg-accent"
          />
        </div>
      </div>
      <ol className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {data.map((s, i) => (
          <li key={s.id} className="shrink-0">
            <Link
              href={s.href}
              className={cn(
                "flex h-10 items-center gap-2 rounded-full pr-4 pl-1.5 text-[13px] font-medium ring-1 transition-colors",
                s.done
                  ? "bg-transparent text-muted ring-line"
                  : "bg-surface text-ink shadow-xs ring-line hover:ring-line-strong",
              )}
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[12px] font-semibold",
                  s.done ? "bg-success-soft text-success" : "bg-accent-soft text-accent",
                )}
              >
                {s.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(s.done && "line-through decoration-line-strong")}>{s.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
