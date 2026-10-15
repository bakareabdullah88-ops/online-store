"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useUi } from "@/stores/ui";
import { AppSync } from "./app-sync";
import { OfflineBanner } from "./offline-banner";

// Interaction-only overlays: their code loads when first opened (or when the
// browser is idle), never on the critical path of a page load.
const loadPalette = () => import("./command-palette").then((m) => m.CommandPalette);
const loadBag = () => import("@/components/checkout/bag-drawer").then((m) => m.BagDrawer);
const CommandPalette = dynamic(loadPalette, { ssr: false });
const BagDrawer = dynamic(loadBag, { ssr: false });

/** True from the first time `open` is true; keeps closing animations intact. */
function useOpenedOnce(open: boolean) {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  return opened;
}

function Overlays() {
  const commandOpen = useUi((s) => s.commandOpen);
  const bagOpen = useUi((s) => s.bagOpen);
  const palette = useOpenedOnce(commandOpen);
  const bag = useOpenedOnce(bagOpen);

  // ⌘K / Ctrl+K toggles search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const ui = useUi.getState();
        ui.setCommandOpen(!ui.commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warm the chunks once the page has settled so first open feels instant.
  useEffect(() => {
    const warm = () => void Promise.all([loadPalette(), loadBag()]);
    const id = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === "function")
        window.requestIdleCallback(warm, { timeout: 4000 });
      else warm();
    }, 6000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      {palette && <CommandPalette />}
      {bag && <BagDrawer />}
    </>
  );
}

/** App-wide overlays and sync, mounted once in the root layout. */
export function GlobalChrome() {
  // Everything here reads the URL, so it sits under Suspense (invisible until needed).
  return (
    <Suspense fallback={null}>
      <AppSync />
      <OfflineBanner />
      <Overlays />
    </Suspense>
  );
}
