"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ChevronUp, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type Shortcut = { token: string; href: string; withQuery?: (q: string) => string };

/**
 * "What would you like to explore next?" (image 3), without the AI: a search
 * box with slash shortcuts that jump straight to a filtered page.
 */
export function QuickJump({
  prompt,
  placeholder,
  shortcuts,
  search,
}: {
  prompt: string;
  placeholder: string;
  shortcuts: Shortcut[];
  /** Where free text goes. */
  search: (q: string) => string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [token, setToken] = useState<Shortcut | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const slash = text.startsWith("/") ? text.slice(1).toLowerCase() : null;
  const matches =
    slash === null ? [] : shortcuts.filter((s) => s.token.toLowerCase().includes(slash));

  const pick = (s: Shortcut) => {
    setToken(s);
    setText("");
    input.current?.focus();
  };
  const submit = () => {
    const q = text.trim();
    if (token) {
      router.push(q && token.withQuery ? token.withQuery(q) : token.href);
      return;
    }
    if (slash !== null && matches[0]) {
      router.push(matches[0].href);
      return;
    }
    if (q) router.push(search(q));
  };

  return (
    <div className="relative bg-[radial-gradient(80%_140%_at_50%_0%,color-mix(in_oklab,var(--chart-blue)_16%,transparent),transparent_70%)] px-3 pt-3 pb-3 md:px-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-2 py-2 text-left text-[14.5px] font-medium text-ink-2"
      >
        <Sparkles className="size-[18px] text-chart-blue" />
        <span className="flex-1">{prompt}</span>
        <ChevronUp
          className={cn("size-4 text-muted transition-transform", !open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="mt-1 flex items-center gap-2 rounded-2xl bg-surface px-3 py-2 shadow-sm ring-1 ring-line focus-within:ring-2 focus-within:ring-accent/40"
            >
              {token && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#fff1df] px-2 py-1 text-[13px] font-medium text-[#c45a00] ring-1 ring-[#ffcf99] dark:bg-[#3a2410] dark:text-[#ffb36b] dark:ring-[#6b3d10]">
                  /{token.token}
                  <button
                    type="button"
                    onClick={() => setToken(null)}
                    aria-label={`Remove /${token.token}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              <input
                ref={input}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !text && token) setToken(null);
                  if (e.key === "Tab" && matches[0] && slash !== null) {
                    e.preventDefault();
                    pick(matches[0]);
                  }
                }}
                placeholder={token ? "Add a search, or press enter" : placeholder}
                aria-label={prompt}
                className="h-9 min-w-0 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-faint"
              />
              <button
                type="submit"
                aria-label="Go"
                disabled={!token && !text.trim()}
                className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
            </form>
            <div className="-mx-1 mt-2.5 scrollbar-none flex gap-1.5 overflow-x-auto px-2 pb-1 md:flex-wrap md:overflow-visible">
              {(slash !== null ? matches : shortcuts).map((s) => (
                <button
                  key={s.token}
                  type="button"
                  onClick={() => pick(s)}
                  className="shrink-0 pressable rounded-full bg-surface/80 px-2.5 py-1 text-[12.5px] font-medium whitespace-nowrap text-ink-2 ring-1 ring-line transition-colors hover:text-ink hover:ring-line-strong"
                >
                  /{s.token}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
