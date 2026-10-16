"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";

const links = [
  { label: "Shop", href: "/#shop" },
  { label: "Sell", href: "/#sell" },
  { label: "Delivery", href: "/#delivery" },
  { label: "FAQs", href: "/#faq" },
];

/** The Kamplug wordmark as plain text: "kam" in ink, "plug" in cobalt. */
function LogoText() {
  return (
    <Link
      href="/"
      aria-label={`${brand.name} home`}
      className="text-[26px] leading-none font-extrabold tracking-[-0.055em] text-[#1b1f3b] md:text-[30px]"
    >
      kam<span className="text-[#3a5bff]">plug</span>
    </Link>
  );
}

/**
 * The landing navbar: the wordmark, plain section links in the middle, and log in /
 * sign up on the right. Clear over the hero; once you scroll it gets a white,
 * blurred background with a hairline under it.
 */
export function LandingNav() {
  const { user, isReady } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const pill =
    "rounded-full bg-white shadow-[0_6px_20px_-12px_rgba(27,31,59,0.35)] ring-1 ring-[#1b1f3b]/[0.06]";
  const cta =
    "flex h-12 items-center gap-1.5 rounded-full bg-[#3a5bff] px-6 text-[15px] font-bold text-white shadow-[0_4px_0_#1f37b8] transition-[transform,box-shadow] hover:translate-y-[2px] hover:shadow-[0_2px_0_#1f37b8] active:translate-y-[4px] active:shadow-none md:h-14 md:text-[16px]";

  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-(--z-header) px-4 transition-[padding] duration-300 md:px-8",
        scrolled ? "pt-3 pb-3" : "pt-4 md:pt-6",
      )}
    >
      {/* Once you scroll, a frosted bar slides in behind the pills so page content
          passing underneath never fights with the logo and buttons. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 border-b border-[#1b1f3b]/[0.06] bg-white/65 backdrop-blur-2xl backdrop-saturate-150 transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
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
            className="pointer-events-auto fixed inset-0 bg-[#1b1f3b]/30 lg:hidden"
          />
        )}
      </AnimatePresence>
      <div className="relative mx-auto flex max-w-[1240px] items-center gap-3">
        {/* The wordmark stays plain text; only the links and buttons are pills. */}
        <div className="pointer-events-auto flex h-12 items-center md:h-14">
          <LogoText />
        </div>
        <nav
          aria-label="Main"
          className={cn(
            "pointer-events-auto absolute left-1/2 hidden h-14 -translate-x-1/2 items-center gap-1 px-3 lg:flex",
            pill,
          )}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex h-10 items-center rounded-full px-5 text-[16px] font-semibold text-[#1b1f3b] transition-colors hover:bg-[#1b1f3b]/[0.05] hover:text-[#3a5bff]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="pointer-events-auto ml-auto flex items-center gap-2">
          {isReady && user ? (
            <Link href="/home" className={cta}>
              Open Kamplug <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  "hidden h-14 items-center px-6 text-[16px] font-semibold text-[#1b1f3b] transition-colors hover:text-[#3a5bff] sm:flex",
                  pill,
                )}
              >
                Log in
              </Link>
              <Link href="/signup" className={cta}>
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
            className={cn("grid size-12 place-items-center text-[#1b1f3b] lg:hidden", pill)}
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.nav
              id="landing-menu"
              aria-label="Main"
              initial={{ opacity: 0, y: -10, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -10, rotateX: -20 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformPerspective: 800, transformOrigin: "top" }}
              className="pointer-events-auto absolute top-[calc(100%+10px)] right-0 left-0 rounded-[24px] bg-white p-3 shadow-xl lg:hidden"
            >
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center rounded-xl px-4 text-[17px] font-bold text-[#1b1f3b] hover:bg-[#f4f5f8]"
                >
                  {l.label}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex h-12 items-center justify-center rounded-full text-[16px] font-bold text-[#1b1f3b] ring-2 ring-[#1b1f3b] sm:hidden"
                >
                  Log in
                </Link>
              )}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
