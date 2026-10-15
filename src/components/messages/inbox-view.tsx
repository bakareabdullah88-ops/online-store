"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ChevronDown,
  Compass,
  ExternalLink,
  MessageCircle,
  Search,
  Star,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { TableEmpty } from "@/components/table/empty";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useMediaQuery } from "@/lib/use-media-query";
import { useBrand, useCampuses } from "@/queries/catalog";
import { useThreads } from "@/queries/inbox";
import { useMyBrand } from "@/queries/studio";
import type { Thread } from "@/services/types";
import { usePrefs } from "@/stores/ui";
import { Conversation } from "./conversation";
import { buyerReplies, shopReplies } from "./quick-replies";

type Filter = "all" | "unread" | "starred";

function StarButton({ id, label }: { id: string; label: string }) {
  const starred = usePrefs((s) => s.starredThreads.includes(id));
  const toggle = usePrefs((s) => s.toggleStar);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={starred}
      aria-label={starred ? `Unstar ${label}` : `Star ${label}`}
      className="tap-area grid size-7 place-items-center rounded-full text-faint transition-colors hover:text-ink"
    >
      <motion.span
        key={String(starred)}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={spring.bouncy}
      >
        <Star className={cn("size-4", starred && "fill-warning text-warning")} />
      </motion.span>
    </button>
  );
}

/** The open conversation, with quick replies built from the shop's real details. */
function ThreadPane({
  thread,
  as,
  onBack,
}: {
  thread: Thread;
  as: "buyer" | "brand";
  onBack: () => void;
}) {
  const myBrand = useMyBrand().data;
  const theirBrand = useBrand(as === "buyer" ? thread.brandHandle : "").data;
  const campuses = useCampuses().data;
  const brand = as === "brand" ? myBrand : theirBrand;
  const campus = campuses?.find((c) => c.id === brand?.campusId);
  const replies = useMemo(
    () =>
      as === "brand"
        ? brand
          ? shopReplies(brand, campus, thread.buyerName)
          : undefined
        : buyerReplies(brand ?? undefined),
    [as, brand, campus, thread.buyerName],
  );
  const name = as === "buyer" ? thread.brandName : thread.buyerName;
  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-5">
        <button
          type="button"
          onClick={onBack}
          className="grid size-9 place-items-center rounded-full hover:bg-ink/[0.06] lg:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="size-5" />
        </button>
        {as === "buyer" ? (
          <span className="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-line">
            <AppImage image={thread.brandLogo} alt="" variant="logo" name={thread.brandName} />
          </span>
        ) : (
          <Avatar name={thread.buyerName} size={40} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{name}</p>
          <p className="truncate text-[12px] text-muted">
            {as === "buyer"
              ? `${campus?.shortName ?? "Campus"} shop`
              : `Buyer${campus ? ` · ${campus.shortName}` : ""}`}
          </p>
        </div>
        <StarButton id={thread.id} label={name} />
        {as === "buyer" ? (
          <Link
            href={`/brands/${thread.brandHandle}`}
            aria-label={`Open ${thread.brandName}`}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink"
          >
            <ExternalLink className="size-4" />
          </Link>
        ) : (
          <Link
            href={`/studio/orders?q=${encodeURIComponent(thread.buyerName)}`}
            aria-label={`Orders from ${thread.buyerName}`}
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink"
          >
            <ExternalLink className="size-4" />
          </Link>
        )}
      </header>
      <Conversation
        key={thread.id}
        threadId={thread.id}
        as={as}
        replies={replies}
        footnote={`Only you and ${name} can see this. Never share passwords or card details.`}
        className="min-h-0 flex-1 px-4 pb-3 md:px-5"
      />
    </>
  );
}

/** Two-pane inbox from the video: conversation left, "All messages" right. Phones show one pane. */
export function InboxView({
  as,
  emptyBody,
}: {
  as: "buyer" | "brand";
  title?: string;
  emptyBody: string;
}) {
  const { data, isPending } = useThreads(as);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/messages";
  const now = useNow(60_000);
  const starred = usePrefs((s) => s.starredThreads);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const selectedId = params.get("thread");
  // Wide screens open the latest conversation straight away, like a mail client.
  const wide = useMediaQuery("(min-width: 1024px)");
  const selected = data?.find((t) => t.id === selectedId) ?? (wide ? (data?.[0] ?? null) : null);
  const unreadOf = (t: Thread) => (as === "buyer" ? t.unreadForBuyer : t.unreadForBrand);
  const nameOf = (t: Thread) => (as === "buyer" ? t.brandName : t.buyerName);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter(
      (t) =>
        (filter === "all" || (filter === "unread" ? unreadOf(t) > 0 : starred.includes(t.id))) &&
        (!term ||
          nameOf(t).toLowerCase().includes(term) ||
          t.messages.some((m) => m.body.toLowerCase().includes(term))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filter, q, starred]);

  if (!isPending && !data?.length) {
    return (
      <TableEmpty
        icon={MessageCircle}
        title="No messages yet"
        body={emptyBody}
        action={
          as === "buyer" ? (
            <ButtonLink href="/explore" leadingIcon={<Compass className="size-4" />}>
              Discover shops
            </ButtonLink>
          ) : undefined
        }
      />
    );
  }

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All messages" },
    { value: "unread", label: "Unread" },
    { value: "starred", label: "Starred" },
  ];

  return (
    <div className="grid gap-3 lg:h-[calc(100dvh-210px)] lg:min-h-[560px] lg:grid-cols-[minmax(0,1fr)_340px]">
      <section
        aria-label="Conversation"
        className={cn(
          "card flex min-h-[70dvh] flex-col overflow-hidden lg:min-h-0",
          !selected && "max-lg:hidden",
        )}
      >
        {selected ? (
          <ThreadPane
            thread={selected}
            as={as}
            onBack={() => router.replace(pathname, { scroll: false })}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
              <MessageCircle className="size-6 text-ink-2" />
            </span>
            <p className="text-small text-muted">Choose a conversation from the list.</p>
          </div>
        )}
      </section>

      <section
        aria-label="All messages"
        className={cn("card flex min-h-0 flex-col overflow-hidden", selected && "max-lg:hidden")}
      >
        <header className="flex h-14 items-center gap-2 border-b border-line px-4">
          <AnimatePresence mode="wait" initial={false}>
            {searching ? (
              <motion.label
                key="search"
                initial={{ opacity: 0, width: "40%" }}
                animate={{ opacity: 1, width: "100%" }}
                exit={{ opacity: 0 }}
                className="flex flex-1 items-center gap-2"
              >
                <Search className="size-4 shrink-0 text-muted" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search messages"
                  aria-label="Search messages"
                  className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint"
                />
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setSearching(false);
                  }}
                  aria-label="Close search"
                  className="grid size-8 place-items-center rounded-full text-muted hover:bg-ink/[0.06]"
                >
                  <X className="size-4" />
                </button>
              </motion.label>
            ) : (
              <motion.div
                key="title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-1 items-center gap-2"
              >
                <h2 className="flex-1 text-[15px] font-semibold">
                  {filters.find((f) => f.value === filter)?.label}
                </h2>
                <button
                  type="button"
                  onClick={() => setSearching(true)}
                  aria-label="Search messages"
                  className="grid size-8 place-items-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink"
                >
                  <Search className="size-4" />
                </button>
                <Menu>
                  <MenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium text-accent-ink hover:bg-ink/[0.04]"
                    >
                      Filter <ChevronDown className="size-3.5" />
                    </button>
                  </MenuTrigger>
                  <MenuContent>
                    {filters.map((f) => (
                      <MenuItem key={f.value} onSelect={() => setFilter(f.value)}>
                        {f.label}
                      </MenuItem>
                    ))}
                  </MenuContent>
                </Menu>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {isPending
            ? [0, 1, 2, 3].map((i) => (
                <li key={i} className="flex gap-3 p-3">
                  <Skeleton className="size-10" rounded="full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-3.5 w-full" />
                  </div>
                </li>
              ))
            : list.map((t, i) => {
                const last = t.messages.at(-1);
                const unread = unreadOf(t);
                const name = nameOf(t);
                const on = t.id === selected?.id;
                return (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ ...spring.smooth, delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <Link
                      href={`${pathname}?thread=${t.id}`}
                      scroll={false}
                      aria-current={on ? "true" : undefined}
                      className={cn(
                        "relative flex gap-3 rounded-2xl p-3 transition-colors",
                        on ? "" : "hover:bg-ink/[0.03]",
                      )}
                    >
                      {on && (
                        <motion.span
                          layoutId="inbox-active"
                          transition={spring.snappy}
                          className="absolute inset-0 rounded-2xl bg-surface-2 ring-1 ring-line"
                          aria-hidden
                        />
                      )}
                      <span className="relative">
                        {as === "buyer" ? (
                          <span className="block size-10 overflow-hidden rounded-full ring-1 ring-line">
                            <AppImage
                              image={t.brandLogo}
                              alt=""
                              variant="logo"
                              name={t.brandName}
                            />
                          </span>
                        ) : (
                          <Avatar name={t.buyerName} size={40} />
                        )}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-[14px]",
                              unread ? "font-semibold" : "font-medium",
                            )}
                          >
                            {name}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted">
                            {now ? formatRelative(t.updatedAt, now) : ""}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2">
                          <span
                            className={cn(
                              "truncate text-[12.5px]",
                              unread ? "text-ink" : "text-muted",
                            )}
                          >
                            {last
                              ? `${last.from === as ? "You: " : ""}${last.body}`
                              : "New conversation"}
                          </span>
                          <span className="ml-auto flex shrink-0 items-center gap-1">
                            {unread > 0 && (
                              <span className="grid size-5 place-items-center rounded-full bg-accent text-[10.5px] font-semibold text-on-accent tabular">
                                {unread}
                              </span>
                            )}
                            <StarButton id={t.id} label={name} />
                          </span>
                        </span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
          {!isPending && list.length === 0 && (
            <li className="p-6 text-center text-small text-muted">
              {filter === "starred" ? "Star a conversation to keep it here." : "Nothing matches."}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
