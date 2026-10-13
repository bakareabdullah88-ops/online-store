# Kiosk

A campus marketplace for Nigerian students. Buy from the student brands in your hostel, or open
a shop and sell. One account has two modes, **Buying** and **Selling**, with an animated switch
between them.

> **The backend isn't connected yet.** Until it is, accounts, shops, orders and messages are saved
> in your browser (IndexedDB), so each browser has its own data. There is no sample data: what you
> see is what people create. Buyers pay sellers on delivery or at pickup; online payments, email
> password resets and payouts are switched off in [`src/config/features.ts`](src/config/features.ts)
> until the backend can do them.

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

### Try the whole flow

1. Open `/`, choose **Create your account**, pick your campus. You land on **Home**.
2. Open a shop from the **+** on the left rail (or the round **+** on phones) and add a product.
3. Sign out (avatar → Sign out), create a second account, find the product and order it.
4. Sign back in as the seller: the order is in **Orders**; accept it and move it to completed.
   The buyer is notified at every step, and both dashboards update.

## Scripts

| Command                             | What it does                                                                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server (Turbopack)                                                                                                      |
| `pnpm build` / `pnpm start`         | Production build and server                                                                                                 |
| `pnpm typecheck`                    | `next typegen` then `tsc --noEmit`                                                                                          |
| `pnpm lint`                         | ESLint, zero warnings allowed                                                                                               |
| `pnpm format` / `pnpm format:check` | Prettier (with Tailwind class sorting)                                                                                      |
| `pnpm test`                         | Vitest unit tests (domain logic and the mock service layer on `fake-indexeddb`)                                             |
| `pnpm test:e2e`                     | Playwright on a Pixel 7 and a 1280px desktop. Builds nothing itself: run `pnpm build` first; it starts `pnpm start` for you |
| `pnpm check`                        | typecheck + lint + unit tests                                                                                               |

The e2e suite runs the real flow with two fresh accounts (sign up → open a shop → add a product →
second account buys → seller fulfils → buyer sees it paid and messages the shop), the auth gate,
appearance settings, and a **page sweep** of every screen (signed out, new buyer, seller with a
product, dark mode), each checked for axe WCAG 2.1 A/AA violations, horizontal overflow and console
errors.

Point Playwright at an already running server with `PLAYWRIGHT_BASE_URL=http://localhost:3100`.

## Environment

All variables are public (`NEXT_PUBLIC_*`); there are no server secrets. See
[`.env.example`](.env.example). They're validated in [`src/env.ts`](src/env.ts).

| Variable                   | Default                                   | Purpose                                                                     |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_DATA_SOURCE`  | `mock`                                    | `mock` (IndexedDB) or `remote` (stub for a real backend)                    |
| `NEXT_PUBLIC_SITE_URL`     | Vercel URL, else `http://localhost:$PORT` | Canonical URL for metadata, OG image and sitemap                            |
| `NEXT_PUBLIC_MOCK_LATENCY` | `900`                                     | Upper bound (ms) of simulated network latency in the mock. `0` turns it off |

## Project map

```
src/
  app/            routes (thin; compose feature components), metadata routes, error pages
  components/
    ui/           design-system primitives (Button, Field, Chip, Tabs, Sheet, Toaster, …)
    app/          signed-in shell: rail, sidebar, phone top bar and pill nav, page header
    dash/         dashboard cards and charts (funnel, hatched bars, step line, dot matrices)
    table/        DataTable: filters, search, export, selection, row menus, pagination
    landing/      landing page sections and the coded app preview
    shell/        curtain, command palette, auth gate, appearance, global sync
    market/       explore, brand and product pages, cards, rails
    checkout/     bag drawer and page, checkout, success
    orders/       order list, live tracking map and timeline, reviews
    account/      buyer home, settings, addresses, saved
    studio/       Shop Studio pages and the open-shop wizard
    art/          generated product art, brand marks, empty-state illustrations (SVG)
  config/         brand name, categories, navigation, feature switches
  design/         tokens and motion presets
  domain/         pure logic: money (kobo), bag, promos, checkout, order state machine, hours, analytics
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

## Changing fonts

There are five font styles (Modern, Clean, Friendly, Editorial, Classic), defined in
[`src/config/font-presets.ts`](src/config/font-presets.ts).

- **Anyone can switch** in **Settings → Appearance → Font style** (or on `/design-system`). The
  choice is saved in that browser.
- **To change the default** everyone starts with, set `defaultFontPreset` in
  `src/config/font-presets.ts` and push. The site ships with **Modern** (Plus Jakarta Sans).
- **To add a new Google font**, load it in [`src/config/fonts.ts`](src/config/fonts.ts), then add a
  style for it in `font-presets.ts`. Fonts are self-hosted at build time.

## Images

Sellers upload their own product photos, logos and covers in Shop Studio. Until the backend
exists they're stored as blobs in the browser. Products without a photo show a neutral
placeholder; there are no stock or stand-in pictures anywhere.

## Deploying

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md). In short: import the repo in Vercel, keep the
defaults, deploy. No environment variables are required.

## Making changes later

Once the repo is connected to Vercel, **every push to GitHub redeploys the site automatically**.
Pushes to the production branch (this repo's default branch) update the live site; pushes to any
other branch get their own preview URL first. Ways to make a change:

- **Ask Claude Code** (claude.ai/code or the app) in a session on this repo: describe the change,
  it edits, tests and pushes, and Vercel deploys.
- **Edit on GitHub**: open a file, click the pencil, commit. Good for copy and config tweaks
  (brand name in `src/config/brand.ts`, fonts in `src/config/fonts.ts`).
- **Locally**: `pnpm dev`, edit, run `pnpm check`, commit and push.

To regenerate screenshots after a change, start the app (`pnpm build && pnpm start --port 3100`),
create real data once with `node scripts/make-state.mjs http://localhost:3100 screenshots/state`
(two accounts, a shop, products, orders and a message), then run for example
`node scripts/screenshot.mjs http://localhost:3100 screenshots/out /studio,/studio/orders --state=screenshots/state/seller.json`.
