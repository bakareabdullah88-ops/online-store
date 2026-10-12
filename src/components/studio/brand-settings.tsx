"use client";

import { useRef, useState } from "react";
import { Camera, ExternalLink } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { categories } from "@/config/categories";
import { cn } from "@/lib/cn";
import { useCampus } from "@/queries/catalog";
import { useMyBrand, useUpdateBrand, useUploadImage } from "@/queries/studio";
import { errorMessage } from "@/services/errors";
import type { Brand, CategoryId, ImageRef } from "@/services/types";
import { toast } from "@/stores/toast";
import {
  FulfilmentFields,
  fromFulfilment,
  toFulfilment,
  type FulfilmentDraft,
} from "./fulfilment-fields";
import { StudioHeaderBlock } from "./studio-shell";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ImagePicker({
  image,
  name,
  variant,
  onUploaded,
  label,
  className,
}: {
  image: ImageRef | null;
  name: string;
  variant: "logo" | "cover";
  onUploaded: (id: string, ref: ImageRef) => void;
  label: string;
  className?: string;
}) {
  const upload = useUploadImage();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-sand",
        variant === "logo" ? "size-24 rounded-full" : "aspect-[16/6] w-full rounded-lg",
        className,
      )}
    >
      <AppImage image={image} alt="" variant={variant} name={name} />
      {upload.isPending && <Skeleton className="absolute inset-0" rounded="none" />}
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "absolute flex items-center justify-center gap-2 bg-primary/70 text-small font-medium text-on-primary opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:opacity-100",
          "inset-0",
        )}
        aria-label={label}
      >
        <Camera className="size-5" />
        {variant === "cover" && "Change cover"}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f)
            upload.mutate(f, {
              onSuccess: (r) => onUploaded(r.id, r.ref),
              onError: (err) => toast.error(errorMessage(err)),
            });
        }}
      />
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-lg bg-surface p-5 hairline md:p-6">
      <h2 className="text-title font-semibold">{title}</h2>
      {description && <p className="mt-1 text-small text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BrandForm({ brand }: { brand: Brand }) {
  const campus = useCampus(brand.campusId);
  const update = useUpdateBrand();
  const [name, setName] = useState(brand.name);
  const [tagline, setTagline] = useState(brand.tagline);
  const [bio, setBio] = useState(brand.bio);
  const [category, setCategory] = useState<CategoryId>(brand.category);
  const [logo, setLogo] = useState<{ id?: string; ref: ImageRef }>({ ref: brand.logo });
  const [cover, setCover] = useState<{ id?: string; ref: ImageRef }>({ ref: brand.cover });
  const [days, setDays] = useState(brand.openHours.days);
  const [opens, setOpens] = useState(brand.openHours.opens);
  const [closes, setCloses] = useState(brand.openHours.closes);
  const [fulfilment, setFulfilment] = useState<FulfilmentDraft>(fromFulfilment(brand.fulfilment));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const save = () => {
    const e: Record<string, string> = {};
    if (closes <= opens) e.hours = "Closing time must be after opening time";
    if (!days.length) e.hours = "Open at least one day";
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    update.mutate(
      {
        name,
        tagline,
        bio,
        category,
        ...(logo.id ? { logoImageId: logo.id } : {}),
        ...(cover.id ? { coverImageId: cover.id } : {}),
        openHours: { days, opens, closes },
        fulfilment: toFulfilment(fulfilment),
      },
      {
        onSuccess: () => {
          setErrors({});
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1500);
          toast.success("Brand saved");
        },
        onError: (err) => {
          const f = (err as { fields?: Record<string, string> }).fields ?? {};
          const mapped: Record<string, string> = {};
          for (const [k, v] of Object.entries(f)) mapped[k.split(".").pop() ?? k] = v;
          setErrors(mapped);
          toast.error("Couldn't save", { description: errorMessage(err) });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Section
        id="logo"
        title="Look"
        description="Your logo and cover appear on your shop page, in search and on every order."
      >
        <ImagePicker
          image={cover.ref}
          name={name}
          variant="cover"
          label="Upload a cover image"
          onUploaded={(id, ref) => setCover({ id, ref })}
        />
        <div className="-mt-12 ml-5 flex items-end gap-4">
          <ImagePicker
            image={logo.ref}
            name={name}
            variant="logo"
            label="Upload a logo"
            onUploaded={(id, ref) => setLogo({ id, ref })}
            className="ring-4 ring-surface"
          />
          <p className="pb-2 text-small text-muted">
            Hover or focus an image to change it. Square logos work best.
          </p>
        </div>
      </Section>
      <Section id="bio" title="Story">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Brand name" error={errors.name}>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
            </Field>
            <Field label="Category">
              <Select
                label="Category"
                value={category}
                onValueChange={(v) => setCategory(v as CategoryId)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Field>
          </div>
          <Field
            label="Tagline"
            error={errors.tagline}
            hint="One line. Shows on cards and in search."
          >
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={80} />
          </Field>
          <Field
            label="Bio"
            optional
            error={errors.bio}
            hint={`${bio.length}/400 · Who are you, what do you make, why should students care?`}
          >
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={400} />
          </Field>
        </div>
      </Section>
      <Section title="Opening hours" description="Buyers see whether you're open right now.">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Open days">
          {DAYS.map((d, i) => (
            <button
              key={d}
              type="button"
              aria-pressed={days.includes(i)}
              onClick={() =>
                setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort())
              }
              className={cn(
                "h-10 w-12 rounded-md text-small font-medium transition-colors",
                days.includes(i)
                  ? "bg-primary text-on-primary"
                  : "bg-surface-2 text-ink-2 hairline hover:text-ink",
              )}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="mt-4 grid max-w-sm grid-cols-2 gap-4">
          <Field label="Opens">
            <Input type="time" value={opens} onChange={(e) => setOpens(e.target.value)} />
          </Field>
          <Field label="Closes">
            <Input type="time" value={closes} onChange={(e) => setCloses(e.target.value)} />
          </Field>
        </div>
        {errors.hours && <p className="mt-2 text-small font-medium text-danger">{errors.hours}</p>}
      </Section>
      <Section title="Pickup & delivery">
        <FulfilmentFields
          value={fulfilment}
          onChange={setFulfilment}
          campus={campus}
          errors={errors}
        />
      </Section>
      <div className="sticky bottom-[calc(var(--tabbar-h)+12px)] z-(--z-sticky) flex justify-end lg:bottom-4">
        <Button
          size="lg"
          className="shadow-lg"
          loading={update.isPending}
          success={saved}
          onClick={save}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}

function VacationCard({ brand }: { brand: Brand }) {
  const update = useUpdateBrand();
  return (
    <div
      className={cn(
        "rounded-lg p-5 hairline transition-colors",
        brand.vacation ? "bg-warning-soft" : "bg-surface",
      )}
    >
      <Switch
        checked={brand.vacation}
        onCheckedChange={(vacation) =>
          update.mutate(
            { vacation },
            {
              onSuccess: () =>
                toast(vacation ? "Vacation mode on" : "You're open again", {
                  description: vacation
                    ? "Your shop stays visible but can't take orders."
                    : "Buyers can order from you.",
                }),
            },
          )
        }
        label="Vacation mode"
        description="Pause new orders (exams, holidays) without hiding your shop."
      />
    </div>
  );
}

export function StudioBrandSettings() {
  const { data: brand, isPending } = useMyBrand();
  if (isPending || !brand) {
    return (
      <div className="flex flex-col gap-6" aria-hidden>
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-72 w-full" rounded="lg" />
      </div>
    );
  }
  return (
    <div>
      <StudioHeaderBlock
        eyebrow="Brand"
        title="Brand settings"
        description={`kiosk/${brand.handle}`}
        actions={
          <ButtonLink
            href={`/brands/${brand.handle}`}
            variant="secondary"
            trailingIcon={<ExternalLink className="size-4" />}
          >
            View shop
          </ButtonLink>
        }
      />
      <div className="mb-6">
        <VacationCard brand={brand} />
      </div>
      <BrandForm key={brand.id} brand={brand} />
    </div>
  );
}
