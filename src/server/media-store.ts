import "server-only";
import { AwsClient } from "aws4fetch";
import { db } from "./pg";

/**
 * Where uploaded photos live. Cloudflare R2 when its settings are present
 * (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME,
 * R2_PUBLIC_URL); otherwise the database, so local development needs nothing.
 * Either way kamplug_media keeps one row per photo with its owner.
 */
type R2 = { client: AwsClient; endpoint: string; publicUrl: string };

let r2Config: R2 | null | undefined;
export function r2(): R2 | null {
  if (r2Config !== undefined) return r2Config;
  const {
    R2_ACCOUNT_ID: account,
    R2_ACCESS_KEY_ID: key,
    R2_SECRET_ACCESS_KEY: secret,
    R2_BUCKET_NAME: bucket,
    R2_PUBLIC_URL: publicUrl,
  } = process.env;
  r2Config =
    account && key && secret && bucket && publicUrl
      ? {
          client: new AwsClient({
            accessKeyId: key,
            secretAccessKey: secret,
            service: "s3",
            region: "auto",
          }),
          endpoint: `https://${account}.r2.cloudflarestorage.com/${bucket}`,
          publicUrl: publicUrl.replace(/\/+$/, ""),
        }
      : null;
  return r2Config;
}

/** Test helper: read the R2 settings again. */
export function forgetR2() {
  r2Config = undefined;
}

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Stores a photo and records who uploaded it. */
export async function saveMedia(id: string, ownerId: string, type: string, bytes: Buffer) {
  const store = r2();
  const pool = await db();
  if (store) {
    const key = `images/${id}.${EXT[type] ?? "bin"}`;
    const body = new Uint8Array(bytes);
    // Sign, then send the bytes ourselves: a signed Request carries its body as
    // a stream, and R2 refuses streamed uploads without a Content-Length.
    const signed = await store.client.sign(`${store.endpoint}/${key}`, {
      method: "PUT",
      body,
      headers: {
        "content-type": type,
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
    const headers = new Headers(signed.headers);
    headers.set("content-length", String(body.byteLength));
    const res = await fetch(signed.url, { method: "PUT", headers, body });
    if (!res.ok) throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
    await pool.query(
      "insert into kamplug_media (id, owner_id, content_type, location) values ($1, $2, $3, $4)",
      [id, ownerId, type, key],
    );
  } else {
    await pool.query(
      "insert into kamplug_media (id, owner_id, content_type, bytes) values ($1, $2, $3, $4)",
      [id, ownerId, type, bytes],
    );
  }
}

export type Stored =
  { kind: "url"; url: string } | { kind: "bytes"; contentType: string; bytes: Buffer };

export async function readMedia(id: string): Promise<Stored | null> {
  const pool = await db();
  const { rows } = await pool.query<{
    content_type: string;
    bytes: Buffer | null;
    location: string | null;
  }>("select content_type, bytes, location from kamplug_media where id = $1", [id]);
  const row = rows[0];
  if (!row) return null;
  if (row.location) {
    const store = r2();
    // Saved to R2 but R2 isn't configured here (say, locally): nothing to show.
    return store ? { kind: "url", url: `${store.publicUrl}/${row.location}` } : null;
  }
  return row.bytes ? { kind: "bytes", contentType: row.content_type, bytes: row.bytes } : null;
}

/** Deletes photos, but only ones this person uploaded. */
export async function deleteMedia(ids: string[], ownerId: string) {
  if (!ids.length) return;
  const pool = await db();
  const { rows } = await pool.query<{ location: string | null }>(
    "delete from kamplug_media where id = any($1) and owner_id = $2 returning location",
    [ids, ownerId],
  );
  const store = r2();
  if (!store) return;
  await Promise.all(
    rows
      .filter((r) => r.location)
      .map((r) =>
        store.client
          .fetch(`${store.endpoint}/${r.location}`, { method: "DELETE" })
          .catch((e) => console.error("[media] R2 delete failed", r.location, e)),
      ),
  );
}
