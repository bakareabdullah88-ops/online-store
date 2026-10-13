"use client";

import { usePathname } from "next/navigation";
import { FileText, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMode } from "@/components/shell/mode";
import { isActive, marketNav, shopNav } from "@/config/nav";
import { useMyBrand } from "@/queries/studio";
import { PageHeader, type Crumb } from "./page-header";

/** Finds the nav entry for the current page, for its icon and breadcrumb. */
function useNavContext(): { icon: LucideIcon; crumbs: Crumb[] } {
  const path = usePathname() ?? "/";
  const mode = useMode();
  const { data: brand } = useMyBrand();
  const sections = mode === "selling" ? shopNav : marketNav;
  const root: Crumb =
    mode === "selling"
      ? { label: brand?.name ?? "Shop", href: "/studio" }
      : { label: "Market", href: "/home" };
  for (const s of sections)
    for (const item of s.items)
      if (isActive(item, path)) {
        const crumbs: Crumb[] = [root];
        if (s.title) crumbs.push({ label: s.title });
        if (path !== item.href) crumbs.push({ label: item.label, href: item.href });
        return { icon: item.icon, crumbs };
      }
  return { icon: FileText, crumbs: [root] };
}

/**
 * Page heading that takes its icon and breadcrumb from the navigation, so
 * every page in the app reads the same way.
 */
export function NavPageHeader({
  title,
  description,
  actions,
  icon,
  current,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: LucideIcon;
  /** Last breadcrumb; defaults to the title when it's plain text. */
  current?: string;
  className?: string;
  children?: ReactNode;
  /** Accepted for older call sites; the breadcrumb replaces it. */
  eyebrow?: string;
}) {
  const ctx = useNavContext();
  const last = current ?? (typeof title === "string" ? title : undefined);
  const crumbs =
    last && ctx.crumbs.at(-1)?.label !== last ? [...ctx.crumbs, { label: last }] : ctx.crumbs;
  return (
    <PageHeader
      icon={icon ?? ctx.icon}
      crumbs={crumbs}
      title={title}
      description={description}
      actions={actions}
      className={className ?? "mb-6"}
    >
      {children}
    </PageHeader>
  );
}
