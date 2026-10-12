"use client";

import { AnimatePresence, motion } from "motion/react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";

export const fieldControl =
  "w-full rounded-md bg-surface text-ink placeholder:text-faint " +
  "shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[box-shadow,background-color] duration-150 " +
  "hover:shadow-[inset_0_0_0_1px_var(--muted)] " +
  "focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1.5px_var(--ink),0_0_0_4px_var(--accent-soft)] " +
  "aria-invalid:shadow-[inset_0_0_0_1.5px_var(--danger)] aria-invalid:focus-visible:shadow-[inset_0_0_0_1.5px_var(--danger),0_0_0_4px_var(--danger-soft)] " +
  "disabled:cursor-not-allowed disabled:opacity-55";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leading?: ReactNode;
  trailing?: ReactNode;
  inputSize?: "md" | "lg";
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, trailing, inputSize = "md", ...props },
  ref,
) {
  const height = inputSize === "lg" ? "h-12 text-body-lg" : "h-10 text-body";
  if (!leading && !trailing) {
    return <input ref={ref} className={cn(fieldControl, height, "px-3.5", className)} {...props} />;
  }
  return (
    <div className="relative">
      {leading && (
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
          {leading}
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          fieldControl,
          height,
          "px-3.5",
          leading ? "pl-10" : undefined,
          trailing ? "pr-11" : undefined,
          className,
        )}
        {...props}
      />
      {trailing && <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span>}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        fieldControl,
        "min-h-28 resize-y px-3.5 py-3 text-body leading-relaxed",
        className,
      )}
      {...props}
    />
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type" | "trailing">>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex size-9 items-center justify-center rounded-sm text-muted hover:bg-ink/5 hover:text-ink"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
          </button>
        }
        {...props}
      />
    );
  },
);

type SearchInputProps = Omit<InputProps, "type" | "leading" | "trailing"> & {
  onClear?: () => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onClear, value, ...props },
  ref,
) {
  const hasValue = typeof value === "string" ? value.length > 0 : false;
  return (
    <Input
      ref={ref}
      type="search"
      value={value}
      leading={<Search className="size-4.5" />}
      trailing={
        <AnimatePresence initial={false}>
          {hasValue && onClear && (
            <motion.button
              type="button"
              onClick={onClear}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={spring.snappy}
              className="flex size-9 items-center justify-center rounded-sm text-muted hover:bg-ink/5 hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
      }
      {...props}
    />
  );
});

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  optional?: boolean;
  className?: string;
  /** A single control element; it receives id / aria-describedby / aria-invalid. */
  children: ReactElement<Record<string, unknown>>;
  /** Right-aligned element next to the label (e.g. "Forgot password?") */
  aside?: ReactNode;
};

export function Field({ label, hint, error, optional, className, children, aside }: FieldProps) {
  const id = useId();
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-small font-medium text-ink">
          {label}
          {optional && <span className="ml-1.5 font-normal text-muted"> (optional)</span>}
        </label>
        {aside}
      </div>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-small text-muted">
          {hint}
        </p>
      )}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={spring.snappy}
            className="text-small font-medium text-danger"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
