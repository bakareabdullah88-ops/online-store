"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shell/logo";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";

const links = [
  { label: "Discover", href: "/explore" },
  { label: "Sell", href: "/#sell" },
  { label: "How it works", href: "/#how" },
  { label: "FAQ", href: "/#faq" },
];

/** Floating liquid-glass navbar. It tightens a little once the page scrolls. */
export function LandingNav() {
  const { user, isReady } = useSession();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  // The open menu closes on Escape; a tap anywhere else closes it via the backdrop below.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-(--z-header) px-3 pt-3 md:px-6 md:pt-4">
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed inset-0 bg-overlay/40 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>
      <motion.div
        initial={reduce ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "pointer-events-auto relative mx-auto max-w-6xl rounded-2xl liquid-glass transition-[max-width,padding] duration-500 ease-out",
          open && "bg-surface",
          scrolled && "max-w-5xl",
        )}
      >
        <div
          className={cn(
            "flex items-center gap-4 px-3 transition-[height] duration-500 md:px-4",
            scrolled ? "h-14" : "h-16",
          )}
        >
          <Logo />
          <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex h-9 items-center rounded-lg px-3 text-[14.5px] font-medium text-ink-2 transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            {isReady && user ? (
              <Link
                href="/home"
                className="flex h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-[14px] font-semibold text-on-accent transition-colors duration-150 hover:bg-accent-hover"
              >
                Open Kamplug <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center rounded-xl px-3.5 text-[14.5px] font-medium text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink sm:flex"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="flex h-10 items-center rounded-xl bg-accent px-4 text-[14px] font-semibold text-on-accent transition-colors duration-150 hover:bg-accent-hover"
                >
                  Sign up
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="landing-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-xl text-ink-2 hover:bg-ink/[0.06] lg:hidden"
            >
              {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.nav
              id="landing-menu"
              aria-label="Main"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden lg:hidden"
            >
              <div className="flex flex-col gap-1 border-t border-line px-3 pt-2 pb-3">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex h-11 items-center rounded-lg px-3 text-[15px] font-medium hover:bg-ink/[0.05]"
                  >
                    {l.label}
                  </Link>
                ))}
                {!user && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="mt-1 flex h-11 items-center justify-center rounded-xl text-[15px] font-medium ring-1 ring-line-strong sm:hidden"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
