import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { AppImage } from "@/components/ui/app-image";
import { cn } from "@/lib/cn";
import type { ImageRef } from "@/services/types";
import { Page } from "@/components/shell/page";
import { FeaturedBrands, PopularOnCampus } from "@/components/market/landing-sections";
import { brand } from "@/config/brand";
import { categories } from "@/config/categories";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} · Buy from student brands on your campus` },
  description: brand.description,
  alternates: { canonical: "/" },
};

const steps = [
  {
    n: "01",
    title: "Find something made nearby",
    body: "Browse thrift, food, skincare, prints and more from students on your campus, filtered by the hostel or faculty they serve.",
  },
  {
    n: "02",
    title: "Pick up or get it delivered",
    body: "Every brand is its own order. Choose a pickup point between lectures or delivery to your room, brand by brand.",
  },
  {
    n: "03",
    title: "Watch it move, live",
    body: "From confirmed to on its way, you see every step. Rate the brand after; it helps the next student decide.",
  },
];

/** Hero strip. Swap these for real photos (ImageRef { kind: "url" }) in /public/seed. */
const heroTiles: { label: string; image: ImageRef }[] = [
  { label: "Àdìrẹ tees · ₦9,500", image: { kind: "art", motif: "tee", palette: "sea", seed: 11 } },
  {
    label: "Party jollof · ₦3,500",
    image: { kind: "art", motif: "bowl", palette: "ochre", seed: 4 },
  },
  {
    label: "Shea serum · ₦6,000",
    image: { kind: "art", motif: "dropper", palette: "rose", seed: 9 },
  },
  {
    label: "Thrift denim · ₦16,500",
    image: { kind: "art", motif: "jacket", palette: "sand", seed: 7 },
  },
];

/** Category tile image: a real photo when one is set in config/categories.ts, else generated art. */
function categoryImage(c: (typeof categories)[number], i: number): ImageRef {
  return c.photo
    ? { kind: "url", src: c.photo }
    : { kind: "art", motif: c.motif, palette: c.palette, seed: 20 + i };
}

export default function LandingPage() {
  return (
    <Page className="-mt-(--header-h) lg:-mt-16">
      {/* ----------------------------- Hero ----------------------------- */}
      <section className="relative overflow-hidden bg-[radial-gradient(55%_70%_at_12%_0%,var(--wash-mint),transparent_72%),radial-gradient(45%_60%_at_92%_8%,var(--wash-peach),transparent_70%)] pt-(--header-h) lg:pt-16">
        <div className="container-page pt-8 pb-10 md:pt-12 lg:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1 text-small font-medium text-ink-2 shadow-xs hairline">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              {brand.tagline} · 8 campuses
            </p>
            <h1 className="mt-5 font-display text-display-xl text-balance text-ink">
              Buy from the brands <em className="text-accent">in your hostel.</em>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-body-lg text-muted">
              {brand.name} is where students sell what they make: hand-dyed tees, party jollof, shea
              butter, posters, past questions. Pick up between lectures or get it delivered to your
              room.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href="/explore"
                size="lg"
                trailingIcon={<ArrowRight className="size-4.5" />}
              >
                Start exploring
              </ButtonLink>
              <ButtonLink href="/open-shop" size="lg" variant="secondary">
                Open your shop
              </ButtonLink>
            </div>
            <dl className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-small text-muted">
              {[
                ["18", "student brands"],
                ["126", "things to buy"],
                ["~45 min", "typical delivery"],
              ].map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-1.5">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-semibold text-ink tabular">{v}</dd>
                  <dd>{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* A strip of what's for sale */}
          <div className="relative mt-10 grid grid-cols-2 gap-3 md:grid-cols-4" aria-hidden>
            {heroTiles.map((t, i) => (
              <div
                key={t.label}
                className={cn(
                  "relative aspect-[4/5] overflow-hidden rounded-lg bg-sand shadow-sm md:aspect-square",
                  i > 1 && "max-md:hidden",
                )}
              >
                <AppImage
                  image={t.image}
                  alt=""
                  sizes="(min-width: 768px) 25vw, 50vw"
                  priority={i < 2}
                />
                <span className="absolute bottom-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[12px] font-medium text-ink shadow-xs backdrop-blur">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- Categories ------------------------- */}
      <section aria-labelledby="cats" className="container-page mt-12 md:mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 id="cats" className="font-display text-display-md">
            What&apos;s on campus
          </h2>
          <Link
            href="/explore"
            className="hidden items-center gap-1 text-small font-medium underline-offset-4 hover:underline sm:inline-flex"
          >
            Everything <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <ul className="-mx-(--gutter) mt-5 scrollbar-none flex snap-x gap-3 overflow-x-auto px-(--gutter) pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {categories.map((c, i) => (
            <li key={c.id} className="w-40 shrink-0 snap-start md:w-auto">
              <Link
                href={`/explore?category=${c.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface hairline"
              >
                <div className="aspect-[4/3] overflow-hidden bg-sand">
                  <div className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                    <AppImage
                      image={categoryImage(c, i)}
                      alt=""
                      sizes="(min-width: 768px) 25vw, 160px"
                    />
                  </div>
                </div>
                <div className="px-3 py-2.5">
                  <p className="text-small font-semibold">{c.name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[12px] text-muted">{c.blurb}</p>
                </div>
              </Link>
            </li>
          ))}
          <li className="w-40 shrink-0 snap-start md:hidden">
            <Link
              href="/explore"
              className="group flex h-full min-h-40 flex-col justify-between rounded-lg bg-primary p-4 text-on-primary"
            >
              <p className="eyebrow opacity-70">All categories</p>
              <p className="text-body font-semibold">
                See everything <ArrowRight className="inline size-4" />
              </p>
            </Link>
          </li>
        </ul>
      </section>

      {/* -------------------------- How it works ------------------------- */}
      <section aria-labelledby="how" className="container-page mt-14 md:mt-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow text-muted">How it works</p>
            <h2 id="how" className="mt-3 font-display text-display-md text-balance">
              Like ordering food, but for everything students make.
            </h2>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-lg bg-line md:col-span-8 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="flex flex-col bg-canvas p-6 md:min-h-72 md:p-7">
                <span className="font-display text-display-lg text-accent">{s.n}</span>
                <h3 className="mt-auto pt-10 text-title font-semibold">{s.title}</h3>
                <p className="mt-2 text-small text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------ Featured brands ------------------------ */}
      <section aria-labelledby="brands" className="container-page mt-14 md:mt-20">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Featured brands</p>
            <h2 id="brands" className="mt-3 font-display text-display-md">
              Run by students you&apos;ve probably met
            </h2>
          </div>
        </div>
        <FeaturedBrands />
      </section>

      {/* ------------------------ Popular on campus ---------------------- */}
      <section aria-labelledby="popular" className="container-page mt-14 md:mt-20">
        <p className="eyebrow text-muted">This week</p>
        <h2 id="popular" className="mt-3 mb-8 font-display text-display-md">
          Popular on campus
        </h2>
        <PopularOnCampus />
      </section>

      {/* --------------------------- Seller CTA -------------------------- */}
      <section aria-labelledby="sell" className="mt-14 md:mt-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary">
            <div className="grid gap-8 p-6 md:grid-cols-12 md:p-10">
              <div className="md:col-span-6">
                <p className="eyebrow opacity-60">For sellers</p>
                <h2 id="sell" className="mt-4 font-display text-display-lg text-balance">
                  Your side hustle deserves a{" "}
                  <em className="text-studio-contrast">real storefront.</em>
                </h2>
                <p className="mt-5 max-w-md text-body-lg opacity-70">
                  Open a shop in five minutes. Get a page for your brand, take orders without the
                  DMs, track deliveries and see what&apos;s selling, all from Shop Studio.
                </p>
                <ul className="mt-8 flex flex-col gap-3 text-small">
                  {[
                    [ShoppingBag, "Orders arrive in one board, not 40 WhatsApp chats"],
                    [MapPin, "Choose the pickup points and hostels you serve"],
                    [ArrowUpRight, "Promo codes, reviews and analytics built in"],
                  ].map(([Icon, text]) => {
                    const I = Icon as typeof ShoppingBag;
                    return (
                      <li key={text as string} className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-on-primary/10">
                          <I className="size-4" />
                        </span>
                        {text as string}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-10 flex flex-wrap gap-3">
                  <ButtonLink
                    href="/open-shop"
                    size="lg"
                    className="bg-on-primary text-primary hover:bg-on-primary/90"
                  >
                    Open your shop, free
                  </ButtonLink>
                  <ButtonLink
                    href="/login?demo=seller"
                    size="lg"
                    variant="ghost"
                    className="text-on-primary hover:bg-on-primary/10"
                  >
                    Try the seller demo
                  </ButtonLink>
                </div>
              </div>
              {/* Mini studio preview */}
              <div className="md:col-span-6 md:pl-6" aria-hidden>
                <div className="rounded-lg bg-on-primary p-5 text-primary shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-small font-semibold">Revenue · last 7 days</p>
                    <span className="rounded-full bg-success-soft px-2 py-0.5 font-mono text-[11px] font-medium text-success">
                      +18.4%
                    </span>
                  </div>
                  <p className="mt-2 font-display text-display-md">₦148,500</p>
                  <div className="mt-6 flex h-36 gap-2.5">
                    {[38, 52, 44, 61, 49, 88, 70].map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex w-full flex-1 items-end">
                          <div
                            className="w-full rounded-t-sm"
                            style={{
                              height: `${h}%`,
                              background:
                                i === 5
                                  ? "var(--studio)"
                                  : "color-mix(in oklab, var(--primary) 12%, transparent)",
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] opacity-70">
                          {["M", "T", "W", "T", "F", "S", "S"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 border-t border-primary/10 pt-4 text-small">
                    {[
                      ["Orders", "42"],
                      ["Conversion", "6.1%"],
                      ["Rating", "4.8"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="opacity-70">{k}</p>
                        <p className="font-mono font-medium">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
