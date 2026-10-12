"use client";

import { useEffect, useState } from "react";
import { services } from "@/services";

/**
 * Resolves an IndexedDB image id to an object URL and revokes it on unmount,
 * so nothing leaks. `undefined` = loading, `null` = missing.
 */
export function useObjectUrl(id: string | null | undefined): string | null | undefined {
  const [state, setState] = useState<{
    id: string | null | undefined;
    url: string | null | undefined;
  }>({
    id,
    url: undefined,
  });

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    let cancelled = false;
    services.media.getImage(id).then(
      (blob) => {
        if (cancelled) return;
        url = blob ? URL.createObjectURL(blob) : null;
        setState({ id, url });
      },
      () => !cancelled && setState({ id, url: null }),
    );
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  if (!id) return null;
  return state.id === id ? state.url : undefined;
}
