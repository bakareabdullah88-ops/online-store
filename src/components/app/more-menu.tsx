"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMode } from "@/components/shell/mode";
import { isActive, marketNav, shopNav, type NavItem } from "@/config/nav";
import { cn } from "@/lib/cn";
import { useNavBadges } from "./nav-badges";

/** Every destination in the current workspace as colourful tiles (used in the More popover and the phone sheet). */
export function NavGrid({
  onNavigate,
  onlySecondary = false,
}: {
  onNavigate?: () => void;
  onlySecondary?: boolean;
}) {
  const mode = useMode();
  const path = usePathname() ?? "/";
  const badges = useNavBadges();
  const sections = (mode === "selling" ? shopNav : marketNav)
    .map((s) => ({ ...s, items: onlySecondary ? s.items.filter((i) => !i.primary) : s.items }))
    .filter((s) => s.items.length);
  return (
    <div className="flex flex-col gap-4">
      {sections.map((s, si) => (
        <div key={s.title ?? si}>
          {s.title && (
            <p className="mb-2 px-1 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
              {s.title}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {s.items.map((item: NavItem) => {
              const active = isActive(item, path);
              const count = item.badge ? badges[item.badge] : 0;
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-col items-center gap-2 rounded-lg px-2 py-3 text-center text-[12.5px] font-medium transition-colors",
                      active ? "bg-ink/[0.05]" : "hover:bg-ink/[0.04]",
                    )}
                  >
                    <item.icon className="size-5 text-ink-2" aria-hidden />
                    <span className="truncate">{item.label}</span>
                    {count > 0 && (
                      <span className="absolute top-2 right-3 grid h-5 min-w-5 place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
