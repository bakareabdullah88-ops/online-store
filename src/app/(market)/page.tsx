import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bike, MapPin, ShoppingBag } from "lucide-react";
import { ProductArt } from "@/components/art/product-art";
import { ButtonLink } from "@/components/ui/button";
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

export default function LandingPage() {
  return (
    <Page className="-mt-(--header-h) lg:-mt-16">
      {/* ----------------------------- Hero ----------------------------- */}
      <section className="relative overflow-hidden pt-(--header-h) lg:pt-16">
        <div className="container-page grid gap-10 pt-10 pb-16 md:pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-7 lg:pt-8">
            <p className="eyebrow flex items-center gap-2 text-muted">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden />
              {brand.tagline} · 8 campuses
            </p>
            <h1 className="mt-5 font-display text-display-xl text-balance text-ink">
              Buy from the brands <em className="text-accent">in your hostel.</em>
            </h1>
            <p className="mt-6 max-w-lg text-body-lg text-muted">
              {brand.name} is where students sell what they make: hand-dyed tees, party jollof, shea butter, posters,
              past questions. Order in a tap, pick up between lectures or get it delivered to your room.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/explore" size="lg" trailingIcon={<ArrowRight className="size-4.5" />}>
                Start exploring
              </ButtonLink>
              <ButtonLink href="/open-shop" size="lg" variant="secondary">
                Open your shop
              </ButtonLink>
            </div>
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
              {[
                ["18", "student brands"],
                ["126", "things to buy"],
                ["~45m", "typical delivery"],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-display-sm tabular">{v}</dd>
                  <dd className="mt-1 text-small text-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Composed still life: three tiles and a live order chip */}
          <div className="relative lg:col-span-5" aria-hidden>
            <div className="relative mx-auto aspect-[5/6] w-full max-w-md sm:max-w-lg lg:max-w-none">
              <div className="absolute top-0 left-0 h-[64%] w-[64%] overflow-hidden rounded-lg shadow-md">
                <ProductArt motif="tee" palette="sea" seed={11} className="size-full" />
              </div>
              <div className="absolute top-[6%] right-0 h-[44%] w-[32%] overflow-hidden rounded-lg">
                <ProductArt motif="bowl" palette="ochre" seed={4} className="size-full" />
              </div>
              <div className="absolute right-[4%] bottom-0 h-[48%] w-[44%] overflow-hidden rounded-lg shadow-md">
                <ProductArt motif="dropper" palette="rose" seed={9} className="size-full" />
              </div>
              <div className="absolute bottom-[6%] left-[6%] flex w-[52%] flex-col gap-3 rounded-lg bg-primary p-4 text-on-primary shadow-lg md:p-5">
                <p className="eyebrow opacity-60">Order KSK-7F2Q</p>
                <div>
                  <p className="flex items-center gap-2 text-small font-medium">
                    <Bike className="size-4" /> Out for delivery
                  </p>
                  <p className="mt-1 text-small opacity-60">Moremi Hall · 12 min</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-on-primary/15">
                    <div className="h-full w-2/3 rounded-full bg-accent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- Categories ------------------------- */}
      <section aria-labelledby="cats" className="container-page">
        <div className="flex items-end justify-between gap-4">
          <h2 id="cats" className="font-display text-display-md">
            What&apos;s on campus
          </h2>
          <Link href="/explore" className="hidden items-center gap-1 text-small font-medium underline-offset-4 hover:underline sm:inline-flex">
            Everything <ArrowUpRight className="size-4" />
          </Link>
        </div>
        <ul className="scrollbar-none -mx-(--gutter) mt-8 flex snap-x gap-3 overflow-x-auto px-(--gutter) pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {categories.map((c, i) => (
            <li key={c.id} className={i === 0 ? "w-60 shrink-0 snap-start md:col-span-2 md:row-span-2 md:w-auto" : "w-40 shrink-0 snap-start md:w-auto"}>
              <Link href={`/explore?category=${c.id}`} className="group flex h-full flex-col overflow-hidden rounded-lg bg-surface hairline">
                <div className={i === 0 ? "aspect-[4/5] overflow-hidden md:aspect-auto md:flex-1" : "aspect-square overflow-hidden"}>
                  <div className="size-full transition-transform duration-700 ease-out group-hover:scale-[1.04]">
                    <ProductArt motif={c.motif} palette={c.palette} seed={20 + i} className="size-full" />
                  </div>
                </div>
                <div className="p-4">
                  <p className={i === 0 ? "font-display text-display-sm" : "text-body font-semibold"}>{c.name}</p>
                  <p className="mt-1 text-small text-muted line-clamp-2">{c.blurb}</p>
                </div>
              </Link>
            </li>
          ))}
          <li className="w-40 shrink-0 snap-start md:w-auto">
            <Link
              href="/explore"
              className="group flex h-full min-h-48 flex-col justify-between rounded-lg bg-primary p-5 text-on-primary transition-colors hover:bg-primary-hover"
            >
              <p className="eyebrow opacity-60">All categories</p>
              <p className="font-display text-display-sm">
                See everything <ArrowRight className="inline size-6 transition-transform group-hover:translate-x-1" />
              </p>
            </Link>
          </li>
        </ul>
      </section>

      {/* -------------------------- How it works ------------------------- */}
      <section aria-labelledby="how" className="container-page mt-24 md:mt-32">
        <div className="grid gap-10 md:grid-cols-12">
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
      <section aria-labelledby="brands" className="container-page mt-24 md:mt-32">
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
      <section aria-labelledby="popular" className="container-page mt-24 md:mt-32">
        <p className="eyebrow text-muted">This week</p>
        <h2 id="popular" className="mt-3 mb-8 font-display text-display-md">
          Popular on campus
        </h2>
        <PopularOnCampus />
      </section>

      {/* --------------------------- Seller CTA -------------------------- */}
      <section aria-labelledby="sell" className="mt-24 md:mt-32">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary">
            <div className="grid gap-10 p-7 md:grid-cols-12 md:p-12 lg:p-16">
              <div className="md:col-span-6">
                <p className="eyebrow opacity-60">For sellers</p>
                <h2 id="sell" className="mt-4 font-display text-display-lg text-balance">
                  Your side hustle deserves a <em className="text-studio-contrast">real storefront.</em>
                </h2>
                <p className="mt-5 max-w-md text-body-lg opacity-70">
                  Open a shop in five minutes. Get a page for your brand, take orders without the DMs, track deliveries and
                  see what&apos;s selling, all from Shop Studio.
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
                  <ButtonLink href="/open-shop" size="lg" className="bg-on-primary text-primary hover:bg-on-primary/90">
                    Open your shop, free
                  </ButtonLink>
                  <ButtonLink href="/login?demo=seller" size="lg" variant="ghost" className="text-on-primary hover:bg-on-primary/10">
                    Try the seller demo
                  </ButtonLink>
                </div>
              </div>
              {/* Mini studio preview */}
              <div className="md:col-span-6 md:pl-6" aria-hidden>
                <div className="rounded-lg bg-on-primary p-5 text-primary shadow-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-small font-semibold">Revenue · last 7 days</p>
                    <span className="rounded-full bg-[color-mix(in_oklab,var(--studio)_15%,transparent)] px-2 py-0.5 font-mono text-[11px] font-medium" style={{ color: "var(--studio)" }}>
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
                            style={{ height: `${h}%`, background: i === 5 ? "var(--studio)" : "color-mix(in oklab, var(--primary) 12%, transparent)" }}
                          />
                        </div>
                        <span className="font-mono text-[10px] opacity-70">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
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
