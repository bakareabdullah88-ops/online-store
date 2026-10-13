import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bike,
  Globe2,
  HandCoins,
  MessageCircle,
  ShieldCheck,
  Store,
  Zap,
} from "lucide-react";
import { AppPreview } from "@/components/landing/app-preview";
import { ChatComposite, FoundComposite, OrderComposite } from "@/components/landing/composites";
import { LandingNav } from "@/components/landing/nav";
import { Logo } from "@/components/shell/logo";
import { Page } from "@/components/shell/page";
import { brand } from "@/config/brand";
import { seedCampuses } from "@/services/mock/seed/campuses";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} · Buy from your campus, sell to your campus` },
  description: brand.description,
  alternates: { canonical: "/" },
};

const campuses = seedCampuses();

const features = [
  {
    title: "Get found by students nearby",
    body: "Your products show up when students on your campus search or browse by category. They see how far you are and whether you deliver to their hall.",
    points: [
      "Search and categories by campus",
      "Delivery zones and pickup points",
      "Follow a shop to get its new drops",
    ],
    art: <FoundComposite />,
  },
  {
    title: "Turn views into orders",
    body: "A short checkout with pay on delivery or at pickup. Each shop gets its own order, so you only handle what's yours.",
    points: [
      "Pay on delivery or at pickup",
      "Promo codes and free delivery",
      "Live order status for the buyer",
    ],
    art: <OrderComposite />,
  },
  {
    title: "Talk to your buyers",
    body: "Questions about sizes, times and delivery happen in one inbox, next to the order. Buyers are notified as soon as you reply.",
    points: [
      "One inbox for every conversation",
      "Quick replies for common questions",
      "Notifications on new messages",
    ],
    art: <ChatComposite />,
  },
];

const benefits = [
  {
    icon: HandCoins,
    title: "Free to open",
    body: "No setup fee and no monthly fee. Open a shop in five short steps.",
  },
  {
    icon: ShieldCheck,
    title: "No card needed",
    body: "Buyers pay you directly when they get their order.",
  },
  {
    icon: Bike,
    title: "Delivery or pickup",
    body: "Choose the halls you deliver to and the spots for pickup.",
  },
  {
    icon: BarChart3,
    title: "Real analytics",
    body: "Views, adds to bag, orders and repeat buyers, from your own shop.",
  },
];

const steps = [
  { n: "01", title: "Create your account", body: "Sign up with your email and pick your campus." },
  {
    n: "02",
    title: "Shop or open a shop",
    body: "Browse student brands nearby, or set up your own in minutes.",
  },
  {
    n: "03",
    title: "Order, deliver, repeat",
    body: "Orders move from placed to delivered, and both sides see every step.",
  },
];

const faqs = [
  { q: "Does it cost anything?", a: "No. Creating an account and opening a shop are free." },
  {
    q: "How do buyers pay?",
    a: "On delivery or at pickup, straight to the seller. Online payments are coming later.",
  },
  {
    q: "Who can sell?",
    a: "Any student with an account. Food, fashion, thrift, beauty, prints, tech, books and more.",
  },
  { q: "Which campuses?", a: `${campuses.length} campuses to start, with more being added.` },
];

function Callout({ tag, text, className }: { tag: string; text: string; className: string }) {
  return (
    <div
      className={`absolute hidden w-56 rounded-xl bg-surface/90 px-4 py-3 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.25)] ring-1 ring-line backdrop-blur-md xl:block ${className}`}
    >
      <span className="inline-block rounded-full bg-chart-mint/60 px-2 py-0.5 text-[11px] font-semibold text-[#0d5a33] dark:text-[#bff3d8]">
        {tag}
      </span>
      <p className="mt-1.5 text-[14px] font-medium">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface">
      <Link
        href="/signup"
        className="block bg-[linear-gradient(90deg,#ffe9d6,#fff3e6,#ffe9d6)] px-4 py-2.5 text-center text-[13px] text-[#4a2b14] dark:bg-[linear-gradient(90deg,#2b1d12,#33251a,#2b1d12)] dark:text-[#f3d9c2]"
      >
        {brand.name} is free for students. Open a shop on your campus in minutes.{" "}
        <b className="font-semibold underline-offset-2 hover:underline">Sign up now</b>
      </Link>
      <div className="relative">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(60%_50%_at_15%_10%,color-mix(in_oklab,var(--chart-mint)_45%,transparent),transparent_70%),radial-gradient(50%_45%_at_85%_20%,#ffe6cc,transparent_70%)] opacity-80 dark:opacity-25"
          aria-hidden
        />
        <LandingNav />
        <Page className="relative">
          {/* hero */}
          <section className="relative mx-auto max-w-6xl px-4 pt-14 text-center md:px-6 md:pt-20">
            <h1 className="mx-auto max-w-4xl text-[clamp(40px,6.4vw,76px)] leading-[1.02] font-bold tracking-[-0.045em] text-balance">
              Buy from your campus,
              <br />
              sell to your campus
            </h1>
            <Callout
              tag="₦0 to start"
              text="Open a shop free, no monthly fees"
              className="top-[250px] -left-4 -rotate-6"
            />
            <Callout
              tag="No card needed"
              text="Pay when it reaches your hall"
              className="top-[236px] -right-4 rotate-6"
            />
            <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
              <svg
                className="hidden h-16 w-16 text-badge sm:block"
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden
              >
                <path
                  d="M6 58 C 14 30, 22 20, 28 40 S 44 50, 54 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M6 58 l-2 -9 M6 58 l8 -4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="54" cy="14" r="3.5" fill="currentColor" />
              </svg>
              <Link
                href="/signup"
                className="flex h-13 items-center gap-2 rounded-xl bg-[#2f45d8] px-7 text-[16px] font-semibold text-white shadow-[0_12px_30px_-10px_#2f45d8] transition-transform hover:-translate-y-0.5"
              >
                Create your account <ArrowRight className="size-4" />
              </Link>
              <p className="max-w-xs text-left text-[15px] text-ink-2">
                Student-run food, fashion, thrift and more, from people in your hostel.
              </p>
            </div>
            <div className="relative mt-14 md:mt-16">
              <AppPreview />
              <p className="mt-4 text-[12.5px] text-muted">
                Shop Studio, where sellers run their shop. Products shown are examples.
              </p>
            </div>
          </section>

          {/* campuses */}
          <section
            aria-labelledby="campuses-title"
            className="mx-auto max-w-6xl px-4 pt-20 md:px-6"
            id="campuses"
          >
            <h2
              id="campuses-title"
              className="text-center text-[13px] font-semibold tracking-[0.08em] text-muted uppercase"
            >
              Open on these campuses
            </h2>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {campuses.map((c) => (
                <li key={c.id} className="text-center">
                  <span className="block text-[26px] font-bold tracking-[-0.03em] text-ink/55 md:text-[30px]">
                    {c.shortName}
                  </span>
                  <span className="block text-[11px] text-muted">{c.city}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* features */}
          <section id="features" className="mx-auto max-w-6xl px-4 pt-28 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-[clamp(30px,4.4vw,48px)] leading-tight font-bold tracking-[-0.035em]">
                Everything you need to sell on campus
              </h2>
              <p className="mt-3 text-[16px] text-muted">
                One account for buying and selling. Switch between the market and your shop in a
                tap.
              </p>
            </div>
            <div className="mt-16 flex flex-col gap-20 md:gap-28">
              {features.map((f, i) => (
                <div key={f.title} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
                  <div className={i % 2 ? "md:order-2" : ""}>{f.art}</div>
                  <div className={i % 2 ? "md:order-1" : ""}>
                    <h3 className="text-[28px] leading-tight font-bold tracking-[-0.03em] md:text-[34px]">
                      {f.title}
                    </h3>
                    <p className="mt-3 text-[15.5px] text-ink-2">{f.body}</p>
                    <ul className="mt-5 flex flex-col gap-2.5">
                      {f.points.map((p) => (
                        <li key={p} className="flex items-center gap-2.5 text-[14.5px]">
                          <BadgeCheck className="size-[18px] text-chart-green" /> {p}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className="mt-6 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-accent hover:underline"
                    >
                      Get started <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* benefits */}
          <section id="benefits" className="mt-28 bg-canvas py-24">
            <div className="mx-auto max-w-6xl px-4 md:px-6">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-[clamp(30px,4.4vw,48px)] leading-tight font-bold tracking-[-0.035em]">
                  Open your shop and start selling with benefits
                </h2>
                <p className="mt-3 text-[16px] text-muted">
                  Built for how students already buy and sell, minus the WhatsApp chaos.
                </p>
              </div>
              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" id="pricing">
                {benefits.map((b, i) => (
                  <div
                    key={b.title}
                    className={`rounded-[22px] p-6 ring-1 ring-line ${i === 0 ? "bg-surface shadow-lg" : "bg-surface/60"}`}
                  >
                    <span className="grid size-11 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
                      <b.icon className="size-5" />
                    </span>
                    <h3 className="mt-5 text-[17px] font-semibold">{b.title}</h3>
                    <p className="mt-1.5 text-[14px] text-muted">{b.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* how it works */}
          <section id="how" className="mx-auto max-w-6xl px-4 py-24 md:px-6">
            <h2 className="text-center text-[clamp(30px,4.4vw,48px)] font-bold tracking-[-0.035em]">
              How it works
            </h2>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-[22px] bg-surface-2/70 p-6 ring-1 ring-line">
                  <span className="text-[13px] font-semibold text-muted tabular">{s.n}</span>
                  <h3 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                  <p className="mt-2 text-[14.5px] text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
            <dl className="mx-auto mt-20 grid max-w-4xl gap-x-12 gap-y-8 md:grid-cols-2">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="text-[16px] font-semibold">{f.q}</dt>
                  <dd className="mt-1.5 text-[14.5px] text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* cta */}
          <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6">
            <div className="relative overflow-hidden rounded-[32px] bg-primary px-6 py-14 text-center text-on-primary md:px-16 md:py-20">
              <div
                className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-chart-blue/40 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-20 -bottom-24 size-72 rounded-full bg-chart-mint/30 blur-3xl"
                aria-hidden
              />
              <h2 className="relative text-[clamp(28px,4vw,44px)] leading-tight font-bold tracking-[-0.035em]">
                Your campus is already shopping.
              </h2>
              <p className="relative mt-3 text-[16px] opacity-75">
                Make an account, then buy or sell from the same place.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/signup"
                  className="flex h-12 items-center gap-2 rounded-xl bg-mint-cta px-6 text-[15px] font-semibold text-on-mint-cta"
                >
                  <Zap className="size-4" /> Get started free
                </Link>
                <Link
                  href="/open-shop"
                  className="flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold ring-1 ring-white/30 hover:bg-white/10"
                >
                  <Store className="size-4" /> Open a shop
                </Link>
              </div>
            </div>
          </section>
        </Page>
        <footer className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-6">
            <div>
              <Logo />
              <p className="mt-4 max-w-xs text-[14px] text-muted">{brand.description}</p>
            </div>
            {[
              {
                title: "Buy",
                links: [
                  ["Discover", "/explore"],
                  ["Orders", "/orders"],
                  ["Saved", "/wishlist"],
                ],
              },
              {
                title: "Sell",
                links: [
                  ["Open a shop", "/open-shop"],
                  ["Shop Studio", "/studio"],
                  ["Pricing", "/#pricing"],
                ],
              },
              {
                title: "Kiosk",
                links: [
                  ["How it works", "/#how"],
                  ["Log in", "/login"],
                  ["Sign up", "/signup"],
                ],
              },
            ].map((c) => (
              <div key={c.title}>
                <p className="text-[13px] font-semibold">{c.title}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href!} className="text-[14px] text-muted hover:text-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-6 text-[12.5px] text-muted md:px-6">
            <span>© {brand.name}. Made for Nigerian campuses.</span>
            <span className="flex items-center gap-1.5">
              <Globe2 className="size-3.5" /> English (Nigeria) ·{" "}
              <MessageCircle className="size-3.5" /> {brand.supportEmail}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
