# Kamplug

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

### Invite-only access

Kamplug is invite-only. Sign-up is closed and only people on the list in
[`src/config/access.ts`](src/config/access.ts) can log in. The list stores a SHA-256 of each
email and a PBKDF2 hash of each password, never the address or password itself.

To let someone in:

1. Log in as an admin and open **More → Members** (or `/account/members`), enter their name and
   email, and choose **Create login**. You get a generated password, a ready-to-send message, and
   an entry for the list. (Or run `node scripts/add-member.mjs "Full Name" email@example.com`.)
2. Add the entry to `accessList` in `src/config/access.ts` (ask Claude, or edit the file on
   GitHub) and push. Vercel redeploys in about a minute and the login works.
3. Send them their email and password privately.

To remove someone, delete their entry and push; they are signed out on their next visit.

For local development and the end-to-end tests, set `NEXT_PUBLIC_OPEN_SIGNUP=1` to let anyone
sign up (`pnpm build:open` does this for a production build, with sample data off).

Until the backend is connected, each person's shop, orders and messages are saved in their own
browser, so two people on different phones won't see each other's shops yet.

### Sample data (preview)

While Kamplug is being built, the app ships with **sample data**: twenty student shops with photos,
reviews and five months of orders, plus a shared **preview account** (Temi, who shops around and
runs Àdìrẹ Lab). Anyone who opens the app without logging in looks around as Temi, no sign-up
needed, and a notice at the top of every page says the app is still being built.

- The data lives in [`src/services/mock/seed/sample.ts`](src/services/mock/seed/sample.ts) and the
  photos in `public/seed/`. Every sample id contains `_demo_`, so it can be found in one pass.
- It is rebuilt every few days so dates stay current; that also resets whatever visitors did in
  the preview. Real accounts keep everything they made.
- **To remove it:** set `NEXT_PUBLIC_SAMPLE_DATA=0` in Vercel and redeploy. Each browser drops the
  sample data on its next visit, and the landing page goes back to invite-only wording. Then
  delete `sample.ts`, `sample-sync.ts`, `public/seed/` and the code marked `SAMPLE DATA`.

## Scripts

| Command                             | What it does                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                          | Dev server (Turbopack)                                                                                                 |
| `pnpm build` / `pnpm start`         | Production build and server                                                                                            |
| `pnpm build:open`                   | Production build with open sign-up, for the end-to-end tests                                                           |
| `pnpm typecheck`                    | `next typegen` then `tsc --noEmit`                                                                                     |
| `pnpm lint`                         | ESLint, zero warnings allowed                                                                                          |
| `pnpm format` / `pnpm format:check` | Prettier (with Tailwind class sorting)                                                                                 |
| `pnpm test`                         | Vitest unit tests (domain logic and the mock service layer on `fake-indexeddb`)                                        |
| `pnpm test:e2e`                     | Playwright on a Pixel 7 and a 1280px desktop. Builds nothing itself: run `pnpm build:open` first; it starts the server |
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

| Variable                   | Default                                   | Purpose                                                                       |
| -------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_DATA_SOURCE`  | `mock`                                    | `mock` (each browser on its own) or `remote` (the shared backend)             |
| `DATABASE_URL`             | –                                         | Postgres connection string, needed with `remote`. Set by the Neon integration |
| `NEXT_PUBLIC_SITE_URL`     | Vercel URL, else `http://localhost:$PORT` | Canonical URL for metadata, OG image and sitemap                              |
| `NEXT_PUBLIC_MOCK_LATENCY` | `900`                                     | Upper bound (ms) of simulated network latency in the mock. `0` turns it off   |

## Project map

```
src/
  app/            routes (thin; compose feature components), metadata routes, error pages
  components/
    ui/           design-system primitives (Button, Field, Chip, Tabs, Sheet, Toaster, …)
    app/          signed-in shell: glass top bar, workspace switch, phone top bar and pill nav, page header
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

## The backend

With a database connected, Kamplug runs on a real, shared backend: everyone sees the same shops,
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
4. Redeploy. The backend switches on because `DATABASE_URL` is set. Tables are created on the
   first request, then the campus list and (while it's on) the sample data.

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
`/api/media/:id`, shrunk in the browser to at most 2000px first. In `mock` mode they stay in the
browser. Products without a photo show a neutral
placeholder; there are no stock or stand-in pictures anywhere.

## Deploying

See [`docs/DEPLOY_VERCEL.md`](docs/DEPLOY_VERCEL.md). In short: import the repo in Vercel, keep the
defaults, deploy. With no environment variables it runs in `mock` mode; to share one database
between everyone, add the backend's variables (see [The backend](#the-backend)).

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
(against a `pnpm build:open` build)
(two accounts, a shop, products, orders and a message), then run for example
`node scripts/screenshot.mjs http://localhost:3100 screenshots/out /studio,/studio/orders --state=screenshots/state/seller.json`.
`node scripts/fit-check.mjs http://localhost:3100` visits every page at seven widths and reports
anything wider than the screen.
