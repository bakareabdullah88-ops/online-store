"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const item: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
    // A lingering filter would trap fixed/backdrop-blurred children.
    transitionEnd: { filter: "none" },
  },
};

/** A group of sections; each one fades up as it scrolls into view. */
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
      className={cn(className)}
      variants={item}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
    >
      {children}
    </Comp>
  );
}
