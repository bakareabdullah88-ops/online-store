import "server-only";
import { newId } from "@/lib/ids";
import { deleteMedia, readMedia, saveMedia } from "./media-store";
import { errorResponse, sameOrigin } from "./rpc";
import { sessionUser } from "./session";

/** Under Vercel's 4.5MB request limit; the browser shrinks bigger photos first. */
export const MAX_UPLOAD = 4 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** POST /api/media  (raw image body) → { id, ref } */
export async function handleUpload(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return errorResponse("FORBIDDEN", "Cross-site requests aren't allowed.");
  const type = req.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
  if (!ACCEPTED.includes(type))
    return errorResponse("VALIDATION", "Use a JPG, PNG, WebP or GIF image.");
  const session = await sessionUser(req);
  if (!session) return errorResponse("UNAUTHORIZED", "Please sign in to continue.");
  const bytes = Buffer.from(await req.arrayBuffer());
  if (!bytes.length) return errorResponse("VALIDATION", "That file is empty.");
  if (bytes.length > MAX_UPLOAD) return errorResponse("VALIDATION", "Images must be under 4MB.");
  const id = newId("img");
  try {
    await saveMedia(id, session.userId, type, bytes);
  } catch (e) {
    console.error("[media] upload failed", e);
    return errorResponse("UNAVAILABLE", "We couldn't save that photo. Please try again.");
  }
  return Response.json({ data: { id, ref: { kind: "blob", id } } });
}

/**
 * GET /api/media/:id → the image: a redirect to Cloudflare R2, or the bytes
 * from the database. Ids are random and never reused, so it caches forever.
 */
export async function handleGet(id: string): Promise<Response> {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return new Response(null, { status: 404 });
  const found = await readMedia(id);
  if (!found) return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
  const forever = "public, max-age=31536000, immutable";
  if (found.kind === "url")
    return new Response(null, {
      status: 302,
      headers: { location: found.url, "cache-control": forever },
    });
  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "content-type": found.contentType,
      "cache-control": forever,
      "x-content-type-options": "nosniff",
    },
  });
}

/** DELETE /api/media/:id: only by whoever uploaded it. */
export async function handleDelete(req: Request, id: string): Promise<Response> {
  if (!sameOrigin(req)) return errorResponse("FORBIDDEN", "Cross-site requests aren't allowed.");
  const session = await sessionUser(req);
  if (!session) return errorResponse("UNAUTHORIZED", "Please sign in to continue.");
  await deleteMedia([id], session.userId);
  return new Response(null, { status: 204 });
}
