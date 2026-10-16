"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { spring } from "@/design/motion";
import { useSetup } from "@/queries/studio";

/**
 * Shop set-up, shown until it's done: progress and the one next step, not the whole list.
 */
export function SetupStrip() {
  const { data } = useSetup();
  if (!data || data.every((s) => s.done)) return null;
  const done = data.filter((s) => s.done).length;
  const next = data.find((s) => !s.done);
  return (
    <section
      aria-labelledby="setup-title"
      className="card flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="setup-title" className="text-[15px] font-semibold">
            Finish setting up your shop
          </h2>
          <span className="shrink-0 text-small text-muted tabular">
            {done} of {data.length}
          </span>
        </div>
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-chart-track"
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
      {next && (
        <Link
          href={next.href}
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-soft px-4 text-small font-semibold text-accent-ink transition-colors hover:bg-accent hover:text-on-accent"
        >
          Next: {next.label} <ArrowRight className="size-4" />
        </Link>
      )}
    </section>
  );
}
