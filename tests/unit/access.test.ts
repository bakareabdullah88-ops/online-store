import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { emailHash, generatePassword } from "@/lib/access-hash";
import { hashPassword, randomSalt } from "@/lib/hash";
import type { AccessEntry } from "@/config/access";

// Invite-only mode with a list we control.
vi.mock("@/config/features", () => ({
  features: { inviteOnly: true, onlinePayments: false, passwordResetEmail: false, payouts: false },
}));
const list = vi.hoisted(() => [] as AccessEntry[]);
vi.mock("@/config/access", () => ({
  accessList: list,
  userIdFor: (e: { id: string }) => `u_${e.id}`,
}));

const { mockServices: s } = await import("@/services/mock");
const { __resetMemory, resetDb } = await import("@/services/mock/db");
const { isServiceError } = await import("@/services/errors");

const PASSWORD = generatePassword();

beforeAll(async () => {
  const salt = randomSalt();
  list.push({
    id: "abc123",
    name: "Ada Admin",
    role: "admin",
    emailHash: await emailHash("ada@example.com"),
    salt,
    passwordHash: await hashPassword(PASSWORD, salt),
    addedAt: "2026-10-13",
  });
});

beforeEach(async () => {
  __resetMemory();
  await resetDb();
});

async function code(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    return isServiceError(e) ? (e as { code: string }).code : "OTHER";
  }
  return "OK";
}

describe("invite-only access", () => {
  it("closes sign-up", async () => {
    expect(
      await code(s.auth.signUp({ name: "Bo", email: "bo@example.com", password: "campus123" })),
    ).toBe("FORBIDDEN");
  });

  it("lets people on the list log in, any capitalisation, and creates their account", async () => {
    const u = await s.auth.signIn({ email: " Ada@Example.com ", password: PASSWORD });
    expect(u.id).toBe("u_abc123");
    expect(u.role).toBe("admin");
    expect(u.name).toBe("Ada Admin");
    expect(u.onboarded).toBe(false);
    expect((await s.auth.getSession())?.id).toBe("u_abc123");
    // Second login reuses the same account.
    await s.auth.signOut();
    expect((await s.auth.signIn({ email: "ada@example.com", password: PASSWORD })).id).toBe(
      "u_abc123",
    );
  });

  it("refuses wrong passwords and people not on the list, with the same message", async () => {
    expect(await code(s.auth.signIn({ email: "ada@example.com", password: "wrong-pass-1" }))).toBe(
      "UNAUTHORIZED",
    );
    expect(await code(s.auth.signIn({ email: "eve@example.com", password: PASSWORD }))).toBe(
      "UNAUTHORIZED",
    );
  });

  it("signs out accounts that are no longer on the list", async () => {
    await s.auth.signIn({ email: "ada@example.com", password: PASSWORD });
    const removed = list.splice(0, 1);
    __resetMemory();
    expect(await s.auth.getSession()).toBeNull();
    list.push(...removed);
  });
});
