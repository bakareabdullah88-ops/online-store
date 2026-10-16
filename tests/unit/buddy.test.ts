import { beforeEach, describe, expect, it } from "vitest";
import { BUDDY_COLORS, BUDDY_SHAPES, defaultBuddy, isBuddy } from "@/domain/buddy";
import { mockServices as s } from "@/services/mock";
import { __resetMemory, resetDb } from "@/services/mock/db";

beforeEach(async () => {
  __resetMemory();
  await resetDb();
});

describe("buddies", () => {
  it("gives every account the same default buddy each time", () => {
    const a = defaultBuddy("user_123");
    expect(defaultBuddy("user_123")).toEqual(a);
    expect(BUDDY_SHAPES).toContain(a.shape);
    expect(BUDDY_COLORS).toContain(a.color);
    // Different accounts spread across the shapes.
    const shapes = new Set(Array.from({ length: 60 }, (_, i) => defaultBuddy(`u${i}`).shape));
    expect(shapes.size).toBeGreaterThan(3);
  });

  it("only accepts real shapes and colours", () => {
    expect(isBuddy({ shape: "star", color: "grape" })).toBe(true);
    expect(isBuddy({ shape: "human", color: "grape" })).toBe(false);
    expect(isBuddy(null)).toBe(false);
  });

  it("saves the chosen buddy on the account and can drop a photo for it", async () => {
    await s.auth.signUp({ name: "Bisi Ade", email: "bisi@example.com", password: "campus123" });
    const base = { name: "Bisi Ade", campusId: "c_unilag", phone: "08030000000" };
    let u = await s.auth.updateProfile({ ...base, avatarImageId: "img_1" });
    expect(u.avatar).toEqual({ kind: "blob", id: "img_1" });
    u = await s.auth.updateProfile({
      ...base,
      buddy: { shape: "cloud", color: "sky" },
      removeAvatar: true,
    });
    expect(u.buddy).toEqual({ shape: "cloud", color: "sky" });
    expect(u.avatar).toBeNull();
    await expect(
      s.auth.updateProfile({ ...base, buddy: { shape: "person" as never, color: "sky" } }),
    ).rejects.toBeTruthy();
  });
});
