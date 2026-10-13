"use client";

import { motion } from "motion/react";
import { Plus, ShoppingBag, Store } from "lucide-react";
import { SidePanel } from "@/components/ui/sheet";
import { useMode, type Mode } from "@/components/shell/mode";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
import { SidebarContent } from "./sidebar";
import { useSwitchWorkspace } from "./workspace";

/** Phone stand-in for the rail: Market / Shop switch. */
function WorkspaceSwitch({ onDone }: { onDone: () => void }) {
  const mode = useMode();
  const { user } = useSession();
  const go = useSwitchWorkspace();
  const hasShop = !!user && user.brandIds.length > 0;
  const options: { value: Mode; label: string; icon: typeof Store }[] = [
    { value: "buying", label: "Market", icon: ShoppingBag },
    { value: "selling", label: hasShop ? "My shop" : "Open a shop", icon: hasShop ? Store : Plus },
  ];
  return (
    <div
      role="radiogroup"
      aria-label="Workspace"
      className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-surface-2 p-1"
    >
      {options.map((o) => {
        const active = mode === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => {
              onDone();
              go(o.value);
            }}
            className={cn(
              "relative flex h-10 items-center justify-center gap-2 rounded-xl text-small font-semibold",
              active ? "text-ink" : "text-muted",
            )}
          >
            {active && (
              <motion.span
                layoutId="menu-workspace"
                transition={spring.snappy}
                className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line"
                aria-hidden
              />
            )}
            <Icon className="relative size-4" />
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MenuSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const close = () => onOpenChange(false);
  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      width="sm"
      title="Menu"
      hideTitle
    >
      <div className="pt-2 pb-6">
        <WorkspaceSwitch onDone={close} />
        <SidebarContent onNavigate={close} />
      </div>
    </SidePanel>
  );
}
