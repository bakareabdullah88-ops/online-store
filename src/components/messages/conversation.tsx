"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { MessageSquareText, Pencil, RefreshCw, SendHorizontal, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { formatDate, formatTime } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { useSendMessage, useThread } from "@/queries/inbox";
import { errorMessage } from "@/services/errors";
import { toast } from "@/stores/toast";
import type { QuickReply } from "./quick-replies";

/** Draft card: the chosen reply types itself in, then can be edited, swapped or sent. */
function DraftCard({
  reply,
  onSend,
  onClose,
  sending,
}: {
  reply: QuickReply;
  onSend: (text: string) => void;
  onClose: () => void;
  sending: boolean;
}) {
  const reduce = useReducedMotion();
  const [variant, setVariant] = useState(0);
  const [text, setText] = useState(reply.drafts[0] ?? "");
  const [typed, setTyped] = useState(reduce ? Infinity : 0);
  const [editing, setEditing] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const done = typed >= text.length;

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setTyped((n) => n + 3), 12);
    return () => window.clearTimeout(id);
  }, [typed, done]);

  const swap = () => {
    const next = (variant + 1) % reply.drafts.length;
    setVariant(next);
    setText(reply.drafts[next] ?? "");
    setTyped(reduce ? Infinity : 0);
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 8, filter: "blur(6px)" }}
      transition={spring.smooth}
      className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,color-mix(in_oklab,var(--chart-blue)_10%,var(--surface)),color-mix(in_oklab,var(--chart-violet)_14%,var(--surface)))] p-4 ring-1 ring-line"
    >
      <div className="flex items-center gap-2 text-[13px] font-medium">
        <span
          className="grid size-6 place-items-center rounded-md"
          style={{
            background: `color-mix(in oklab, ${reply.tone} 22%, transparent)`,
            color: reply.tone,
          }}
        >
          <MessageSquareText className="size-3.5" />
        </span>
        {reply.label}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick reply"
          className="ml-auto grid size-7 place-items-center rounded-full text-muted hover:bg-ink/[0.06] hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-3">
        {editing ? (
          <textarea
            ref={area}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Edit reply"
            maxLength={1000}
            className="field-sizing-content min-h-16 flex-1 resize-none rounded-xl bg-surface px-3 py-2 text-[14px] leading-relaxed ring-1 ring-line outline-none focus:ring-2 focus:ring-accent/40"
          />
        ) : (
          <p className="min-h-16 flex-1 text-[14px] leading-relaxed text-ink-2" aria-live="polite">
            {text.slice(0, typed)}
            {!done && (
              <span
                className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-accent"
                aria-hidden
              />
            )}
          </p>
        )}
        <div className="flex shrink-0 flex-col items-center gap-2">
          {reply.drafts.length > 1 && (
            <button
              type="button"
              onClick={swap}
              aria-label="Try another wording"
              className="grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-xs ring-1 ring-line hover:text-ink"
            >
              <RefreshCw className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setTyped(Infinity);
              setEditing(true);
              requestAnimationFrame(() => area.current?.focus());
            }}
            aria-label="Edit before sending"
            className="grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-xs ring-1 ring-line hover:text-ink"
          >
            <Pencil className="size-4" />
          </button>
          <AnimatePresence>
            {done && (
              <motion.button
                type="button"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={spring.bouncy}
                disabled={sending || !text.trim()}
                onClick={() => onSend(text.trim())}
                aria-label="Send this reply"
                className="grid size-10 place-items-center rounded-full bg-primary text-on-primary disabled:opacity-50"
              >
                <SendHorizontal className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-2 text-[11.5px] text-muted">
        Filled in from your details. Check it before you send.
      </p>
    </motion.div>
  );
}

/** A chat thread with a composer and quick replies. `as` decides which side is "me". */
export function Conversation({
  threadId,
  as,
  className,
  emptyHint,
  replies,
  footnote,
}: {
  threadId: string;
  as: "buyer" | "brand";
  className?: string;
  emptyHint?: string;
  replies?: QuickReply[];
  footnote?: string;
}) {
  const { data: thread, isPending } = useThread(threadId, as);
  const send = useSendMessage(as);
  const [body, setBody] = useState("");
  const [tools, setTools] = useState(false);
  const [draft, setDraft] = useState<QuickReply | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const count = thread?.messages.length ?? 0;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [count, reduce, tools, draft]);

  const deliver = (text: string, after?: () => void) => {
    if (!text) return;
    send.mutate(
      { threadId, body: text },
      {
        onSuccess: after,
        onError: (e) => toast.error("Message not sent", { description: errorMessage(e) }),
      },
    );
  };
  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    deliver(text);
  };

  let lastStamp = "";
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
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {thread?.messages.map((m) => {
                const mine = m.from === as;
                const stamp = mounted ? `${formatDate(m.at)}, ${formatTime(m.at)}` : "";
                const showStamp = stamp !== lastStamp;
                lastStamp = stamp;
                return (
                  <motion.li
                    key={m.id}
                    layout={!reduce}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={spring.smooth}
                    className={cn("flex flex-col", mine ? "items-end" : "items-start")}
                  >
                    {showStamp && (
                      <span className="mt-2 mb-1.5 px-1 text-[11px] text-muted">{stamp}</span>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                        mine
                          ? "rounded-tr-md bg-[color-mix(in_oklab,var(--chart-violet)_12%,var(--surface))] text-ink"
                          : "rounded-tl-md bg-[color-mix(in_oklab,var(--chart-blue)_9%,var(--surface))] text-ink",
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{m.body}</p>
                      {m.id.startsWith("optimistic") && (
                        <p className="mt-0.5 text-right text-[10.5px] text-muted">Sending…</p>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {draft ? (
          <DraftCard
            key={draft.id}
            reply={draft}
            sending={send.isPending}
            onClose={() => setDraft(null)}
            onSend={(text) => deliver(text, () => setDraft(null))}
          />
        ) : (
          tools &&
          replies && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 6, filter: "blur(6px)" }}
              transition={spring.smooth}
              className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-2/80 p-1.5 ring-1 ring-line sm:grid-cols-3"
              role="group"
              aria-label="Quick replies"
            >
              {replies.map((r, i) => (
                <motion.button
                  key={r.id}
                  type="button"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...spring.snappy, delay: i * 0.03 }}
                  onClick={() => {
                    setTools(false);
                    setDraft(r);
                  }}
                  className="flex flex-col items-start gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium transition-colors hover:bg-surface hover:shadow-xs"
                >
                  <span
                    className="grid size-6 place-items-center rounded-md"
                    style={{
                      background: `color-mix(in oklab, ${r.tone} 22%, transparent)`,
                      color: r.tone,
                    }}
                  >
                    <MessageSquareText className="size-3.5" />
                  </span>
                  {r.label}
                </motion.button>
              ))}
            </motion.div>
          )
        )}
      </AnimatePresence>

      <form
        className="mt-3 flex items-end gap-1.5 rounded-2xl bg-surface px-2 py-1.5 ring-1 ring-line focus-within:ring-2 focus-within:ring-accent/40"
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
          placeholder="Send message…"
          className="field-sizing-content max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[14px] outline-none placeholder:text-faint"
        />
        <motion.button
          type="submit"
          whileTap={{ scale: 0.9 }}
          transition={spring.snappy}
          disabled={!body.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-xl text-ink-2 transition-colors hover:bg-ink/[0.05] hover:text-ink disabled:opacity-35"
          aria-label="Send message"
        >
          <SendHorizontal className="size-[18px]" />
        </motion.button>
        {replies && (
          <button
            type="button"
            onClick={() => {
              setDraft(null);
              setTools((v) => !v);
            }}
            aria-expanded={tools}
            aria-label={tools ? "Hide quick replies" : "Show quick replies"}
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
              tools || draft
                ? "bg-accent-soft text-accent"
                : "text-chart-violet hover:bg-ink/[0.05]",
            )}
          >
            <Wand2 className="size-[18px]" />
          </button>
        )}
      </form>
      {footnote && <p className="mt-2 text-center text-[11.5px] text-muted">{footnote}</p>}
    </div>
  );
}
