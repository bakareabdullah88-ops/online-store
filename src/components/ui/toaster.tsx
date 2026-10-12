"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";
import { useToastStore, type Toast } from "@/stores/toast";

const icons = {
  neutral: null,
  success: <CircleCheck className="size-4.5 text-success" />,
  danger: <CircleAlert className="size-4.5 text-danger" />,
  info: <Info className="size-4.5 text-info" />,
} as const;

function ToastItem({ toast, index }: { toast: Toast; index: number }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(toast.duration);
  const started = useRef(0);

  useEffect(() => {
    if (!toast.duration || paused) return;
    started.current = Date.now();
    const t = window.setTimeout(() => dismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(t);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, toast.duration, toast.id, dismiss]);

  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 - index * 0.02 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, transition: { duration: 0.16 } }}
      transition={spring.smooth}
      drag={reduce ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.1, right: 0.9 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80 || info.velocity.x > 500) dismiss(toast.id);
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex w-full touch-pan-y items-start gap-3 rounded-md bg-primary py-3 pr-2 pl-4 text-on-primary shadow-lg"
    >
      {icons[toast.tone] && (
        <span className="mt-0.5 shrink-0 rounded-full bg-on-primary [&>svg]:block">{icons[toast.tone]}</span>
      )}
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-small font-medium">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-small opacity-70">{toast.description}</p>}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            dismiss(toast.id);
          }}
          className="h-8 shrink-0 rounded-sm px-2.5 font-mono text-label font-semibold uppercase tracking-wider text-on-primary underline-offset-4 hover:underline"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        className="flex size-8 shrink-0 items-center justify-center rounded-sm opacity-60 hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </motion.li>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <section
      aria-label="Notifications"
      className={cn(
        "pointer-events-none fixed inset-x-0 z-(--z-toast) flex justify-center px-3",
        "bottom-[calc(var(--tabbar-h)+12px+env(safe-area-inset-bottom))] md:bottom-6 md:justify-end md:px-6",
      )}
    >
      <ol aria-live="polite" aria-relevant="additions text" className="flex w-full max-w-sm flex-col-reverse gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t, i) => (
            <ToastItem key={t.id} toast={t} index={i} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}
