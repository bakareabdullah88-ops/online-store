# Polish audit

A refinement pass over Kamplug, plus the changes asked for directly: simpler
dashboards with the money figure on top, a sidebar menu on phones instead of the
bottom bar, a messages button in the top bar, Discover alignment, a smaller
cover editor, and the landing visuals brought back in a simpler form.

Screenshots: `audit/before/` and `audit/after/`, full page, 390px and 1440px,
plus dark mode for the landing page, buyer home and shop home. `after/` also has
the phone menu open (`menu-open-*.jpg`). Made with `scripts/make-state.mjs` and
`scripts/screenshot.mjs` against the test build (`pnpm build:test`).

## Problems found, by visual impact

| #   | Problem                                                                                                                                                                                              | Where                                                                                                               | Fix                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Dashboards had too much going on: four stat cards, a funnel, gross volume, a gradient "insight" card and dot charts, all of the same weight. The number that matters wasn't the first thing you saw. | `studio/performance.tsx`, `account/home.tsx`                                                                        | One headline panel per dashboard (`dash/hero.tsx`): revenue for a shop, spending for a buyer, with change, three supporting figures and a quiet area chart. Then what needs doing and what's selling. Funnel, busiest days and repeat buyers moved to Analytics (`studio/trends.tsx`). |
| 2   | Phone bottom tab bar overlapped content and duplicated the top bar                                                                                                                                   | `app/mobile-nav.tsx`                                                                                                | Removed. A standard left sidebar (`app/mobile-sidebar.tsx`) opens from a menu button in the top bar, with the workspace switch, every section, badges and the main action.                                                                                                             |
| 3   | No way to see new messages from the top bar                                                                                                                                                          | `app/top-nav.tsx`, `app/mobile-top-bar.tsx`                                                                         | `app/messages-button.tsx`: a messages icon with an unread count (buyer and shop inboxes) on desktop and phones.                                                                                                                                                                        |
| 4   | Shop cover editor took the full width at 16:6, about 420px tall on desktop                                                                                                                           | `studio/brand-settings.tsx`                                                                                         | Logo and cover side by side, cover capped at 448px wide, visible "Change logo" and "Change cover" buttons (hover-only did not work on touch).                                                                                                                                          |
| 5   | Discover sidebar and results started at different heights, with an empty band above the results                                                                                                      | `market/explore/explore-view.tsx`                                                                                   | On large screens the page title and count sit at the top of the results column, level with the sidebar. "Results" heading and filler line removed.                                                                                                                                     |
| 6   | Landing page lost its product illustrations and motion in an earlier pass                                                                                                                            | `app/(site)/page.tsx`                                                                                               | Brought back, simpler: an animated drawing of Shop Studio (an order slides in and is accepted, revenue updates), and drawn feature rows. No gradients, no cursor, no spring bounce. Labelled as examples.                                                                              |
| 7   | Gradients used as decoration                                                                                                                                                                         | `dash/insight.tsx`, `messages/conversation.tsx`, `studio/finance.tsx`, `dash/funnel-chart.tsx`, `(auth)/layout.tsx` | Insight card deleted. Others flattened to a single tint or removed. Chart area fills keep a light single-colour fade.                                                                                                                                                                  |
| 8   | Competing accent colours on the landing page (hard-coded blue CTA, mint buttons)                                                                                                                     | `app/(site)/page.tsx`, `landing/nav.tsx`                                                                            | Uses the accent token for the main CTA and primary (black) for nav buttons.                                                                                                                                                                                                            |
| 9   | Radius scale too round and inconsistent (12/16/20/24/28px plus hard-coded values)                                                                                                                    | `globals.css`, `design/tokens.ts`                                                                                   | Tightened: 6, 8, 10, 12, 16, 20. Hard-coded `rounded-[Npx]` replaced with tokens.                                                                                                                                                                                                      |
| 10  | Shadows too heavy and too many levels                                                                                                                                                                | `globals.css`                                                                                                       | md and lg lighter, xl now equals lg. Scrolled-header shadow removed (it already has a border).                                                                                                                                                                                         |
| 11  | Bouncy motion                                                                                                                                                                                        | `design/motion.ts`                                                                                                  | The `bouncy` spring now settles with barely any overshoot. Press scale 0.94 → 0.97. Logo no longer rotates on hover. Draft reply card no longer blurs in.                                                                                                                              |
| 12  | Task list showed every task, mostly "All clear", with a spinning ring                                                                                                                                | `dash/todo.tsx`                                                                                                     | Lists only open tasks with counts, and "All caught up" when there are none. "Get started" stays a checklist. Static ring.                                                                                                                                                              |
| 13  | Emoji and exclamation marks in UI text                                                                                                                                                               | `lib/greeting.ts`, `studio/analytics.tsx`, `domain/orders.ts`, `services/mock/notify.ts`, `studio/orders-board.tsx` | Removed.                                                                                                                                                                                                                                                                               |
| 14  | Save button floated with a large shadow over the form                                                                                                                                                | `studio/brand-settings.tsx`                                                                                         | A sticky save bar with a hairline border at the bottom of the viewport.                                                                                                                                                                                                                |
| 15  | Date range control drew a box inside a box on phones                                                                                                                                                 | `dash/date-range.tsx`                                                                                               | Outer frame only from tablet width up.                                                                                                                                                                                                                                                 |

## Fixed bugs (reported separately)

- Discover: a search lost its "Brands" matches while the header was being moved; restored below the active filters.
- e2e: the shop-flow test looked for a "Performance" heading and a "Gross volume" label that no longer exist; it now checks the shop name, the revenue figure and the sold product.

## Left alone, on purpose

- Spinners inside buttons while saving. They show a real pending state and are small.
- Skeleton shimmer. It matches the layout it stands in for.
- Celebration ribbons when a shop opens. A one-off moment the user asked for earlier.
- The yellow "Add to bag" button on Discover. It's a deliberate buy colour used only there.
- Chart colours on Analytics. They're data colours, not decoration.

## Would need a real redesign (not done)

- Product rows on Discover are tall on desktop when photos are missing. A denser grid view would suit large screens.
- The shop setup strip and the "Needs your attention" list overlap in purpose. Merging them into one "Next steps" list would remove another panel.
- Landing page benefits and FAQ are still card grids. A plainer two-column layout would read faster.

## Checks

- `pnpm tsc --noEmit`, `pnpm lint`: clean.
- `pnpm test`: 68 passed (unit and server, against Postgres).
- `pnpm build:test`, then `pnpm playwright test`: 14 passed (phone and desktop, including the accessibility sweep and dark mode).
- Screenshot runs: no console errors or warnings on any page.

## Round 2: identity, landing, usability (15 Oct)

### Identity

- One brand colour, campus green (`#0E7A4F`, `#3DD68C` on dark). It replaces the blue, lavender and purple accents in both modes.
- The Plug K mark (a K whose arm ends in a plug) and a lowercase `kamplug` wordmark with "plug" in green.
- The mark is used in the header, favicon, app icons and the link-share image.
- Voice: "friendly plug". Copy is plain and warm, with no exclamation marks or emoji.

### Landing and login

- **Navbar:** floating liquid-glass. Its blur never applied before: the build kept only the Safari spelling of the property. Fixed for every glass surface.
- **Hero:** drawn products float around the headline in their own colours, following the pointer and drifting on scroll.
- **Below the hero:**
  - the Studio preview tilts into place;
  - a campus marquee;
  - feature drawings that play;
  - steps that fill in as you scroll;
  - an FAQ;
  - a green closing panel.
- **Section layout:** each section has its own label and background.
- **Phone menu:** closes on a tap outside it or on Escape.
- **Phone hero buttons:** both on one line, with "Open a shop" the shorter one.
- **Login and sign-up:** a green, animated brand panel replaces the empty dark half.

### Fixed bugs

- **New product form kept the previous product's details.** Next.js keeps recently visited pages alive in the background, so the "new" form was the old one. It now resets after publishing and when you leave without changes, and offers "Keep editing / Start fresh" otherwise.
- **The newest chat messages stayed blurred.** They animated in from a blur that was never cleared.
- **The phone menu's footer button sat on the bottom edge.** The safe-area padding replaced the normal padding.
- **Checkout Back showed an endless skeleton.** The success page said "We couldn't find that checkout" until a refetch finished.

### Usability (selected)

- **Selling:**
  - "Publish & add another", Duplicate, a visible stock field, quick "Edit stock" and "Mark sold out".
  - One save model, and a warning before leaving with unsaved changes.
  - Decline and cancel ask first, with a reason.
  - Call, WhatsApp and Message actions on an order; bulk accept with one summary toast.
- **Buying:**
  - Saved places at checkout and "Save this address".
  - Payment shown per order (on delivery or at pickup), and a clear reason when "Place order" is unavailable.
  - Star-only reviews.
  - Reorder can't add the items twice.
  - Messages keep your text if sending fails, Enter adds a new line on phones, and drafts survive switching chats.
- **Less noise:**
  - The phone header is down to the menu, logo, messages, alerts, bag and account; search and the buying/selling switch moved into the menu.
  - A one-line greeting.
  - Instant switching between buying and selling, with no colour burst and no arrival pop-up.
  - Shop set-up shows progress and the next step.

### Layout checker

`scripts/audit-layout.mjs` loads every main page at 360, 390, 430, 768, 1280 and 1440px, in light and dark, as a visitor, buyer and seller. It reports:

- sideways scrolling
- elements sticking out of the screen
- overlapping controls
- tap targets under 32px

| Run | Findings |
|-----|----------|
| First run | 323 (299 small tap targets, 24 overlaps, all from the show-password button sitting inside its field by design). No sideways scrolling or clipped elements anywhere. |
| After the fixes | Recorded in `audit/layout-report.json`. |

The main fix was the phone header, where icons were squeezed to 29px.
