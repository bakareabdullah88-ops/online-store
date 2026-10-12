import Link from "next/link";
import { brand } from "@/config/brand";
import { categories } from "@/config/categories";
import { AppearanceControls } from "./appearance";
import { Logo } from "./logo";

export function SiteFooter() {
  const cols = [
    {
      title: "Shop",
      links: [
        { href: "/explore", label: "Explore everything" },
        ...categories
          .slice(0, 5)
          .map((c) => ({ href: `/explore?category=${c.id}`, label: c.name })),
      ],
    },
    {
      title: "Sell",
      links: [
        { href: "/open-shop", label: "Open your shop" },
        { href: "/studio", label: brand.sellerProductName },
        { href: "/studio/promotions", label: "Promo codes" },
      ],
    },
    {
      title: "You",
      links: [
        { href: "/account", label: "Dashboard" },
        { href: "/orders", label: "Track an order" },
        { href: "/wishlist", label: "Saved items" },
        { href: "/account/settings", label: "Settings" },
      ],
    },
  ];
  return (
    <footer className="mt-16 border-t border-line bg-canvas-sunk">
      <div className="container-page grid gap-10 py-10 md:grid-cols-12 md:py-14">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm font-display text-display-sm text-ink-2">
            Student-made, campus-delivered. <em>Support the people you sit beside in class.</em>
          </p>
          <div className="mt-6 max-w-sm">
            <h2 className="mb-3 eyebrow text-muted">Appearance</h2>
            <AppearanceControls />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          {cols.map((c) => (
            <div key={c.title}>
              <h2 className="eyebrow text-muted">{c.title}</h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-small text-ink-2 underline-offset-4 hover:text-ink hover:underline"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-small text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {brand.name}. A demo marketplace: payments, wallet and accounts are simulated and
            nothing is charged.
          </p>
          <p className="font-mono text-label tracking-wider uppercase">
            Made for Nigerian campuses
          </p>
        </div>
      </div>
    </footer>
  );
}
