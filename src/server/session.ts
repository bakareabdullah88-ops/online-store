import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./pg";

export const SESSION_COOKIE = "kiosk_session";
const MAX_AGE_S = 30 * 86_400;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** The account signed in with this request's cookie, if the sign-in is still valid. */
export async function sessionUser(req: Request): Promise<{ token: string; userId: string } | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const pool = await db();
  const { rows } = await pool.query<{ user_id: string }>(
    "select user_id from kiosk_sessions where token_hash = $1 and expires_at > now()",
    [hash(token)],
  );
  return rows[0] ? { token, userId: rows[0].user_id } : null;
}

/** Starts a sign-in and returns the Set-Cookie header for it. */
export async function startSession(req: Request, userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const pool = await db();
  await pool.query(
    `insert into kiosk_sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(secs => $3))`,
    [hash(token), userId, MAX_AGE_S],
  );
  // Housekeeping: drop expired sign-ins now and then.
  if (Math.random() < 0.05) await pool.query("delete from kiosk_sessions where expires_at < now()");
  return cookie(req, token, MAX_AGE_S);
}

/** Ends a sign-in and returns the Set-Cookie header that clears it. */
export async function endSession(req: Request, token: string | null): Promise<string> {
  if (token) {
    const pool = await db();
    await pool.query("delete from kiosk_sessions where token_hash = $1", [hash(token)]);
  }
  return cookie(req, "", 0);
}

function cookie(req: Request, value: string, maxAge: number) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
