"use client";

import Link from "next/link";
import { AnimatePresence, motion, type HTMLMotionProps } from "motion/react";
import { Check } from "lucide-react";
import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,color,box-shadow,border-color,scale] duration-150 ease-out " +
  "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover shadow-xs",
  accent: "bg-accent text-on-accent hover:bg-accent-hover shadow-xs",
  secondary:
    "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:bg-surface-2 hover:shadow-[inset_0_0_0_1px_var(--ink)]",
  ghost: "bg-transparent text-ink hover:bg-ink/[0.06] dark:hover:bg-ink/[0.08]",
  danger: "bg-danger text-white hover:brightness-110 dark:text-canvas",
  link: "bg-transparent px-0! h-auto! text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-sm px-3 text-small",
  md: "h-11 rounded-md px-4.5 text-body",
  lg: "h-13 rounded-md px-6 text-body-lg",
  icon: "size-11 rounded-md",
  "icon-sm": "size-9 rounded-sm",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string | undefined;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction; keeps the button width stable. */
  loading?: boolean;
  /** Briefly shows a check mark (e.g. after save). */
  success?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
};

export type ButtonProps = ButtonOwnProps & Omit<HTMLMotionProps<"button">, "children">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    success = false,
    leadingIcon,
    trailingIcon,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  const state = loading ? "loading" : success ? "success" : "idle";
  return (
    <motion.button
      ref={ref}
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      whileTap={variant === "link" ? undefined : { scale: 0.97 }}
      transition={spring.snappy}
      {...rest}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 transition-opacity duration-150",
          state !== "idle" && "opacity-0",
        )}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
      <AnimatePresence initial={false}>
        {state !== "idle" && (
          <motion.span
            key={state}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={spring.snappy}
            aria-hidden
          >
            {state === "loading" ? <Spinner /> : <Check className="size-4.5" strokeWidth={2.25} />}
          </motion.span>
        )}
      </AnimatePresence>
      {loading && <span className="sr-only">Loading</span>}
    </motion.button>
  );
});

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  leadingIcon,
  trailingIcon,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonStyles({
        variant,
        size,
        className: cn("active:scale-[0.97]", className),
      })}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  );
}
