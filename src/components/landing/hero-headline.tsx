"use client";

import { useEffect, useState } from "react";

/** "What do you need?" in Pidgin, Yoruba, Igbo and Hausa. The last word is the blue one. */
const lines = [
  { lang: "pcm", lead: "Wetin you", end: "need?" },
  { lang: "yo", lead: "Kí lo", end: "nílò?" },
  { lang: "ig", lead: "Gịnị ka ị", end: "chọrọ?" },
  { lang: "ha", lead: "Me kake", end: "bukata?" },
] as const;

/**
 * The landing headline. Every few seconds it flips down to the same question in
 * the next language. Screen readers always get the Pidgin line; with reduced
 * motion it stays on Pidgin.
 */
export function HeroHeadline() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % lines.length), 9600);
    return () => window.clearInterval(t);
  }, []);

  const line = lines[i]!;
  return (
    <h1 className="mt-5 text-[clamp(34px,10.4vw,116px)] leading-[0.95] font-extrabold tracking-[-0.06em] whitespace-nowrap [perspective:800px]">
      <span className="sr-only">Wetin you need?</span>
      <span
        key={line.lang}
        lang={line.lang}
        aria-hidden
        className="inline-block origin-[50%_0%] motion-safe:animate-[lp-flip_0.6s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {line.lead} <span className="text-[#3a5bff]">{line.end}</span>
      </span>
    </h1>
  );
}
