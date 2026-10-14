import type { MediaService, Services } from "../contracts";
import { ServiceError, type ServiceErrorCode } from "../errors";

/**
 * The browser side of the real backend. Every service method is one POST to
 * /api/rpc, which runs the same service code on the server against the
 * shared database (see src/server). Photos go to /api/media.
 */

/** The newest change this tab has seen, so its own writes don't count as news. */
let seenSeq = 0;
const noteSeq = (seq: unknown) => {
  if (typeof seq === "number" && seq > seenSeq) seenSeq = seq;
};

type ErrorBody = {
  error?: { code?: ServiceErrorCode; message?: string; fields?: Record<string, string> };
};

async function fail(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as ErrorBody | null;
  throw new ServiceError(
    body?.error?.code ?? "UNAVAILABLE",
    body?.error?.message ?? "We couldn't reach Kiosk. Check your connection and try again.",
    body?.error?.fields,
  );
}

async function send(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, { credentials: "same-origin", ...init });
  } catch {
    throw new ServiceError(
      "UNAVAILABLE",
      "We couldn't reach Kiosk. Check your connection and try again.",
    );
  }
}

async function call(service: string, method: string, args: unknown[]): Promise<unknown> {
  // JSON turns a missing argument into null; drop trailing ones so defaults apply.
  const trimmed = [...args];
  while (trimmed.length && trimmed[trimmed.length - 1] === undefined) trimmed.pop();
  const res = await send("/api/rpc", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ service, method, args: trimmed }),
  });
  if (!res.ok) return fail(res);
  const body = (await res.json()) as { data: unknown; seq?: number };
  noteSeq(body.seq);
  return body.data ?? undefined;
}

function service<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get(_, method) {
      if (typeof method !== "string" || method === "then") return undefined;
      return (...args: unknown[]) => call(name, method, args);
    },
  });
}

/** Photos bigger than this, or wider than MAX_SIDE, are shrunk in the browser first. */
const MAX_BYTES = 3.5 * 1024 * 1024;
const MAX_SIDE = 2000;

async function shrink(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined")
    return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= MAX_BYTES) {
    bitmap.close();
    return file;
  }
  const canvas = new OffscreenCanvas(
    Math.round(bitmap.width * scale),
    Math.round(bitmap.height * scale),
  );
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
}

const media: MediaService = {
  async putImage(file) {
    const body = await shrink(file);
    const res = await send("/api/media", {
      method: "POST",
      headers: { "content-type": body.type || "application/octet-stream" },
      body,
    });
    if (!res.ok) return fail(res);
    return ((await res.json()) as { data: Awaited<ReturnType<MediaService["putImage"]>> }).data;
  },
  async getImage(id) {
    const res = await send(`/api/media/${encodeURIComponent(id)}`, { method: "GET" });
    if (res.status === 404) return null;
    if (!res.ok) return fail(res);
    return res.blob();
  },
  async deleteImage(id) {
    const res = await send(`/api/media/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok && res.status !== 404) return fail(res);
  },
};

/** How often an open, visible tab asks whether anything changed. */
const POLL_MS = 20_000;

export const remoteServices: Services = {
  auth: service("auth"),
  catalog: service("catalog"),
  social: service("social"),
  orders: service("orders"),
  notifications: service("notifications"),
  messages: service("messages"),
  places: service("places"),
  studio: service("studio"),
  media,
  realtime: {
    subscribe(cb) {
      let stopped = false;
      const check = async () => {
        if (stopped || document.visibilityState !== "visible") return;
        const res = await fetch("/api/sync", { cache: "no-store" }).catch(() => null);
        const body = res?.ok ? ((await res.json()) as { seq: number | null }) : null;
        if (stopped || typeof body?.seq !== "number") return;
        const changed = seenSeq > 0 && body.seq > seenSeq;
        noteSeq(body.seq);
        if (changed) cb();
      };
      const timer = window.setInterval(check, POLL_MS);
      const onVisible = () => void check();
      document.addEventListener("visibilitychange", onVisible);
      void check();
      return () => {
        stopped = true;
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    },
  },
};
