"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { brand } from "@/config/brand";

const noop = () => () => undefined;

/** True after hydration. Use to gate time- or device-dependent rendering. */
export function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** Current time, ticking. Null during SSR/hydration so markup always matches. */
export function useNow(intervalMs = 30_000): number | null {
  const mounted = useMounted();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(t);
  }, [intervalMs]);
  return mounted ? now : null;
}

/** Client-side title for data that only exists in the browser. */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = `${title}${brand.titleSeparator}${brand.name}`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}

const NOT_TEXT = new Set([
  "checkbox",
  "radio",
  "button",
  "submit",
  "reset",
  "range",
  "file",
  "color",
]);

function isTextEntry(el: Element | null): boolean {
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !NOT_TEXT.has(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

function subscribeFocus(cb: () => void) {
  let t = 0;
  // On focusout the next element isn't focused yet; look again a tick later.
  const later = () => {
    window.clearTimeout(t);
    t = window.setTimeout(cb, 0);
  };
  document.addEventListener("focusin", cb);
  document.addEventListener("focusout", later);
  return () => {
    window.clearTimeout(t);
    document.removeEventListener("focusin", cb);
    document.removeEventListener("focusout", later);
  };
}

/**
 * True while a text field has focus. Phones use it to hide fixed bottom bars,
 * which would otherwise ride up with the keyboard and cover the field.
 */
export function useTextEntryFocus(): boolean {
  return useSyncExternalStore(
    subscribeFocus,
    () => isTextEntry(document.activeElement),
    () => false,
  );
}
