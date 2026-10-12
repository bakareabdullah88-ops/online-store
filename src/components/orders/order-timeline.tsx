"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { spring } from "@/design/motion";
import { statusDescription, statusLabel, stepsFor } from "@/domain/orders";
import { formatTime } from "@/lib/format";
import { useMounted } from "@/lib/hooks";
import { cn } from "@/lib/cn";
import type { Order } from "@/services/types";

/** Live, animated step timeline. New steps fill in with a spring. */
export function OrderTimeline({ order }: { order: Order }) {
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const method = order.fulfilment.method;
  const failed = order.status === "cancelled" || order.status === "declined";
  const steps = failed ? (["placed", order.status] as const) : stepsFor(method);
  const reachedAt = new Map(order.timeline.map((t) => [t.status, t.at]));
  const currentIndex = steps.findIndex((s) => s === order.status);

  return (
    <ol className="relative flex flex-col" aria-label="Order progress">
      {steps.map((s, i) => {
        const done =
          i < currentIndex || (i === currentIndex && (order.status === "delivered" || failed));
        const current = i === currentIndex && !done;
        const reached = i <= currentIndex;
        const at = reachedAt.get(s);
        const last = i === steps.length - 1;
        const failedStep = failed && s === order.status;
        return (
          <li
            key={s}
            className="relative flex gap-4 pb-7 last:pb-0"
            aria-current={current ? "step" : undefined}
          >
            {!last && (
              <span
                className="absolute top-8 bottom-0 left-[15px] w-0.5 overflow-hidden rounded-full bg-line"
                aria-hidden
              >
                <motion.span
                  className="block h-full w-full origin-top bg-accent"
                  initial={false}
                  animate={{ scaleY: i < currentIndex ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : { ...spring.gentle, delay: 0.1 }}
                />
              </span>
            )}
            <span className="relative z-10 flex size-8 shrink-0 items-center justify-center">
              {current && !reduce && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-accent"
                  initial={{ opacity: 0.35, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.7 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <motion.span
                initial={false}
                animate={{ scale: reached ? 1 : 0.85 }}
                transition={spring.bouncy}
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-full",
                  failedStep
                    ? "bg-danger text-white"
                    : reached
                      ? "bg-accent text-on-accent"
                      : "bg-surface text-muted shadow-[inset_0_0_0_1.5px_var(--line-strong)]",
                )}
              >
                {failedStep ? (
                  <X className="size-4" strokeWidth={2.5} />
                ) : done ? (
                  <Check className="size-4" strokeWidth={2.5} />
                ) : (
                  <span className="font-mono text-[11px] font-semibold">{i + 1}</span>
                )}
              </motion.span>
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={cn("text-body font-medium", reached ? "text-ink" : "text-muted")}>
                  {statusLabel(s, method)}
                </p>
                <p className="font-mono text-small text-muted tabular">
                  {at && mounted ? formatTime(at) : ""}
                </p>
              </div>
              {(current || failedStep || (last && done)) && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring.snappy}
                  className="mt-1 text-small text-muted"
                >
                  {statusDescription(s, method)}
                </motion.p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact horizontal progress for cards. */
export function OrderProgress({ order }: { order: Order }) {
  const steps = stepsFor(order.fulfilment.method);
  const idx = steps.indexOf(order.status);
  return (
    <div className="flex gap-1" aria-hidden>
      {steps.map((s, i) => (
        <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/[0.08]">
          <motion.span
            className="block h-full origin-left rounded-full bg-accent"
            initial={false}
            animate={{ scaleX: i <= idx ? 1 : 0 }}
            transition={spring.gentle}
          />
        </span>
      ))}
    </div>
  );
}
