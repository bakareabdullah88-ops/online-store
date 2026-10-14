"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Menu as MenuIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/overlay";
import { Logo } from "@/components/shell/logo";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";

type Item = { label: string; href: string; hint?: string };
const groups: { label: string; items: Item[] }[] = [
  {
    label: "Buy",
    items: [
      { label: "Discover shops", href: "/explore", hint: "Browse by campus and category" },
      { label: "Track your orders", href: "/orders", hint: "Every step, as it happens" },
      { label: "Saved items", href: "/wishlist", hint: "Keep things for later" },
    ],
  },
  {
    label: "Sell",
    items: [
      { label: "Open a shop", href: "/open-shop", hint: "Five quick steps, free" },
      { label: "Shop Studio", href: "/studio", hint: "Orders, products and analytics" },
    ],
  },
  {
    label: "Product",
    items: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Benefits", href: "/#benefits" },
    ],
  },
];

export function LandingNav() {
  const router = useRouter();
  const { user, isReady } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-(--z-header) transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled ? "glass shadow-[0_1px_0_var(--line)]" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:h-[72px] md:px-6">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {groups.map((g) => (
            <Menu key={g.label}>
              <MenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 items-center gap-1 rounded-lg px-3 text-[14.5px] font-medium text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink data-[state=open]:text-ink"
                >
                  {g.label} <ChevronDown className="size-3.5 text-muted" />
                </button>
              </MenuTrigger>
              <MenuContent align="start" className="w-72 p-1.5">
                {g.items.map((it) => (
                  <MenuItem key={it.href} onSelect={() => router.push(it.href)}>
                    <span className="block">{it.label}</span>
                    {it.hint && (
                      <span className="block text-[12px] font-normal text-muted">{it.hint}</span>
                    )}
                  </MenuItem>
                ))}
              </MenuContent>
            </Menu>
          ))}
          <Link
            href="/#pricing"
            className="flex h-9 items-center rounded-lg px-3 text-[14.5px] font-medium text-ink-2 hover:bg-ink/[0.05] hover:text-ink"
          >
            Pricing
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {isReady && user ? (
            <Link
              href="/home"
              className="flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-[14px] font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
            >
              Open {user.name.split(" ")[0]}&apos;s Kamplug <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-10 items-center rounded-xl px-3 text-[14.5px] font-medium hover:bg-ink/[0.05] sm:flex"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="flex h-10 items-center rounded-lg bg-primary px-4 text-[14px] font-semibold text-on-primary transition-colors duration-150 hover:bg-primary-hover"
              >
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-xl hover:bg-ink/[0.05] lg:hidden"
          >
            {open ? <X className="size-5" /> : <MenuIcon className="size-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Main"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-line glass lg:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-4">
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="px-2 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                    {g.label}
                  </p>
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className="flex h-10 items-center rounded-lg px-2 text-[15px] font-medium hover:bg-ink/[0.05]"
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex h-11 items-center justify-center rounded-xl text-[15px] font-medium ring-1 ring-line-strong"
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
