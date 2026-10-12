"use client";

import { motion } from "motion/react";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";

export function passwordScore(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (pw.length < 8) return 1;
  return Math.min(4, Math.max(1, s - 1)) as 1 | 2 | 3 | 4;
}

const labels = ["", "Weak", "Fair", "Good", "Strong"] as const;
const tones = ["", "bg-danger", "bg-warning", "bg-success", "bg-success"] as const;

export function PasswordStrength({ value }: { value: string }) {
  const score = passwordScore(value);
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-1 overflow-hidden rounded-full bg-ink/[0.08]">
            <motion.span
              className={cn("block h-full origin-left rounded-full", tones[score])}
              initial={false}
              animate={{ scaleX: score >= i ? 1 : 0 }}
              transition={spring.snappy}
            />
          </span>
        ))}
      </div>
      <span className="w-14 text-right text-small text-muted">{value ? labels[score] : ""}</span>
      {value && <span className="sr-only">Password strength: {labels[score]}</span>}
    </div>
  );
}
