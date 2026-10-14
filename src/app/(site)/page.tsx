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
import { features as flags } from "@/config/features";
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
    href: "/explore",
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
    href: "/studio",
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
    href: "/studio/messages",
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
  {
    n: "01",
    title: flags.sampleData ? "Look around" : "Get your login",
    body: flags.sampleData
      ? "Open the preview, no sign-up needed. Real logins come from the Kamplug team."
      : "The Kamplug team creates one for you. Log in and pick your campus.",
  },
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
  ...(flags.sampleData
    ? [
        {
          q: "Is Kamplug live yet?",
          a: "Not yet, we're still building it. The shops, products and orders inside are sample data so you can see how everything works.",
        },
      ]
    : []),
  {
    q: "How do I join?",
    a: "Kamplug is invite-only for now. The Kamplug team creates your login and sends you your email and password.",
  },
  { q: "Does it cost anything?", a: "No. Using Kamplug and opening a shop are free." },
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

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-surface">
      {flags.sampleData ? (
        <Link
          href="/home"
          className="block bg-[#fff3e6] px-4 py-2.5 text-center text-[13px] text-[#4a2b14] dark:bg-[#2b1d12] dark:text-[#f3d9c2]"
        >
          🚧 We&apos;re still building {brand.name}. Everything inside is sample data for now.{" "}
          <b className="font-semibold underline-offset-2 hover:underline">Have a look around</b>
        </Link>
      ) : (
        <Link
          href="/login"
          className="block bg-[#fff3e6] px-4 py-2.5 text-center text-[13px] text-[#4a2b14] dark:bg-[#2b1d12] dark:text-[#f3d9c2]"
        >
          {brand.name} is invite-only while we open campus by campus. Have a login?{" "}
          <b className="font-semibold underline-offset-2 hover:underline">Log in</b>
        </Link>
      )}
      <div className="relative">
        <LandingNav />
        <Page className="relative">
          {/* hero */}
          <section className="relative mx-auto max-w-6xl px-4 pt-14 text-center md:px-6 md:pt-20">
            <h1 className="mx-auto max-w-4xl text-[clamp(40px,6.4vw,76px)] leading-[1.02] font-bold tracking-[-0.045em] text-balance">
              Buy from your campus,
              <br />
              sell to your campus
            </h1>
            <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
              <Link
                href={flags.sampleData ? "/home" : "/login"}
                className="flex h-13 items-center gap-2 rounded-xl bg-[#2f45d8] px-7 text-[16px] font-semibold text-white transition-[filter] hover:brightness-110"
              >
                {flags.sampleData ? `Explore ${brand.name}` : `Log in to ${brand.name}`}{" "}
                <ArrowRight className="size-4" />
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
                      href={flags.sampleData ? f.href : "/signup"}
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
                {benefits.map((b) => (
                  <div key={b.title} className="rounded-[12px] bg-surface p-6 ring-1 ring-line">
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
                <li key={s.n} className="rounded-[12px] bg-surface p-6 ring-1 ring-line">
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
            <div className="relative overflow-hidden rounded-[16px] bg-primary px-6 py-14 text-center text-on-primary md:px-16 md:py-20">
              <h2 className="relative text-[clamp(28px,4vw,44px)] leading-tight font-bold tracking-[-0.035em]">
                Your campus is already shopping.
              </h2>
              <p className="relative mt-3 text-[16px] opacity-75">
                {flags.sampleData
                  ? "We're still building it. Look around the preview, no sign-up needed."
                  : "Got your invite? Log in, then buy or sell from the same place."}
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={flags.sampleData ? "/home" : "/login"}
                  className="flex h-12 items-center gap-2 rounded-xl bg-mint-cta px-6 text-[15px] font-semibold text-on-mint-cta"
                >
                  <Zap className="size-4" /> {flags.sampleData ? "Explore the preview" : "Log in"}
                </Link>
                <Link
                  href={flags.sampleData ? "/login" : "/signup"}
                  className="flex h-12 items-center gap-2 rounded-xl px-6 text-[15px] font-semibold ring-1 ring-white/30 hover:bg-white/10"
                >
                  <Store className="size-4" /> {flags.sampleData ? "Log in" : "How to get access"}
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
                title: "Kamplug",
                links: [
                  ["How it works", "/#how"],
                  ["Log in", "/login"],
                  flags.sampleData ? ["Explore the preview", "/home"] : ["Get access", "/signup"],
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
