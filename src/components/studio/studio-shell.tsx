"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Suspense, useId, type ReactNode } from "react";
import { ExternalLink, Search } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/shell/logo";
import { ModeSwitch } from "@/components/shell/mode-switch";
import { RequireAuth } from "@/components/shell/require-auth";
import { AccountMenu, NotificationsButton, useScrolled } from "@/components/shell/site-header";
import { TabBar } from "@/components/shell/tab-bar";
import { isActive, studioNav } from "@/config/nav";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useThreads } from "@/queries/inbox";
import { useMyBrand, useStudioOrders } from "@/queries/studio";
import { useUi } from "@/stores/ui";

function StudioNav() {
  const pathname = usePathname() ?? "/studio";
  const id = useId();
  const orders = useStudioOrders();
  const threads = useThreads("brand");
  const newOrders = (orders.data ?? []).filter((o) => o.status === "placed").length;
  const unread = (threads.data ?? []).reduce((n, t) => n + t.unreadForBrand, 0);
  return (
    <nav aria-label="Shop Studio" className="flex flex-col gap-0.5">
      {studioNav.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        const badge =
          item.href === "/studio/orders"
            ? newOrders
            : item.href === "/studio/messages"
              ? unread
              : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-10 items-center gap-3 rounded-md px-3 text-small font-medium transition-colors",
              active ? "text-ink" : "text-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={id}
                className="absolute inset-0 rounded-md bg-surface shadow-sm hairline"
                transition={spring.snappy}
                aria-hidden
              />
            )}
            <Icon className="relative size-4.5" />
            <span className="relative flex-1">{item.label}</span>
            {badge > 0 && (
              <span className="relative rounded-full bg-accent px-1.5 font-mono text-[10px] leading-5 text-on-accent">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandBadge() {
  const { data: brand, isPending } = useMyBrand();
  if (isPending || !brand) {
    return (
      <div className="flex items-center gap-3 px-1">
        <Skeleton className="size-10" rounded="md" />
        <Skeleton className="h-4 w-28" />
      </div>
    );
  }
  return (
    <Link
      href={`/brands/${brand.handle}`}
      className="group flex items-center gap-3 rounded-md p-1 hover:bg-ink/[0.04]"
    >
      <span className="size-10 shrink-0 overflow-hidden rounded-md">
        <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold">{brand.name}</span>
        <span className="flex items-center gap-1 text-small text-muted">
          View shop <ExternalLink className="size-3" />
        </span>
      </span>
    </Link>
  );
}

function StudioHeader() {
  const scrolled = useScrolled();
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const { data: brand } = useMyBrand();
  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className={cn(
        "sticky top-0 z-(--z-header) transition-[background-color,box-shadow] duration-300",
        scrolled ? "bg-canvas/85 shadow-[0_1px_0_var(--line)] backdrop-blur-lg" : "bg-canvas",
      )}
    >
      <div className="flex h-(--header-h) items-center gap-3 px-(--gutter) md:px-8 lg:h-16">
        <Logo href="/studio" suffix="Studio" />
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label="Search"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-5" />
          </Button>
          <ModeSwitch className="mr-1 hidden md:inline-flex" />
          {brand && (
            <ButtonLink
              href={`/brands/${brand.handle}`}
              variant="ghost"
              size="sm"
              className="hidden xl:inline-flex"
              trailingIcon={<ExternalLink className="size-3.5" />}
            >
              View shop
            </ButtonLink>
          )}
          <NotificationsButton />
          <div className="ml-1 hidden lg:block">
            <AccountMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

export function StudioSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-12 w-72" />
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" rounded="lg" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" rounded="lg" />
    </div>
  );
}

export function StudioShell({ children }: { children: ReactNode }) {
  return (
    <div data-mode="selling" className="flex min-h-dvh flex-col bg-canvas">
      <Suspense fallback={<div className="h-(--header-h) lg:h-16" />}>
        <StudioHeader />
      </Suspense>
      <div className="flex-1 px-(--gutter) pt-4 pb-16 md:px-8 md:pt-6">
        <div className="mx-auto grid max-w-(--content-max) gap-8 lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] xl:gap-12">
          <aside className="hidden lg:block" style={{ viewTransitionName: "app-sidebar" }}>
            <div className="sticky top-24 flex flex-col gap-6">
              <Suspense fallback={<Skeleton className="h-12 w-full" />}>
                <BrandBadge />
              </Suspense>
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <StudioNav />
              </Suspense>
              <div className="rounded-lg bg-canvas-sunk p-4 text-small text-muted">
                <p className="font-medium text-ink">Demo shop data</p>
                <p className="mt-1">
                  Payouts and payments are simulated. Orders from real accounts on this device
                  appear here.
                </p>
              </div>
            </div>
          </aside>
          <div className="min-w-0">
            <Suspense fallback={<StudioSkeleton />}>
              <RequireAuth requireShop fallback={<StudioSkeleton />}>
                {children}
              </RequireAuth>
            </Suspense>
          </div>
        </div>
      </div>
      <Suspense fallback={null}>
        <TabBar variant="studio" />
      </Suspense>
    </div>
  );
}

/** Standard page heading inside Studio. */
export function StudioHeaderBlock({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="eyebrow text-muted">{eyebrow}</p>
        <h1 className="mt-2 font-display text-display-md">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-body text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
