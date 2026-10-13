"use client";

import { Avatar } from "@/components/ui/misc";
import { useObjectUrl } from "@/queries/media";
import { useSession } from "@/queries/session";

export function UserAvatar({ size = 32, className }: { size?: number; className?: string }) {
  const { user } = useSession();
  const url = useObjectUrl(user?.avatar?.kind === "blob" ? user.avatar.id : null);
  if (!user) return null;
  return <Avatar name={user.name} src={url ?? null} size={size} className={className} />;
}
