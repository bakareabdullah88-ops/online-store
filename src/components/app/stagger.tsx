"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const item: Variants = {
  hidden: { opacity: 0, y: -18, rotateX: 14, transformPerspective: 900 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/** A group of sections; each one swings down into place as it scrolls into view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const Comp = as === "section" ? motion.section : as === "li" ? motion.li : motion.div;
  const reduce = useReducedMotion();
  // Reveals itself when scrolled into view (the first screenful shows straight away).
  return (
    <Comp
      className={cn("origin-top", className)}
      variants={item}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
    >
      {children}
    </Comp>
  );
}
