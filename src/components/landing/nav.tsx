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

  const cta =
    "flex h-11 items-center gap-1.5 rounded-xl bg-[#3a5bff] px-5 text-[15px] font-bold text-white shadow-[0_4px_0_#1f37b8] transition-[transform,box-shadow] hover:translate-y-[2px] hover:shadow-[0_2px_0_#1f37b8] active:translate-y-[4px] active:shadow-none";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-(--z-header) transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled || open
          ? "bg-white/85 shadow-[0_1px_0_rgba(27,31,59,0.08)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="relative mx-auto flex h-[72px] max-w-[1240px] items-center gap-6 px-5 md:h-20 md:px-8">
        <LogoText />
        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-4 py-2 text-[16px] font-semibold text-[#1b1f3b] transition-colors hover:text-[#3a5bff]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {isReady && user ? (
            <Link href="/home" className={cta}>
              Open Kamplug <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-11 items-center px-3 text-[16px] font-semibold text-[#1b1f3b] hover:text-[#3a5bff] sm:flex"
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
            className="grid size-11 place-items-center rounded-xl text-[#1b1f3b] hover:bg-[#1b1f3b]/[0.06] lg:hidden"
          >
            {open ? <X className="size-6" /> : <MenuIcon className="size-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.nav
            id="landing-menu"
            aria-label="Main"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-[#1b1f3b]/10 lg:hidden"
          >
            <div className="flex flex-col px-5 pt-2 pb-5">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex h-12 items-center border-b border-[#1b1f3b]/[0.07] text-[18px] font-bold text-[#1b1f3b]"
                >
                  {l.label}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-4 flex h-12 items-center justify-center rounded-xl text-[16px] font-bold text-[#1b1f3b] ring-2 ring-[#1b1f3b] sm:hidden"
                >
                  Log in
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
