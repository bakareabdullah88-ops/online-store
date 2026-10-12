"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Minus, Plus, Star } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";
import { formatNaira, type Kobo } from "@/domain/money";

/* ---------------------------------- Badge --------------------------------- */

/** Count badge that springs whenever the number changes. */
export function CountBadge({ count, className, label }: { count: number; className?: string; label?: string }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={spring.bouncy}
          className={cn(
            "inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold leading-none text-on-accent tabular",
            className,
          )}
          aria-label={label}
        >
          <motion.span
            key={count}
            initial={reduce ? false : { y: -6, opacity: 0, scale: 1.4 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={spring.bouncy}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------- Status pill ------------------------------ */

export type PillTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const pillTones: Record<PillTone, string> = {
  neutral: "bg-ink/[0.06] text-ink-2 dark:bg-ink/[0.1]",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Pill({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-mono text-label font-medium uppercase tracking-[0.06em] whitespace-nowrap",
        pillTones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/* --------------------------------- Avatar --------------------------------- */

export function Avatar({
  name,
  src,
  size = 36,
  className,
  tone,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
  /** Hue for the initials fallback; derived from the name if omitted. */
  tone?: number;
}) {
  const hue = tone ?? hashHue(name);
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: src ? undefined : `oklch(0.86 0.05 ${hue})`,
        color: `oklch(0.32 0.06 ${hue})`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- object URLs from IndexedDB cannot go through next/image
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span className="font-medium" style={{ fontSize: Math.max(11, size * 0.38) }} aria-hidden>
          {letters}
        </span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}

function hashHue(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/* -------------------------------- Stepper --------------------------------- */

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "Quantity",
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const btn = cn(
    "flex items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/[0.06] disabled:opacity-35 active:scale-90 transition-transform",
    size === "sm" ? "size-8" : "size-10",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex items-center rounded-full bg-surface shadow-[inset_0_0_0_1px_var(--line-strong)]",
        size === "sm" ? "h-9 p-0.5" : "h-11 p-0.5",
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus className="size-4" />
      </button>
      <span
        className={cn("relative overflow-hidden text-center font-mono font-medium tabular", size === "sm" ? "w-7 text-small" : "w-9 text-body")}
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            className="block"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={spring.snappy}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/* --------------------------------- Rating --------------------------------- */

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  const id = useId();
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value.toFixed(1)} out of 5`} role="img">
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs>
              <linearGradient id={`${id}-${i}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <path
              d="M12 2.8l2.75 5.7 6.25.86-4.55 4.37 1.1 6.2L12 16.97l-5.55 2.96 1.1-6.2L3 9.36l6.25-.86z"
              fill={`url(#${id}-${i})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

export function RatingInput({ value, onChange, label = "Rating" }: { value: number; onChange: (n: number) => void; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          whileTap={{ scale: 0.85 }}
          animate={value >= n ? { scale: [1, 1.18, 1] } : { scale: 1 }}
          transition={spring.bouncy}
          className="flex size-11 items-center justify-center rounded-md text-accent hover:bg-accent-soft"
        >
          <Star className="size-7" fill={value >= n ? "currentColor" : "none"} strokeWidth={1.5} />
        </motion.button>
      ))}
    </div>
  );
}

/* --------------------------------- Price ---------------------------------- */

export function Price({
  kobo,
  compareAt,
  className,
  size = "md",
}: {
  kobo: Kobo;
  compareAt?: Kobo | undefined;
  className?: string;
  size?: "sm" | "md" | "lg" | "display";
}) {
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "tabular",
          size === "sm" && "font-mono text-small font-medium",
          size === "md" && "font-mono text-body font-medium",
          size === "lg" && "font-mono text-title-lg font-medium",
          size === "display" && "font-display text-display-md",
          compareAt && compareAt > kobo && "text-accent-ink",
        )}
      >
        {formatNaira(kobo)}
      </span>
      {compareAt && compareAt > kobo && (
        <s className="font-mono text-small text-muted tabular">
          <span className="sr-only">was </span>
          {formatNaira(compareAt)}
        </s>
      )}
    </span>
  );
}

/* ----------------------------- Number ticker ------------------------------ */

/** Animates between numeric values (totals, KPIs). Renders formatted text. */
export function NumberTicker({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  const first = useRef(true);
  useEffect(() => {
    if (first.current || reduce) {
      first.current = false;
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { type: "spring", stiffness: 140, damping: 24, mass: 0.8 });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return (
    <>
      <motion.span className={cn("tabular", className)} aria-hidden>
        {text}
      </motion.span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

/* ---------------------------------- Kbd ----------------------------------- */

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5.5 min-w-5.5 items-center justify-center rounded-xs bg-surface px-1.5 font-mono text-[11px] text-muted shadow-[inset_0_0_0_1px_var(--line-strong),0_1px_0_var(--line-strong)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* -------------------------------- Progress -------------------------------- */

export function ProgressBar({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]", className)}
    >
      <motion.div
        className="h-full origin-left rounded-full bg-accent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={spring.gentle}
      />
    </div>
  );
}

/* ------------------------------- Eyebrow ---------------------------------- */

export function Eyebrow({ children, className, as: Tag = "p" }: { children: ReactNode; className?: string; as?: "p" | "span" | "h2" | "h3" }) {
  return <Tag className={cn("eyebrow text-muted", className)}>{children}</Tag>;
}
