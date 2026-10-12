import { hashPassword, randomSalt, verifyPassword } from "@/lib/hash";
import { newId } from "@/lib/ids";
import type { AuthService } from "../contracts";
import { ServiceError } from "../errors";
import { schemas } from "./schemas";
import type { UserRecord } from "../types";
import { commit, getDb, setSessionUserId } from "./db";
import { currentUser, publicUser, requireUser } from "./context";
import { latency } from "./latency";
import { DEMO } from "./seed";

function validation(error: { issues: { path: PropertyKey[]; message: string }[] }): never {
  const fields: Record<string, string> = {};
  for (const i of error.issues) fields[String(i.path[0] ?? "form")] ??= i.message;
  throw new ServiceError("VALIDATION", Object.values(fields)[0] ?? "Check the form", fields);
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
    const db = await getDb();
    if (db.users.some((u) => u.email === input.email)) {
      throw new ServiceError("CONFLICT", "An account with this email already exists. Try logging in.", {
        email: "This email is already registered",
      });
    }
    const salt = randomSalt();
    const user: UserRecord = {
      id: newId("u"),
      email: input.email,
      name: input.name,
      phone: "",
      campusId: null,
      avatar: null,
      brandIds: [],
      followingBrandIds: [],
      wishlistProductIds: [],
      onboarded: false,
      notificationPrefs: { orderUpdates: true, messages: true, promotions: false, newFromFollowed: true },
      createdAt: new Date().toISOString(),
      isDemo: false,
      passwordHash: await hashPassword(input.password, salt),
      passwordSalt: salt,
    };
    db.users.push(user);
    db.notifications.push({
      id: newId("n"),
      userId: user.id,
      kind: "system",
      title: `Welcome, ${input.name.split(" ")[0]}`,
      body: "Finish setting up your profile to see brands on your campus.",
      href: "/welcome",
      read: false,
      createdAt: new Date().toISOString(),
    });
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
    const user = db.users.find((u) => u.email === input.email);
    // Same message for unknown email and wrong password (no account enumeration).
    const fail = () => {
      throw new ServiceError("UNAUTHORIZED", "That email and password don't match.", {
        password: "That email and password don't match",
      });
    };
    if (!user || !user.passwordHash) return fail();
    const ok = await verifyPassword(input.password, user.passwordSalt, user.passwordHash);
    if (!ok) return fail();
    await setSessionUserId(user.id);
    return publicUser(user);
  },

  async signInDemo(kind) {
    await latency(0.6);
    const db = await getDb();
    const id = kind === "buyer" ? DEMO.buyer.id : DEMO.seller.id;
    const user = db.users.find((u) => u.id === id);
    if (!user) throw new ServiceError("NOT_FOUND", "Demo data is missing. Reset demo data in settings.");
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
    // BACKEND-SEAM: send a reset email. The demo never reveals whether the email exists.
    return { sent: true };
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
      throw new ServiceError("VALIDATION", "Pick a campus from the list", { campusId: "Pick a campus" });
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
    user.notificationPrefs = { ...user.notificationPrefs, ...prefs };
    await commit("users");
    return publicUser(user);
  },
};
