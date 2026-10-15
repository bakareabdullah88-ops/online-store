"use client";

import { Command } from "cmdk";
import { Dialog as RDialog, VisuallyHidden } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useState } from "react";
import {
  ArrowRight,
  Clock,
  CornerDownLeft,
  Heart,
  LayoutGrid,
  Moon,
  Receipt,
  Search,
  Settings,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Kbd } from "@/components/ui/misc";
import { Spinner } from "@/components/ui/spinner";
import { useTheme } from "@/components/providers/theme";
import { categories } from "@/config/categories";
import { spring } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import { useSearch } from "@/queries/catalog";
import { useMediaQuery } from "@/lib/use-media-query";
import { useSession } from "@/queries/session";
import { usePrefs, useUi } from "@/stores/ui";

const itemClass =
  "flex min-h-12 cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-body text-ink outline-none data-[selected=true]:bg-ink/[0.06]";

/** ⌘K / Ctrl+K: search products, brands and pages from anywhere. */
export function CommandPalette() {
  const open = useUi((s) => s.commandOpen);
  const setOpen = useUi((s) => s.setCommandOpen);
  const setBagOpen = useUi((s) => s.setBagOpen);
  const [query, setQuery] = useState("");
  const touch = useMediaQuery("(pointer: coarse)");
  const deferred = useDeferredValue(query);
  const { data, isFetching } = useSearch(deferred);
  const router = useRouter();
  const { user } = useSession();
  const { resolved, setPreference } = useTheme();
  const { recentSearches, addRecentSearch, clearRecentSearches } = usePrefs();
  const reduce = useReducedMotion();

  const close = () => {
    setOpen(false);
    setQuery("");
  };
  const go = (href: string, remember?: string) => {
    if (remember) addRecentSearch(remember);
    close();
    router.push(href);
  };

  const term = query.trim();
  const hasShop = !!user && user.brandIds.length > 0;
  const pages = [
    { label: "Explore", href: "/explore", icon: LayoutGrid },
    {
      label: "Your bag",
      action: () => {
        close();
        setBagOpen(true);
      },
      icon: ShoppingBag,
    },
    { label: "Orders", href: "/orders", icon: Receipt },
    { label: "Saved items", href: "/wishlist", icon: Heart },
    {
      label: hasShop ? "Shop Studio" : "Open your shop",
      href: hasShop ? "/studio" : "/open-shop",
      icon: Store,
    },
    { label: "Settings", href: "/account/settings", icon: Settings },
    {
      label: resolved === "dark" ? "Switch to light theme" : "Switch to dark theme",
      action: () => setPreference(resolved === "dark" ? "light" : "dark"),
      icon: Moon,
    },
  ];

  return (
    <RDialog.Root open={open} onOpenChange={(v) => (v ? setOpen(true) : close())}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <RDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-(--z-overlay) bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </RDialog.Overlay>
            <RDialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              // Phones: open on the suggestions without the keyboard covering them;
              // tapping the search box brings it up.
              onOpenAutoFocus={(e) => {
                if (!touch) return;
                e.preventDefault();
                (e.currentTarget as HTMLElement | null)?.focus();
              }}
            >
              <motion.div
                className="fixed inset-x-0 top-0 z-(--z-sheet) mx-auto flex max-h-dvh w-full max-w-xl flex-col overflow-hidden bg-surface shadow-xl ring-1 ring-line sm:top-[12vh] sm:max-h-[70vh] sm:rounded-lg"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
                transition={spring.smooth}
              >
                <VisuallyHidden.Root>
                  <RDialog.Title>Search</RDialog.Title>
                </VisuallyHidden.Root>
                <Command
                  shouldFilter={false}
                  label="Search Kamplug"
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex items-center gap-3 border-b border-line px-4">
                    {isFetching && term ? (
                      <Spinner className="size-5 text-muted" />
                    ) : (
                      <Search className="size-5 text-muted" />
                    )}
                    <Command.Input
                      value={query}
                      onValueChange={setQuery}
                      autoFocus={!touch}
                      placeholder="Search products, brands, pages…"
                      className="h-14 flex-1 bg-transparent text-body-lg text-ink outline-none placeholder:text-faint"
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          term &&
                          !document.querySelector("[cmdk-item][data-selected=true]")
                        ) {
                          go(`/search?q=${encodeURIComponent(term)}`, term);
                        }
                      }}
                    />
                    <RDialog.Close
                      className="flex size-9 items-center justify-center rounded-md text-muted hover:bg-ink/[0.06] sm:hidden"
                      aria-label="Close search"
                    >
                      <X className="size-5" />
                    </RDialog.Close>
                    <Kbd className="hidden sm:inline-flex">Esc</Kbd>
                  </div>
                  <Command.List className="min-h-0 flex-1 overflow-y-auto p-2">
                    <Command.Empty className="px-3 py-10 text-center text-body text-muted">
                      {isFetching ? (
                        "Searching…"
                      ) : (
                        <>No matches for “{term}”. Try a brand name or “jollof”.</>
                      )}
                    </Command.Empty>

                    {term && (
                      <Command.Item
                        value={`search-all-${term}`}
                        onSelect={() => go(`/search?q=${encodeURIComponent(term)}`, term)}
                        className={itemClass}
                      >
                        <Search className="size-4.5 text-muted" />
                        <span className="flex-1 truncate">
                          Search everything for <strong className="font-medium">“{term}”</strong>
                        </span>
                        <CornerDownLeft className="size-4 text-faint" />
                      </Command.Item>
                    )}

                    {term && !!data?.products.length && (
                      <Command.Group
                        heading="Products"
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:text-muted"
                      >
                        {data.products.map((p) => (
                          <Command.Item
                            key={p.id}
                            value={`p-${p.id}`}
                            onSelect={() => go(`/products/${p.slug}`, term)}
                            className={itemClass}
                          >
                            <span className="size-10 shrink-0 overflow-hidden rounded-sm">
                              <AppImage image={p.images[0]} alt="" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-small font-medium">
                                {p.name}
                              </span>
                              <span className="block truncate text-small text-muted">
                                {p.brand.name}
                              </span>
                            </span>
                            <span className="font-mono text-small text-ink-2 tabular">
                              {formatNaira(p.priceKobo)}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {term && !!data?.brands.length && (
                      <Command.Group
                        heading="Brands"
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:text-muted"
                      >
                        {data.brands.map((b) => (
                          <Command.Item
                            key={b.id}
                            value={`b-${b.id}`}
                            onSelect={() => go(`/brands/${b.handle}`, term)}
                            className={itemClass}
                          >
                            <span className="size-10 shrink-0 overflow-hidden rounded-full">
                              <AppImage image={b.logo} alt="" variant="logo" name={b.name} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-small font-medium">
                                {b.name}
                              </span>
                              <span className="block truncate text-small text-muted">
                                @{b.handle} · {b.tagline}
                              </span>
                            </span>
                            <ArrowRight className="size-4 text-faint" />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {!term && recentSearches.length > 0 && (
                      <Command.Group
                        heading="Recent"
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:text-muted"
                      >
                        {recentSearches.map((r) => (
                          <Command.Item
                            key={r}
                            value={`r-${r}`}
                            onSelect={() => setQuery(r)}
                            className={itemClass}
                          >
                            <Clock className="size-4.5 text-muted" />
                            <span className="flex-1 truncate">{r}</span>
                          </Command.Item>
                        ))}
                        <Command.Item
                          value="clear-recent"
                          onSelect={clearRecentSearches}
                          className={`${itemClass} text-small text-muted`}
                        >
                          <X className="size-4.5" />
                          Clear recent searches
                        </Command.Item>
                      </Command.Group>
                    )}

                    {!term && (
                      <Command.Group
                        heading="Categories"
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:text-muted"
                      >
                        {categories.map((c) => (
                          <Command.Item
                            key={c.id}
                            value={`c-${c.id}`}
                            onSelect={() => go(`/explore?category=${c.id}`)}
                            className={itemClass}
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-surface-2 ring-1 ring-line">
                              <c.icon className="size-4 text-ink-2" />
                            </span>
                            <span className="flex-1">{c.name}</span>
                            <span className="truncate text-small text-muted max-sm:hidden">
                              {c.blurb}
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    {!term && (
                      <Command.Group
                        heading="Go to"
                        className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:text-muted"
                      >
                        {pages.map((p) => {
                          const Icon = p.icon;
                          return (
                            <Command.Item
                              key={p.label}
                              value={`page-${p.label}`}
                              onSelect={() => (p.href ? go(p.href) : p.action?.())}
                              className={itemClass}
                            >
                              <Icon className="size-4.5 text-muted" />
                              <span className="flex-1">{p.label}</span>
                            </Command.Item>
                          );
                        })}
                      </Command.Group>
                    )}
                  </Command.List>
                  <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-small text-muted sm:flex">
                    <span className="flex items-center gap-1.5">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd> to move
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Kbd>↵</Kbd> to open
                    </span>
                  </div>
                </Command>
              </motion.div>
            </RDialog.Content>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  );
}
