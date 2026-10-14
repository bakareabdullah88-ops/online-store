"use client";

import { useEffect, useState } from "react";
import { env } from "@/env";
import { services } from "@/services";

const remote = env.NEXT_PUBLIC_DATA_SOURCE === "remote";

/**
 * Resolves an uploaded image id to a URL. With the backend, that's
 * /api/media/:id (which points at Cloudflare R2, or the database). In mock
 * mode it's an object URL for the IndexedDB blob, revoked on unmount so
 * nothing leaks. `undefined` = loading, `null` = missing.
 */
export const useObjectUrl = remote ? useRemoteUrl : useLocalObjectUrl;

function useRemoteUrl(id: string | null | undefined): string | null {
  return id ? `/api/media/${encodeURIComponent(id)}` : null;
}

function useLocalObjectUrl(id: string | null | undefined): string | null | undefined {
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
