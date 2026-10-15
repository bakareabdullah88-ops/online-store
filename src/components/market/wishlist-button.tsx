"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import { useSession } from "@/queries/session";
import { useToggleWishlist } from "@/queries/social";
import { toast } from "@/stores/toast";

const PARTICLES = 8;

/** Heart with a little burst of particles when saving. Optimistic. */
export function WishlistButton({
  productId,
  productName,
  className,
  size = "md",
  variant = "floating",
}: {
  productId: string;
  productName: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "floating" | "plain";
}) {
  const { user } = useSession();
  const toggle = useToggleWishlist();
  const reduce = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const saved = !!user?.wishlistProductIds.includes(productId);
  const [burst, setBurst] = useState(0);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast("Log in to save items", {
        description: "Your saved items follow you across devices once you're signed in.",
        action: {
          label: "Log in",
          onClick: () => router.push(`/login?next=${encodeURIComponent(pathname)}`),
        },
      });
      return;
    }
    if (!saved) setBurst((b) => b + 1);
    toggle.mutate(productId);
  };

  const dim = size === "sm" ? "size-9" : size === "lg" ? "size-12" : "size-10";
  const icon = size === "lg" ? "size-6" : "size-[18px]";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.86 }}
      transition={spring.snappy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from saved` : `Save ${productName}`}
      className={cn(
        "relative flex items-center justify-center rounded-full",
        dim,
        variant === "floating"
          ? "bg-surface/95 shadow-sm hover:bg-surface"
          : "hover:bg-ink/[0.06]",
        className,
      )}
    >
      <motion.span
        key={saved ? "on" : "off"}
        initial={reduce ? false : { scale: saved ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={spring.bouncy}
        className={saved ? "text-accent" : "text-ink"}
      >
        <Heart className={icon} fill={saved ? "currentColor" : "none"} strokeWidth={1.8} />
      </motion.span>
      <AnimatePresence>
        {!reduce && burst > 0 && saved && (
          <motion.span
            key={burst}
            className="pointer-events-none absolute inset-0"
            aria-hidden
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0.35, duration: 0.2 }}
          >
            {Array.from({ length: PARTICLES }, (_, i) => {
              const a = (i / PARTICLES) * Math.PI * 2;
              return (
                <motion.span
                  key={i}
                  className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-accent"
                  initial={{ x: "-50%", y: "-50%", scale: 0.6 }}
                  animate={{
                    x: `calc(-50% + ${Math.cos(a) * 20}px)`,
                    y: `calc(-50% + ${Math.sin(a) * 20}px)`,
                    scale: 0,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              );
            })}
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-accent"
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.45 }}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
