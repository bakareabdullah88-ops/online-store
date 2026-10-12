"use client";

import {
  Checkbox as RCheckbox,
  RadioGroup as RRadio,
  Slider as RSlider,
  Switch as RSwitch,
} from "radix-ui";
import { motion } from "motion/react";
import { Check, Minus } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { spring } from "@/design/motion";

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
  hideLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className={cn("min-w-0", hideLabel && "sr-only")}>
        <label htmlFor={id} className="block text-body font-medium text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-d`} className="text-small text-muted">
            {description}
          </p>
        )}
      </div>
      <RSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        aria-describedby={description ? `${id}-d` : undefined}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
          checked ? "bg-accent" : "bg-line-strong",
          "disabled:opacity-45",
        )}
      >
        <RSwitch.Thumb asChild>
          <motion.span
            layout
            transition={spring.snappy}
            className={cn(
              "block size-6 rounded-full bg-white shadow-sm",
              checked ? "ml-auto" : "ml-0",
            )}
          />
        </RSwitch.Thumb>
      </RSwitch.Root>
    </div>
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
  hideLabel,
}: {
  checked: boolean | "indeterminate";
  onCheckedChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <RCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-xs transition-[background-color,box-shadow] duration-150",
          checked
            ? "bg-primary text-on-primary"
            : "bg-surface shadow-[inset_0_0_0_1.5px_var(--line-strong)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]",
          "disabled:opacity-45",
        )}
      >
        <RCheckbox.Indicator asChild>
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.bouncy}
          >
            {checked === "indeterminate" ? (
              <Minus className="size-3.5" strokeWidth={3} />
            ) : (
              <Check className="size-3.5" strokeWidth={3} />
            )}
          </motion.span>
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      <div className={cn(hideLabel && "sr-only")}>
        <label htmlFor={id} className="text-body text-ink">
          {label}
        </label>
        {description && <p className="text-small text-muted">{description}</p>}
      </div>
    </div>
  );
}

/** Radio cards: big tappable options (fulfilment, payment method…). */
export function RadioCards<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  columns = 1,
}: {
  value: T | undefined;
  onChange: (v: T) => void;
  options: readonly {
    value: T;
    title: ReactNode;
    description?: ReactNode;
    icon?: ReactNode;
    aside?: ReactNode;
    disabled?: boolean;
  }[];
  label: string;
  className?: string;
  columns?: 1 | 2 | 3;
}) {
  const layoutId = useId();
  return (
    <RRadio.Root
      value={value ?? ""}
      onValueChange={(v) => onChange(v as T)}
      aria-label={label}
      className={cn(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <RRadio.Item
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className={cn(
              "relative flex w-full items-start gap-3 rounded-md bg-surface p-4 text-left transition-[box-shadow] duration-150",
              "shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--muted)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="pointer-events-none absolute inset-0 rounded-md shadow-[inset_0_0_0_2px_var(--ink)]"
                transition={spring.snappy}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full transition-[box-shadow] duration-150",
                active
                  ? "shadow-[inset_0_0_0_6px_var(--ink)]"
                  : "shadow-[inset_0_0_0_1.5px_var(--line-strong)]",
              )}
              aria-hidden
            />
            {o.icon && <span className="mt-0.5 text-ink-2">{o.icon}</span>}
            <span className="min-w-0 flex-1">
              <span className="block text-body font-medium text-ink">{o.title}</span>
              {o.description && (
                <span className="mt-0.5 block text-small text-muted">{o.description}</span>
              )}
            </span>
            {o.aside && <span className="shrink-0 text-small text-ink-2">{o.aside}</span>}
          </RRadio.Item>
        );
      })}
    </RRadio.Root>
  );
}

export function RangeSlider({
  value,
  onValueChange,
  onValueCommit,
  min,
  max,
  step = 1,
  label,
  formatValue,
}: {
  value: [number, number];
  onValueChange: (v: [number, number]) => void;
  onValueCommit?: (v: [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  formatValue: (n: number) => string;
}) {
  return (
    <RSlider.Root
      value={value}
      onValueChange={(v) => onValueChange([v[0] ?? min, v[1] ?? max])}
      onValueCommit={(v) => onValueCommit?.([v[0] ?? min, v[1] ?? max])}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={1}
      aria-label={label}
      className="relative flex h-10 w-full touch-none select-none items-center"
    >
      <RSlider.Track className="relative h-1 grow overflow-hidden rounded-full bg-line-strong">
        <RSlider.Range className="absolute h-full bg-ink" />
      </RSlider.Track>
      {value.map((v, i) => (
        <RSlider.Thumb
          key={i}
          aria-label={i === 0 ? `Minimum ${label}` : `Maximum ${label}`}
          aria-valuetext={formatValue(v)}
          className="block size-6 rounded-full bg-surface shadow-[0_0_0_1.5px_var(--ink),var(--shadow-sm)] transition-transform duration-150 hover:scale-110 focus-visible:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
        />
      ))}
    </RSlider.Root>
  );
}
