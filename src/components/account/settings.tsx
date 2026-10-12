"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Camera, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Select } from "@/components/ui/overlay";
import { Dialog } from "@/components/ui/sheet";
import { SegmentedControl } from "@/components/ui/tabs";
import { useTheme, type ThemePreference } from "@/components/providers/theme";
import { useCampuses } from "@/queries/catalog";
import { useObjectUrl } from "@/queries/media";
import {
  useResetDemo,
  useSession,
  useSignOut,
  useUpdateNotificationPrefs,
  useUpdateProfile,
} from "@/queries/session";
import { useUploadImage } from "@/queries/studio";
import { profileSchema } from "@/services/inputs";
import { errorMessage } from "@/services/errors";
import type { User } from "@/services/types";
import { useBag } from "@/stores/bag";
import { toast } from "@/stores/toast";
import { DashboardHeader } from "./dashboard-shell";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-line py-8 md:grid-cols-[240px_1fr]">
      <div>
        <h2 className="text-title font-semibold">{title}</h2>
        {description && <p className="mt-1 text-small text-muted">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ProfileForm({ user }: { user: User }) {
  const campuses = useCampuses();
  const update = useUpdateProfile();
  const upload = useUploadImage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [campusId, setCampusId] = useState(user.campusId ?? "");
  const [avatarId, setAvatarId] = useState<string | undefined>(
    user.avatar?.kind === "blob" ? user.avatar.id : undefined,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const url = useObjectUrl(avatarId);

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
      { name, phone, campusId, ...(avatarId ? { avatarImageId: avatarId } : {}) },
      {
        onSuccess: () => {
          setSaved(true);
          window.setTimeout(() => setSaved(false), 1500);
          toast.success("Profile saved");
        },
        onError: (e) => toast.error(errorMessage(e)),
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
      <div className="flex items-center gap-4">
        <Avatar name={name || "You"} src={url ?? null} size={64} />
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
                onSuccess: (r) => setAvatarId(r.id),
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
          Change photo
        </Button>
      </div>
      <Field label="Name" error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </Field>
      <Field label="Email" hint="Email changes aren't available in the demo.">
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
          onValueChange={setCampusId}
          placeholder="Choose your campus"
          label="Campus"
          options={(campuses.data ?? []).map((c) => ({
            value: c.id,
            label: c.name,
            hint: c.shortName,
          }))}
        />
      </Field>
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
  const reset = useResetDemo();
  const signOut = useSignOut();
  const clearBag = useBag((s) => s.clear);
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  if (!user) return null;

  return (
    <div>
      <DashboardHeader eyebrow="Settings" title="Settings" />
      <Section title="Profile" description="How sellers and riders see you.">
        <ProfileForm user={user} />
      </Section>
      <Section title="Notifications" description="Choose what we tell you about.">
        <NotificationPrefs user={user} />
      </Section>
      <Section title="Appearance" description="Follows your device by default.">
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
      </Section>
      <Section title="Language" description="More languages will be added later.">
        <p className="flex items-center gap-3 text-body">
          English (Nigeria)
          <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 font-mono text-[10px] tracking-wider text-muted uppercase">
            Only option for now
          </span>
        </p>
      </Section>
      <Section
        title="Demo data"
        description="Everything lives in this browser. Reset to start fresh."
      >
        <div className="flex max-w-lg flex-col items-start gap-3">
          <p className="text-small text-muted">
            Resetting deletes your account, orders, shops and uploads on this device, and restores
            the original demo brands and products.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              leadingIcon={<RotateCcw className="size-4.5" />}
              onClick={() => setConfirm(true)}
            >
              Reset demo data
            </Button>
            <Button
              variant="secondary"
              leadingIcon={<LogOut className="size-4.5" />}
              loading={signOut.isPending}
              onClick={() => signOut.mutate(undefined, { onSuccess: () => router.push("/") })}
            >
              Sign out
            </Button>
          </div>
        </div>
      </Section>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Reset all demo data?"
        description="This can't be undone."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={reset.isPending}
              onClick={() =>
                reset.mutate(undefined, {
                  onSuccess: () => {
                    clearBag();
                    setConfirm(false);
                    router.push("/");
                    toast.success("Demo data reset", {
                      description: "Everything is back to how it started.",
                    });
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p className="text-body text-muted">
          You&apos;ll be signed out. Use “Try the demo” to jump back in.
        </p>
      </Dialog>
    </div>
  );
}
