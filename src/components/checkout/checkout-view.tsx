"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Bike,
  Building2,
  Check,
  CreditCard,
  Lock,
  MapPin,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { RadioCards } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { NumberTicker } from "@/components/ui/misc";
import { Select } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedControl } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { spring } from "@/design/motion";
import { formatNaira } from "@/domain/money";
import type { GroupQuote } from "@/domain/checkout";
import { cn } from "@/lib/cn";
import { useCampuses } from "@/queries/catalog";
import { usePlaces, useWallet } from "@/queries/inbox";
import { useCreateOrders, useQuote } from "@/queries/orders";
import { useSession } from "@/queries/session";
import { errorMessage } from "@/services/errors";
import type { CheckoutInput } from "@/services/inputs";
import type { Campus, PaymentMethod } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { useBagView, type BagGroupView } from "./use-bag-view";

type GroupState = {
  method: "delivery" | "pickup";
  zoneId: string;
  pickupPointId: string;
  addressLine: string;
  note: string;
  promoInput: string;
};

const demoCards = [
  {
    id: "visa",
    brand: "Visa",
    last4: "4242",
    name: "Demo card",
    tone: "from-[#22304A] to-[#3B4F73]",
  },
  {
    id: "verve",
    brand: "Verve",
    last4: "0618",
    name: "Demo card",
    tone: "from-[#1E5B45] to-[#2F7A5E]",
  },
  {
    id: "master",
    brand: "Mastercard",
    last4: "5100",
    name: "Demo card",
    tone: "from-[#6E2335] to-[#9A3A50]",
  },
];

function CardCarousel({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="Saved demo cards"
      className="-mx-2 scrollbar-none flex snap-x scroll-px-2 gap-3 overflow-x-auto p-2"
    >
      {demoCards.map((c) => {
        const active = c.id === value;
        return (
          <motion.button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.id)}
            whileTap={{ scale: 0.97 }}
            animate={{ scale: active ? 1 : 0.96, opacity: active ? 1 : 0.7 }}
            transition={spring.snappy}
            className={cn(
              "relative flex aspect-[1.6/1] w-56 shrink-0 snap-start flex-col justify-between rounded-lg bg-linear-to-br p-4 text-left text-white shadow-md",
              c.tone,
              active && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
            )}
          >
            <span className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-wider uppercase opacity-80">
                Demo · not real
              </span>
              {active && (
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-ink">
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
            </span>
            <span>
              <span className="block font-mono text-body tracking-[0.15em]">•••• {c.last4}</span>
              <span className="mt-1 flex items-center justify-between text-small opacity-85">
                <span>{c.name}</span>
                <span className="font-semibold">{c.brand}</span>
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: number;
  tone?: "discount";
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between",
        strong ? "text-body font-semibold" : "text-small",
      )}
    >
      <span className={strong ? "text-ink" : "text-muted"}>{label}</span>
      <span className={cn("font-mono tabular", tone === "discount" && "text-success")}>
        {tone === "discount" && value > 0 ? "−" : ""}
        <NumberTicker value={value} format={(n) => formatNaira(n)} step={100} />
      </span>
    </div>
  );
}

function GroupSection({
  group,
  campus,
  state,
  onChange,
  quote,
  errors,
  index,
}: {
  group: BagGroupView;
  campus: Campus | undefined;
  state: GroupState;
  onChange: (patch: Partial<GroupState>) => void;
  quote: GroupQuote | undefined;
  errors: Record<string, string>;
  index: number;
}) {
  const b = group.brand;
  const setPromo = useBag((s) => s.setPromo);
  const promoCode = useBag((s) => s.promoCodes[group.brandId]);
  if (!b) return <Skeleton className="h-64 w-full" rounded="lg" />;
  const zones = campus?.zones.filter((z) => b.fulfilment.zoneIds.includes(z.id)) ?? [];
  const points =
    campus?.pickupPoints.filter((p) => b.fulfilment.pickupPointIds.includes(p.id)) ?? [];
  const methods = [
    ...(b.fulfilment.delivery
      ? [
          {
            value: "delivery" as const,
            label: `Delivery · ${formatNaira(b.fulfilment.deliveryFeeKobo)}`,
            icon: <Bike className="size-4" />,
          },
        ]
      : []),
    ...(b.fulfilment.pickup
      ? [{ value: "pickup" as const, label: "Pickup · Free", icon: <MapPin className="size-4" /> }]
      : []),
  ];

  return (
    <section aria-labelledby={`g-${group.brandId}`} className="rounded-lg bg-surface hairline">
      <header className="flex items-center gap-3 border-b border-line p-4 md:p-5">
        <span className="font-mono text-label text-muted">0{index + 2}</span>
        <span className="size-9 shrink-0 overflow-hidden rounded-full">
          <AppImage image={b.logo} alt="" variant="logo" name={b.name} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`g-${group.brandId}`} className="truncate text-body font-semibold">
            {b.name}
          </h2>
          <p className="text-small text-muted">
            {group.count} item{group.count === 1 ? "" : "s"} · {campus?.shortName} · separate order
          </p>
        </div>
        <span className="font-mono text-small tabular">
          {formatNaira(quote?.totalKobo ?? group.subtotalKobo)}
        </span>
      </header>

      <div className="flex flex-col gap-5 p-4 md:p-5">
        <ul className="scrollbar-none flex gap-2 overflow-x-auto" aria-label="Items">
          {group.items.map((i) => (
            <li key={i.id} className="relative size-14 shrink-0 overflow-hidden rounded-sm">
              <AppImage image={i.product?.images[0]} alt={i.product?.name ?? ""} />
              {i.line.quantity > 1 && (
                <span className="absolute right-1 bottom-1 rounded-xs bg-primary px-1 font-mono text-[10px] text-on-primary">
                  ×{i.line.quantity}
                </span>
              )}
            </li>
          ))}
        </ul>

        {methods.length > 1 ? (
          <SegmentedControl
            label={`How to get your ${b.name} order`}
            value={state.method}
            onChange={(m) => onChange({ method: m })}
            options={methods}
            className="w-full [&>button]:flex-1"
          />
        ) : (
          <p className="flex items-center gap-2 text-small font-medium">
            {methods[0]?.icon} {b.name} offers {state.method} only
          </p>
        )}

        <AnimatePresence mode="wait" initial={false}>
          {state.method === "delivery" ? (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring.snappy}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <Field label="Deliver to" error={errors.zoneId}>
                <Select
                  label="Delivery zone"
                  value={state.zoneId || undefined}
                  onValueChange={(v) => onChange({ zoneId: v })}
                  placeholder="Choose a zone"
                  options={zones.map((z) => ({ value: z.id, label: z.name }))}
                />
              </Field>
              <Field label="Room, block or landmark" error={errors.addressLine}>
                <Input
                  value={state.addressLine}
                  onChange={(e) => onChange({ addressLine: e.target.value })}
                  placeholder="e.g. Room 12, Block C"
                  maxLength={120}
                />
              </Field>
            </motion.div>
          ) : (
            <motion.div
              key="pickup"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={spring.snappy}
            >
              <RadioCards
                label="Pickup point"
                value={state.pickupPointId || undefined}
                onChange={(v) => onChange({ pickupPointId: v })}
                columns={points.length > 1 ? 2 : 1}
                options={points.map((p) => ({ value: p.id, title: p.name, description: p.hint }))}
              />
              {errors.pickupPointId && (
                <p className="mt-2 text-small font-medium text-danger">{errors.pickupPointId}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Field label="Note for the brand" optional>
          <Input
            value={state.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="e.g. Please call when you're at the gate"
            maxLength={200}
          />
        </Field>

        {/* Promo code */}
        <div>
          {promoCode && quote?.promo?.status === "applied" ? (
            <div className="flex items-center gap-3 rounded-md bg-success-soft px-3.5 py-2.5 text-small text-success">
              <Tag className="size-4" />
              <span className="flex-1">
                <span className="font-mono font-semibold">{quote.promo.code}</span> ·{" "}
                {quote.promo.label}
              </span>
              <button
                type="button"
                onClick={() => setPromo(group.brandId, null)}
                className="flex size-7 items-center justify-center rounded-sm hover:bg-success/10"
                aria-label={`Remove code ${quote.promo.code}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <form
              className="flex items-start gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const code = state.promoInput.trim().toUpperCase();
                if (code) setPromo(group.brandId, code);
              }}
            >
              <Field
                label="Promo code"
                className="flex-1"
                error={
                  promoCode && quote?.promo?.status === "invalid" ? quote.promo.reason : undefined
                }
                hint="Try KIOSK10, FRESHER or FREEDEL"
              >
                <Input
                  value={state.promoInput}
                  onChange={(e) => onChange({ promoInput: e.target.value.toUpperCase() })}
                  placeholder="CODE"
                  className="font-mono uppercase"
                  autoCapitalize="characters"
                />
              </Field>
              <Button
                type="submit"
                variant="secondary"
                className="mt-6.5"
                disabled={!state.promoInput.trim()}
              >
                Apply
              </Button>
            </form>
          )}
        </div>

        {quote && quote.problems.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-md bg-danger-soft px-3.5 py-3 text-small text-danger">
            {quote.problems.map((p, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {p.reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function CheckoutView() {
  const { user } = useSession();
  const { groups, isEmpty, loading } = useBagView();
  const campuses = useCampuses();
  const places = usePlaces();
  const wallet = useWallet();
  const promoCodes = useBag((s) => s.promoCodes);
  const removeBrand = useBag((s) => s.removeBrand);
  const setPromo = useBag((s) => s.setPromo);
  const create = useCreateOrders();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [phoneInput, setPhone] = useState<string | null>(null);
  const phone = phoneInput ?? user?.phone ?? "";
  const [overrides, setOverrides] = useState<Record<string, GroupState>>({});
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [card, setCard] = useState("visa");
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [placed, setPlaced] = useState(false);

  const campusById = useMemo(
    () => new Map((campuses.data ?? []).map((c) => [c.id, c])),
    [campuses.data],
  );

  /** Per-brand choices: the user's edits, falling back to sensible defaults (saved places). */
  const stateFor = (g: BagGroupView): GroupState | undefined => {
    if (overrides[g.brandId]) return overrides[g.brandId];
    const b = g.brand;
    if (!b) return undefined;
    const place =
      places.data?.find((p) => p.isDefault && p.campusId === b.campusId) ??
      places.data?.find((p) => p.campusId === b.campusId);
    return {
      method: b.fulfilment.delivery ? "delivery" : "pickup",
      zoneId:
        place && b.fulfilment.zoneIds.includes(place.zoneId)
          ? place.zoneId
          : (b.fulfilment.zoneIds[0] ?? ""),
      pickupPointId: b.fulfilment.pickupPointIds[0] ?? "",
      addressLine: place?.addressLine ?? "",
      note: "",
      promoInput: promoCodes[g.brandId] ?? "",
    };
  };
  const state: Record<string, GroupState> = {};
  for (const g of groups) {
    const st = stateFor(g);
    if (st) state[g.brandId] = st;
  }

  const ready =
    groups.length > 0 &&
    groups.every((g) => g.brand && state[g.brandId] && g.items.every((i) => i.product)) &&
    !places.isPending;
  const blockedGroup = groups.find((g) => g.blockedReason);

  const buildInput = (forQuote: boolean): CheckoutInput | null => {
    if (!ready || !user) return null;
    return {
      campusId: user.campusId ?? groups[0]?.brand?.campusId ?? "",
      phone: forQuote ? "08000000000" : phone,
      paymentMethod: payment,
      groups: groups.map((g) => {
        const s = state[g.brandId]!;
        const pickupZone = campusById
          .get(g.brand!.campusId)
          ?.pickupPoints.find((p) => p.id === s.pickupPointId)?.zoneId;
        return {
          brandId: g.brandId,
          lines: g.items
            .filter((i) => !i.unavailable)
            .map((i) => ({
              productId: i.line.productId,
              variantKey: i.line.variantKey,
              quantity: i.line.quantity,
            })),
          fulfilment:
            s.method === "delivery"
              ? {
                  method: "delivery" as const,
                  zoneId: s.zoneId,
                  addressLine: forQuote ? "quote" : s.addressLine,
                  ...(s.note && !forQuote ? { note: s.note } : {}),
                }
              : {
                  method: "pickup" as const,
                  zoneId: pickupZone ?? s.zoneId,
                  pickupPointId: s.pickupPointId,
                  ...(s.note && !forQuote ? { note: s.note } : {}),
                },
          ...(promoCodes[g.brandId] ? { promoCode: promoCodes[g.brandId] } : {}),
        };
      }),
    };
  };

  // Query keys are hashed structurally, so a fresh object per render is fine.
  // Address and note are excluded: they never change the price.
  const quote = useQuote(buildInput(true));
  const quoteByBrand = new Map((quote.data?.groups ?? []).map((g) => [g.brandId, g]));
  const total = quote.data?.totalKobo ?? groups.reduce((n, g) => n + g.subtotalKobo, 0);
  const balance = wallet.data?.balanceKobo ?? 0;
  const problems = (quote.data?.groups ?? []).some((g) => g.problems.length > 0);

  const validate = () => {
    const all: Record<string, Record<string, string>> = {};
    for (const g of groups) {
      const s = state[g.brandId];
      if (!s) continue;
      const e: Record<string, string> = {};
      if (s.method === "delivery") {
        if (!s.zoneId) e.zoneId = "Choose a zone";
        if (s.addressLine.trim().length < 3) e.addressLine = "Add a room number or landmark";
      } else if (!s.pickupPointId) e.pickupPointId = "Choose a pickup point";
      if (Object.keys(e).length) all[g.brandId] = e;
    }
    setErrors(all);
    const ph = phone.replace(/[\s-]/g, "");
    const phoneOk = /^(\+234|0)[789][01]\d{8}$/.test(ph);
    setPhoneError(phoneOk ? undefined : "Enter a Nigerian number, e.g. 0803 123 4567");
    return Object.keys(all).length === 0 && phoneOk;
  };

  const place = () => {
    if (!validate()) {
      toast.error("A few details are missing", { description: "Check the highlighted fields." });
      return;
    }
    const input = buildInput(false);
    if (!input) return;
    create.mutate(input, {
      onSuccess: (res) => {
        setPlaced(true);
        for (const g of input.groups) {
          removeBrand(g.brandId);
          setPromo(g.brandId, null);
        }
        router.push(`/checkout/success?checkout=${res.checkoutId}`);
      },
      onError: (e) => toast.error("Couldn't place your order", { description: errorMessage(e) }),
    });
  };

  if (isEmpty && !placed && !create.isPending) {
    return (
      <div className="container-page">
        <EmptyState
          illustration="bag"
          title="Nothing to check out"
          body="Your bag is empty. Add something from a campus brand first."
          action={<ButtonLink href="/explore">Explore</ButtonLink>}
        />
      </div>
    );
  }

  if (loading || !ready) {
    return (
      <div className="container-page grid gap-8 pt-10 lg:grid-cols-12" aria-busy>
        <div className="flex flex-col gap-4 lg:col-span-7">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-36 w-full" rounded="lg" />
          <Skeleton className="h-72 w-full" rounded="lg" />
        </div>
        <Skeleton className="h-80 w-full lg:col-span-5" rounded="lg" />
      </div>
    );
  }

  const payOptions = [
    {
      value: "card" as const,
      title: "Card",
      description: "Pay now with a saved demo card",
      icon: <CreditCard className="size-5" />,
    },
    {
      value: "transfer" as const,
      title: "Bank transfer",
      description: "Transfer to a one-time demo account",
      icon: <Building2 className="size-5" />,
    },
    {
      value: "pay_on_pickup" as const,
      title: "Pay on pickup or delivery",
      description: "Cash or transfer when you get it",
      icon: <Banknote className="size-5" />,
    },
    {
      value: "wallet" as const,
      title: "Kiosk wallet",
      description: wallet.data
        ? `Demo balance ${formatNaira(balance)}${balance < total ? " · not enough" : ""}`
        : "Loading balance…",
      icon: <Wallet className="size-5" />,
      disabled: !!wallet.data && balance < total,
    },
  ];

  return (
    <div className="container-page pt-6 md:pt-10">
      <header className="mb-8">
        <p className="eyebrow text-muted">Checkout</p>
        <h1 className="mt-2 font-display text-display-lg">Almost yours</h1>
        <p className="mt-2 flex items-center gap-2 text-small text-muted">
          <Lock className="size-4" /> Demo checkout. No real payment is taken.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-7">
          <section aria-labelledby="contact" className="rounded-lg bg-surface p-4 hairline md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-label text-muted">01</span>
              <h2 id="contact" className="text-body font-semibold">
                Contact
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input value={user?.name ?? ""} readOnly className="bg-surface-2" />
              </Field>
              <Field label="Phone for the rider" error={phoneError}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0803 123 4567"
                />
              </Field>
            </div>
          </section>

          {groups.map((g, i) => (
            <GroupSection
              key={g.brandId}
              group={g}
              index={i}
              campus={g.brand ? campusById.get(g.brand.campusId) : undefined}
              state={state[g.brandId]!}
              onChange={(patch) =>
                setOverrides((o) => ({
                  ...o,
                  [g.brandId]: { ...state[g.brandId]!, ...o[g.brandId], ...patch },
                }))
              }
              quote={quoteByBrand.get(g.brandId)}
              errors={errors[g.brandId] ?? {}}
            />
          ))}

          <section aria-labelledby="pay" className="rounded-lg bg-surface p-4 hairline md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="font-mono text-label text-muted">0{groups.length + 2}</span>
              <h2 id="pay" className="text-body font-semibold">
                Payment
              </h2>
              <span className="ml-auto rounded-full bg-warning-soft px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wider text-warning uppercase">
                Demo
              </span>
            </div>
            <RadioCards
              label="Payment method"
              value={payment}
              onChange={setPayment}
              options={payOptions}
            />
            <AnimatePresence initial={false} mode="wait">
              {payment === "card" && (
                <motion.div
                  key="card"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={spring.smooth}
                  className="overflow-hidden"
                >
                  <div className="pt-5">
                    <p className="mb-3 text-small text-muted">
                      Pick a saved card. These are pretend cards; nothing is charged.
                    </p>
                    <CardCarousel value={card} onChange={setCard} />
                  </div>
                </motion.div>
              )}
              {payment === "transfer" && (
                <motion.div
                  key="transfer"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={spring.smooth}
                  className="overflow-hidden"
                >
                  <dl className="mt-5 grid grid-cols-2 gap-3 rounded-md bg-canvas-sunk p-4 text-small">
                    <div>
                      <dt className="text-muted">Bank</dt>
                      <dd className="font-medium">Demo Bank</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Account</dt>
                      <dd className="font-mono font-medium">00 0000 0000</dd>
                    </div>
                    <p className="col-span-2 text-muted">
                      In the demo, placing the order marks the transfer as received.
                    </p>
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>

        <aside className="min-w-0 lg:col-span-5">
          <div className="rounded-lg bg-surface p-5 hairline md:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-title font-semibold">Order summary</h2>
              {quote.isFetching && (
                <Spinner className="size-4 text-muted" label="Updating totals" />
              )}
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              {(quote.data?.groups ?? []).map((g) => (
                <div key={g.brandId} className="flex items-baseline justify-between text-small">
                  <span className="truncate text-ink-2">{g.brandName}</span>
                  <span className="font-mono tabular">{formatNaira(g.totalKobo)}</span>
                </div>
              ))}
            </div>
            <div className="my-5 h-px bg-line" />
            <div className="flex flex-col gap-2">
              <SummaryRow label="Subtotal" value={quote.data?.subtotalKobo ?? 0} />
              <SummaryRow label="Delivery" value={quote.data?.deliveryKobo ?? 0} />
              {(quote.data?.discountKobo ?? 0) > 0 && (
                <SummaryRow
                  label="Discounts"
                  value={quote.data?.discountKobo ?? 0}
                  tone="discount"
                />
              )}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
              <span className="text-body font-semibold">Total</span>
              <span className="font-display text-display-md">
                <NumberTicker value={total} format={(n) => formatNaira(n)} step={100} />
              </span>
            </div>
            {blockedGroup && (
              <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-small text-warning">
                {blockedGroup.blockedReason} Remove it from your bag to continue.
              </p>
            )}
            <Button
              size="lg"
              className="mt-6 hidden w-full lg:flex"
              loading={create.isPending}
              disabled={!!blockedGroup || problems || !quote.data}
              onClick={place}
            >
              Place {groups.length > 1 ? `${groups.length} orders` : "order"} · {formatNaira(total)}
            </Button>
            <p className="mt-3 text-small text-muted">
              Each brand gets its own order and updates it separately. You can cancel any order
              until the brand accepts it.
            </p>
          </div>
        </aside>
      </div>

      {/* Sticky place-order bar on phones */}
      <div className="h-24 lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-(--z-header) border-t border-line bg-canvas/95 px-(--gutter) pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div>
            <p className="text-small text-muted">Total</p>
            <p className="font-mono text-body-lg font-semibold tabular">
              <NumberTicker value={total} format={(n) => formatNaira(n)} step={100} />
            </p>
          </div>
          <Button
            size="lg"
            className="ml-auto max-w-72 flex-1"
            loading={create.isPending}
            disabled={!!blockedGroup || problems || !quote.data}
            onClick={place}
          >
            Place {groups.length > 1 ? `${groups.length} orders` : "order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
