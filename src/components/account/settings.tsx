"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { useRef, useState } from "react";
import {
  BellRing,
  Camera,
  Globe,
  LogOut,
  Palette,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import { AddressPicker } from "@/components/address/address-picker";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Field, Input, PasswordInput } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Select } from "@/components/ui/overlay";
import { Dialog } from "@/components/ui/sheet";
import { SegmentedControl } from "@/components/ui/tabs";
import { FontPicker } from "@/components/ui/font-picker";
import { useTheme, type ThemePreference } from "@/components/providers/theme";
import { useCampuses } from "@/queries/catalog";
import { useObjectUrl } from "@/queries/media";
import {
  useDeleteAccount,
  useSession,
  useSignOut,
  useUpdateNotificationPrefs,
  useUpdateProfile,
} from "@/queries/session";
import { useUploadImage } from "@/queries/studio";
import { profileSchema } from "@/services/inputs";
import { errorMessage, isServiceError } from "@/services/errors";
import type { User } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { NavPageHeader } from "@/components/app/nav-header";
import { BuddyAvatar } from "@/components/app/buddy";
import { buddyFor } from "@/components/app/user-avatar";
import {
  BUDDY_COLORS,
  BUDDY_SHAPES,
  buddyColors,
  buddyShapeNames,
  type Buddy,
} from "@/domain/buddy";
import { cn } from "@/lib/cn";

function Section({
  title,
  description,
  icon,
  tone = "var(--chart-blue)",
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card grid grid-cols-1 gap-6 py-6 md:grid-cols-[240px_1fr] md:py-8">
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className="grid size-10 shrink-0 place-items-center rounded-xl tone-tile [&_svg]:size-5"
            style={{ ["--tone" as string]: tone }}
          >
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-title font-semibold">{title}</h2>
          {description && <p className="mt-1 text-small text-muted">{description}</p>}
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** `returnTo`: where to go after saving, when another page sent the user here (?next=). */
function ProfileForm({ user, returnTo }: { user: User; returnTo: string | null }) {
  const router = useRouter();
  const campuses = useCampuses();
  const update = useUpdateProfile();
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [campusId, setCampusId] = useState(user.campusId ?? "");
  const [hall, setHall] = useState(user.hallZoneId ?? "");
  const [faculty, setFaculty] = useState(user.facultyZoneId ?? "");
  const campus = campuses.data?.find((c) => c.id === campusId);
  const [avatarId, setAvatarId] = useState<string | undefined>(
    user.avatar?.kind === "blob" ? user.avatar.id : undefined,
  );
  const [usePhoto, setUsePhoto] = useState(!!user.avatar);
  const [buddy, setBuddy] = useState<Buddy>(() => buddyFor(user));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const url = useObjectUrl(avatarId);
  const pickBuddy = (b: Buddy) => {
    setBuddy(b);
    setUsePhoto(false);
  };

  const save = () => {
    const parsed = profileSchema.safeParse({ name, phone, campusId, avatarImageId: avatarId });
    if (!parsed.success) {
      const e: Record<string, string> = {};
      for (const i of parsed.error.issues) e[String(i.path[0])] ??= i.message;
      setErrors(e);
      return;
    }
    setErrors({});
    update.mutate(
      {
        name,
        phone,
        campusId,
        // Empty clears them.
        hallZoneId: hall || null,
        facultyZoneId: faculty || null,
        buddy,
        ...(usePhoto && avatarId ? { avatarImageId: avatarId } : {}),
        ...(!usePhoto && user.avatar ? { removeAvatar: true } : {}),
      },
      {
        onSuccess: () => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1500);
          toast.success("Profile saved", {
            description: returnTo ? "Taking you back." : undefined,
          });
          if (returnTo) router.push(returnTo);
        },
        onError: (e) => {
          if (isServiceError(e) && e.fields) setErrors(e.fields);
          toast.error(errorMessage(e));
        },
      },
    );
  };

  return (
    <form
      className="flex max-w-lg flex-col gap-5"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 text-small font-medium">Profile picture</legend>
        <div className="flex items-center gap-4">
          {usePhoto ? (
            <Avatar name={name || "You"} src={url ?? null} size={88} />
          ) : (
            <BuddyAvatar
              key={`${buddy.shape}-${buddy.color}`}
              buddy={buddy}
              size={88}
              label={`Your buddy: ${buddyColors[buddy.color].name} ${buddyShapeNames[buddy.shape]}`}
            />
          )}
          <div className="flex flex-col items-start gap-2">
            <p className="text-small text-muted">
              {usePhoto
                ? "Your photo shows on your profile."
                : "Your buddy waves from your profile icon. Point at it to say hi."}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                aria-label="Upload a profile photo"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f)
                    upload.mutate(f, {
                      onSuccess: (r) => {
                        setAvatarId(r.id);
                        setUsePhoto(true);
                      },
                      onError: (err) => toast.error(errorMessage(err)),
                    });
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<Camera className="size-4" />}
                loading={upload.isPending}
                onClick={() => fileRef.current?.click()}
              >
                {usePhoto ? "Change photo" : "Use a photo"}
              </Button>
              {usePhoto && (
                <Button variant="ghost" size="sm" onClick={() => setUsePhoto(false)}>
                  Use my buddy
                </Button>
              )}
            </div>
          </div>
        </div>
        <div role="radiogroup" aria-label="Buddy" className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {BUDDY_SHAPES.map((shape) => {
            const on = !usePhoto && buddy.shape === shape;
            return (
              <button
                key={shape}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={buddyShapeNames[shape]}
                title={buddyShapeNames[shape]}
                onClick={() => pickBuddy({ ...buddy, shape })}
                className={cn(
                  "grid aspect-square place-items-center rounded-xl ring-1 transition-[box-shadow,background-color]",
                  on ? "bg-accent-soft ring-2 ring-accent" : "ring-line hover:bg-ink/[0.04]",
                )}
              >
                <BuddyAvatar buddy={{ shape, color: buddy.color }} size={40} animated={false} />
              </button>
            );
          })}
        </div>
        <div role="radiogroup" aria-label="Buddy colour" className="flex flex-wrap gap-2.5">
          {BUDDY_COLORS.map((color) => {
            const on = !usePhoto && buddy.color === color;
            const c = buddyColors[color];
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={c.name}
                title={c.name}
                onClick={() => pickBuddy({ ...buddy, color })}
                className={cn(
                  "tap-area size-8 rounded-full ring-offset-2 ring-offset-surface transition-shadow",
                  on ? "ring-2 ring-ink" : "ring-1 ring-line",
                )}
                style={{
                  background: `linear-gradient(135deg, ${c.light}, ${c.base} 55%, ${c.shade})`,
                }}
              />
            );
          })}
        </div>
      </fieldset>
      <Field label="Name" error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field
        label="Email"
        hint="Changing your email needs a verification step that isn't switched on yet."
      >
        <Input value={user.email} readOnly className="bg-surface-2" />
      </Field>
      <Field label="Phone" error={errors.phone}>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
        />
      </Field>
      <Field label="Campus" error={errors.campusId}>
        <Select
          value={campusId || undefined}
          onValueChange={(v) => {
            if (v === campusId) return;
            // A hall or faculty belongs to one campus.
            setCampusId(v);
            setHall("");
            setFaculty("");
          }}
          placeholder="Choose your campus"
          label="Campus"
          options={(campuses.data ?? []).map((c) => ({
            value: c.id,
            label: c.name,
            hint: c.shortName,
          }))}
        />
      </Field>
      {campus && (
        <>
          <AddressPicker
            campus={campus}
            value={hall}
            onChange={setHall}
            kinds={["hostel"]}
            label="Your hall"
            error={errors.hallZoneId}
            hint="Shops from your hall and faculty show up first."
            optional
            clearable
          />
          <AddressPicker
            campus={campus}
            value={faculty}
            onChange={setFaculty}
            kinds={["faculty"]}
            label="Your faculty"
            error={errors.facultyZoneId}
            optional
            clearable
          />
        </>
      )}
      <Button type="submit" className="self-start" loading={update.isPending} success={saved}>
        Save profile
      </Button>
    </form>
  );
}

function NotificationPrefs({ user }: { user: User }) {
  const update = useUpdateNotificationPrefs();
  const p = user.notificationPrefs;
  const rows: { key: keyof User["notificationPrefs"]; label: string; description: string }[] = [
    {
      key: "orderUpdates",
      label: "Order updates",
      description: "Confirmed, on the way, delivered.",
    },
    { key: "messages", label: "Messages", description: "When a brand replies to you." },
    { key: "newFromFollowed", label: "New drops", description: "From brands you follow." },
    {
      key: "promotions",
      label: "Deals and promo codes",
      description: "A few times a month, never spam.",
    },
  ];
  return (
    <div className="flex max-w-lg flex-col gap-5">
      {rows.map((r) => (
        <Switch
          key={r.key}
          checked={p[r.key]}
          onCheckedChange={(v) => update.mutate({ [r.key]: v })}
          label={r.label}
          description={r.description}
        />
      ))}
    </div>
  );
}

export function SettingsView() {
  const { user } = useSession();
  const { preference, setPreference } = useTheme();
  const remove = useDeleteAccount();
  const signOut = useSignOut();
  const clearBag = useBag((s) => s.clear);
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const returnTo = safeNext(useSearchParams().get("next"));
  if (!user) return null;

  return (
    <div>
      <NavPageHeader eyebrow="Settings" title="Settings" />
      <Section
        title="Profile"
        icon={<UserRound />}
        tone="var(--chart-blue)"
        description="How sellers see you."
      >
        <ProfileForm user={user} returnTo={returnTo} />
      </Section>
      <Section
        title="Notifications"
        icon={<BellRing />}
        tone="#f59e0b"
        description="Choose what we tell you about."
      >
        <NotificationPrefs user={user} />
      </Section>
      <Section
        title="Appearance"
        icon={<Palette />}
        tone="var(--chart-violet)"
        description="Theme and font style. Saved on this device."
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-small font-medium">Theme</p>
            <SegmentedControl<ThemePreference>
              label="Theme"
              value={preference}
              onChange={setPreference}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
                { value: "system", label: "Match device" },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-small font-medium">Font style</p>
            <FontPicker />
          </div>
        </div>
      </Section>
      <Section
        title="Language"
        icon={<Globe />}
        tone="#14b8a6"
        description="More languages will be added later."
      >
        <p className="flex items-center gap-3 text-body">
          English (Nigeria)
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted uppercase">
            Only option for now
          </span>
        </p>
      </Section>
      <Section
        icon={<ShieldAlert />}
        tone="#f43f5e"
        title="Account"
        description="Sign out of this device, or delete your account for good."
      >
        <div className="flex max-w-lg flex-col items-start gap-3">
          <p className="text-small text-muted">
            Deleting removes your profile, your shop and its products, saved addresses and uploads.
            Orders other people placed with you stay in their history.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              leadingIcon={<LogOut className="size-4.5" />}
              loading={signOut.isPending}
              onClick={() => void signOut.mutateAsync().then(() => router.push("/"))}
            >
              Sign out
            </Button>
            <Button
              variant="danger"
              leadingIcon={<Trash2 className="size-4.5" />}
              onClick={() => {
                setPassword("");
                setDeleteError(null);
                setConfirm(true);
              }}
            >
              Delete account
            </Button>
          </div>
        </div>
      </Section>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete your account?"
        description="This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              disabled={!password}
              onClick={() =>
                remove.mutateAsync(password).then(
                  () => {
                    clearBag();
                    setConfirm(false);
                    router.push("/");
                    toast.success("Your account was deleted");
                  },
                  (e) => setDeleteError(errorMessage(e)),
                )
              }
            >
              Delete account
            </Button>
          </>
        }
      >
        {user.hasPassword === false ? (
          // Google-only accounts have no password; typing the email confirms instead.
          <Field label={`Type ${user.email} to confirm`} error={deleteError ?? undefined}>
            <Input
              type="email"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        ) : (
          <Field label="Enter your password to confirm" error={deleteError ?? undefined}>
            <PasswordInput
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        )}
      </Dialog>
    </div>
  );
}
