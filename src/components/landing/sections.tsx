"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";

/** A slow, endless row of campus names. Pauses on hover; still when motion is reduced. */
export function CampusMarquee({
  items,
}: {
  items: { name: string; short: string; city: string }[];
}) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={hidden || undefined}>
      {items.map((c) => (
        <li key={c.short} className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-[28px] font-semibold tracking-[-0.03em] text-ink/70 md:text-[34px]">
            {c.short}
          </span>
          <span className="text-[12px] text-muted">
            {c.name}, {c.city}
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-marquee [--marquee-duration:45s] group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** "How it works": the line between the steps fills in as you scroll through them. */
export function HowSteps({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });
  return (
    <ol ref={ref} className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
      {/* The track and its fill: vertical on phones, horizontal from tablet up. */}
      <span
        aria-hidden
        className="absolute top-5 bottom-5 left-5 w-px bg-line md:top-5 md:right-[16%] md:bottom-auto md:left-[16%] md:h-px md:w-auto"
      />
      <motion.span
        aria-hidden
        style={reduce ? undefined : { scaleY: fill }}
        className="absolute top-5 bottom-5 left-5 w-px origin-top bg-accent md:hidden"
      />
      <motion.span
        aria-hidden
        style={reduce ? undefined : { scaleX: fill }}
        className="absolute top-5 right-[16%] left-[16%] hidden h-px origin-left bg-accent md:block"
      />
      {steps.map((s, i) => (
        <li key={s.n} className="relative flex gap-5 md:flex-col md:items-center md:text-center">
          <StepDot index={i} count={steps.length} progress={fill} reduce={!!reduce} label={s.n} />
          <div>
            <h3 className="text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepDot({
  index,
  count,
  progress,
  reduce,
  label,
}: {
  index: number;
  count: number;
  progress: ReturnType<typeof useSpring>;
  reduce: boolean;
  label: string;
}) {
  // Each dot lights up as the line reaches it.
  const at = count > 1 ? index / (count - 1) : 0;
  const lit = useTransform(progress, (v): number => (reduce || v >= at - 0.02 ? 1 : 0));
  const bg = useTransform(lit, [0, 1], ["var(--surface)", "var(--accent)"]);
  const fg = useTransform(lit, [0, 1], ["var(--muted)", "var(--on-accent)"]);
  return (
    <motion.span
      style={{ backgroundColor: bg, color: fg }}
      className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold tabular ring-1 ring-line transition-colors duration-300"
    >
      {label}
    </motion.span>
  );
}

/** Plain-language answers that open in place. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mx-auto mt-10 max-w-3xl divide-y divide-line border-y border-line">
      {items.map((f) => (
        <details key={f.q} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16.5px] font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="size-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="-mt-1 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
