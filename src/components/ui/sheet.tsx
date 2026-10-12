"use client";

import { Dialog as RDialog, VisuallyHidden } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { duration, ease, spring } from "@/design/motion";
import { useMediaQuery } from "@/lib/use-media-query";

type BaseProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Visually hide the title (it is still announced). */
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

function CloseButton({ className }: { className?: string }) {
  return (
    <RDialog.Close
      className={cn(
        "flex size-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-ink/[0.06] hover:text-ink",
        className,
      )}
      aria-label="Close"
    >
      <X className="size-5" />
    </RDialog.Close>
  );
}

function Header({
  title,
  description,
  hideTitle,
}: Pick<BaseProps, "title" | "description" | "hideTitle">) {
  const titleEl = (
    <RDialog.Title className="font-display text-display-sm text-ink">{title}</RDialog.Title>
  );
  return (
    <div className={cn("flex items-start justify-between gap-4", hideTitle && "absolute right-3 top-3")}>
      <div className={cn("min-w-0", hideTitle && "sr-only")}>
        {hideTitle ? <VisuallyHidden.Root>{titleEl}</VisuallyHidden.Root> : titleEl}
        {description && (
          <RDialog.Description className="mt-1.5 text-body text-muted">{description}</RDialog.Description>
        )}
      </div>
      <CloseButton className="-mr-2 -mt-1 shrink-0" />
    </div>
  );
}

/** Centered modal dialog. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  children,
  footer,
  className,
}: BaseProps) {
  const reduce = useReducedMotion();
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <RDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-(--z-overlay) bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base, ease: ease.outQuint }}
              />
            </RDialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-(--z-sheet) flex items-end justify-center p-3 sm:items-center sm:p-6">
              <RDialog.Content
                asChild
                forceMount
                {...(description ? {} : { "aria-describedby": undefined })}
              >
                <motion.div
                  className={cn(
                    "pointer-events-auto relative flex max-h-[min(88dvh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-surface shadow-xl ring-1 ring-line focus:outline-none",
                    className,
                  )}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
                  transition={spring.smooth}
                >
                  <div className="px-6 pt-6">
                    <Header title={title} description={description} hideTitle={hideTitle} />
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">{children}</div>
                  {footer && (
                    <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 px-6 py-4 sm:flex-row sm:justify-end">
                      {footer}
                    </div>
                  )}
                </motion.div>
              </RDialog.Content>
            </div>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  );
}

/** Side panel (desktop drawers: bag, filters, editors). */
export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  children,
  footer,
  className,
  side = "right",
  width = "md",
}: BaseProps & { side?: "left" | "right"; width?: "sm" | "md" | "lg" | "xl" }) {
  const reduce = useReducedMotion();
  const offset = side === "right" ? "100%" : "-100%";
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <RDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-(--z-overlay) bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.base, ease: ease.outQuint }}
              />
            </RDialog.Overlay>
            <RDialog.Content
              asChild
              forceMount
              {...(description ? {} : { "aria-describedby": undefined })}
            >
              <motion.div
                className={cn(
                  "fixed inset-y-0 z-(--z-sheet) flex w-full flex-col bg-surface shadow-xl focus:outline-none",
                  side === "right" ? "right-0 border-l border-line" : "left-0 border-r border-line",
                  width === "sm" && "max-w-sm",
                  width === "md" && "max-w-md",
                  width === "lg" && "max-w-xl",
                  width === "xl" && "max-w-3xl",
                  className,
                )}
                initial={reduce ? { opacity: 0 } : { x: offset }}
                animate={reduce ? { opacity: 1 } : { x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: offset }}
                transition={spring.smooth}
              >
                <div className="px-6 pt-5 pb-4">
                  <Header title={title} description={description} hideTitle={hideTitle} />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>
                {footer && <div className="border-t border-line px-6 py-4 safe-bottom">{footer}</div>}
              </motion.div>
            </RDialog.Content>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  );
}

/** Bottom sheet with drag-to-dismiss (mobile). */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  children,
  footer,
  className,
}: BaseProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-(--z-overlay) bg-overlay" />
        <Drawer.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "fixed inset-x-0 bottom-0 z-(--z-sheet) flex max-h-[92dvh] flex-col rounded-t-xl bg-surface shadow-xl outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden />
          <div className={cn("flex items-start justify-between gap-4 px-5 pt-3 pb-3", hideTitle && "sr-only")}>
            <div className="min-w-0">
              <Drawer.Title className="font-display text-display-sm text-ink">{title}</Drawer.Title>
              {description && (
                <Drawer.Description className="mt-1 text-body text-muted">{description}</Drawer.Description>
              )}
            </div>
            <Drawer.Close
              className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-md text-muted hover:bg-ink/[0.06] hover:text-ink"
              aria-label="Close"
            >
              <X className="size-5" />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && (
            <div className="border-t border-line px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Bottom sheet on phones, side panel from md up. */
export function ResponsiveSheet(
  props: BaseProps & { side?: "left" | "right"; width?: "sm" | "md" | "lg" | "xl" },
) {
  const desktop = useMediaQuery("(min-width: 768px)");
  const { side, width, ...rest } = props;
  return desktop ? <SidePanel side={side} width={width} {...rest} /> : <BottomSheet {...rest} />;
}
