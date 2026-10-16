"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { AddressPicker } from "@/components/address/address-picker";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Avatar, ProgressBar } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { safeNext } from "@/lib/safe-next";
import { useSpot } from "@/stores/spot";
import { focusCampusId } from "@/config/brand";
import { useCampuses } from "@/queries/catalog";
import { useObjectUrl } from "@/queries/media";
import { useSession, useUpdateProfile } from "@/queries/session";
import { useUploadImage } from "@/queries/studio";
import { profileSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";

const steps = ["Campus", "Details", "Photo"] as const;

export function WelcomeFlow() {
  const { user, isReady } = useSession();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const router = useRouter();
  const reduce = useReducedMotion();
  const campuses = useCampuses();
  const update = useUpdateProfile();
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [campusId, setCampusId] = useState<string>("");
  /** Null until they choose; until then it's what's saved, or a guess from the landing page. */
  const [hallPick, setHall] = useState<string | null>(null);
  const [facultyPick, setFaculty] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarId, setAvatarId] = useState<string | undefined>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarUrl = useObjectUrl(avatarId);
  const campus = campuses.data?.find((c) => c.id === campusId);
  // A hall or faculty picked on the landing page is a good first guess; they can change it.
  const spot = useSpot((st) => st.spot);
  const spotZone =
    spot?.campusId === campusId ? campus?.zones.find((z) => z.id === spot.zoneId) : undefined;
  const hall = hallPick ?? user?.hallZoneId ?? (spotZone?.kind === "hostel" ? spotZone.id : "");
  const faculty =
    facultyPick ?? user?.facultyZoneId ?? (spotZone?.kind === "faculty" ? spotZone.id : "");
  const seeded = useRef(false);

  useEffect(() => {
    if (isReady && !user) router.replace("/login?next=/welcome");
  }, [isReady, user, router]);

  useEffect(() => {
    if (!user || seeded.current) return;
    seeded.current = true;
    setName(user.name);
    setPhone(user.phone);
    // The campus they picked a spot on before signing up, if they haven't chosen one yet.
    setCampusId(user.campusId ?? useSpot.getState().spot?.campusId ?? focusCampusId);
  }, [user]);

  // Move focus to each new step's heading so keyboard and screen-reader users land on it.
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

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const validateDetails = () => {
    const r = profileSchema.safeParse({ name, campusId, phone });
    if (r.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const i of r.error.issues) e[String(i.path[0])] ??= i.message;
    setErrors(e);
    return !e.name && !e.phone;
  };

  const finish = (withAvatar: boolean) =>
    update.mutate(
      {
        name,
        campusId,
        phone,
        // Null clears one they took out; leaving it out keeps what's saved.
        ...(hall || hallPick !== null ? { hallZoneId: hall || null } : {}),
        ...(faculty || facultyPick !== null ? { facultyZoneId: faculty || null } : {}),
        ...(withAvatar && avatarId ? { avatarImageId: avatarId } : {}),
      },
      {
        onSuccess: (u) => {
          toast.success(`You're all set, ${u.name.split(" ")[0]}`, {
            description: "Here's what's on your campus.",
          });
          router.push(next ?? "/home");
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  const onFile = (file: File | undefined) => {
    if (!file) return;
    upload.mutate(file, {
      onSuccess: (r) => setAvatarId(r.id),
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  const variants = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: d * -40 }),
  };

  return (
    <div className="w-full max-w-lg">
      <div className="flex items-center gap-4">
        {step > 0 ? (
          <Button variant="ghost" size="icon-sm" aria-label="Back" onClick={() => go(step - 1)}>
            <ArrowLeft className="size-4.5" />
          </Button>
        ) : (
          <span className="size-9" />
        )}
        <ProgressBar
          value={step + 1}
          max={steps.length}
          label="Onboarding progress"
          className="flex-1"
        />
        <span className="font-mono text-label text-muted tabular">
          {step + 1}/{steps.length}
        </span>
      </div>

      <div data-wizard className="relative mt-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={spring.smooth}
          >
            {step === 0 && (
              <section aria-labelledby="w-campus">
                <p className="eyebrow text-muted">Step 1 · Your campus</p>
                <h1 id="w-campus" className="mt-2 font-display text-display-md text-balance">
                  Where do you study?
                </h1>
                <p className="mt-2 text-body text-muted">
                  We&apos;ll show you brands that deliver to your campus first.
                </p>
                <div role="radiogroup" aria-label="Campus" className="mt-6 grid grid-cols-2 gap-2">
                  {campuses.isPending
                    ? Array.from({ length: 8 }, (_, i) => (
                        <Skeleton key={i} className="h-[74px]" rounded="md" />
                      ))
                    : campuses.data?.map((c) => {
                        const active = c.id === campusId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              if (c.id === campusId) return;
                              setCampusId(c.id);
                              setHall("");
                              setFaculty("");
                            }}
                            className={cn(
                              "relative flex flex-col items-start rounded-md bg-surface p-3.5 text-left transition-shadow",
                              active
                                ? "shadow-[inset_0_0_0_2px_var(--ink)]"
                                : "shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--muted)]",
                            )}
                          >
                            <span className="font-mono text-small font-semibold">
                              {c.shortName}
                            </span>
                            <span className="mt-0.5 line-clamp-1 text-small text-muted">
                              {c.city}, {c.state}
                            </span>
                            {active && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={spring.bouncy}
                                className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-on-primary"
                              >
                                <Check className="size-3" strokeWidth={3} />
                              </motion.span>
                            )}
                          </button>
                        );
                      })}
                </div>
                {campus && (
                  <div className="mt-6 flex flex-col gap-4 border-t border-line-thin pt-6">
                    <p className="text-body text-muted">
                      Shops from your hall and faculty show up first.
                    </p>
                    <AddressPicker
                      campus={campus}
                      value={hall}
                      onChange={setHall}
                      kinds={["hostel"]}
                      label="Your hall"
                      optional
                      clearable
                    />
                    <AddressPicker
                      campus={campus}
                      value={faculty}
                      onChange={setFaculty}
                      kinds={["faculty"]}
                      label="Your faculty"
                      optional
                      clearable
                    />
                  </div>
                )}
                <Button
                  size="lg"
                  className="mt-8 w-full"
                  disabled={!campusId}
                  onClick={() => go(1)}
                >
                  Continue
                </Button>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="w-details">
                <p className="eyebrow text-muted">Step 2 · Your details</p>
                <h1 id="w-details" className="mt-2 font-display text-display-md">
                  How should sellers reach you?
                </h1>
                <p className="mt-2 text-body text-muted">
                  Only brands you order from see your phone number, for delivery.
                </p>
                <form
                  className="mt-6 flex flex-col gap-5"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (validateDetails()) go(2);
                  }}
                >
                  <Field label="Name" error={errors.name}>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Phone number" error={errors.phone} hint="e.g. 0803 123 4567">
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="0803 123 4567"
                    />
                  </Field>
                  <Button type="submit" size="lg" className="mt-3">
                    Continue
                  </Button>
                </form>
              </section>
            )}

            {step === 2 && (
              <section aria-labelledby="w-photo">
                <p className="eyebrow text-muted">Step 3 · Optional</p>
                <h1 id="w-photo" className="mt-2 font-display text-display-md">
                  Add a profile photo
                </h1>
                <p className="mt-2 text-body text-muted">
                  It helps sellers recognise you at pickup or delivery. You can skip this.
                </p>
                <div className="mt-8 flex items-center gap-5">
                  <div className="relative">
                    <Avatar name={name || "You"} src={avatarUrl ?? null} size={96} />
                    {upload.isPending && <Skeleton className="absolute inset-0" rounded="full" />}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        onFile(e.target.files?.[0]);
                        // Picking the same file again should still work.
                        e.currentTarget.value = "";
                      }}
                      aria-label="Upload profile photo"
                    />
                    <Button
                      variant="secondary"
                      leadingIcon={<Camera className="size-4.5" />}
                      loading={upload.isPending}
                      onClick={() => fileRef.current?.click()}
                    >
                      {avatarId ? "Change photo" : "Upload photo"}
                    </Button>
                    <p className="text-small text-muted">JPG, PNG or WebP · up to 8MB</p>
                  </div>
                </div>
                <div className="mt-10 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => finish(false)}
                    disabled={update.isPending}
                  >
                    Skip for now
                  </Button>
                  <Button size="lg" loading={update.isPending} onClick={() => finish(true)}>
                    Finish
                  </Button>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
