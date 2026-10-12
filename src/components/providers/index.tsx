"use client";

import { MotionConfig } from "motion/react";
import { TooltipProvider } from "@/components/ui/overlay";
import { Toaster } from "@/components/ui/toaster";
import { GlobalChrome } from "@/components/shell/global-chrome";
import { SkipLink } from "@/components/shell/page";
import { QueryProvider } from "./query";
import { ThemeProvider } from "./theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={350} skipDelayDuration={200}>
            <SkipLink />
            {children}
            <GlobalChrome />
            <Toaster />
          </TooltipProvider>
        </MotionConfig>
      </QueryProvider>
    </ThemeProvider>
  );
}
