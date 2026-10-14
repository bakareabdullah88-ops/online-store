# Kamplug

A campus marketplace for Nigerian students. Buy from the student brands in your hostel, or open
a shop and sell. One account has two modes, **Buying** and **Selling**, with an animated switch
between them.

Everything runs on a real backend: a Neon Postgres database, sign-in with email and password or
Google, and photos on Cloudflare R2. Anyone can create an account. There is no sample or demo
data: what you see is what people create. Buyers pay sellers on delivery or at pickup; online
payments, password-reset emails and payouts are switched off in
[`src/config/features.ts`](src/config/features.ts) until they're built.

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

You need the backend's settings in `.env.local` first (see [The backend](#the-backend) and
[`.env.example`](.env.example)).

## Scripts

| Command                             | What it does                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server (Turbopack)                                                                                                 |
| `pnpm build` / `pnpm start`         | Production build and server                                                                                            |
| `pnpm build:test`                   | Production build that keeps data in the browser instead of a database, for the end-to-end tests                        |
| `pnpm typecheck`                    | `next typegen` then `tsc --noEmit`                                                                                     |
| `pnpm lint`                         | ESLint, zero warnings allowed                                                                                          |
| `pnpm format` / `pnpm format:check` | Prettier (with Tailwind class sorting)                                                                                 |
| `pnpm test`                         | Vitest unit tests (domain logic and the mock service layer on `fake-indexeddb`)                                        |
| `pnpm test:e2e`                     | Playwright on a Pixel 7 and a 1280px desktop. Builds nothing itself: run `pnpm build:test` first; it starts the server |
| `pnpm check`                        | typecheck + lint + unit tests                                                                                          |

The e2e suite runs the real flow with two fresh accounts (sign up → open a shop → add a product →
second account buys → seller fulfils → buyer sees it paid and messages the shop), the auth gate,
appearance settings, and a **page sweep** of every screen (signed out, new buyer, seller with a
product, dark mode), each checked for axe WCAG 2.1 A/AA violations, horizontal overflow and console
errors.

Point Playwright at an already running server with `PLAYWRIGHT_BASE_URL=http://localhost:3100`.

## Environment

See [`.env.example`](.env.example). Public ones are validated in [`src/env.ts`](src/env.ts).
The backend's settings (database, Google, R2) are secrets: set them in Vercel, never in the code.

| Variable                  | Default                                   | Purpose                                                                      |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| Backend settings          | –                                         | Database, Google sign-in and R2: see [The backend](#the-backend)             |
| `NEXT_PUBLIC_APP_URL`     | Vercel URL, else `http://localhost:$PORT` | The site's address, for sign-in, metadata, OG image and sitemap              |
| `NEXT_PUBLIC_DATA_SOURCE` | `remote`                                  | Tests only: `mock` keeps data in the browser so tests run without a database |

## Project map

```
src/
  app/            routes (thin; compose feature components), metadata routes, error pages
  components/
    ui/           design-system primitives (Button, Field, Chip, Tabs, Sheet, Toaster, …)
    app/          signed-in shell: glass top bar, workspace switch, phone top bar and pill nav, page header
    dash/         dashboard cards and charts (funnel, hatched bars, step line, dot matrices)
    table/        DataTable: filters, search, export, selection, row menus, pagination
    landing/      landing page navigation
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
  services/       typed contracts; mock/ is the service code (runs on the server); remote/ is the browser client
  server/         database, sessions, Google sign-in, photo storage (server only)
  queries/        TanStack Query hooks over the services
  stores/         Zustand: bag, UI prefs, toasts
docs/             DESIGN_ANALYSIS.md, DECISIONS.md, DEPLOY_VERCEL.md
API_CONTRACT.md   every service method and the REST endpoint it maps to
```

`/design-system` is a living style guide of every token and primitive.

## The backend

Kamplug runs on a real, shared backend: everyone sees the same shops,
products, orders and messages. The service code in `src/services/mock` runs on the server
(Next.js route handlers in `src/app/api`, server code in `src/server`) against Postgres. See
[`API_CONTRACT.md`](API_CONTRACT.md) for the routes and rules, and `docs/DECISIONS.md` §14–15 for
how it works and its limits.

| Piece          | Service                    | Variables                                                                                      |
| -------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Database       | Neon Postgres              | `DATABASE_URL`                                                                                 |
| Google sign-in | Better Auth + Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`            |
| Photos         | Cloudflare R2              | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` |
| Site address   | –                          | `NEXT_PUBLIC_APP_URL`                                                                          |

**Turning it on in Vercel** (once):

1. **Project → Settings → Environment Variables**: add each variable above (Production and
   Preview). Don't add `NODE_ENV`; Vercel sets it.
2. **Google Cloud → APIs & Services → Credentials →** your OAuth client: add
   `https://<your domain>/api/auth/callback/google` under **Authorized redirect URIs**, and the
   domain under **Authorized JavaScript origins**. `BETTER_AUTH_URL` must be that same domain.
3. **Cloudflare R2 →** the `kamplug-images` bucket: turn on public access (r2.dev or a custom
   domain) and use that address as `R2_PUBLIC_URL`. The API token needs Object Read & Write on the
   bucket.
4. Redeploy. Tables are created on the first request, with the campus list.

Google sign-in works on the domain registered with Google; preview deployments (with their own
addresses) can still use email and password.

**Locally**: run Postgres (or use a Neon branch), put the same variables in `.env.local` with
`BETTER_AUTH_URL=http://localhost:3000`, and `pnpm dev`. The backend tests need a throwaway
database: `TEST_DATABASE_URL=postgres://… pnpm test` (they wipe it; without it they're skipped).

Search the code for `BACKEND-SEAM` for what's still to come (payments, email, payouts).

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

Sellers upload their own product photos, logos and covers in Shop Studio. With the backend on
they're stored on Cloudflare R2 (or in Postgres if R2 isn't set up) and served from
`/api/media/:id`, shrunk in the browser to at most 2000px first. Products without a photo show a neutral
placeholder; there are no stock or stand-in pictures anywhere.

## Deploying

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md). In short: import the repo in Vercel, keep the
defaults, add the backend's variables (see [The backend](#the-backend)), deploy.

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
(against a `pnpm build:test` build)
(two accounts, a shop, products, orders and a message), then run for example
`node scripts/screenshot.mjs http://localhost:3100 screenshots/out /studio,/studio/orders --state=screenshots/state/seller.json`.
`node scripts/fit-check.mjs http://localhost:3100` visits every page at seven widths and reports
anything wider than the screen.
