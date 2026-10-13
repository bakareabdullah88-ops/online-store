"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ExternalLink, Layers } from "lucide-react";
import { useState } from "react";
import { AppImage } from "@/components/ui/app-image";
import { useMode } from "@/components/shell/mode";
import { categories } from "@/config/categories";
import { isActive, marketNav, shopNav, type NavItem, type NavSection } from "@/config/nav";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useCampus, useProducts } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import { useMyBrand, useStudioProducts } from "@/queries/studio";
import { useNavBadges, type BadgeKey } from "./nav-badges";
import { UserAvatar } from "./user-avatar";

/** Category dot colours (image 2's coloured bullets). */
const DOTS = [
  "var(--chart-pink)",
  "var(--chart-blue)",
  "var(--chart-green)",
  "var(--chart-orange)",
  "var(--chart-violet)",
  "var(--chart-mint)",
  "var(--chart-blue-2)",
  "var(--warning)",
];

function Badge({ count, tone }: { count: number; tone: "red" | "grey" }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto rounded-full px-2 py-0.5 text-[11px] leading-4 font-semibold tabular",
        tone === "red" ? "bg-badge text-white" : "bg-ink/[0.07] text-ink-2",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

const redBadges: BadgeKey[] = ["notifications", "messages", "shopMessages", "newOrders"];

export function NavLink({
  item,
  path,
  badges,
  onNavigate,
}: {
  item: NavItem;
  path: string;
  badges: Record<BadgeKey, number>;
  onNavigate?: () => void;
}) {
  const active = isActive(item, path);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors",
        active ? "text-ink" : "text-ink-2 hover:bg-ink/[0.04] hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          transition={spring.snappy}
          className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line"
          aria-hidden
        />
      )}
      <Icon className={cn("relative size-[18px]", active ? "text-ink" : "text-muted")} />
      <span className="relative flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="relative">
          <Badge
            count={badges[item.badge]}
            tone={redBadges.includes(item.badge) ? "red" : "grey"}
          />
        </span>
      )}
    </Link>
  );
}

function Sections({
  sections,
  path,
  onNavigate,
}: {
  sections: NavSection[];
  path: string;
  onNavigate?: () => void;
}) {
  const badges = useNavBadges();
  return (
    <>
      {sections.map((s, i) => (
        <div key={s.title ?? i} className={cn(i > 0 && "mt-5 border-t border-line pt-5")}>
          {s.title && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
              {s.title}
            </p>
          )}
          <div className="flex flex-col gap-0.5">
            {s.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                path={path}
                badges={badges}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

/** Expandable category list with coloured dots and counts (image 2). */
function CategoryTree({
  mode,
  onNavigate,
}: {
  mode: "buying" | "selling";
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const market = useProducts({ pageSize: 48 });
  const shop = useStudioProducts({});
  const params = useSearchParams();
  const pathname = usePathname() ?? "/";
  const list = mode === "selling" ? (shop.data ?? []) : (market.data?.items ?? []);
  const countFor = (id: string) => list.filter((p) => p.category === id).length;
  const visible = categories.filter((c) => mode === "buying" || countFor(c.id) > 0);
  const current = params.get("category");
  const base = mode === "selling" ? "/studio/products" : "/explore";
  if (mode === "selling" && visible.length === 0) return null;
  return (
    <div className="mt-5 border-t border-line pt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-ink-2 hover:bg-ink/[0.04] hover:text-ink"
      >
        <Layers className="size-[18px] text-muted" />
        <span className="flex-1 text-left">
          {mode === "selling" ? "Product category" : "Categories"}
        </span>
        <ChevronDown
          className={cn("size-4 text-muted transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.smooth}
            className="ml-[21px] overflow-hidden border-l border-line pl-3"
          >
            {visible.map((c, i) => {
              const n = countFor(c.id);
              const active = pathname.startsWith(base) && current === c.id;
              return (
                <li key={c.id}>
                  <Link
                    href={`${base}?category=${c.id}`}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13.5px] transition-colors",
                      active
                        ? "bg-surface font-semibold text-ink shadow-xs"
                        : "text-ink-2 hover:text-ink",
                    )}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: DOTS[i % DOTS.length] }}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    {n > 0 && (
                      <span className="rounded-full bg-ink/[0.06] px-1.5 text-[11px] font-semibold text-ink-2 tabular">
                        {n}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContextHeader({ mode }: { mode: "buying" | "selling" }) {
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const { data: brand } = useMyBrand();
  if (mode === "selling" && brand) {
    return (
      <div className="flex items-center gap-3 px-3">
        <span className="size-10 shrink-0 overflow-hidden rounded-xl">
          <AppImage image={brand.logo} alt="" variant="logo" name={brand.name} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{brand.name}</p>
          <Link
            href={`/brands/${brand.handle}`}
            className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"
          >
            View shop <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="px-3">
      <p className="text-[15px] font-semibold">Market</p>
      <p className="text-[12px] text-muted">{campus ? campus.name : "All campuses"}</p>
    </div>
  );
}

/** Navigation for the current workspace. Also used inside the phone menu sheet. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const mode = useMode();
  const path = usePathname() ?? "/";
  return (
    <>
      <ContextHeader mode={mode} />
      <nav aria-label={mode === "selling" ? "Shop" : "Market"} className="mt-5">
        <Sections
          sections={mode === "selling" ? shopNav : marketNav}
          path={path}
          onNavigate={onNavigate}
        />
      </nav>
      <CategoryTree mode={mode} onNavigate={onNavigate} />
    </>
  );
}

export function Sidebar() {
  const { user } = useSession();
  return (
    <aside className="sticky top-0 hidden h-dvh w-(--sidebar-w) shrink-0 flex-col py-5 pr-3 lg:flex">
      <div className="-mr-3 scrollbar-none min-h-0 flex-1 overflow-y-auto pr-3">
        <SidebarContent />
      </div>
      {user && (
        <Link
          href="/account/settings"
          className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-ink/[0.04]"
        >
          <UserAvatar size={36} />
          <span className="min-w-0">
            <span className="block truncate text-[13.5px] font-semibold">{user.name}</span>
            <span className="block truncate text-[12px] text-muted">{user.email}</span>
          </span>
        </Link>
      )}
    </aside>
  );
}
