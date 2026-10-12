"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { AppSync } from "./app-sync";
import { ModeCurtain } from "./mode-curtain";
import { OfflineBanner } from "./offline-banner";

// Heavy, interaction-only overlays load after the shell.
const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), { ssr: false });
const BagDrawer = dynamic(() => import("@/components/checkout/bag-drawer").then((m) => m.BagDrawer), { ssr: false });
const AccountSheet = dynamic(() => import("./account-sheet").then((m) => m.AccountSheet), { ssr: false });

/** App-wide overlays and sync, mounted once in the root layout. */
export function GlobalChrome() {
  // Everything here reads the URL, so it sits under Suspense (invisible until needed).
  return (
    <Suspense fallback={null}>
      <AppSync />
      <ModeCurtain />
      <OfflineBanner />
      <CommandPalette />
      <BagDrawer />
      <AccountSheet />
    </Suspense>
  );
}
