import { accessList, userIdFor } from "@/config/access";
import { features } from "@/config/features";
import { ServiceError } from "../errors";
import type { Brand, UserRecord, User } from "../types";
import { getDb, getSessionUserId } from "./db";
import type { DbSnapshot } from "./seed";

/** The access-list entry behind an account, in invite-only mode. */
export function accessEntryFor(userId: string) {
  return accessList.find((e) => userIdFor(e) === userId);
}

export async function currentUser(db?: DbSnapshot): Promise<UserRecord | null> {
  const d = db ?? (await getDb());
  const id = await getSessionUserId();
  if (!id) return null;
  // Invite-only: accounts not (or no longer) on the list are signed out.
  if (features.inviteOnly && !accessEntryFor(id)) return null;
  return d.users.find((u) => u.id === id) ?? null;
}

export async function requireUser(db?: DbSnapshot): Promise<UserRecord> {
  const u = await currentUser(db);
  if (!u) throw new ServiceError("UNAUTHORIZED", "Please sign in to continue.");
  return u;
}

export async function requireBrand(db: DbSnapshot): Promise<{ user: UserRecord; brand: Brand }> {
  const user = await requireUser(db);
  const brand = db.brands.find((b) => user.brandIds.includes(b.id));
  if (!brand) throw new ServiceError("FORBIDDEN", "Open a shop first to use Shop Studio.");
  return { user, brand };
}

/** Strip private fields before returning a user to the UI. */
export function publicUser(u: UserRecord): User {
  const { passwordHash, passwordSalt, ...rest } = u;
  const role = features.inviteOnly ? (accessEntryFor(u.id)?.role ?? "member") : "member";
  return { ...structuredClone(rest), role };
}

/** Return detached copies so UI mutations never leak into the store. */
export function clone<T>(v: T): T {
  return structuredClone(v);
}

export function nowIso() {
  return new Date().toISOString();
}

export function notFound(what: string): never {
  throw new ServiceError("NOT_FOUND", `${what} not found.`);
}
