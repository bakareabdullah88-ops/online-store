"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { formatTime, formatDate } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useSendMessage, useThread } from "@/queries/inbox";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";

/** A chat thread with an auto-growing composer. `as` decides which side is "me". */
export function Conversation({
  threadId,
  as,
  className,
  emptyHint,
}: {
  threadId: string;
  as: "buyer" | "brand";
  className?: string;
  emptyHint?: string;
}) {
  const { data: thread, isPending } = useThread(threadId, as);
  const send = useSendMessage(as);
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const count = thread?.messages.length ?? 0;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [count, reduce]);

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    send.mutate(
      { threadId, body: text },
      {
        onError: (e) => {
          setBody(text);
          toast.error("Message not sent", { description: errorMessage(e) });
        },
      },
    );
  };

  let lastDay = "";
  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-1 py-4"
        role="log"
        aria-live="polite"
        aria-label="Messages"
      >
        {isPending ? (
          <div className="flex flex-col gap-3" aria-hidden>
            <Skeleton className="h-10 w-2/3" rounded="lg" />
            <Skeleton className="ml-auto h-10 w-1/2" rounded="lg" />
            <Skeleton className="h-14 w-3/5" rounded="lg" />
          </div>
        ) : count === 0 ? (
          <p className="mx-auto max-w-xs py-10 text-center text-small text-muted">
            {emptyHint ?? "Say hi. Ask about sizes, pickup times or custom orders."}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {thread?.messages.map((m) => {
                const mine = m.from === as;
                const day = mounted ? formatDate(m.at) : "";
                const showDay = day !== lastDay;
                lastDay = day;
                return (
                  <motion.li
                    key={m.id}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={spring.smooth}
                    className="flex flex-col"
                  >
                    {showDay && mounted && (
                      <span className="my-3 self-center eyebrow text-muted">{day}</span>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3.5 py-2.5 text-body",
                        mine
                          ? "self-end rounded-br-xs bg-primary text-on-primary"
                          : "self-start rounded-bl-xs bg-canvas-sunk text-ink",
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-right font-mono text-[10px]",
                          mine ? "opacity-60" : "text-muted",
                        )}
                      >
                        {mounted ? formatTime(m.at) : " "}
                        {m.id.startsWith("optimistic") && " · sending"}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
      <form
        className="flex items-end gap-2 border-t border-line pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor={`composer-${threadId}`} className="sr-only">
          Message
        </label>
        <textarea
          id={`composer-${threadId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Write a message…"
          className="field-sizing-content max-h-32 min-h-11 flex-1 resize-none rounded-md bg-surface px-3.5 py-2.5 text-body shadow-[inset_0_0_0_1px_var(--line-strong)] outline-none placeholder:text-faint focus-visible:shadow-[inset_0_0_0_1.5px_var(--ink)]"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.9 }}
          transition={spring.snappy}
          disabled={!body.trim()}
          className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary disabled:opacity-40"
          aria-label="Send message"
        >
          <SendHorizontal className="size-4.5" />
        </motion.button>
      </form>
    </div>
  );
}
