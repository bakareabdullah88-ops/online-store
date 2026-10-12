"use client";

import { Check } from "lucide-react";
import { useId } from "react";
import { fontPresets } from "@/config/font-presets";
import { cn } from "@/lib/cn";
import { useFontPreset } from "@/components/providers/font";

/**
 * Font style picker. Each option is set in its own fonts so you can see the
 * difference before choosing. The choice is saved in this browser.
 */
export function FontPicker({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { preset, setPreset } = useFontPreset();
  const name = useId();
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="sr-only">Font style</legend>
      <div
        className={cn(
          "grid gap-2",
          compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {fontPresets.map((p) => {
          const active = p.id === preset;
          return (
            <label
              key={p.id}
              className={cn(
                "relative flex cursor-pointer items-center gap-3 rounded-md px-3.5 py-3 transition-colors",
                "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                active
                  ? "bg-surface shadow-[inset_0_0_0_1.5px_var(--accent)]"
                  : "bg-surface hairline hover:bg-surface-2",
              )}
            >
              <input
                type="radio"
                name={name}
                value={p.id}
                checked={active}
                onChange={() => setPreset(p.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className="w-11 shrink-0 text-[28px] leading-none text-ink"
                style={{ fontFamily: `var(${p.display.cssVar})`, fontWeight: p.display.weight }}
              >
                Aa
              </span>
              <span className="min-w-0 flex-1" style={{ fontFamily: `var(${p.body.cssVar})` }}>
                <span className="block text-small font-semibold text-ink">{p.label}</span>
                <span className="block text-[12px] leading-snug text-muted">{p.description}</span>
              </span>
              {active && <Check className="size-4 shrink-0 text-accent" aria-hidden />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
