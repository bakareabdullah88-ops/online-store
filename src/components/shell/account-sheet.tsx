"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { BottomSheet } from "@/components/ui/sheet";
import { Button, ButtonLink } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/tabs";
import { useTheme, type ThemePreference } from "@/components/providers/theme";
import { accountNav, studioNav, studioTabs } from "@/config/nav";
import { brand } from "@/config/brand";
import { useCampus } from "@/queries/catalog";
import { useSession, useSignInDemo, useSignOut } from "@/queries/session";
import { useUi } from "@/stores/ui";
import { toast } from "@/stores/toast";
import { errorMessage } from "@/services/errors";
import { useMode } from "./mode";
import { ModeSwitch } from "./mode-switch";
import { UserAvatar } from "./site-header";

/** Mobile account sheet: profile, the mode switch, shortcuts, theme, sign out. */
export function AccountSheet() {
  const open = useUi((s) => s.accountOpen);
  const setOpen = useUi((s) => s.setAccountOpen);
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const mode = useMode();
  const router = useRouter();
  const signOut = useSignOut();
  const demo = useSignInDemo();
  const { preference, setPreference } = useTheme();
  const close = () => setOpen(false);

  const links =
    mode === "selling"
      ? studioNav.filter((n) => !studioTabs.some((t) => t.href === n.href))
      : accountNav.filter((n) => n.href !== "/orders");

  return (
    <BottomSheet
      open={open}
      onOpenChange={setOpen}
      title={user ? "Account" : `Welcome to ${brand.name}`}
      hideTitle={!!user}
    >
      {user ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 pt-2">
            <UserAvatar size={48} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-title-lg">{user.name}</p>
              <p className="truncate text-small text-muted">
                {campus?.shortName ?? "No campus yet"} · {user.email}
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 eyebrow text-muted">Mode</p>
            <ModeSwitch
              className="w-full [&>button]:flex-1 [&>button]:justify-center"
              onSwitch={close}
            />
          </div>
          <nav
            aria-label={mode === "selling" ? "Studio" : "Account"}
            className="-mx-2 flex flex-col"
          >
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="flex h-12 items-center gap-3 rounded-md px-2 text-body text-ink hover:bg-ink/[0.05]"
                >
                  <Icon className="size-5 text-muted" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight className="size-4 text-faint" />
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center justify-between gap-3">
            <span className="text-small font-medium">Theme</span>
            <SegmentedControl<ThemePreference>
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
          <Button
            variant="secondary"
            leadingIcon={<LogOut className="size-4.5" />}
            loading={signOut.isPending}
            onClick={() =>
              signOut.mutate(undefined, {
                onSuccess: () => {
                  close();
                  router.push("/");
                  toast("Signed out");
                },
              })
            }
          >
            Sign out
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pt-1 pb-2">
          <p className="text-body text-muted">
            Log in to track orders, save favourites and open your own shop.
          </p>
          <ButtonLink href="/signup" onClick={close} size="lg">
            Create an account
          </ButtonLink>
          <ButtonLink href="/login" onClick={close} variant="secondary" size="lg">
            Log in
          </ButtonLink>
          <div className="mt-2 rounded-md bg-canvas-sunk p-4">
            <p className="eyebrow text-muted">Just looking?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["buyer", "seller"] as const).map((k) => (
                <Button
                  key={k}
                  variant="secondary"
                  size="sm"
                  loading={demo.isPending && demo.variables === k}
                  onClick={() =>
                    demo.mutate(k, {
                      onSuccess: () => {
                        close();
                        router.push(k === "seller" ? "/studio" : "/explore");
                        toast.success(`Signed in to the demo ${k} account`);
                      },
                      onError: (e) => toast.error(errorMessage(e)),
                    })
                  }
                >
                  Demo {k}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
