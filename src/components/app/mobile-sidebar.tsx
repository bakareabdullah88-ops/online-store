"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { SidePanel } from "@/components/ui/sheet";
import { useMode } from "@/components/shell/mode";
import { isActive, marketNav, shopNav } from "@/config/nav";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
import { useNavBadges } from "./nav-badges";
import { WorkspaceSwitch } from "./workspace-switch";

/** The phone menu: every page of the current side, in a standard slide-in sidebar. */
export function MobileSidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const mode = useMode();
  const path = usePathname() ?? "/";
  const badges = useNavBadges();
  const { user } = useSession();
  const sections = mode === "selling" ? shopNav : marketNav;
  const hasShop = !!user && user.brandIds.length > 0;
  const action =
    mode === "selling" || hasShop
      ? { href: "/studio/products/new", label: "Add a product" }
      : { href: "/open-shop", label: "Open a shop" };
  const close = () => onOpenChange(false);

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      width="sm"
      title="Kamplug"
      hideTitle
      className="max-w-[300px]"
      footer={
        <Link
          href={action.href}
          onClick={close}
          className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent text-[14px] font-semibold text-on-accent transition-colors hover:bg-accent-hover"
        >
          <Plus className="size-4" /> {action.label}
        </Link>
      }
    >
      <div className="-mx-2 flex flex-col gap-5">
        <div className="px-2">
          <WorkspaceSwitch />
        </div>
        {sections.map((s, si) => (
          <nav key={s.title ?? si} aria-label={s.title ?? (mode === "selling" ? "Shop" : "Market")}>
            {s.title && (
              <p className="mb-1 px-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
                {s.title}
              </p>
            )}
            <ul>
              {s.items.map((item) => {
                const active = isActive(item, path);
                const count = item.badge ? badges[item.badge] : 0;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-lg px-3 text-[14.5px] transition-colors",
                        active
                          ? "bg-accent-soft font-semibold text-accent-ink"
                          : "text-ink-2 hover:bg-ink/[0.04] hover:text-ink",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {count > 0 && (
                        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-badge px-1.5 text-[11px] font-bold text-white tabular">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>
    </SidePanel>
  );
}
