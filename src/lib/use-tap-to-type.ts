"use client";

import { useCallback, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useMediaQuery } from "./use-media-query";

/**
 * For boxes that open a list of choices: on phones the first tap only opens
 * the list (no keyboard covering it); tapping the box again brings the
 * keyboard up for typing. With a mouse and keyboard nothing changes.
 */
export function useTapToType() {
  const touch = useMediaQuery("(pointer: coarse)");
  const [typing, setTyping] = useState(false);
  /** True while the box is being refocused to show the keyboard; ignore that blur. */
  const refocusing = useRef(false);
  const keyboardOff = touch && !typing;

  /** Bring the keyboard up. Call from the tap itself. Returns false if it was already up. */
  const startTyping = useCallback(
    (el: HTMLInputElement | null) => {
      if (!el || !keyboardOff) return false;
      refocusing.current = true;
      flushSync(() => setTyping(true));
      el.blur();
      el.focus();
      refocusing.current = false;
      return true;
    },
    [keyboardOff],
  );
  const reset = useCallback(() => setTyping(false), []);

  return {
    /** Spread onto the input. */
    inputMode: keyboardOff ? ("none" as const) : undefined,
    keyboardOff,
    startTyping,
    refocusing,
    reset,
  };
}
