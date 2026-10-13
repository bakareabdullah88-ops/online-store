"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useMode } from "@/components/shell/mode";
import { isActive, marketNav, shopNav, visibleSections, type NavItem } from "@/config/nav";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
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
  const { user } = useSession();
  const badges = useNavBadges();
  const sections = visibleSections(mode === "selling" ? shopNav : marketNav, user?.role === "admin")
    .map((s) => ({ ...s, items: onlySecondary ? s.items.filter((i) => !i.primary) : s.items }))
    .filter((s) => s.items.length);
  let n = 0;
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
              const i = n++;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 420, damping: 28, delay: i * 0.025 }}
                >
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 rounded-2xl px-2 py-3 text-center text-[12.5px] font-medium transition-colors",
                      active ? "bg-surface shadow-sm ring-1 ring-line" : "hover:bg-ink/[0.04]",
                    )}
                  >
                    <span
                      className="grid size-11 place-items-center rounded-2xl tone-tile transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]"
                      style={{ ["--tone" as string]: item.tone }}
                    >
                      <item.icon className="size-5" />
                    </span>
                    <span className="truncate">{item.label}</span>
                    {count > 0 && (
                      <span className="absolute top-2 right-3 grid h-5 min-w-5 place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
