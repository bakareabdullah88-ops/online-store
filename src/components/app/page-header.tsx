"use client";

import Link from "next/link";
import { ChevronRight, House, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

/**
 * Page heading used across the app: title, a short description and actions on
 * the right. The breadcrumb only shows on deeper pages (three levels or more),
 * where it says something the title doesn't. `icon` and `tone` are accepted
 * for older call sites but no longer drawn.
 */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** Colour of the icon tile. */
  tone?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
  /** Extra row under the heading (tabs, filters). */
  children?: ReactNode;
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {crumbs && crumbs.length > 2 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-muted">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 opacity-50" aria-hidden />}
                {c.href ? (
                  <Link
                    href={c.href}
                    className="flex items-center gap-1.5 rounded-md transition-colors hover:text-ink"
                  >
                    {i === 0 && <House className="size-3.5" aria-hidden />}
                    {c.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-ink">
                    {c.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] leading-tight font-bold tracking-[-0.025em] text-balance md:text-[26px]">
            {title}
          </h1>
          {description && <p className="mt-0.5 text-small text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
