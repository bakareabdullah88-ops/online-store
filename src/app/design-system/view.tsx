"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Bell, Heart, MoreHorizontal, Pencil, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip, ChipGroup, ChipOption } from "@/components/ui/chip";
import { Checkbox, RadioCards, RangeSlider, Switch } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, PasswordInput, SearchInput, Textarea } from "@/components/ui/input";
import {
  Avatar,
  CountBadge,
  Eyebrow,
  Kbd,
  NumberTicker,
  Pill,
  Price,
  ProgressBar,
  QuantityStepper,
  RatingInput,
  Stars,
} from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, Popover, Select, Tooltip } from "@/components/ui/overlay";
import { Dialog, ResponsiveSheet } from "@/components/ui/sheet";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { SegmentedControl, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppImage } from "@/components/ui/app-image";
import { Illustration, type IllustrationName } from "@/components/art/illustrations";
import { useTheme } from "@/components/providers/theme";
import { spring, type SpringName } from "@/design/motion";
import { artPalettes, type ArtPalette } from "@/design/tokens";
import { formatNaira } from "@/domain/money";
import { brand } from "@/config/brand";
import { toast } from "@/stores/toast";
import type { ArtMotif } from "@/services/types";
import { cn } from "@/lib/cn";

const colorGroups: { title: string; tokens: string[] }[] = [
  { title: "Surfaces", tokens: ["canvas", "canvas-sunk", "surface", "surface-2", "sand", "line", "line-strong"] },
  { title: "Ink", tokens: ["ink", "ink-2", "muted", "faint", "primary", "on-primary"] },
  { title: "Accent (mode-aware)", tokens: ["accent", "accent-hover", "accent-soft", "accent-ink", "on-accent", "ember", "studio"] },
  { title: "Semantic", tokens: ["success", "success-soft", "warning", "warning-soft", "danger", "danger-soft", "info", "info-soft"] },
];

const typeScale: { token: string; className: string; sample: string }[] = [
  { token: "display-xl", className: "font-display text-display-xl", sample: "Made on campus" },
  { token: "display-lg", className: "font-display text-display-lg", sample: "Buy from your hallmates" },
  { token: "display-md", className: "font-display text-display-md", sample: "Fresh drops this week" },
  { token: "display-sm", className: "font-display text-display-sm", sample: "Your bag" },
  { token: "title-lg", className: "text-title-lg font-semibold", sample: "Indigo Àdìrẹ Boxy Tee" },
  { token: "title", className: "text-title font-semibold", sample: "Delivery to Moremi Hall" },
  { token: "body-lg", className: "text-body-lg", sample: "Hand-dyed in small batches in Akoka, so no two pieces are the same." },
  { token: "body", className: "text-body", sample: "Orders before 2pm arrive hot for lunch." },
  { token: "small", className: "text-small text-muted", sample: "Ships from UNILAG · usually ready in 90 min" },
  { token: "label", className: "eyebrow text-muted", sample: "New this week" },
];

const motifs: ArtMotif[] = [
  "tee", "dress", "cap", "jacket", "sneaker", "tote", "bowl", "jar", "cookie", "drink", "bottle", "dropper",
  "tube", "bracelet", "earring", "poster", "sticker", "card", "earbuds", "case", "cable", "book", "candle",
];

const radii = [
  ["xs", "rounded-xs"],
  ["sm", "rounded-sm"],
  ["md", "rounded-md"],
  ["lg", "rounded-lg"],
  ["xl", "rounded-xl"],
  ["2xl", "rounded-2xl"],
] as const;

const shadows = [
  ["xs", "shadow-xs"],
  ["sm", "shadow-sm"],
  ["md", "shadow-md"],
  ["lg", "shadow-lg"],
  ["xl", "shadow-xl"],
] as const;

const illustrations: IllustrationName[] = [
  "bag", "orders", "wishlist", "search", "notifications", "messages", "products", "offline", "error", "lost",
  "following", "reviews", "wallet", "places", "customers", "promos",
];

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-12 md:py-16">
      <div className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-12">
        <div>
          <Eyebrow>{kicker}</Eyebrow>
          <h2 className="mt-2 font-display text-display-sm">{title}</h2>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-11 shrink-0 rounded-md shadow-[inset_0_0_0_1px_var(--line)]" style={{ background: `var(--${token})` }} />
      <span className="min-w-0">
        <span className="block text-small font-medium">{token}</span>
        <span className="block font-mono text-label text-muted">--{token}</span>
      </span>
    </div>
  );
}

function SpringDemo({ name }: { name: SpringName }) {
  const [on, setOn] = useState(false);
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="group flex w-full items-center gap-4 rounded-md bg-surface p-3 text-left hairline hover:bg-surface-2"
      aria-label={`Play the ${name} spring`}
    >
      <span className={cn("flex h-10 flex-1 rounded-sm bg-canvas-sunk p-1", on ? "justify-end" : "justify-start")}>
        <motion.span layout={!reduce} className="block size-8 rounded-sm bg-accent" transition={spring[name]} />
      </span>
      <span className="w-28 shrink-0">
        <span className="block text-small font-medium">{name}</span>
        <span className="block font-mono text-label text-muted">
          k{spring[name].stiffness} · d{spring[name].damping}
        </span>
      </span>
    </button>
  );
}

export function DesignSystemView() {
  const { preference, setPreference } = useTheme();
  const [mode, setMode] = useState<"buying" | "selling">("buying");
  const [chips, setChips] = useState<string[]>(["thrift"]);
  const [chip, setChip] = useState("all");
  const [tab, setTab] = useState("products");
  const [pillTab, setPillTab] = useState("week");
  const [seg, setSeg] = useState<"grid" | "list">("grid");
  const [sw, setSw] = useState(true);
  const [cb, setCb] = useState(true);
  const [radio, setRadio] = useState<"pickup" | "delivery">("delivery");
  const [range, setRange] = useState<[number, number]>([2000, 18000]);
  const [select, setSelect] = useState<string | undefined>("unilag");
  const [qty, setQty] = useState(2);
  const [rating, setRating] = useState(4);
  const [total, setTotal] = useState(1_250_000);
  const [dialog, setDialog] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [search, setSearch] = useState("jollof");
  const [badge, setBadge] = useState(3);
  const [palette, setPalette] = useState<ArtPalette>("clay");

  const nav = [
    ["color", "Colour"],
    ["type", "Type"],
    ["space", "Space & elevation"],
    ["motion", "Motion"],
    ["buttons", "Buttons"],
    ["forms", "Forms"],
    ["selection", "Selection"],
    ["overlays", "Overlays"],
    ["feedback", "Feedback"],
    ["data", "Commerce"],
    ["imagery", "Imagery"],
    ["empty", "Empty states"],
  ] as const;

  return (
    <div data-mode={mode} className="min-h-dvh bg-canvas text-ink">
      <header className="sticky top-0 z-(--z-header) border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-title-lg">{brand.name}</span>
            <span className="eyebrow hidden text-muted sm:inline">Design system</span>
          </div>
          <div className="flex items-center gap-2">
            <SegmentedControl
              size="sm"
              label="Preview mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: "buying", label: "Buying" },
                { value: "selling", label: "Selling" },
              ]}
            />
            <SegmentedControl
              size="sm"
              label="Theme"
              value={preference}
              onChange={setPreference}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "Auto" },
              ]}
            />
          </div>
        </div>
      </header>

      <div className="container-page">
        <div className="grid gap-8 py-12 md:grid-cols-12 md:py-20">
          <div className="md:col-span-8">
            <Eyebrow>Foundation · v1</Eyebrow>
            <h1 className="mt-3 font-display text-display-lg text-balance">
              A warm, editorial system for a <em className="text-accent">campus</em> marketplace.
            </h1>
          </div>
          <p className="text-body-lg text-muted md:col-span-4 md:self-end">
            Every primitive, every state, in both themes and both modes. Switch the controls above. The accent moves from
            ember to studio green when Selling.
          </p>
        </div>
        <nav aria-label="Sections" className="scrollbar-none -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-4 md:mx-0 md:flex-wrap md:px-0">
          {nav.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="h-9 shrink-0 rounded-full px-3.5 text-small leading-9 text-ink-2 hairline hover:text-ink">
              {label}
            </a>
          ))}
        </nav>

        <Section id="color" kicker="01" title="Colour">
          <div className="grid gap-10">
            {colorGroups.map((g) => (
              <div key={g.title}>
                <h3 className="eyebrow mb-4 text-muted">{g.title}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {g.tokens.map((t) => (
                    <Swatch key={t} token={t} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" kicker="02" title="Type">
          <div className="divide-y divide-line">
            {typeScale.map((t) => (
              <div key={t.token} className="grid gap-2 py-4 md:grid-cols-[120px_1fr] md:items-baseline">
                <span className="font-mono text-label text-muted">{t.token}</span>
                <span className={cn(t.className, "min-w-0 break-words")}>{t.sample}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-small text-muted">
            Instrument Serif (display) · Geist (UI) · Geist Mono (labels & figures:{" "}
            <span className="font-mono text-ink tabular">{formatNaira(1_250_000)}</span>)
          </p>
        </Section>

        <Section id="space" kicker="03" title="Space & elevation">
          <div className="grid gap-10">
            <div>
              <h3 className="eyebrow mb-4 text-muted">Radii</h3>
              <div className="flex flex-wrap items-end gap-4">
                {radii.map(([r, cls]) => (
                  <div key={r} className="text-center">
                    <div className={cn("size-16 bg-sand hairline", cls)} />
                    <span className="mt-2 block font-mono text-label text-muted">{r}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="eyebrow mb-4 text-muted">Elevation</h3>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-5">
                {shadows.map(([s, cls]) => (
                  <div key={s} className={cn("flex h-24 items-end rounded-md bg-surface p-3", cls)}>
                    <span className="font-mono text-label text-muted">shadow-{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="eyebrow mb-4 text-muted">Spacing (4px grid)</h3>
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 6, 8, 12, 16, 24].map((n) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className="w-10 font-mono text-label text-muted">{n * 4}</span>
                    <span className="h-3 rounded-xs bg-accent" style={{ width: n * 4 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="motion" kicker="04" title="Motion">
          <p className="mb-6 max-w-prose text-body text-muted">
            Four springs cover every movement. Tap a row to play it. With reduced motion on, movement is replaced by
            instant state changes and short fades.
          </p>
          <div className="grid gap-3">
            {(Object.keys(spring) as SpringName[]).map((n) => (
              <SpringDemo key={n} name={n} />
            ))}
          </div>
        </Section>

        <Section id="buttons" kicker="05" title="Buttons">
          <div className="grid gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="accent">Accent</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Delete</Button>
              <Button variant="link">Link style</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg" trailingIcon={<ArrowRight className="size-4.5" />}>
                Large
              </Button>
              <Tooltip content="Add product">
                <Button size="icon" variant="secondary" aria-label="Add product">
                  <Plus className="size-5" />
                </Button>
              </Tooltip>
              <Tooltip content="Save to wishlist">
                <Button size="icon-sm" variant="ghost" aria-label="Save to wishlist">
                  <Heart className="size-4.5" />
                </Button>
              </Tooltip>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                loading={loading}
                onClick={() => {
                  setLoading(true);
                  window.setTimeout(() => setLoading(false), 1400);
                }}
              >
                Click to load
              </Button>
              <Button
                variant="secondary"
                success={success}
                onClick={() => {
                  setSuccess(true);
                  window.setTimeout(() => setSuccess(false), 1400);
                }}
              >
                Save changes
              </Button>
              <Button disabled>Disabled</Button>
              <ButtonLink href="#buttons" variant="secondary" leadingIcon={<ShoppingBag className="size-4.5" />}>
                As a link
              </ButtonLink>
            </div>
          </div>
        </Section>

        <Section id="forms" kicker="06" title="Forms">
          <div className="grid max-w-xl gap-5">
            <Field label="Full name" hint="As it appears on your student ID">
              <Input placeholder="Ada Okafor" />
            </Field>
            <Field label="Email" error="Enter a valid email address">
              <Input defaultValue="ada@unilag" type="email" />
            </Field>
            <Field label="Password" aside={<a className="text-small text-muted underline underline-offset-4" href="#forms">Forgot?</a>}>
              <PasswordInput defaultValue="kiosk-demo-1" />
            </Field>
            <Field label="Search">
              <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch("")} placeholder="Search Kiosk" />
            </Field>
            <Field label="Campus">
              <Select
                value={select}
                onValueChange={setSelect}
                placeholder="Choose your campus"
                options={[
                  { value: "unilag", label: "UNILAG", hint: "Akoka" },
                  { value: "ui", label: "UI", hint: "Ibadan" },
                  { value: "oau", label: "OAU", hint: "Ile-Ife" },
                ]}
              />
            </Field>
            <Field label="Bio" optional>
              <Textarea placeholder="What do you sell, and why do students love it?" />
            </Field>
            <Field label="Disabled">
              <Input disabled defaultValue="Can't touch this" />
            </Field>
          </div>
        </Section>

        <Section id="selection" kicker="07" title="Selection">
          <div className="grid gap-8">
            <div>
              <h3 className="eyebrow mb-3 text-muted">Single-select chips</h3>
              <ChipGroup label="Category" value={chip} onChange={setChip} className="flex-wrap">
                {["all", "fashion", "food", "beauty", "tech"].map((c) => (
                  <ChipOption key={c} value={c}>
                    {c[0]?.toUpperCase() + c.slice(1)}
                  </ChipOption>
                ))}
              </ChipGroup>
            </div>
            <div>
              <h3 className="eyebrow mb-3 text-muted">Toggle chips</h3>
              <div className="flex flex-wrap gap-2">
                {["thrift", "under ₦5k", "in stock", "delivery"].map((c, i) => (
                  <Chip
                    key={c}
                    selected={chips.includes(c)}
                    count={[12, 48, 96, 31][i]}
                    onClick={() => setChips((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]))}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList label="Brand sections">
                <TabsTrigger value="products" count={8}>Products</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews" count={24}>Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="products" className="pt-4 text-small text-muted">Product grid goes here.</TabsContent>
              <TabsContent value="about" className="pt-4 text-small text-muted">Brand story goes here.</TabsContent>
              <TabsContent value="reviews" className="pt-4 text-small text-muted">Reviews go here.</TabsContent>
            </Tabs>
            <div className="flex flex-wrap items-center gap-4">
              <Tabs value={pillTab} onValueChange={setPillTab} variant="pill">
                <TabsList label="Period">
                  <TabsTrigger value="week">7 days</TabsTrigger>
                  <TabsTrigger value="month">30 days</TabsTrigger>
                  <TabsTrigger value="quarter">90 days</TabsTrigger>
                </TabsList>
              </Tabs>
              <SegmentedControl
                label="View"
                value={seg}
                onChange={setSeg}
                options={[
                  { value: "grid", label: "Grid" },
                  { value: "list", label: "List" },
                ]}
              />
            </div>
            <div className="grid max-w-md gap-4">
              <Switch checked={sw} onCheckedChange={setSw} label="Vacation mode" description="Pause orders without hiding your shop." />
              <Checkbox checked={cb} onCheckedChange={setCb} label="In stock only" />
              <Checkbox checked="indeterminate" onCheckedChange={() => undefined} label="Select all (indeterminate)" />
            </div>
            <div className="max-w-md">
              <RadioCards
                label="Fulfilment"
                value={radio}
                onChange={setRadio}
                options={[
                  { value: "delivery", title: "Delivery to your hostel", description: "Moremi Hall · ~45 min", aside: formatNaira(50_000) },
                  { value: "pickup", title: "Pickup", description: "Arts car park kiosk", aside: "Free" },
                ]}
              />
            </div>
            <div className="max-w-md">
              <div className="mb-1 flex justify-between text-small">
                <span className="font-medium">Price</span>
                <span className="font-mono text-muted tabular">
                  {formatNaira(range[0] * 100)} – {formatNaira(range[1] * 100)}
                </span>
              </div>
              <RangeSlider label="price" value={range} onValueChange={setRange} min={500} max={35000} step={500} formatValue={(n) => formatNaira(n * 100)} />
            </div>
          </div>
        </Section>

        <Section id="overlays" kicker="08" title="Overlays">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setDialog(true)}>
              Open dialog
            </Button>
            <Button variant="secondary" onClick={() => setSheet(true)}>
              Open sheet
            </Button>
            <Popover trigger={<Button variant="secondary">Popover</Button>}>
              <p className="max-w-56 text-small text-muted">Popovers hold small, contextual content like filter hints.</p>
            </Popover>
            <Menu>
              <MenuTrigger asChild>
                <Button variant="secondary" size="icon" aria-label="More actions">
                  <MoreHorizontal className="size-5" />
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Product</MenuLabel>
                <MenuItem icon={<Pencil />} shortcut="E" onSelect={() => toast("Edit selected")}>
                  Edit
                </MenuItem>
                <MenuItem icon={<Bell />} onSelect={() => toast("We'll notify you")}>
                  Notify when back
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={<Trash2 />} danger onSelect={() => toast.error("Deleted (demo)")}>
                  Delete
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
          <Dialog
            open={dialog}
            onOpenChange={setDialog}
            title="Leave this checkout?"
            description="Your bag is saved. You can come back anytime."
            footer={
              <>
                <Button variant="secondary" onClick={() => setDialog(false)}>
                  Stay
                </Button>
                <Button onClick={() => setDialog(false)}>Leave</Button>
              </>
            }
          >
            <p className="text-body text-muted">Dialogs trap focus, close on Escape, and return focus to the trigger.</p>
          </Dialog>
          <ResponsiveSheet
            open={sheet}
            onOpenChange={setSheet}
            title="Filters"
            description="A bottom sheet on phones, a side panel from tablet up."
            footer={
              <Button className="w-full" onClick={() => setSheet(false)}>
                Show 48 results
              </Button>
            }
          >
            <div className="grid gap-4">
              <Checkbox checked onCheckedChange={() => undefined} label="Delivers to my hostel" />
              <Checkbox checked={false} onCheckedChange={() => undefined} label="Open now" />
            </div>
          </ResponsiveSheet>
        </Section>

        <Section id="feedback" kicker="09" title="Feedback">
          <div className="grid gap-8">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => toast("Added to bag", { description: "Indigo Àdìrẹ Boxy Tee · M" })}>
                Neutral toast
              </Button>
              <Button variant="secondary" onClick={() => toast.success("Order placed", { description: "We'll keep you posted." })}>
                Success toast
              </Button>
              <Button variant="secondary" onClick={() => toast.error("Couldn't apply code", { description: "This code has expired." })}>
                Error toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => toast("Removed from bag", { action: { label: "Undo", onClick: () => toast.success("Restored") } })}
              >
                Toast with undo
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Pill>Draft</Pill>
              <Pill tone="warning" dot>Placed</Pill>
              <Pill tone="info" dot>Preparing</Pill>
              <Pill tone="accent" dot>Out for delivery</Pill>
              <Pill tone="success" dot>Delivered</Pill>
              <Pill tone="danger" dot>Declined</Pill>
            </div>
            <div className="flex items-center gap-4">
              <span className="relative inline-flex">
                <ShoppingBag className="size-6" />
                <CountBadge count={badge} className="absolute -top-2 -right-2.5" />
              </span>
              <Button size="sm" variant="secondary" onClick={() => setBadge((b) => b + 1)}>
                Add one
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setBadge(0)}>
                Clear
              </Button>
            </div>
            <div className="max-w-sm">
              <ProgressBar value={6} max={7} label="Setup progress" />
              <p className="mt-2 text-small text-muted">6 of 7 steps complete</p>
            </div>
            <div>
              <h3 className="eyebrow mb-4 text-muted">Skeletons mirror real layouts</h3>
              <div className="grid max-w-md grid-cols-2 gap-4">
                {[0, 1].map((i) => (
                  <div key={i}>
                    <Skeleton className="aspect-[4/5] w-full" rounded="md" />
                    <SkeletonText className="mt-3 text-body" lines={2} />
                    <Skeleton className="mt-2 h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        <Section id="data" kicker="10" title="Commerce">
          <div className="grid gap-8">
            <div className="flex flex-wrap items-center gap-6">
              <Price kobo={950_000} size="display" />
              <Price kobo={1_850_000} compareAt={2_200_000} size="lg" />
              <Price kobo={350_000} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <QuantityStepper value={qty} onChange={setQty} max={9} />
              <QuantityStepper value={qty} onChange={setQty} max={9} size="sm" />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <Stars value={4.6} size={16} />
              <RatingInput value={rating} onChange={setRating} />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <span className="font-display text-display-md">
                <NumberTicker value={total} format={(n) => formatNaira(n)} />
              </span>
              <Button size="sm" variant="secondary" onClick={() => setTotal((t) => t + 350_000)}>
                + ₦3,500
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setTotal((t) => Math.max(0, t - 350_000))}>
                − ₦3,500
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name="Ada Okafor" />
              <Avatar name="Tunde Bakare" size={44} />
              <Avatar name="Zainab Bello" size={28} />
              <span className="ml-4 flex items-center gap-1 text-small text-muted">
                Search <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </div>
          </div>
        </Section>

        <Section id="imagery" kicker="11" title="Imagery">
          <p className="mb-5 max-w-prose text-body text-muted">
            Generated art keeps the catalogue cohesive before real photos arrive. Every image renders through{" "}
            <code className="font-mono text-small">&lt;AppImage&gt;</code>, which handles blobs, URLs and fallbacks.
          </p>
          <div className="mb-5 flex flex-wrap gap-2">
            {(Object.keys(artPalettes) as ArtPalette[]).map((p) => (
              <Chip key={p} selected={p === palette} onClick={() => setPalette(p)}>
                {p}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {motifs.map((m, i) => (
              <figure key={m}>
                <div className="aspect-[4/5] overflow-hidden rounded-md">
                  <AppImage image={{ kind: "art", motif: m, palette, seed: i * 7 + 3 }} alt={`${m} art`} />
                </div>
                <figcaption className="mt-1.5 font-mono text-label text-muted">{m}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-[96px_1fr]">
            <div className="size-24 overflow-hidden rounded-lg">
              <AppImage image={{ kind: "art", motif: "monogram", palette, seed: 1 }} alt="Àdìrẹ Lab logo" name="Àdìrẹ Lab" variant="logo" />
            </div>
            <div className="h-40 overflow-hidden rounded-lg">
              <AppImage image={{ kind: "art", motif: "tee", palette, seed: 1000 }} alt="Brand cover" variant="cover" />
            </div>
          </div>
        </Section>

        <Section id="empty" kicker="12" title="Empty states">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {illustrations.map((n) => (
              <figure key={n} className="flex flex-col items-center rounded-md bg-surface p-4 hairline">
                <Illustration name={n} className="w-28" />
                <figcaption className="mt-2 font-mono text-label text-muted">{n}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 rounded-lg bg-surface hairline">
            <EmptyState
              illustration="bag"
              title="Your bag is empty"
              body="Find something from a brand on your campus. Most orders arrive the same day."
              action={<ButtonLink href="#empty">Start exploring</ButtonLink>}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
