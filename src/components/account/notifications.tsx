"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck, MessageCircle, Package, Star, Store, Tag, Info } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { formatDate, formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useMarkRead, useNotifications } from "@/queries/inbox";
import type { AppNotification } from "@/services/types";
import { NavPageHeader } from "@/components/app/nav-header";

const icons = {
  order: Package,
  message: MessageCircle,
  promo: Tag,
  review: Star,
  follow: Store,
  system: Info,
} as const;

function dayKey(iso: string, now: number) {
  const d = new Date(iso);
  const today = new Date(now);
  const y = new Date(now - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return formatDate(iso, { year: d.getFullYear() !== today.getFullYear() });
}

export function NotificationsView() {
  const { data, isPending } = useNotifications();
  const mark = useMarkRead();
  const now = useNow(30_000);
  const unread = (data ?? []).filter((n) => !n.read).length;
  const groups = new Map<string, AppNotification[]>();
  if (now)
    for (const n of data ?? [])
      groups.set(dayKey(n.createdAt, now), [...(groups.get(dayKey(n.createdAt, now)) ?? []), n]);

  return (
    <div className="max-w-3xl">
      <NavPageHeader
        eyebrow="Notifications"
        title="What's new"
        description={unread ? `${unread} unread` : "You're all caught up."}
        actions={
          unread > 0 && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<CheckCheck className="size-4" />}
              onClick={() => mark.mutate("all")}
            >
              Mark all as read
            </Button>
          )
        }
      />
      {isPending || !now ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" rounded="md" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          illustration="notifications"
          title="No notifications yet"
          body="Order updates, replies and drops from brands you follow land here."
          action={<ButtonLink href="/explore">Explore</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups.entries()].map(([day, items]) => (
            <section key={day} aria-label={day}>
              <h2 className="mb-2 eyebrow text-muted">{day}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-lg bg-surface hairline">
                <AnimatePresence initial={false}>
                  {items.map((n) => {
                    const Icon = icons[n.kind] ?? Bell;
                    const body = (
                      <>
                        <span
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-full",
                            n.read ? "bg-ink/[0.05] text-muted" : "bg-accent-soft text-accent-ink",
                          )}
                        >
                          <Icon className="size-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-small",
                              n.read ? "text-ink-2" : "font-semibold text-ink",
                            )}
                          >
                            {n.title}
                          </span>
                          <span className="mt-0.5 block text-small text-muted">{n.body}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-[12px] text-muted">
                            {formatRelative(n.createdAt, now)}
                          </span>
                          {!n.read && (
                            <span className="size-2 rounded-full bg-accent" aria-label="Unread" />
                          )}
                        </span>
                      </>
                    );
                    return (
                      <motion.li
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={spring.smooth}
                      >
                        {n.href ? (
                          <Link
                            href={n.href}
                            onClick={() => !n.read && mark.mutate(n.id)}
                            className="flex items-start gap-4 px-4 py-4 transition-colors hover:bg-ink/[0.03] md:px-5"
                          >
                            {body}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => !n.read && mark.mutate(n.id)}
                            className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-ink/[0.03] md:px-5"
                          >
                            {body}
                          </button>
                        )}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
