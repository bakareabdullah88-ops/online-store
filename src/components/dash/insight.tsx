import Link from "next/link";
import { ArrowUpRight, Lightbulb } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Grainy gradient card with one big number (image 3, "Insights"). */
export function InsightCard({
  value,
  label,
  href,
  empty,
  className,
}: {
  value: ReactNode;
  label: ReactNode;
  href?: string;
  empty?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <span
        className="absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,#ff9a5a_0%,transparent_55%),radial-gradient(110%_100%_at_0%_100%,#2f54ff_0%,transparent_60%),linear-gradient(160deg,#f7b98f_0%,#9db4ff_55%,#3d5bd8_100%)]"
        aria-hidden
      />
      <svg className="absolute inset-0 size-full opacity-[0.18] mix-blend-overlay" aria-hidden>
        <filter id="insight-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#insight-grain)" />
      </svg>
      <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-[12.5px] font-medium text-white ring-1 ring-white/35 backdrop-blur-md">
        <Lightbulb className="size-3.5" /> Insights
      </span>
      <span
        className={cn(
          "relative mt-auto block font-medium tracking-[-0.04em] text-white",
          typeof value === "string" && value.length > 6
            ? "text-[30px] leading-tight md:text-[34px]"
            : "text-[56px] leading-none md:text-[68px]",
        )}
      >
        {value}
      </span>
      <span className="relative mt-2 block text-[13px] text-white/85">{label}</span>
      {href && (
        <ArrowUpRight className="absolute top-5 right-5 size-5 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
      {empty && <span className="sr-only">Not enough data yet</span>}
    </>
  );
  const cls = cn(
    "group relative flex min-h-[220px] flex-col overflow-hidden rounded-[24px] p-5 md:p-6",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <section className={cls}>{body}</section>
  );
}
