"use client";

import { Avatar } from "@/components/ui/misc";
import { defaultBuddy, isBuddy } from "@/domain/buddy";
import { useObjectUrl } from "@/queries/media";
import { useSession } from "@/queries/session";
import type { User } from "@/services/types";
import { BuddyAvatar } from "./buddy";

/** The buddy this account shows: the one they picked, or the one their account started with. */
export function buddyFor(user: Pick<User, "id" | "buddy">) {
  return isBuddy(user.buddy) ? user.buddy : defaultBuddy(user.id);
}

/** Your profile picture: your photo if you uploaded one, otherwise your animated buddy. */
export function UserAvatar({ size = 32, className }: { size?: number; className?: string }) {
  const { user } = useSession();
  const url = useObjectUrl(user?.avatar?.kind === "blob" ? user.avatar.id : null);
  if (!user) return null;
  if (user.avatar) {
    return <Avatar name={user.name} src={url ?? null} size={size} className={className} />;
  }
  return <BuddyAvatar buddy={buddyFor(user)} size={size} className={className} />;
}
