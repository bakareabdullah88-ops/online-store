import { createStore, del, get, set, type UseStore } from "idb-keyval";
import { newId } from "@/lib/ids";
import { ServiceError } from "../errors";
import type { MediaService } from "../contracts";
import { quick } from "./latency";

let blobs: UseStore | null = null;
const memory = new Map<string, Blob>();

function store() {
  blobs ??= createStore("kiosk-media", "blobs");
  return blobs;
}
const hasIdb = () => typeof indexedDB !== "undefined";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export const mockMedia: MediaService = {
  async putImage(file) {
    if (!ACCEPTED.includes(file.type)) throw new ServiceError("VALIDATION", "Use a JPG, PNG, WebP or GIF image.");
    if (file.size > MAX_BYTES) throw new ServiceError("VALIDATION", "Images must be under 8MB.");
    await quick();
    const id = newId("img");
    // BACKEND-SEAM: upload to object storage (S3/R2/Vercel Blob) and return a CDN URL ref instead.
    if (hasIdb()) await set(id, file, store());
    else memory.set(id, file);
    return { id, ref: { kind: "blob", id } };
  },
  async getImage(id) {
    if (!hasIdb()) return memory.get(id) ?? null;
    return (await get<Blob>(id, store())) ?? null;
  },
  async deleteImage(id) {
    if (hasIdb()) await del(id, store());
    memory.delete(id);
  },
};

export async function clearMedia() {
  memory.clear();
  if (!hasIdb()) return;
  const { clear } = await import("idb-keyval");
  await clear(store());
}
