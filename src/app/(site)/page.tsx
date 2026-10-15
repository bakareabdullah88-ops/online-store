import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bike,
  Globe2,
  HandCoins,
  ShieldCheck,
} from "lucide-react";
import { KamplugMark } from "@/components/app/kamplug-mark";
import { ChatComposite, FoundComposite, OrderComposite } from "@/components/landing/composites";
import { LandingHero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { Reveal } from "@/components/landing/reveal";
import { CampusMarquee, Faq, HowSteps } from "@/components/landing/sections";
import { Logo } from "@/components/shell/logo";
import { Page } from "@/components/shell/page";
import { brand } from "@/config/brand";
import { seedCampuses } from "@/services/mock/seed/campuses";

export const metadata: Metadata = {
  title: { absolute: `${brand.name} · Your campus plug` },
  description: brand.description,
  alternates: { canonical: "/" },
};

/** A small green label that names each section, so they read as distinct parts. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-[12.5px] font-semibold tracking-[0.12em] text-brand-ink uppercase">
      {children}
    </p>
  );
}

const campuses = seedCampuses().map((c) => ({ name: c.name, short: c.shortName, city: c.city }));

const features = [
  {
    id: "buy",
    kicker: "For buyers",
    title: "Find it on your campus, not across town",
    body: "Search what students near you are selling. See how far each shop is and whether they deliver to your hall.",
    points: [
      "Search and browse by category",
      "Delivery to your hall, or pick up",
      "Follow shops for their new drops",
    ],
    art: <FoundComposite />,
  },
  {
    id: "sell",
    kicker: "For sellers",
    title: "Turn your DMs into real orders",
    body: "Open a free shop, list what you sell and take orders with pay on delivery. Each order tells you exactly what to make and where it's going.",
    points: [
      "Pay on delivery or at pickup",
      "Your own promo codes",
      "Live status your buyers can follow",
    ],
    art: <OrderComposite />,
  },
  {
    id: "chat",
    kicker: "In between",
    title: "Sort out the details in one chat",
    body: "Sizes, colours, pickup times. Talk it through next to the order, and get notified the moment someone replies.",
    points: ["One inbox for every conversation", "Unread counts right in the top bar"],
    art: <ChatComposite />,
  },
];

const benefits = [
  {
    icon: HandCoins,
    title: "Free to open",
    body: "No setup fee and no monthly fee. Five short steps.",
  },
  { icon: ShieldCheck, title: "No card needed", body: "Buyers pay when the order reaches them." },
  {
    icon: Bike,
    title: "Delivery or pickup",
    body: "Pick the halls you deliver to and your pickup spots.",
  },
  {
    icon: BarChart3,
    title: "Know your numbers",
    body: "Revenue, orders and repeat buyers from your own shop.",
  },
];

const steps = [
  {
    n: "1",
    title: "Create your account",
    body: "Use your email or Google, then pick your campus.",
  },
  {
    n: "2",
    title: "Shop or open a shop",
    body: "Browse student brands near you, or set up your own.",
  },
  {
    n: "3",
    title: "Order, deliver, repeat",
    body: "Both sides see every step from placed to delivered.",
  },
];

const faqs = [
  {
    q: "How do I join?",
    a: "Create an account with your email or Google. It takes about a minute.",
  },
  { q: "Does it cost anything?", a: "No. Using Kamplug and opening a shop are both free." },
  {
    q: "How do buyers pay?",
    a: "On delivery or at pickup, straight to the seller. Online payments are coming later.",
  },
  {
    q: "Who can sell?",
    a: "Any student with an account. Food, fashion, thrift, beauty, prints, tech, books and more.",
  },
  {
    q: "Which campuses?",
    a: `You can pick from ${campuses.length} campuses when you sign up, with more on the way.`,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-surface">
      <LandingNav />
      <Page>
        <LandingHero />

        {/* Campuses */}
        <section
          aria-labelledby="campuses-title"
          className="border-y border-line bg-surface-2 py-10"
          id="campuses"
        >
          <h2
            id="campuses-title"
            className="text-center text-[12.5px] font-semibold tracking-[0.12em] text-muted uppercase"
          >
            Live on {campuses.length} campuses
          </h2>
          <div className="mt-6">
            <CampusMarquee items={campuses} />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 pt-28 pb-8 md:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <SectionLabel>What you can do</SectionLabel>
            <h2 className="mt-3 text-[clamp(30px,4.4vw,48px)] leading-tight font-semibold tracking-[-0.035em]">
              One account for buying and selling
            </h2>
            <p className="mt-3 text-[16.5px] text-muted">
              Switch between the market and your shop in a tap.
            </p>
          </Reveal>
          <div className="mt-20 flex flex-col gap-24 md:gap-32">
            {features.map((f, i) => (
              <div
                key={f.id}
                id={f.id}
                className="grid scroll-mt-28 items-center gap-10 md:grid-cols-2 md:gap-16"
              >
                <Reveal from={i % 2 ? "right" : "left"} className={i % 2 ? "md:order-2" : ""}>
                  {f.art}
                </Reveal>
                <Reveal
                  from={i % 2 ? "left" : "right"}
                  delay={80}
                  className={i % 2 ? "md:order-1" : ""}
                >
                  <p className="text-[13px] font-semibold tracking-[0.06em] text-brand-ink uppercase">
                    {f.kicker}
                  </p>
                  <h3 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.03em] md:text-[34px]">
                    {f.title}
                  </h3>
                  <p className="mt-3 max-w-prose text-[16px] leading-relaxed text-ink-2">
                    {f.body}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2.5">
                    {f.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-[15px]">
                        <BadgeCheck className="size-[18px] shrink-0 text-brand-ink" aria-hidden />
                        {p}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section
          id="benefits"
          className="relative mt-24 overflow-hidden bg-accent-soft py-24 dark:bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))]"
        >
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal className="mx-auto max-w-2xl text-center">
              <SectionLabel>Why Kamplug</SectionLabel>
              <h2 className="mt-3 text-[clamp(30px,4.4vw,48px)] leading-tight font-semibold tracking-[-0.035em]">
                Selling on campus, minus the stress
              </h2>
              <p className="mt-3 text-[16.5px] text-muted">
                Built for how students already buy and sell, without the WhatsApp chaos.
              </p>
            </Reveal>
            <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, i) => (
                <Reveal as="li" key={b.title} delay={i * 90}>
                  <div className="group h-full rounded-xl bg-surface p-6 ring-1 ring-line transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-accent/40">
                    <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-brand-ink transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                      <b.icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-[16.5px] font-semibold">{b.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{b.body}</p>
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 border-y border-line bg-surface-2 py-28">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <SectionLabel>Getting started</SectionLabel>
              <h2 className="mt-3 text-center text-[clamp(30px,4.4vw,48px)] font-semibold tracking-[-0.035em]">
                How it works
              </h2>
            </Reveal>
            <HowSteps steps={steps} />
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="scroll-mt-24 border-t border-line bg-surface-2 px-4 py-24 md:px-6"
        >
          <Reveal>
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-3 text-center text-[clamp(28px,4vw,40px)] font-semibold tracking-[-0.035em]">
              Questions, answered
            </h2>
          </Reveal>
          <Faq items={faqs} />
        </section>

        {/* Closing call to action */}
        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-16 text-center text-white md:px-16 md:py-20">
              {/* Big faint marks drifting behind the text. */}
              <KamplugMark className="pointer-events-none absolute -top-10 -left-10 size-56 text-white/10 motion-safe:animate-[float_14s_ease-in-out_infinite]" />
              <KamplugMark className="pointer-events-none absolute -right-8 -bottom-12 size-72 rotate-12 text-white/10 motion-safe:animate-[float_18s_ease-in-out_infinite_reverse]" />
              <h2 className="relative text-[clamp(28px,4vw,46px)] leading-tight font-semibold tracking-[-0.035em]">
                Your campus is already buying.
                <br />
                Be the plug.
              </h2>
              <p className="relative mx-auto mt-3 max-w-md text-[16.5px] text-white">
                One free account for buying and selling. Open your shop whenever you&apos;re ready.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/signup"
                  className="group flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[15px] font-semibold text-brand transition-colors duration-150 hover:bg-white/90"
                >
                  Create your account
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/login"
                  className="flex h-12 items-center rounded-xl px-6 text-[15px] font-semibold ring-1 ring-white/40 transition-colors duration-150 hover:bg-white/10"
                >
                  Log in
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </Page>

      <footer className="border-t border-line bg-surface-2">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr] md:px-6">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-muted">
              {brand.description}
            </p>
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
              ],
            },
            {
              title: "Kamplug",
              links: [
                ["How it works", "/#how"],
                ["FAQ", "/#faq"],
                ["Log in", "/login"],
                ["Create an account", "/signup"],
              ],
            },
          ].map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold">{c.title}</p>
              <ul className="mt-3 flex flex-col gap-2">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href!}
                      className="text-[14px] text-muted transition-colors hover:text-ink"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* The wordmark, big, as a sign-off. */}
        <div className="mx-auto max-w-6xl overflow-hidden px-4 md:px-6" aria-hidden>
          {/* Drawn as SVG text: a faint sign-off, not something to read. */}
          <svg viewBox="0 0 1000 200" className="block w-full translate-y-[18%] opacity-[0.07]">
            <text
              x="0"
              y="170"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              className="fill-ink font-bold"
              style={{ fontSize: 220, letterSpacing: "-0.045em" }}
            >
              kam<tspan className="fill-brand-ink">plug</tspan>
            </text>
          </svg>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-6 text-[12.5px] text-muted md:px-6">
          <span>© {brand.name}. Made for Nigerian campuses.</span>
          <span className="flex items-center gap-1.5">
            <Globe2 className="size-3.5" /> English (Nigeria)
          </span>
        </div>
      </footer>
    </div>
  );
}
