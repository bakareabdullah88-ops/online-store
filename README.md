# Kiosk

A campus marketplace for Nigerian students. Buy from the student brands in your hostel, or open
a shop and sell. One account has two modes, **Buying** and **Selling**, with an animated switch
between them.

> **This is a frontend-only demo.** All data lives in your browser (IndexedDB), seeded with 18
> believable student brands across 8 campuses. Payments, wallet, payouts and auth are simulated
> and labelled as demo throughout. No real money moves, and nothing you type leaves your device.

The product name lives in one place, [`src/config/brand.ts`](src/config/brand.ts).

## Quick start

Requirements: Node ≥ 20.9 and pnpm 10 (`corepack enable` picks up the pinned version).

```bash
pnpm install
pnpm dev                 # http://localhost:3000
```

Production build:

```bash
pnpm build && pnpm start
```

### Demo accounts

The login page has one-tap buttons for both.

| Who | Email | Password | What to try |
| --- | --- | --- | --- |
| Buyer | `ada@demo.kiosk` | `kiosk-demo-1` | Explore, add to bag, check out with `FREEDEL` or `KIOSK10`, then watch the order move live |
| Seller | `tolu@demo.kiosk` | `kiosk-demo-1` | Owns **Àdìrẹ Lab**. Switch to Selling, accept orders on the board, edit products, check analytics |

You can also sign up as yourself and open a shop from scratch via **Open your shop** (a
five-step wizard). **Settings → Reset demo data** wipes everything back to the seed.

Orders you place with seeded brands advance on their own (confirmed → preparing → out for
delivery → delivered, over about a minute), so tracking is live and survives reloads. Orders your
own shop receives are moved by you in Shop Studio.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | `next typegen` then `tsc --noEmit` |
| `pnpm lint` | ESLint, zero warnings allowed |
| `pnpm format` / `pnpm format:check` | Prettier (with Tailwind class sorting) |
| `pnpm test` | Vitest unit tests (domain logic and the mock service layer on `fake-indexeddb`) |
| `pnpm test:e2e` | Playwright on a Pixel 7 and a 1280px desktop. Builds nothing itself: run `pnpm build` first; it starts `pnpm start` for you |
| `pnpm check` | typecheck + lint + unit tests |

The e2e suite covers the buyer flow (browse → bag → checkout → live tracking), the seller flow
(sign up → open a shop → publish a product; accept an order; switch modes) and a **page sweep**:
29 screens in light mode plus 9 in dark mode, each checked for axe WCAG 2.1 A/AA violations,
horizontal overflow and console errors.

Point Playwright at an already running server with `PLAYWRIGHT_BASE_URL=http://localhost:3100`.

## Environment

All variables are public (`NEXT_PUBLIC_*`); there are no server secrets. See
[`.env.example`](.env.example). They're validated in [`src/env.ts`](src/env.ts).

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_DATA_SOURCE` | `mock` | `mock` (IndexedDB) or `remote` (stub for a real backend) |
| `NEXT_PUBLIC_SITE_URL` | Vercel URL, else `http://localhost:$PORT` | Canonical URL for metadata, OG image and sitemap |
| `NEXT_PUBLIC_MOCK_LATENCY` | `900` | Upper bound (ms) of simulated network latency in the mock. `0` turns it off |

## Project map

```
src/
  app/            routes (thin; compose feature components), metadata routes, error pages
  components/
    ui/           design-system primitives (Button, Field, Chip, Tabs, Sheet, Toaster, …)
    shell/        header, tab bar, mode switch and curtain, command palette, account sheet
    market/       explore, brand and product pages, cards, rails
    checkout/     bag drawer and page, checkout, success
    orders/       order list, live tracking map and timeline, reviews
    account/      buyer dashboard
    studio/       Shop Studio (seller dashboard) and the open-shop wizard
    art/          generated product art, brand marks, empty-state illustrations (SVG)
  config/         brand name, categories, navigation
  design/         tokens and motion presets
  domain/         pure logic: money (kobo), bag, promos, checkout, order state machine, hours
  services/       typed contracts, mock (IndexedDB) and remote (stub) implementations
  queries/        TanStack Query hooks over the services
  stores/         Zustand: bag, UI prefs, toasts
docs/             DESIGN_ANALYSIS.md, DECISIONS.md, DEPLOY_VERCEL.md
API_CONTRACT.md   every service method and the REST endpoint it maps to
```

`/design-system` is a living style guide of every token and primitive.

## Connecting a real backend

The UI only talks to the interfaces in [`src/services/contracts.ts`](src/services/contracts.ts).
Implement them in `src/services/remote/` against the endpoints in
[`API_CONTRACT.md`](API_CONTRACT.md), then set `NEXT_PUBLIC_DATA_SOURCE=remote`. Search the code
for `BACKEND-SEAM` to find every place that changes meaning with a real server (sessions,
uploads, payments, realtime).

## Using real photos

Seed products use generated SVG art, so nothing is hotlinked. To use real photos:

1. Put the files in [`public/seed/`](public/seed) (JPEG or WebP, 4:5 crops work best).
2. In [`src/services/mock/seed/catalog.ts`](src/services/mock/seed/catalog.ts), add `photos` to a
   product, for example `photos: ["/seed/adire-tee-1.jpg", "/seed/adire-tee-2.jpg"]`. They become
   `ImageRef { kind: "url" }` and are served through `next/image`.
3. Use **Settings → Reset demo data** (or clear site data) so your browser reseeds.

Sellers can also upload their own images in Shop Studio; those are stored as blobs in IndexedDB.

## Deploying

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md). In short: import the repo in Vercel, keep the
defaults, deploy. No environment variables are required.
