"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Cpu,
  Shirt,
  Soup,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Reveal } from "./reveal";
import { BeautySet, BookStack, JollofPlate, TechSet, ThriftRack } from "./illustrations";

type Tile = {
  id: string;
  title: string;
  body: string;
  href: string;
  icon: LucideIcon;
  bg: string;
  edge: string;
  Art: (p: { className?: string }) => React.ReactNode;
  span: string;
  big?: boolean;
};

const tiles: Tile[] = [
  {
    id: "food",
    title: "Food",
    body: "Jollof, small chops, shawarma and late-night bites from cooks in your hall.",
    href: "/explore?category=food",
    icon: Soup,
    bg: "#ffe9a8",
    edge: "#d9a800",
    Art: JollofPlate,
    span: "col-span-2 md:row-span-2",
    big: true,
  },
  {
    id: "thrift",
    title: "Thrift",
    body: "Vintage finds, one of one.",
    href: "/explore?category=thrift",
    icon: Shirt,
    bg: "#dfe5ff",
    edge: "#7d93ff",
    Art: ThriftRack,
    span: "col-span-1",
  },
  {
    id: "beauty",
    title: "Beauty",
    body: "Shea, black soap, glow oils.",
    href: "/explore?category=beauty",
    icon: Sparkles,
    bg: "#ffd9cf",
    edge: "#f09a85",
    Art: BeautySet,
    span: "col-span-1",
  },
  {
    id: "tech",
    title: "Tech",
    body: "Chargers, earbuds, cases.",
    href: "/explore?category=tech",
    icon: Cpu,
    bg: "#d4f0ff",
    edge: "#7cc4ec",
    Art: TechSet,
    span: "col-span-1",
  },
  {
    id: "books",
    title: "Books",
    body: "Past questions and notes.",
    href: "/explore?category=books",
    icon: BookOpen,
    bg: "#d6f7e8",
    edge: "#7fd3ad",
    Art: BookStack,
    span: "col-span-1",
  },
];

/** A tile that leans toward the pointer, as if it were a card on a table. */
function TiltLink({
  href,
  className,
  style,
  children,
}: {
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
  };
  const onLeave = () => {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };
  return (
    <Link
      ref={ref}
      href={href}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "group relative block h-full [transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] overflow-hidden rounded-[28px] transition-transform duration-300 ease-out motion-reduce:[transform:none]",
        className,
      )}
      style={style}
    >
      {children}
    </Link>
  );
}

/**
 * The categories as a grid of tiles: food gets the big one, the rest share the
 * row, and a dark tile lists everything else. Tiles swing down into place as
 * they scroll in and lean toward the pointer.
 */
export function CategoryStrip() {
  return (
    <div className="grid grid-cols-2 gap-4 pb-3 md:grid-cols-4 md:grid-rows-[260px_260px] md:gap-5">
      {tiles.map((t, i) => (
        <Reveal key={t.id} from="top" delay={i * 90} className={t.span}>
          <TiltLink
            href={t.href}
            className={t.big ? "min-h-[420px] md:min-h-0" : "min-h-[230px]"}
            style={{ background: t.bg, boxShadow: `0 10px 0 ${t.edge}` }}
          >
            <div className={cn("relative z-10 flex flex-col p-5 md:p-7", t.big && "md:p-9")}>
              <span className="grid size-11 place-items-center rounded-2xl bg-white/70 text-[#1b1f3b]">
                <t.icon className="size-5" aria-hidden />
              </span>
              <h3
                className={cn(
                  "mt-4 leading-none font-extrabold tracking-[-0.045em]",
                  t.big ? "text-[40px] md:text-[64px]" : "text-[26px] md:text-[30px]",
                )}
              >
                {t.title}
              </h3>
              <p
                className={cn(
                  "mt-2 max-w-[22ch] leading-snug",
                  t.big ? "text-[16px] md:text-[19px]" : "text-[14.5px]",
                )}
              >
                {t.body}
              </p>
              {t.big && (
                <span className="mt-5 inline-flex items-center gap-2 text-[13px] font-extrabold tracking-[0.2em] uppercase">
                  Browse food
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              )}
            </div>
            <span
              aria-hidden
              className="absolute top-5 right-5 z-10 grid size-9 place-items-center rounded-full bg-[#1b1f3b] text-white opacity-0 transition-opacity group-hover:opacity-100 max-md:hidden"
            >
              <ArrowUpRight className="size-4" />
            </span>
            <div
              className={cn(
                "pointer-events-none absolute transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3",
                t.big
                  ? "right-[-6%] bottom-[-6%] w-[72%] md:w-[70%]"
                  : "right-[-8%] bottom-[-10%] w-[62%] md:w-[58%]",
              )}
            >
              <div className="lp-bob" style={{ animationDelay: `${i * -0.7}s` }}>
                <t.Art className="w-full" />
              </div>
            </div>
          </TiltLink>
        </Reveal>
      ))}
      <Reveal from="top" delay={tiles.length * 90} className="col-span-2">
        <TiltLink
          href="/explore"
          className="flex min-h-[200px] flex-col justify-between bg-[#1b1f3b] p-6 text-white md:p-8"
          style={{ boxShadow: "0 10px 0 #000" }}
        >
          <div>
            <p className="text-[13px] font-extrabold tracking-[0.2em] text-[#ffd23f] uppercase">
              And more
            </p>
            <p className="mt-3 text-[26px] leading-tight font-extrabold tracking-[-0.04em] md:text-[34px]">
              Fashion, accessories, prints, custom cards, phone repairs…
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-extrabold tracking-[0.2em] uppercase">
            See every category
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </TiltLink>
      </Reveal>
    </div>
  );
}
