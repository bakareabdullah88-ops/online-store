"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { TabBar } from "./tab-bar";

const NO_FOOTER = ["/checkout", "/messages", "/account", "/orders", "/notifications", "/bag", "/wishlist"];

export function MarketChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const footer = !NO_FOOTER.some((p) => pathname.startsWith(p));
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader transparentAtTop={pathname === "/"} />
      <div className="flex-1">{children}</div>
      {footer && <SiteFooter />}
      <TabBar variant="market" />
    </div>
  );
}
