# Design analysis

> **Status of the references.** The seven concept images (`design-references/01…07`) were not
> in the repository when this analysis was written. Everything below is derived from the written
> brief, which describes each reference's qualities in some detail. When the images are added,
> revisit each section and log the differences under "Deltas after viewing the images".

## What each reference contributes

### 01 · Product builder / editor
- **Why it works:** dense but calm. Small type (12–13px) is used confidently because spacing
  is strictly on a 4px grid and every control sits in a panel with a hairline border instead of
  a heavy shadow. Segmented controls and tooltips do the work that dropdowns usually do.
- **Take:** panel chrome (1px borders, 8–12px radii, tight 8px internal rhythm), segmented
  controls with a sliding pill, mono labels for values, tooltips on icon-only actions.
- **Leave:** tool-like density on consumer screens. Panels belong in Shop Studio, not the market.

### 02 · Dashboard
- **Why it works:** white cards on a soft grey canvas create depth without shadows. A single
  confident accent is reserved for *one* thing per chart (the highlighted bar), so the eye knows
  where to look. Tables are tidy because numbers are right-aligned in a tabular face and status
  is carried by small pills, not by row colour.
- **Take:** cards-on-canvas, one highlighted bar, tabular figures, status pills, a
  setup-progress card ("6 of 7 steps") that turns onboarding into a to-do list.
- **Leave:** the generic "SaaS" icon-in-a-circle KPI tiles. Our KPIs lead with the number in
  mono, with a sparkline and a period delta, and no decorative icon.

### 03 · Mobile flows
- **Why it works:** thumb-first. Primary actions live in a sticky bottom bar; navigation is a
  five-item tab bar; pickers (size, colour) are large chips; quantity steppers are 44px targets.
  The order-tracking map turns waiting into something to watch.
- **Take:** bottom tab bar, sticky add-to-bag bar, chip pickers, steppers, payment-card
  carousel, map card with moving marker.
- **Leave:** nothing. Mobile is the primary platform for our users.

### 04 · Bag
- **Why it works:** line items have one image, a two-line title, the variant in small caps
  and the price aligned right. Totals sit in a quiet summary block with the grand total set
  larger. Nothing competes with the checkout button.
- **Take:** that hierarchy, plus our twist: the bag is **grouped by brand** (each brand
  becomes its own order, like Chowdeck vendors) with per-brand fulfilment choice.

### 05 · Product detail
- **Why it works:** photography gets ~60% of the viewport; the information column is narrow
  (~420px) so the line length stays readable; price is set in the display face.
- **Take:** big gallery, narrow info column, display-serif price, accordion-style details.

### 06 · Store home
- **Why it works:** a warm editorial feel. Cream and sand surfaces instead of white, black
  primary buttons, a refined serif for headlines, tiny uppercase mono labels as section
  "eyebrows", generous product photography with lots of air.
- **Take:** this is the soul of the marketplace side of Kiosk.

### 07 · Landing
- **Why it works:** an editorial hero with real typographic contrast (very large serif against
  small mono), asymmetric composition, and restraint: one image moment, not five.
- **Take:** asymmetric hero, numbered "how it works", a seller call-to-action with a different
  surface tone.

## Synthesis → the Kiosk identity

| Dimension | Decision |
| --- | --- |
| **Surfaces** | Warm paper (`canvas` cream) for the market, a cooler bone-grey canvas for Studio so the two modes feel like different rooms of one building. Cards are `surface` with a hairline `line` border; shadows are reserved for floating layers (sheets, popovers, the bag drawer). |
| **Ink** | Near-black warm ink (`#1B1814`) for text and primary buttons. Never pure black. |
| **Accent (Buying)** | *Ember*: a warm vermilion. Used for the active indicator, badges, the bag count, sale prices and the highlighted chart bar. Never for large fills. |
| **Accent (Selling)** | *Studio green*: a deep bottle green. It takes over every accent role when Selling mode is on, so the switch is legible from colour alone (and from the label, for colour-blind users). |
| **Type** | Instrument Serif for display (headlines, prices on product pages, big numbers in hero moments); Geist for UI text; Geist Mono for eyebrows, labels, figures and status pills. |
| **Rhythm** | 4px base grid. Section spacing on mobile 48/64px, desktop 96/128px. Tight internals, generous gutters. |
| **Radii** | Small and varied on purpose: 6px controls, 10px cards, 16px sheets, full pills for chips. We avoid "everything is a 16px rounded card". |
| **Layout** | Editorial asymmetry: 7/5 and 8/4 splits, oversized section numbers, mixed card sizes in feature rails, and an occasional full-bleed band. |
| **Imagery** | Product art is generated, cohesive SVG compositions (tonal gradients, simple object silhouettes, patterns) tinted from a curated warm palette, so the catalogue looks art-directed even without photos. Real photos drop into `/public/seed/`. |
| **Motion** | Springs for movement, tween only for opacity. Two signature moments: the **Buying ↔ Selling switch** (accent sweep, nav morph, content crossfade) and **fly-to-bag** (product thumbnail arcs into the bag; the badge springs). |

## Things we explicitly avoid
- Purple-to-blue gradients, gradient blobs, glassmorphism.
- Emoji as icons, icon-in-a-circle feature grids.
- Uniform card grids with no hierarchy. Rails mix a large "lead" item with smaller ones.
- Stock-photo hero sections. Our hero is type plus one composed product still life.

## Usability over reference fidelity
- **Contrast:** cream backgrounds lower contrast, so muted text is darkened to `#5F574D`
  (≥ 5.5:1 on canvas) rather than the pale taupe the mood suggests.
- **Small mono labels** are never below 11px and always ≥ 4.5:1.
- **Tap targets:** reference mobile chips look ~32px tall; ours are 40px with 44px hit areas.

## Deltas after viewing the images
_To be filled in once the images are added._
