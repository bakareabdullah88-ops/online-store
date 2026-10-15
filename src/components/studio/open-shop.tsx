"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Loader2, X } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/misc";
import { Ribbons } from "@/components/ui/ribbons";
import { Celebration } from "@/components/checkout/celebration";
import { categories, categoryById } from "@/config/categories";
import { spring } from "@/design/motion";
import { slugify } from "@/lib/ids";
import { hashString } from "@/lib/random";
import { cn } from "@/lib/cn";
import { useCampus } from "@/queries/catalog";
import { useSession } from "@/queries/session";
import { useCreateBrand, useHandleAvailable } from "@/queries/studio";
import { createBrandSchema, handleSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type { Brand, CategoryId, ImageRef } from "@/services/types";
import { toast } from "@/stores/toast";
import { useUi } from "@/stores/ui";
import { ImagePicker } from "./brand-settings";
import { FulfilmentFields, toFulfilment, type FulfilmentDraft } from "./fulfilment-fields";

const steps = ["Name", "Category", "Look", "Story", "Fulfilment", "Launch"] as const;

type State = {
  name: string;
  handle: string;
  handleTouched: boolean;
  category: CategoryId | null;
  logo: { id?: string; ref: ImageRef } | null;
  cover: { id?: string; ref: ImageRef } | null;
  tagline: string;
  bio: string;
  fulfilment: FulfilmentDraft;
};

function suggestHandle(name: string) {
  return slugify(name).replace(/-/g, "").slice(0, 24);
}

function Preview({ s, campusName }: { s: State; campusName: string }) {
  const cat = s.category ? categoryById(s.category) : null;
  const seed = hashString(s.handle || s.name || "kiosk");
  const logo: ImageRef = s.logo?.ref ?? {
    kind: "art",
    motif: "monogram",
    palette: cat?.palette ?? "sand",
    seed,
  };
  const cover: ImageRef = s.cover?.ref ?? {
    kind: "art",
    motif: cat?.motif ?? "tote",
    palette: cat?.palette ?? "sand",
    seed,
  };
  return (
    <div className="card pt-5" aria-label="Live preview of your shop" role="img">
      <div className="relative aspect-[16/7] overflow-hidden rounded-lg">
        <AppImage image={cover} alt="" variant="cover" />
      </div>
      <div className="pt-5">
        <div className="relative -mt-12 ml-4 size-16 overflow-hidden rounded-full ring-4 ring-canvas">
          <AppImage image={logo} alt="" variant="logo" name={s.name || "Your brand"} />
        </div>
        <p className="mt-3 eyebrow text-muted">
          {cat?.name ?? "Category"} · {campusName} · @{s.handle || "handle"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 font-display text-display-sm">
          <span className="truncate">{s.name || "Your brand"}</span>
          <BadgeCheck className="size-5 shrink-0 text-faint" aria-hidden />
        </p>
        <p className="mt-1 line-clamp-2 text-small text-muted">
          {s.tagline || "A short line about what you sell."}
        </p>
        <div className="mt-4 flex gap-2">
          <span className="h-9 rounded-md bg-primary px-4 text-small leading-9 text-on-primary">
            Follow
          </span>
          <span className="h-9 rounded-md px-4 text-small leading-9 hairline">Message</span>
        </div>
      </div>
    </div>
  );
}

export function OpenShopWizard() {
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const reduce = useReducedMotion();
  const create = useCreateBrand();
  const router = useRouter();
  const checkHandle = useHandleAvailable();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Brand | null>(null);
  // The last availability answer, for the handle it was about.
  const [checked, setChecked] = useState<{ handle: string; ok: boolean } | null>(null);
  const [s, setS] = useState<State>({
    name: "",
    handle: "",
    handleTouched: false,
    category: null,
    logo: null,
    cover: null,
    tagline: "",
    bio: "",
    fulfilment: {
      pickup: true,
      delivery: false,
      deliveryFee: "500",
      prepMinutes: 60,
      pickupPointIds: [],
      zoneIds: [],
    },
  });

  // Clear the "just opened" flag when leaving the wizard.
  useEffect(() => () => useUi.setState({ shopJustOpened: false }), []);

  // Live handle availability (debounced).
  const { mutate: check, mutateAsync: checkNow } = checkHandle;
  useEffect(() => {
    if (!s.handle) return;
    if (!handleSchema.safeParse(s.handle).success) return;
    const handle = s.handle;
    const t = window.setTimeout(() => {
      check(handle, { onSuccess: (ok) => setChecked({ handle, ok }) });
    }, 350);
    return () => window.clearTimeout(t);
  }, [s.handle, check]);
  const handleValid = !s.handle || handleSchema.safeParse(s.handle).success;
  const shownHandleState = !s.handle
    ? "idle"
    : !handleValid
      ? "invalid"
      : checked?.handle === s.handle
        ? checked.ok
          ? "ok"
          : "taken"
        : "checking";

  // Default pickup point once the campus is known.
  const firstPoint = campus?.pickupPoints[0]?.id;
  const fulfilment =
    s.fulfilment.pickupPointIds.length === 0 && s.fulfilment.pickup && firstPoint
      ? { ...s.fulfilment, pickupPointIds: [firstPoint] }
      : s.fulfilment;

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
    setErrors({});
  };

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (s.name.trim().length < 2) e.name = "Give your brand a name";
      const h = handleSchema.safeParse(s.handle);
      if (!h.success) e.handle = h.error.issues[0]?.message ?? "Choose a handle";
      else if (shownHandleState === "taken") e.handle = "That handle is taken";
    }
    if (step === 1 && !s.category) e.category = "Pick a category";
    if (step === 3 && s.tagline.trim().length < 4) e.tagline = "A short line about what you sell";
    if (step === 4) {
      if (!fulfilment.pickup && !fulfilment.delivery) e.pickup = "Offer pickup, delivery or both";
      if (fulfilment.pickup && fulfilment.pickupPointIds.length === 0)
        e.pickupPointIds = "Choose at least one pickup point";
      if (fulfilment.delivery && fulfilment.zoneIds.length === 0)
        e.zoneIds = "Choose at least one zone";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Continue pressed before the live check answered: check right away, then move on.
  const [awaitingHandle, setAwaitingHandle] = useState(false);

  const next = async () => {
    if (!validateStep()) return;
    if (step === 0 && shownHandleState !== "ok") {
      setAwaitingHandle(true);
      try {
        const handle = s.handle;
        const ok = await checkNow(handle);
        setChecked({ handle, ok });
        if (!ok) {
          setErrors({ handle: "That handle is taken" });
          return;
        }
      } catch (e) {
        toast.error("Couldn't check that handle", { description: errorMessage(e) });
        return;
      } finally {
        setAwaitingHandle(false);
      }
    }
    if (step < steps.length - 1) go(step + 1);
  };

  const launch = () => {
    const input = {
      name: s.name,
      handle: s.handle,
      category: s.category ?? "fashion",
      tagline: s.tagline,
      bio: s.bio,
      ...(s.logo?.id ? { logoImageId: s.logo.id } : {}),
      ...(s.cover?.id ? { coverImageId: s.cover.id } : {}),
      fulfilment: toFulfilment(fulfilment),
    };
    const parsed = createBrandSchema.safeParse(input);
    if (!parsed.success) {
      toast.error("Something's missing", { description: parsed.error.issues[0]?.message });
      return;
    }
    create.mutate(input, {
      onSuccess: (b) => {
        useUi.setState({ shopJustOpened: true });
        setCreated(b);
      },
      onError: (e) => {
        // A handle someone else just took sends you back to the step where you can change it.
        const fields = (e as { fields?: Record<string, string> }).fields;
        if (fields?.handle) {
          go(0);
          setErrors({ handle: fields.handle });
          setChecked({ handle: s.handle, ok: false });
          return;
        }
        toast.error("Couldn't open your shop", { description: errorMessage(e) });
      },
    });
  };

  // Move focus to the new step's heading so keyboard and screen-reader users land on it.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      const h = document.querySelector<HTMLHeadingElement>("[data-wizard] h1");
      if (!h) return;
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }, 380);
    return () => window.clearTimeout(t);
  }, [step]);

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -48 }),
  };

  if (created) {
    return (
      <div className="relative mx-auto max-w-lg py-10 text-center">
        <Ribbons />
        <div className="relative z-10">
          <Celebration />
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.smooth, delay: 0.25 }}
            className="mt-8 font-display text-display-lg text-balance"
          >
            {created.name} is open
          </motion.h1>
          <p className="mt-3 text-body-lg text-muted">
            Your shop is live at kamplug/{created.handle}. Add a product so students can start
            ordering.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => router.push("/studio/products/new")}>
              Add your first product
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push("/studio")}>
              Go to Shop Studio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const campusName = campus?.shortName ?? "Campus";

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
      <div className="min-w-0">
        <div className="flex items-center gap-4">
          <ProgressBar
            value={step + 1}
            max={steps.length}
            label="Shop setup progress"
            className="flex-1"
          />
          <span className="font-mono text-label text-muted tabular">
            {step + 1}/{steps.length}
          </span>
        </div>
        <ol className="mt-3 hidden gap-4 text-small text-muted sm:flex" aria-hidden>
          {steps.map((label, i) => (
            <li
              key={label}
              className={cn(
                "flex items-center gap-1.5",
                i === step && "font-medium text-ink",
                i < step && "text-ink-2",
              )}
            >
              {i < step ? (
                <Check className="size-3.5 text-accent" />
              ) : (
                <span className="font-mono text-[11px]">{i + 1}</span>
              )}
              {label}
            </li>
          ))}
        </ol>

        <div data-wizard className="relative mt-10 min-h-[440px] overflow-hidden">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.form
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={spring.smooth}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (step === steps.length - 1) launch();
                else void next();
              }}
            >
              {step === 0 && (
                <div className="flex flex-col gap-6">
                  <header>
                    <p className="eyebrow text-muted">Step 1 · Name</p>
                    <h1 className="mt-2 font-display text-display-md text-balance">
                      What&apos;s your brand called?
                    </h1>
                    <p className="mt-2 text-body text-muted">
                      You can change the name later. Your handle is your shop link.
                    </p>
                  </header>
                  <Field label="Brand name" error={errors.name}>
                    <Input
                      inputSize="lg"
                      value={s.name}
                      autoFocus
                      maxLength={40}
                      placeholder="e.g. Moremi Thrift"
                      onChange={(e) =>
                        setS((x) => ({
                          ...x,
                          name: e.target.value,
                          handle: x.handleTouched ? x.handle : suggestHandle(e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field
                    label="Handle"
                    error={
                      errors.handle ??
                      (shownHandleState === "taken"
                        ? "That handle is taken"
                        : shownHandleState === "invalid"
                          ? "Letters, numbers, dots and underscores, 3–24 characters"
                          : undefined)
                    }
                    hint={
                      shownHandleState === "ok"
                        ? `kamplug/${s.handle} is yours`
                        : "Your shop link, e.g. kamplug/moremithrift"
                    }
                  >
                    <Input
                      value={s.handle}
                      maxLength={24}
                      onChange={(e) => {
                        setS((x) => ({
                          ...x,
                          handle: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""),
                          handleTouched: true,
                        }));
                      }}
                      leading={<span className="font-mono text-small">kamplug/</span>}
                      className="pl-16 font-mono"
                      trailing={
                        <span
                          className="flex size-9 items-center justify-center"
                          aria-live="polite"
                        >
                          {shownHandleState === "checking" && (
                            <Loader2
                              className="size-4 animate-spin text-muted"
                              aria-label="Checking"
                            />
                          )}
                          {shownHandleState === "ok" && (
                            <Check className="size-4 text-success" aria-label="Available" />
                          )}
                          {(shownHandleState === "taken" || shownHandleState === "invalid") && (
                            <X className="size-4 text-danger" aria-label="Not available" />
                          )}
                        </span>
                      }
                    />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-6">
                  <header>
                    <p className="eyebrow text-muted">Step 2 · Category</p>
                    <h1 className="mt-2 font-display text-display-md">What do you sell?</h1>
                    <p className="mt-2 text-body text-muted">
                      Pick the closest fit. Buyers filter by category.
                    </p>
                  </header>
                  <div
                    role="radiogroup"
                    aria-label="Category"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4"
                  >
                    {categories.map((c) => {
                      const active = s.category === c.id;
                      return (
                        <motion.button
                          key={c.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setS((x) => ({ ...x, category: c.id }))}
                          className={cn(
                            "overflow-hidden rounded-md text-left transition-shadow",
                            active
                              ? "shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--ink)]"
                              : "hairline hover:shadow-[inset_0_0_0_1px_var(--muted)]",
                          )}
                        >
                          <div className="grid aspect-[4/3] place-items-center bg-surface-2">
                            <c.icon
                              className={cn(
                                "size-8 transition-colors",
                                active ? "text-accent" : "text-ink-2",
                              )}
                              strokeWidth={1.5}
                            />
                          </div>
                          <p className="bg-surface px-3 py-2.5 text-small font-medium">{c.name}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <p className="text-small font-medium text-danger">{errors.category}</p>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <header>
                    <p className="eyebrow text-muted">Step 3 · Look</p>
                    <h1 className="mt-2 font-display text-display-md">Add a logo and cover</h1>
                    <p className="mt-2 text-body text-muted">
                      Optional. We&apos;ve made you a cover from your category so you can skip this.
                    </p>
                  </header>
                  <ImagePicker
                    image={
                      s.cover?.ref ?? {
                        kind: "art",
                        motif: s.category ? categoryById(s.category).motif : "tote",
                        palette: s.category ? categoryById(s.category).palette : "sand",
                        seed: hashString(s.handle || "x"),
                      }
                    }
                    name={s.name}
                    variant="cover"
                    label="Upload a cover image"
                    onUploaded={(id, ref) => setS((x) => ({ ...x, cover: { id, ref } }))}
                    withButton
                  />
                  <div className="flex items-center gap-4">
                    <ImagePicker
                      image={
                        s.logo?.ref ?? {
                          kind: "art",
                          motif: "monogram",
                          palette: s.category ? categoryById(s.category).palette : "sand",
                          seed: hashString(s.handle || "x"),
                        }
                      }
                      name={s.name || "Brand"}
                      variant="logo"
                      label="Upload a logo"
                      onUploaded={(id, ref) => setS((x) => ({ ...x, logo: { id, ref } }))}
                      withButton
                    />
                    <p className="text-small text-muted">
                      Square logos look best. Covers are wide (16:6). PNG, JPG or WebP.
                    </p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <header>
                    <p className="eyebrow text-muted">Step 4 · Story</p>
                    <h1 className="mt-2 font-display text-display-md">Tell students who you are</h1>
                  </header>
                  <Field
                    label="Tagline"
                    error={errors.tagline}
                    hint="One line that shows on cards, e.g. Hand-dyed tees made in Akoka"
                  >
                    <Input
                      value={s.tagline}
                      onChange={(e) => setS((x) => ({ ...x, tagline: e.target.value }))}
                      maxLength={80}
                    />
                  </Field>
                  <Field
                    label="Short bio"
                    optional
                    hint={`${s.bio.length}/400 · Who's behind it, what makes it good`}
                  >
                    <Textarea
                      value={s.bio}
                      onChange={(e) => setS((x) => ({ ...x, bio: e.target.value }))}
                      maxLength={400}
                    />
                  </Field>
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <header>
                    <p className="eyebrow text-muted">Step 5 · Pickup & delivery</p>
                    <h1 className="mt-2 font-display text-display-md">
                      How do buyers get their order?
                    </h1>
                    <p className="mt-2 text-body text-muted">
                      On {campus?.name ?? "your campus"}. You can change this any time.
                    </p>
                  </header>
                  <FulfilmentFields
                    value={fulfilment}
                    onChange={(f) => setS((x) => ({ ...x, fulfilment: f }))}
                    campus={campus}
                    errors={errors}
                  />
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col gap-6">
                  <header>
                    <p className="eyebrow text-muted">Step 6 · Launch</p>
                    <h1 className="mt-2 font-display text-display-md">Ready to open?</h1>
                    <p className="mt-2 text-body text-muted">
                      Here&apos;s your shop. You&apos;ll add products next.
                    </p>
                  </header>
                  <div className="lg:hidden">
                    <Preview s={{ ...s, fulfilment }} campusName={campusName} />
                  </div>
                  <dl className="card grid grid-cols-[120px_1fr] gap-y-2 py-5 text-small">
                    <dt className="text-muted">Name</dt>
                    <dd>{s.name}</dd>
                    <dt className="text-muted">Link</dt>
                    <dd className="font-mono">kamplug/{s.handle}</dd>
                    <dt className="text-muted">Category</dt>
                    <dd>{s.category ? categoryById(s.category).name : ""}</dd>
                    <dt className="text-muted">Fulfilment</dt>
                    <dd>
                      {[
                        fulfilment.pickup &&
                          `Pickup (${fulfilment.pickupPointIds.length} point${fulfilment.pickupPointIds.length === 1 ? "" : "s"})`,
                        fulfilment.delivery &&
                          `Delivery to ${fulfilment.zoneIds.length} zones · ₦${fulfilment.deliveryFee}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </dd>
                  </dl>
                  <p className="text-small text-muted">
                    By opening a shop you agree to sell honestly and fulfil the orders you accept.
                  </p>
                </div>
              )}

              <div className="mt-10 flex items-center gap-3">
                {step > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    leadingIcon={<ArrowLeft className="size-4.5" />}
                    onClick={() => go(step - 1)}
                  >
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="ml-auto"
                  loading={create.isPending || awaitingHandle}
                  trailingIcon={
                    step < steps.length - 1 ? <ArrowRight className="size-4.5" /> : undefined
                  }
                >
                  {step === steps.length - 1
                    ? "Open my shop"
                    : step === 2 && !s.logo && !s.cover
                      ? "Skip for now"
                      : "Continue"}
                </Button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 eyebrow text-muted">Live preview</p>
          <Preview s={{ ...s, fulfilment }} campusName={campusName} />
          <p className="mt-3 text-small text-muted">This is how your shop appears to buyers.</p>
        </div>
      </aside>
    </div>
  );
}
