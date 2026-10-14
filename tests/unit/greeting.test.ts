import { describe, expect, it } from "vitest";
import { greet, greetingOptions } from "@/lib/greeting";

const at = (day: number, hour: number) => {
  // 2026-10-11 is a Sunday; add `day` days.
  const d = new Date(2026, 9, 11 + day, hour, 15);
  return d;
};

describe("greeting", () => {
  it("fits the time of day", () => {
    expect(greetingOptions("Temi", at(2, 8))).toContain("Good morning, Temi ☀️");
    expect(greetingOptions("Temi", at(2, 14))).toContain("Good afternoon, Temi");
    expect(greetingOptions("Temi", at(2, 19))).toContain("Good evening, Temi");
    expect(greetingOptions("Temi", at(2, 2)).every((g) => !g.includes("morning"))).toBe(true);
  });

  it("adds a line for special days", () => {
    expect(greetingOptions("Temi", at(5, 10))).toContain("Happy Friday, Temi");
    expect(greetingOptions("Temi", at(3, 10))).not.toContain("Happy Friday, Temi");
  });

  it("always names the person and avoids repeating the last one", () => {
    localStorage.clear();
    const first = greet("Temi", at(2, 9), () => 0);
    const second = greet("Temi", at(2, 9), () => 0);
    expect(first).toContain("Temi");
    expect(second).toContain("Temi");
    expect(second).not.toBe(first);
  });
});
