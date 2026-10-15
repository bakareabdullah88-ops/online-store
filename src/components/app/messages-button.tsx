"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useMode } from "@/components/shell/mode";
import { cn } from "@/lib/cn";
import { useNavBadges } from "./nav-badges";

/**
 * Messages, with the number of unread conversations. Counts both inboxes (as
 * a buyer and as a shop), so a new message is never missed in either mode,
 * and opens whichever inbox has something new.
 */
export function MessagesButton({ className }: { className?: string }) {
  const mode = useMode();
  const { messages, shopMessages } = useNavBadges();
  const total = messages + shopMessages;
  const href =
    mode === "selling"
      ? shopMessages || !messages
        ? "/studio/messages"
        : "/messages"
      : messages || !shopMessages
        ? "/messages"
        : "/studio/messages";
  return (
    <Link
      href={href}
      aria-label={total ? `Messages, ${total} unread` : "Messages"}
      className={cn(
        "relative grid size-10 shrink-0 pressable place-items-center rounded-xl text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink max-[380px]:size-9",
        className,
      )}
    >
      <MessageCircle className="size-[18px]" />
      {total > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-badge px-1 text-[10px] font-bold text-white tabular ring-2 ring-surface">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Link>
  );
}
