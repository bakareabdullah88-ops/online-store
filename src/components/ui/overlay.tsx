"use client";

import {
  DropdownMenu as RMenu,
  Popover as RPopover,
  Select as RSelect,
  Tooltip as RTooltip,
} from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const floatingPanel =
  "z-(--z-popover) rounded-md bg-surface p-1 text-ink shadow-lg ring-1 ring-line " +
  "origin-(--radix-popper-transform-origin) " +
  "data-[state=open]:[animation:pop-in_160ms_cubic-bezier(0.22,1,0.36,1)] " +
  "data-[state=closed]:[animation:pop-out_120ms_ease-in_forwards]";

export const TooltipProvider = RTooltip.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <RTooltip.Root delayDuration={350}>
      <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
      <RTooltip.Portal>
        <RTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-(--z-popover) max-w-60 rounded-sm bg-primary px-2.5 py-1.5 text-small text-on-primary shadow-md",
            "origin-(--radix-tooltip-content-transform-origin) [animation:pop-in_140ms_cubic-bezier(0.22,1,0.36,1)]",
          )}
        >
          {content}
        </RTooltip.Content>
      </RTooltip.Portal>
    </RTooltip.Root>
  );
}

export function Popover({
  trigger,
  children,
  align = "start",
  open,
  onOpenChange,
  className,
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}) {
  return (
    <RPopover.Root open={open} onOpenChange={onOpenChange}>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className={cn(floatingPanel, "p-3", className)}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

export const Menu = RMenu.Root;
export const MenuTrigger = RMenu.Trigger;

export function MenuContent({
  children,
  align = "end",
  className,
}: {
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <RMenu.Portal>
      <RMenu.Content
        align={align}
        sideOffset={6}
        collisionPadding={12}
        className={cn(floatingPanel, "min-w-52", className)}
      >
        {children}
      </RMenu.Content>
    </RMenu.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  icon,
  danger,
  disabled,
  shortcut,
}: {
  children: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
}) {
  return (
    <RMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "flex h-10 cursor-pointer items-center gap-2.5 rounded-sm px-2.5 text-small font-medium outline-none select-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-ink/[0.06]",
        danger ? "text-danger" : "text-ink",
      )}
    >
      {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && <span className="font-mono text-label text-muted">{shortcut}</span>}
    </RMenu.Item>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <RMenu.Label className="px-2.5 pt-2 pb-1 eyebrow text-muted">{children}</RMenu.Label>;
}

export function MenuSeparator() {
  return <RMenu.Separator className="my-1 h-px bg-line" />;
}

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  className,
  id,
  invalid,
  describedBy,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  value: T | undefined;
  onValueChange: (v: T) => void;
  options: readonly { value: T; label: string; hint?: string }[];
  placeholder?: string;
  label?: string;
  className?: string;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  /** Set by <Field> when it wraps the select, like it does for inputs. */
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  return (
    <RSelect.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <RSelect.Trigger
        id={id}
        aria-label={label}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy ?? ariaDescribedBy}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-md bg-surface px-3.5 text-left text-body text-ink",
          "shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--muted)]",
          "focus-visible:shadow-[inset_0_0_0_1.5px_var(--ink),0_0_0_4px_var(--accent-soft)] focus-visible:outline-none",
          "aria-invalid:shadow-[inset_0_0_0_1.5px_var(--danger)] data-[placeholder]:text-faint",
          className,
        )}
      >
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <ChevronDown className="size-4 text-muted" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            floatingPanel,
            "max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) min-w-44",
          )}
        >
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                className="relative flex h-10 cursor-pointer items-center gap-2 rounded-sm pr-8 pl-2.5 text-small font-medium text-ink outline-none select-none data-[highlighted]:bg-ink/[0.06]"
              >
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                {o.hint && <span className="text-muted">{o.hint}</span>}
                <RSelect.ItemIndicator className="absolute right-2.5">
                  <Check className="size-4" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
