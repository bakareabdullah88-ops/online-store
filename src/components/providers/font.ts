"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  FONT_STORAGE_KEY,
  defaultFontPreset,
  getFontPreset,
  type FontPresetId,
} from "@/config/font-presets";

const listeners = new Set<() => void>();

function read(): FontPresetId {
  return getFontPreset(document.documentElement.getAttribute("data-font")).id;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== FONT_STORAGE_KEY) return;
    document.documentElement.setAttribute("data-font", getFontPreset(e.newValue).id);
    cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** The visitor's font style (Settings → Appearance), saved in this browser. */
export function useFontPreset() {
  const preset = useSyncExternalStore<FontPresetId>(subscribe, read, () => defaultFontPreset);
  const setPreset = useCallback((id: FontPresetId) => {
    document.documentElement.setAttribute("data-font", id);
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, id);
    } catch {
      // Storage unavailable (private mode): the style still applies for this visit.
    }
    for (const l of listeners) l();
  }, []);
  return { preset, setPreset };
}
