# Decisions

Every dependency, architectural choice and deviation from the brief, with the reason.

## 1. Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 16.4** (App Router, Turbopack) | Current stable. Static shells, route-level code splitting, Metadata API and `opengraph-image` out of the box; deploys to Vercel with zero config. |
| Rendering | `cacheComponents` + `partialPrefetching` (framework defaults for new apps) | Static App Shells are prerendered and prefetched, so navigations feel instant. All data is client-side (IndexedDB), so data UI lives below `<Suspense>`/query boundaries. Back/forward keeps page state via React `<Activity>`, which restores Explore filters and scroll position for free. |
| Language | TypeScript 5.9, `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes: false` | Brief requirement. TS 7 (native) was skipped because Next's type plugin targets 5.x. |
| Styling | **Tailwind CSS v4** with tokens declared in CSS (`@theme inline`) | Tokens live once, as CSS variables, and Tailwind utilities read them. Theme and mode switches are a variable swap with no class churn. |
| Headless primitives | **`radix-ui`** (unified package) | Accessible dialogs, popovers, tooltips, tabs, selects, sliders, dropdowns, switches. Unstyled, so every pixel is ours. |
| Motion | **`motion`** (v14, `motion/react`) | Springs, `layoutId` shared layouts, `AnimatePresence`, gestures (swipe to remove, drag), `useReducedMotion`. |
| Route transitions | **React `<ViewTransition>`** (React 19.3, built into the App Router) | See §4. Motion handles in-page and component motion; the platform handles cross-route morphs. |
| Server state | **TanStack Query v5** | Caching, optimistic updates, invalidation, loading and error states over the async service layer. |
| Client state | **Zustand v5** (`persist` to `localStorage`) | Bag, mode memory, UI prefs (recent searches, explore view). No server data is ever copied into Zustand. |
| Forms | **React Hook Form + Zod v4** (`@hookform/resolvers`) | Typed schemas shared between form validation and the service layer's input validation. |
| Command palette | **cmdk** | Accessible combobox semantics and fuzzy filtering; we style it fully. |
| Mobile sheets | **vaul** | Native-feeling drag-to-dismiss bottom sheets with snap points, built on Radix Dialog (focus trap and restore). |
| Drag and drop | **@dnd-kit** (`core`, `sortable`, `utilities`) | Kanban columns and image reordering; keyboard sensors for accessibility. |
| Theming | **Own 80-line provider** (`components/providers/theme.tsx`) instead of `next-themes` | `next-themes` renders its boot `<script>` from a client component, which React 19.2+ warns about in the console ("Encountered a script tag…"), and the brief forbids console warnings. Ours inlines the boot script in the server layout (no flash, also sets `data-mode` before paint) and exposes the same `light / dark / system` API via `useSyncExternalStore`. |
| Persistence | **idb-keyval** | A tiny (≈600B) promise wrapper over IndexedDB. Dexie's query engine isn't needed at this data size. Two stores: `kiosk-db/kv` for collections and `kiosk-media/blobs` for uploaded images. |
| Icons | **lucide-react** | One consistent 1.5px-stroke set, tree-shaken per icon. |
| Class merging | `clsx` + `tailwind-merge` | Variant APIs on primitives without class conflicts. |
| Unit tests | **Vitest 5** + jsdom + `fake-indexeddb` (native `tsconfigPaths`) | Fast, ESM-native, runs the real service layer against an in-memory IndexedDB. |
| E2E | **Playwright 1.56** | Pinned to match the pre-installed Chromium build in the dev container. |
| Lint/format | ESLint 9 (flat, `eslint-config-next`), Prettier + `prettier-plugin-tailwindcss` | Standard Next tooling; class sorting keeps diffs readable. |

**Not added:** a UI kit (shadcn, MUI, Chakra), a date library (`Intl` covers it), a chart
library (charts are hand-built SVG, so they match the system exactly and cost ~3KB), or
lodash.

## 2. Fonts

`next/font/google` self-hosts at build time, with no layout shift and no runtime request to Google.

- **Instrument Serif** for display. A high-contrast, slightly condensed serif. The narrow set
  fits big editorial headlines on a 360px screen without hyphenation, and its italic gives us a
  second voice for emphasis. Fraunces was the alternative; its soft "wonky" optical axis reads
  as playful-craft, which is less premium than we want. Instrument Serif ships one weight, which
  enforces restraint: display only, never body.
- **Geist** for UI: neutral, very legible at 13–15px, tabular figures available.
- **Geist Mono** for eyebrows, labels, prices in tables, order codes and status pills. Gives
  the "receipt / label maker" texture that suits a campus marketplace.

## 3. Architecture

```
src/
  app/                     routes (thin: compose feature components)
  components/
    ui/                    design-system primitives (Button, Input, Chip, Tabs, Sheet, …)
    shell/                 header, tab bar, mode switch, bag drawer, command palette, toasts
    art/                   generated product/brand art + empty-state illustrations (SVG)
    market/                marketplace features (cards, rails, filters, gallery, …)
    checkout/ orders/      bag, checkout, tracking
    account/               buyer dashboard
    studio/                seller dashboard
  config/                  brand.ts (product name lives ONLY here), categories, nav
  design/                  typed tokens (motion springs, durations, z-index) mirroring CSS
  domain/                  pure business logic: money, bag math, promos, order state machine
  services/
    types.ts               entity + DTO types (the API contract in code)
    contracts.ts           service interfaces
    index.ts               picks the implementation from NEXT_PUBLIC_DATA_SOURCE
    mock/                  IndexedDB-backed repositories, seed, latency simulation
    remote/                stub that throws "not implemented"
  queries/                 TanStack Query hooks (the only bridge from UI to services)
  stores/                  Zustand stores (bag, prefs, mode memory)
  lib/                     utilities (cn, format, ids, hash, object URLs)
  env.ts                   Zod-validated public env
```

**Rules:**
1. UI imports from `@/queries/*` (and `@/domain/*` for pure helpers), never from
   `@/services/mock/*` or seed data.
2. Services are async, validate input with Zod, and throw typed `ServiceError`s
   (`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION`, `CONFLICT`).
3. `domain/` is framework-free and fully unit tested.
4. `// BACKEND-SEAM:` marks every place a real backend plugs in.

### Account model
- One `User`. `user.brandIds` is an array (one brand in v1, many later).
- **Mode is derived from the route**: `/studio/**` is Selling, everything else is Buying. The
  switch navigates and remembers the last path on each side (Zustand). This removes a whole
  class of "selling mode but marketplace page" inconsistencies and makes deep links honest.
  The `<html data-mode>` attribute drives the accent swap.
- Sellers cannot buy their own products. Enforced in `domain/bag.ts` (UI shows a friendly
  block) **and** in `createOrders` (service rejects with `FORBIDDEN`).

## 4. Motion architecture

- **Spring presets** (`design/motion.ts`): `snappy` (micro: toggles, chips), `smooth`
  (sheets, drawers, layout), `bouncy` (badge pops, success), `gentle` (large surfaces, the
  mode curtain). Durations: micro 160ms, base 240ms, transition 360ms, hero ≤ 600ms.
- **Component motion** uses Motion: `layoutId` for indicators (tabs, chips, segmented
  controls, mode switch pill, bottom tab bar), `AnimatePresence` for lists, sheets and
  toasts, `drag` for swipe-to-remove, and `useSpring` for number tickers.
- **Route-level transitions and cross-route shared elements** use React's `<ViewTransition>`.
  *Deviation from the brief:* the brief asks for Motion `layoutId` for card→page morphs. In
  the App Router the previous page is detached (hidden by Activity) when the new one commits,
  so Motion cannot measure both ends reliably. That is the classic "AnimatePresence + App
  Router" problem, which needs a frozen-router hack built on private Next internals. React's `<ViewTransition name>`
  is the supported mechanism. It runs on the compositor (transform/opacity snapshots), keeps
  60fps on low-end Android, and degrades to an instant swap where unsupported. Same-tree
  morphs (order card → order drawer in Studio, product card → quick view) still use `layoutId`.
- **Reduced motion:** `<MotionConfig reducedMotion="user">` globally, plus CSS that zeroes
  view-transition durations. Every animated component has a fade-only path.

## 5. Data layer

- **Repositories**: in memory, hydrated from IndexedDB on first access, written through on
  change. Schema version stored under `meta:version`; `migrate()` runs ordered steps.
- **Seeding**: on first run (or after "Reset demo data"), deterministic seed data is
  generated from a fixed PRNG seed, so every visitor gets identical content.
- **Latency**: every service call waits 300–900ms (`MOCK_LATENCY`, shorter under tests),
  so loading states are real and designed.
- **Images**: uploads are stored as `Blob`s in `kiosk-media`; `useObjectUrl` creates and
  revokes object URLs. Seed images are `ImageRef { kind: "art" }` and render as generated SVG
  art; `{ kind: "url" }` is for files dropped in `/public/seed/`.
- **Money**: integer kobo everywhere; `formatNaira()` uses `Intl.NumberFormat("en-NG")`.
- **Orders** progress through a pure state machine (`domain/orders.ts`). Buyer orders to
  seeded brands auto-advance on a timer schedule computed from `placedAt`, so tracking is live
  and survives reloads. Orders received by the user's own brand are advanced manually in Studio.
- **Auth**: demo only. Passwords hashed with PBKDF2-SHA-256 (Web Crypto, 100k iterations,
  random salt). The session id is stored in IndexedDB. Labelled as demo everywhere.

### Entities
`Campus` (zones, pickup points) · `User` · `Session` · `Brand` · `Product` (options,
variants with stock) · `Review` (+ seller reply) · `Order` (items, fulfilment, payment,
timeline) · `Promo` (platform or brand scoped) · `Notification` · `Thread` (messages) ·
`WalletTransaction` · `SavedPlace` · `Payout` · `BrandMetric` (daily views / add-to-bag /
orders / revenue).

## 6. Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/login`, `/signup`, `/forgot-password`, `/welcome` | Auth + onboarding |
| `/explore` | Browse with filters (URL-persisted) |
| `/search?q=` | Search results |
| `/brands/[handle]` | Brand page |
| `/products/[slug]` | Product page |
| `/bag`, `/checkout`, `/checkout/success` | Bag and checkout |
| `/orders`, `/orders/[id]` | Orders + live tracking |
| `/wishlist`, `/notifications`, `/messages` | Shared buyer surfaces |
| `/account/**` | Buyer dashboard (overview, orders, saved, following, places, wallet, messages, reviews, settings) |
| `/open-shop` | Shop onboarding wizard |
| `/studio/**` | Shop Studio (overview, products, orders, customers, reviews, promotions, analytics, brand, payouts) |
| `/design-system` | Living style guide |
| `/offline` | Offline fallback |

## 7. Deviations and judgement calls
- **Reference images missing** at bootstrap. See `DESIGN_ANALYSIS.md`.
- **`<ViewTransition>` instead of `layoutId` for cross-route morphs.** See §4.
- **Mode derived from the route** instead of free-floating state. See §3.
- **Offline detection** uses `online`/`offline` events directly instead of Next's
  `experimental.useOffline`, so the build prints no experimental-feature notices.
- **Tap targets** are 44px even where references look tighter (usability over fidelity).
