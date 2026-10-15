"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** "What do you need?" in a white pill; searching opens Discover with the term. */
export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        router.push(term ? `/explore?q=${encodeURIComponent(term)}` : "/explore");
      }}
      className="flex h-16 w-full max-w-[560px] items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-[0_6px_0_rgba(27,31,59,0.12),0_18px_40px_-20px_rgba(27,31,59,0.35)] ring-1 ring-[#1b1f3b]/10 md:h-[68px]"
    >
      <Search className="size-5 shrink-0 text-[#3a5bff]" aria-hidden />
      <label htmlFor="hero-q" className="sr-only">
        What do you need?
      </label>
      <input
        id="hero-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        enterKeyHint="search"
        placeholder="Jollof, thrift jeans, lash tech…"
        className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#111] outline-none placeholder:text-[#6b6b6b] md:text-[17px]"
      />
      <button
        type="submit"
        className="h-full shrink-0 rounded-full bg-[#3a5bff] px-5 text-[15px] font-bold text-white transition-colors hover:bg-[#2a45d6] md:px-7 md:text-[16px]"
      >
        Find it
      </button>
    </form>
  );
}
