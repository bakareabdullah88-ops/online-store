import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Crumb = { label: string; href?: string };

/**
 * Page heading used across the app (images 2 and 4): breadcrumb, icon tile,
 * title, a short description and actions on the right.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  crumbs,
  actions,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  crumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
  /** Extra row under the heading (tabs, filters). */
  children?: ReactNode;
}) {
  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-[12.5px] text-muted">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="size-3.5 text-line-strong" aria-hidden />}
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-ink">
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
        <div className="flex min-w-0 items-center gap-3.5">
          {Icon && (
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface shadow-xs ring-1 ring-line">
              <Icon className="size-5 text-ink" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-[22px] leading-tight font-semibold tracking-[-0.02em] md:text-[26px]">
              {title}
            </h1>
            {description && <p className="mt-0.5 text-small text-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

/** Standard padding for pages inside the app panel. */
export const pagePad = "px-4 pt-5 pb-10 md:px-6 lg:px-8 lg:pt-7";
