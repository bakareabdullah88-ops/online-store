"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppImage } from "@/components/ui/app-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import { useThreads } from "@/queries/inbox";
import { Conversation } from "./conversation";

/** Two-pane inbox (list + thread). Phones show one pane at a time via ?thread=. */
export function InboxView({ as, title, emptyBody }: { as: "buyer" | "brand"; title: string; emptyBody: string }) {
  const { data, isPending } = useThreads(as);
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/messages";
  const now = useNow(60_000);
  const selectedId = params.get("thread") ?? null;
  const selected = data?.find((t) => t.id === selectedId) ?? null;

  if (!isPending && !data?.length) {
    return (
      <EmptyState
        illustration="messages"
        title="No messages yet"
        body={emptyBody}
        action={as === "buyer" ? <ButtonLink href="/explore">Find a brand</ButtonLink> : undefined}
      />
    );
  }

  return (
    <div className="grid overflow-hidden rounded-lg bg-surface hairline md:h-[min(72dvh,720px)] md:grid-cols-[300px_1fr]">
      <div className={cn("min-h-0 border-line md:border-r", selected && "max-md:hidden")}>
        <h2 className="sr-only">{title}</h2>
        <ul className="h-full overflow-y-auto">
          {isPending
            ? [0, 1, 2].map((i) => (
                <li key={i} className="flex gap-3 border-b border-line p-4">
                  <Skeleton className="size-10" rounded="full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="mt-2 h-3.5 w-full" />
                  </div>
                </li>
              ))
            : data?.map((t) => {
                const last = t.messages[t.messages.length - 1];
                const unread = as === "buyer" ? t.unreadForBuyer : t.unreadForBrand;
                const name = as === "buyer" ? t.brandName : t.buyerName;
                return (
                  <li key={t.id}>
                    <Link
                      href={`${pathname}?thread=${t.id}`}
                      scroll={false}
                      aria-current={t.id === selectedId ? "true" : undefined}
                      className={cn("flex gap-3 border-b border-line p-4 transition-colors", t.id === selectedId ? "bg-canvas-sunk" : "hover:bg-ink/[0.03]")}
                    >
                      {as === "buyer" ? (
                        <span className="size-10 shrink-0 overflow-hidden rounded-full">
                          <AppImage image={t.brandLogo} alt="" variant="logo" name={t.brandName} />
                        </span>
                      ) : (
                        <Avatar name={t.buyerName} size={40} />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn("truncate text-small", unread ? "font-semibold" : "font-medium")}>{name}</span>
                          <span className="shrink-0 text-[11px] text-muted">{now ? formatRelative(t.updatedAt, now) : ""}</span>
                        </span>
                        <span className={cn("mt-0.5 flex items-center gap-2 text-small", unread ? "text-ink" : "text-muted")}>
                          <span className="truncate">{last ? `${last.from === as ? "You: " : ""}${last.body}` : "New conversation"}</span>
                          {unread > 0 && <span className="ml-auto shrink-0 rounded-full bg-accent px-1.5 font-mono text-[10px] leading-5 text-on-accent">{unread}</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
        </ul>
      </div>
      <div className={cn("flex min-h-[60dvh] flex-col md:min-h-0", !selected && "max-md:hidden")}>
        {selected ? (
          <>
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button type="button" onClick={() => router.push(pathname, { scroll: false })} className="flex size-9 items-center justify-center rounded-md hover:bg-ink/[0.06] md:hidden" aria-label="Back to conversations">
                <ArrowLeft className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-body font-semibold">{as === "buyer" ? selected.brandName : selected.buyerName}</p>
                {as === "buyer" && (
                  <Link href={`/brands/${selected.brandHandle}`} className="text-small text-muted underline-offset-4 hover:underline">
                    View shop
                  </Link>
                )}
              </div>
            </header>
            <Conversation key={selected.id} threadId={selected.id} as={as} className="min-h-0 flex-1 px-4 pb-4" />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-small text-muted">Choose a conversation</div>
        )}
      </div>
    </div>
  );
}
