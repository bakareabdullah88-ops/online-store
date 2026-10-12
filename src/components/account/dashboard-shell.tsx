"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Suspense, useId, type ReactNode } from "react";
import { ArrowUpRight, Store } from "lucide-react";
import { RequireAuth } from "@/components/shell/require-auth";
import { UserAvatar } from "@/components/shell/site-header";
import { Skeleton } from "@/components/ui/skeleton";
import { accountNav, isActive } from "@/config/nav";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useCampus } from "@/queries/catalog";
import { useUnreadCount, useThreads } from "@/queries/inbox";
import { useSession } from "@/queries/session";

function SidebarNav() {
  const pathname = usePathname() ?? "/";
  const id = useId();
  const unread = useUnreadCount();
  const threads = useThreads("buyer");
  const unreadMessages = (threads.data ?? []).reduce((n, t) => n + t.unreadForBuyer, 0);
  return (
    <nav aria-label="Account" className="flex flex-col gap-0.5">
      {accountNav.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        const badge = item.href === "/notifications" ? unread : item.href === "/messages" ? unreadMessages : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("relative flex h-10 items-center gap-3 rounded-md px-3 text-small font-medium transition-colors", active ? "text-ink" : "text-muted hover:text-ink")}
          >
            {active && <motion.span layoutId={id} className="absolute inset-0 rounded-md bg-surface shadow-sm hairline" transition={spring.snappy} aria-hidden />}
            <Icon className="relative size-4.5" />
            <span className="relative flex-1">{item.label}</span>
            {badge > 0 && <span className="relative rounded-full bg-accent px-1.5 font-mono text-[10px] leading-5 text-on-accent">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Sidebar() {
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const hasShop = !!user && user.brandIds.length > 0;
  return (
    <aside className="hidden lg:block" style={{ viewTransitionName: "app-sidebar" }}>
      <div className="sticky top-24 flex flex-col gap-6">
        <div className="flex items-center gap-3 px-1">
          <UserAvatar size={40} />
          <div className="min-w-0">
            <p className="truncate text-small font-semibold">{user?.name}</p>
            <p className="truncate text-small text-muted">{campus?.shortName ?? "Campus not set"}</p>
          </div>
        </div>
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <SidebarNav />
        </Suspense>
        <Link href={hasShop ? "/studio" : "/open-shop"} className="group flex flex-col rounded-lg bg-primary p-4 text-on-primary">
          <Store className="size-5" />
          <p className="mt-3 text-small font-semibold">{hasShop ? "Go to Shop Studio" : "Sell on campus"}</p>
          <p className="mt-1 text-small text-on-primary/80">{hasShop ? "Orders, products and payouts." : "Open a shop in five minutes. It's free."}</p>
          <ArrowUpRight className="mt-3 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </aside>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="mt-4 h-40 w-full" rounded="lg" />
      <Skeleton className="h-40 w-full" rounded="lg" />
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="container-page pt-6 md:pt-10">
      <div className="grid gap-10 lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] xl:gap-14">
        <Suspense fallback={<div className="hidden lg:block" />}>
          <Sidebar />
        </Suspense>
        <div className="min-w-0">
          <Suspense fallback={<DashboardSkeleton />}>
            <RequireAuth fallback={<DashboardSkeleton />}>{children}</RequireAuth>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/** Standard page heading inside the dashboard. */
export function DashboardHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="eyebrow text-muted">{eyebrow}</p>
        <h1 className="mt-2 font-display text-display-md">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-body text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
