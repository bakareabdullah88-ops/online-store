import "server-only";
import { newId } from "@/lib/ids";
import { isSampleId } from "@/services/mock/seed/sample";
import { db } from "./pg";
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
  if (isSampleId(session.userId))
    return errorResponse(
      "FORBIDDEN",
      "You're looking around with the preview account, so uploads aren't saved.",
    );
  const bytes = Buffer.from(await req.arrayBuffer());
  if (!bytes.length) return errorResponse("VALIDATION", "That file is empty.");
  if (bytes.length > MAX_UPLOAD) return errorResponse("VALIDATION", "Images must be under 4MB.");
  const id = newId("img");
  const pool = await db();
  await pool.query(
    "insert into kiosk_media (id, owner_id, content_type, bytes) values ($1, $2, $3, $4)",
    [id, session.userId, type, bytes],
  );
  return Response.json({ data: { id, ref: { kind: "blob", id } } });
}

/** GET /api/media/:id → the image. Ids are random and never reused, so it caches forever. */
export async function handleGet(id: string): Promise<Response> {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return new Response(null, { status: 404 });
  const pool = await db();
  const { rows } = await pool.query<{ content_type: string; bytes: Buffer }>(
    "select content_type, bytes from kiosk_media where id = $1",
    [id],
  );
  const row = rows[0];
  if (!row) return new Response(null, { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "content-type": row.content_type,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}

/** DELETE /api/media/:id: only by whoever uploaded it. */
export async function handleDelete(req: Request, id: string): Promise<Response> {
  if (!sameOrigin(req)) return errorResponse("FORBIDDEN", "Cross-site requests aren't allowed.");
  const session = await sessionUser(req);
  if (!session) return errorResponse("UNAUTHORIZED", "Please sign in to continue.");
  const pool = await db();
  await pool.query("delete from kiosk_media where id = $1 and owner_id = $2", [id, session.userId]);
  return new Response(null, { status: 204 });
}
