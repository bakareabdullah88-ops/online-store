"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/overlay";
import { cn } from "@/lib/cn";

export type CardAction = { label: string; href?: string; onSelect?: () => void; icon?: ReactNode };

/** The round "…" button on dashboard cards, with real actions. */
export function CardMenu({ actions, label }: { actions: CardAction[]; label: string }) {
  const router = useRouter();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          aria-label={`${label} options`}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink-2 ring-1 ring-line transition-colors hover:text-ink hover:ring-line-strong"
        >
          <MoreHorizontal className="size-[18px]" />
        </button>
      </MenuTrigger>
      <MenuContent>
        {actions.map((a) => (
          <MenuItem
            key={a.label}
            icon={a.icon}
            onSelect={() => (a.href ? router.push(a.href) : a.onSelect?.())}
          >
            {a.label}
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

/** Soft grey card (image 3). */
export function DashCard({
  title,
  aside,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  actions?: CardAction[];
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const label = typeof title === "string" ? title : "Card";
  return (
    <section
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-[24px] bg-surface-2/70 ring-1 ring-line",
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-center gap-3 px-5 pt-5 md:px-6 md:pt-6">
          {title && (
            <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-[-0.01em] md:text-[19px]">
              {title}
            </h2>
          )}
          {aside}
          {actions && actions.length > 0 && <CardMenu actions={actions} label={label} />}
        </header>
      )}
      <div
        className={cn("flex min-h-0 flex-1 flex-col px-5 pt-4 pb-5 md:px-6 md:pb-6", bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}

/** Small "+12%" / "−8%" pill. */
export function DeltaBadge({ change, className }: { change: number | null; className?: string }) {
  if (change === null)
    return (
      <span
        className={cn(
          "rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-semibold text-accent",
          className,
        )}
      >
        New
      </span>
    );
  const up = change >= 0;
  const text = `${up ? "+" : "−"}${Math.abs(change) >= 100 ? Math.round(Math.abs(change)) : Math.abs(change).toFixed(Math.abs(change) < 10 ? 1 : 0)}%`;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular",
        change === 0
          ? "bg-ink/[0.06] text-ink-2"
          : up
            ? "bg-success-soft text-success"
            : "bg-danger-soft text-danger",
        className,
      )}
    >
      {change === 0 ? "0%" : text}
    </span>
  );
}

/** Headline number card (video: Clients / Revenue / Projects). */
export function StatCard({
  label,
  value,
  change,
  compare,
  icon,
}: {
  label: string;
  value: ReactNode;
  change: number | null;
  compare: string;
  icon?: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col rounded-[20px] bg-surface p-4 ring-1 ring-line md:p-5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
        <h2 className="flex-1 truncate text-[13.5px] font-medium text-ink-2">{label}</h2>
        <DeltaBadge change={change} />
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <p className="text-[24px] leading-none font-semibold tracking-[-0.02em] tabular md:text-[28px]">
          {value}
        </p>
        <p className="text-[11.5px] text-muted">{compare}</p>
      </div>
    </section>
  );
}
