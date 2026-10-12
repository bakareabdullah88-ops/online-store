"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { spring } from "@/design/motion";
import { isValueAvailable, type Selection } from "@/domain/variants";
import { cn } from "@/lib/cn";
import type { Product } from "@/services/types";

/** Option pickers (size, colour, flavour…) with sold-out values crossed out. */
export function VariantPicker({
  product,
  selection,
  onChange,
}: {
  product: Pick<Product, "options" | "variants">;
  selection: Selection;
  onChange: (s: Selection) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-5">
      {product.options.map((o) => {
        const chosen = o.values.find((v) => v.id === selection[o.id]);
        const isColour = o.values.some((v) => v.swatch);
        return (
          <fieldset key={o.id}>
            <legend className="mb-2.5 flex items-baseline gap-2 text-small">
              <span className="font-medium text-ink">{o.name}</span>
              <span className="text-muted">{chosen?.label ?? "Choose one"}</span>
            </legend>
            <div role="radiogroup" aria-label={o.name} className="flex flex-wrap gap-2">
              {o.values.map((v) => {
                const active = selection[o.id] === v.id;
                const available = isValueAvailable(product, selection, o.id, v.id);
                if (isColour) {
                  return (
                    <button
                      key={v.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${v.label}${available ? "" : " (sold out)"}`}
                      title={v.label}
                      onClick={() => onChange({ ...selection, [o.id]: v.id })}
                      className={cn(
                        "relative flex size-11 items-center justify-center rounded-full transition-shadow",
                        active
                          ? "shadow-[0_0_0_2px_var(--canvas),0_0_0_3.5px_var(--ink)]"
                          : "hover:shadow-[0_0_0_2px_var(--canvas),0_0_0_3px_var(--line-strong)]",
                      )}
                    >
                      <span
                        className="size-9 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
                        style={{ background: v.swatch }}
                      />
                      {!available && (
                        <span
                          className="absolute h-0.5 w-10 rotate-45 rounded-full bg-ink/70"
                          aria-hidden
                        />
                      )}
                    </button>
                  );
                }
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`${v.label}${available ? "" : " (sold out)"}`}
                    onClick={() => onChange({ ...selection, [o.id]: v.id })}
                    className={cn(
                      "relative h-11 min-w-12 rounded-md px-4 text-small font-medium transition-[color,box-shadow]",
                      active
                        ? "text-on-primary"
                        : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink)]",
                      !available && !active && "text-muted line-through decoration-1",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId={`${id}-${o.id}`}
                        className="absolute inset-0 rounded-md bg-primary"
                        transition={spring.snappy}
                        aria-hidden
                      />
                    )}
                    <span className="relative">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
