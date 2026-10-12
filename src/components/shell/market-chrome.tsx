"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Logo } from "./logo";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { TabBar } from "./tab-bar";

const NO_FOOTER = [
  "/checkout",
  "/messages",
  "/account",
  "/orders",
  "/notifications",
  "/bag",
  "/wishlist",
];

/** Static stand-in while the URL is unknown during prerender of dynamic routes. */
function HeaderFallback() {
  return (
    <header
      className="sticky top-0 z-(--z-header) bg-canvas/85 shadow-[0_1px_0_var(--line)]"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="container-page flex h-(--header-h) items-center lg:h-16">
        <Logo />
      </div>
    </header>
  );
}

function Header() {
  const pathname = usePathname() ?? "/";
  return <SiteHeader transparentAtTop={pathname === "/"} />;
}

function Footer() {
  const pathname = usePathname() ?? "/";
  return NO_FOOTER.some((p) => pathname.startsWith(p)) ? null : <SiteFooter />;
}

export function MarketChrome({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense
        fallback={
          <div
            className="h-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] lg:hidden"
            aria-hidden
          />
        }
      >
        <TabBar variant="market" />
      </Suspense>
    </div>
  );
}
