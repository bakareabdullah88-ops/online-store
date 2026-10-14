"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogIn, LogOut, Settings, Star } from "lucide-react";
import { Popover } from "@/components/ui/overlay";
import { AppearanceControls } from "@/components/shell/appearance";
import { useSession, useSignOut } from "@/queries/session";
import { useCampus } from "@/queries/catalog";
import { toast } from "@/stores/toast";
import { UserAvatar } from "./user-avatar";

/** Avatar button with profile links, appearance and sign out. */
export function AccountMenu({ side = "bottom" }: { side?: "right" | "bottom" }) {
  const { user } = useSession();
  const campus = useCampus(user?.campusId);
  const signOut = useSignOut();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const close = () => setOpen(false);
  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={side === "right" ? "start" : "end"}
      className="w-72 p-2"
      trigger={
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full ring-2 ring-transparent transition-shadow hover:ring-line-strong focus-visible:ring-accent"
        >
          <UserAvatar size={side === "right" ? 44 : 36} />
        </button>
      }
    >
      <div className="flex items-center gap-3 px-2 py-2">
        <UserAvatar size={40} />
        <div className="min-w-0">
          <p className="truncate text-small font-semibold">{user.name}</p>
          <p className="truncate text-[12px] text-muted">
            {user.preview
              ? "Preview account · sample data"
              : `${campus?.shortName ? `${campus.shortName} · ` : ""}${user.email}`}
          </p>
        </div>
      </div>
      <div className="my-1 h-px bg-line" />
      {user.preview && (
        <Link
          href="/login"
          onClick={close}
          className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-small font-medium hover:bg-ink/[0.05]"
        >
          <LogIn className="size-4 text-muted" /> Log in with your account
        </Link>
      )}
      <Link
        href="/account/settings"
        onClick={close}
        className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-small font-medium hover:bg-ink/[0.05]"
      >
        <Settings className="size-4 text-muted" /> Settings
      </Link>
      <Link
        href="/account/reviews"
        onClick={close}
        className="flex h-10 items-center gap-2.5 rounded-md px-2.5 text-small font-medium hover:bg-ink/[0.05]"
      >
        <Star className="size-4 text-muted" /> My reviews
      </Link>
      <div className="my-1 h-px bg-line" />
      <AppearanceControls className="px-2.5 py-2" />
      <div className="my-1 h-px bg-line" />
      <button
        type="button"
        onClick={() =>
          // mutateAsync: this menu unmounts as soon as the session clears.
          void signOut.mutateAsync().then(() => {
            close();
            router.push("/");
            toast(user.preview ? "Thanks for looking around" : "Signed out");
          })
        }
        className="flex h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-small font-medium text-danger hover:bg-danger-soft"
      >
        <LogOut className="size-4" /> {user.preview ? "Leave the preview" : "Sign out"}
      </button>
    </Popover>
  );
}
