import "server-only";
import type { Services } from "@/services/contracts";
import { isServiceError, type ServiceErrorCode } from "@/services/errors";
import { mockAuth } from "@/services/mock/auth";
import { mockCatalog } from "@/services/mock/catalog";
import { mockMessages, mockNotifications, mockPlaces } from "@/services/mock/inbox";
import { mockOrders } from "@/services/mock/orders";
import { mockSocial } from "@/services/mock/social";
import { mockStudio } from "@/services/mock/studio";
import { endSession, sessionUser, startSession } from "./session";
import { runCall } from "./store";

/** What the browser may call. Media has its own routes; realtime is /api/sync. */
const callable: Omit<Services, "media" | "realtime"> = {
  auth: mockAuth,
  catalog: mockCatalog,
  social: mockSocial,
  orders: mockOrders,
  notifications: mockNotifications,
  messages: mockMessages,
  places: mockPlaces,
  studio: mockStudio,
};

const STATUS: Record<ServiceErrorCode, number> = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION: 422,
  CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
  UNAVAILABLE: 503,
};

const MAX_BODY = 512 * 1024;

export function errorResponse(code: ServiceErrorCode, message: string, fields?: unknown) {
  return Response.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status: STATUS[code], headers: { "cache-control": "no-store" } },
  );
}

/**
 * Same-site requests only: browsers always send Origin on a POST, and a
 * JSON body can't be sent cross-site without a preflight this API refuses.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Never send a password hash to a browser, whatever a service returns. */
const SECRET_KEYS = new Set(["passwordHash", "passwordSalt"]);
export function scrub(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(scrub);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v)) if (!SECRET_KEYS.has(k)) out[k] = scrub(x);
    return out;
  }
  return v;
}

/*
 * Per-address limits, kept in each server's memory: enough to slow down
 * password guessing and junk analytics, not a substitute for a firewall.
 */
const hits = new Map<string, number[]>();
function limited(req: Request, bucket: string, max: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 20_000) hits.clear();
  return recent.length > max;
}

/** Test helper. */
export function __resetAttempts() {
  hits.clear();
}

/** Calls a minute per address. */
const LIMITS: Record<string, number> = {
  "auth.signIn": 10,
  "auth.signUp": 10,
  "auth.deleteAccount": 10,
  "catalog.recordEvent": 60,
};
const ANY_CALL = 600;

type Body = { service: string; method: string; args: unknown[] };

function parse(raw: unknown): Body | null {
  if (!raw || typeof raw !== "object") return null;
  const { service, method, args } = raw as Record<string, unknown>;
  if (typeof service !== "string" || typeof method !== "string") return null;
  if (!Array.isArray(args) || args.length > 4) return null;
  return { service, method, args };
}

/** POST /api/rpc  { service, method, args } → { data, seq } */
export async function handleRpc(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return errorResponse("FORBIDDEN", "Cross-site requests aren't allowed.");
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    return errorResponse("VALIDATION", "Send JSON.");
  const text = await req.text();
  if (text.length > MAX_BODY) return errorResponse("VALIDATION", "That request is too large.");
  let body: Body | null = null;
  try {
    body = parse(JSON.parse(text));
  } catch {
    body = null;
  }
  if (!body) return errorResponse("VALIDATION", "Malformed request.");

  const service = Object.hasOwn(callable, body.service)
    ? (callable[body.service as keyof typeof callable] as unknown as Record<string, unknown>)
    : null;
  const fn = service && Object.hasOwn(service, body.method) ? service[body.method] : null;
  if (typeof fn !== "function") return errorResponse("NOT_FOUND", "No such operation.");
  const name = `${body.service}.${body.method}`;
  const max = LIMITS[name];
  if ((max !== undefined && limited(req, name, max)) || limited(req, "any", ANY_CALL))
    return errorResponse("UNAVAILABLE", "Too many attempts. Wait a minute and try again.");

  try {
    const session = await sessionUser(req);
    const args = body.args.map((a) => (a === null ? undefined : a));
    const result = await runCall(session?.userId ?? null, () =>
      (fn as (...a: unknown[]) => Promise<unknown>).apply(service, args),
    );
    const headers = new Headers({ "cache-control": "no-store" });
    if (result.signedIn) {
      const { userId } = result.signedIn;
      if (session) headers.append("set-cookie", await endSession(req, session.token));
      if (userId) headers.append("set-cookie", await startSession(req, userId));
    }
    return Response.json({ data: scrub(result.value ?? null), seq: result.seq }, { headers });
  } catch (e) {
    if (isServiceError(e)) return errorResponse(e.code, e.message, e.fields);
    console.error(`[rpc] ${name} failed`, e);
    return errorResponse("UNAVAILABLE", "Something went wrong on our side. Please try again.");
  }
}
