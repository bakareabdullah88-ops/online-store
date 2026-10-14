import { hashPassword, randomSalt, verifyPassword } from "@/lib/hash";
import { newId } from "@/lib/ids";
import type { AuthService } from "../contracts";
import { ServiceError } from "../errors";
import { schemas } from "./schemas";
import type { UserRecord } from "../types";
import { commit, getDb, setSessionUserId } from "./db";
import { currentUser, publicUser, requireUser } from "./context";
import { latency } from "./latency";
import { features } from "@/config/features";
import { removeMedia } from "./media";
import { accessList, userIdFor } from "@/config/access";
import { emailHash, normaliseEmail } from "@/lib/access-hash";
import { PREVIEW } from "./seed/sample";

function validation(error: { issues: { path: PropertyKey[]; message: string }[] }): never {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
  throw new ServiceError("VALIDATION", Object.values(fields)[0] ?? "Check the form", fields);
}

function newUserRecord(p: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
}): UserRecord {
  return {
    ...p,
    phone: "",
    campusId: null,
    avatar: null,
    brandIds: [],
    followingBrandIds: [],
    wishlistProductIds: [],
    onboarded: false,
    notificationPrefs: {
      orderUpdates: true,
      messages: true,
      promotions: false,
      newFromFollowed: true,
    },
    createdAt: new Date().toISOString(),
  };
}

function welcomeNote(user: UserRecord) {
  return {
    id: newId("n"),
    userId: user.id,
    kind: "system" as const,
    title: `Welcome, ${user.name.split(" ")[0]}`,
    body: "Finish setting up your profile to see shops on your campus.",
    href: "/welcome",
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export const mockAuth: AuthService = {
  async getSession() {
    const u = await currentUser();
    return u ? publicUser(u) : null;
  },

  async signUp(raw) {
    const { signUpSchema } = await schemas();
    const parsed = signUpSchema.safeParse(raw);
    if (!parsed.success) validation(parsed.error);
    const input = parsed.data;
    await latency();
    if (features.inviteOnly) {
      throw new ServiceError(
        "FORBIDDEN",
        "Kamplug is invite-only for now. Ask the Kamplug team for a login.",
      );
    }
    const db = await getDb();
    if (db.users.some((u) => u.email === input.email)) {
      throw new ServiceError(
        "CONFLICT",
        "An account with this email already exists. Try logging in.",
        {
          email: "This email is already registered",
        },
      );
    }
    const salt = randomSalt();
    const user = newUserRecord({
      id: newId("u"),
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password, salt),
      passwordSalt: salt,
    });
    db.users.push(user);
    db.notifications.push(welcomeNote(user));
    await commit("users", "notifications");
    await setSessionUserId(user.id);
    return publicUser(user);
  },

  async signIn(raw) {
    const { signInSchema } = await schemas();
    const parsed = signInSchema.safeParse(raw);
    if (!parsed.success) validation(parsed.error);
    const input = parsed.data;
    await latency();
    const db = await getDb();
    // Same message for unknown email and wrong password (no account enumeration).
    const fail = () => {
      throw new ServiceError("UNAUTHORIZED", "That email and password don't match.", {
        password: "That email and password don't match",
      });
    };
    if (features.inviteOnly) {
      const hash = await emailHash(input.email);
      const entry = accessList.find((e) => e.emailHash === hash);
      if (!entry || !(await verifyPassword(input.password, entry.salt, entry.passwordHash)))
        return fail();
      const id = userIdFor(entry);
      let member = db.users.find((u) => u.id === id);
      // First login on this device: create the account from the invite.
      if (!member) {
        member = newUserRecord({
          id,
          email: normaliseEmail(input.email),
          name: entry.name,
          passwordHash: entry.passwordHash,
          passwordSalt: entry.salt,
        });
        db.users.push(member);
        db.notifications.push(welcomeNote(member));
        await commit("users", "notifications");
      }
      await setSessionUserId(member.id);
      return publicUser(member);
    }
    const user = db.users.find((u) => u.email === input.email);
    if (!user || !user.passwordHash) return fail();
    const ok = await verifyPassword(input.password, user.passwordSalt, user.passwordHash);
    if (!ok) return fail();
    await setSessionUserId(user.id);
    return publicUser(user);
  },

  async startPreview() {
    await latency(0.6);
    if (!features.sampleData) {
      throw new ServiceError("UNAVAILABLE", "The preview is switched off. Log in to continue.");
    }
    const db = await getDb();
    const user = db.users.find((u) => u.id === PREVIEW.userId);
    if (!user)
      throw new ServiceError("UNAVAILABLE", "The preview isn't ready. Refresh and try again.");
    await setSessionUserId(user.id);
    return publicUser(user);
  },

  async signOut() {
    await latency(0.4);
    await setSessionUserId(null);
  },

  async requestPasswordReset(raw) {
    const { resetSchema } = await schemas();
    const parsed = resetSchema.safeParse(raw);
    if (!parsed.success) validation(parsed.error);
    await latency();
    // BACKEND-SEAM: send a reset email (never reveal whether the email exists).
    if (!features.passwordResetEmail) {
      throw new ServiceError(
        "UNAVAILABLE",
        "Password reset by email isn't switched on yet. If you remember your password, log in to change it in Settings.",
      );
    }
    return { sent: true };
  },

  async deleteAccount(raw) {
    const { deleteAccountSchema } = await schemas();
    const parsed = deleteAccountSchema.safeParse(raw);
    if (!parsed.success) validation(parsed.error);
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    if (user.id === PREVIEW.userId) {
      throw new ServiceError("FORBIDDEN", "The preview account can't be deleted.");
    }
    // Google-only accounts confirm with their email address instead of a password.
    const ok = user.passwordHash
      ? await verifyPassword(parsed.data.password, user.passwordSalt, user.passwordHash)
      : normaliseEmail(parsed.data.password) === normaliseEmail(user.email);
    if (!ok) {
      const what = user.passwordHash ? "password" : "email";
      throw new ServiceError("UNAUTHORIZED", `That ${what} isn't right.`, {
        password: `That ${what} isn't right`,
      });
    }
    const brandIds = new Set(user.brandIds);
    const images = [
      ...db.products.filter((p) => brandIds.has(p.brandId)).flatMap((p) => p.images),
      ...db.brands.filter((b) => brandIds.has(b.id)).flatMap((b) => [b.logo, b.cover]),
      ...(user.avatar ? [user.avatar] : []),
    ];
    db.users = db.users.filter((u) => u.id !== user.id);
    db.brands = db.brands.filter((b) => !brandIds.has(b.id));
    db.products = db.products.filter((p) => !brandIds.has(p.brandId));
    db.promos = db.promos.filter((p) => !(p.brandId && brandIds.has(p.brandId)));
    db.places = db.places.filter((p) => p.userId !== user.id);
    db.notifications = db.notifications.filter((n) => n.userId !== user.id);
    db.events = db.events.filter((e) => !brandIds.has(e.brandId));
    for (const u of db.users) {
      u.followingBrandIds = u.followingBrandIds.filter((id) => !brandIds.has(id));
    }
    await removeMedia(images.flatMap((i) => (i.kind === "blob" ? [i.id] : [])));
    await commit("users", "brands", "products", "promos", "places", "notifications", "events");
    await setSessionUserId(null);
  },

  async updateProfile(raw) {
    const { profileSchema } = await schemas();
    const parsed = profileSchema.safeParse(raw);
    if (!parsed.success) validation(parsed.error);
    const input = parsed.data;
    await latency();
    const db = await getDb();
    const user = await requireUser(db);
    if (!db.campuses.some((c) => c.id === input.campusId)) {
      throw new ServiceError("VALIDATION", "Pick a campus from the list", {
        campusId: "Pick a campus",
      });
    }
    user.name = input.name;
    user.campusId = input.campusId;
    user.phone = input.phone;
    if (input.avatarImageId) user.avatar = { kind: "blob", id: input.avatarImageId };
    user.onboarded = true;
    await commit("users");
    return publicUser(user);
  },

  async updateNotificationPrefs(prefs) {
    await latency(0.4);
    const db = await getDb();
    const user = await requireUser(db);
    // Only the known switches, and only true or false.
    const next = { ...user.notificationPrefs };
    for (const key of Object.keys(next) as (keyof typeof next)[]) {
      const v = (prefs as Record<string, unknown> | null)?.[key];
      if (typeof v === "boolean") next[key] = v;
    }
    user.notificationPrefs = next;
    await commit("users");
    return publicUser(user);
  },
};

/**
 * Signs in someone whose email Google has just verified, creating their
 * account on first visit. SERVER ONLY: it trusts the email, so it must never
 * be callable from a browser (it isn't on mockAuth, which /api/rpc exposes).
 */
export async function signInWithVerifiedEmail(profile: { email: string; name: string }) {
  const email = normaliseEmail(profile.email);
  const db = await getDb();
  let user: UserRecord | undefined;
  if (features.inviteOnly) {
    const hash = await emailHash(email);
    const entry = accessList.find((e) => e.emailHash === hash);
    if (!entry) {
      throw new ServiceError(
        "FORBIDDEN",
        "That Google account isn't on the invite list yet. Ask the Kamplug team for access.",
      );
    }
    const id = userIdFor(entry);
    user = db.users.find((u) => u.id === id);
    if (!user) {
      user = newUserRecord({
        id,
        email,
        name: entry.name,
        passwordHash: entry.passwordHash,
        passwordSalt: entry.salt,
      });
      db.users.push(user);
      db.notifications.push(welcomeNote(user));
    }
  } else {
    user = db.users.find((u) => normaliseEmail(u.email) === email);
    if (user?.passwordHash) {
      // Nobody proved they owned this address when the password was set; Google
      // just did. Dropping the password stops anyone who signed up with someone
      // else's email from getting into their account.
      user.passwordHash = "";
      user.passwordSalt = "";
      db.notifications.push({
        id: newId("n"),
        userId: user.id,
        kind: "system",
        title: "You now log in with Google",
        body: "Google confirmed this email is yours, so your old password was removed. Use Continue with Google next time.",
        href: "/account/settings",
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    if (!user) {
      const name = profile.name.trim().slice(0, 60) || email.split("@")[0]!;
      user = newUserRecord({ id: newId("u"), email, name, passwordHash: "", passwordSalt: "" });
      db.users.push(user);
      db.notifications.push(welcomeNote(user));
    }
  }
  await commit("users", "notifications");
  await setSessionUserId(user.id);
  return publicUser(user);
}
