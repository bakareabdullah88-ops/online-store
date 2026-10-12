import { describe, expect, it } from "vitest";
import { discountPercent, formatNaira, formatNairaCompact, naira, parseNairaInput, percentOf, sumKobo } from "./money";

describe("money", () => {
  it("formats whole naira without decimals", () => {
    expect(formatNaira(450_000)).toBe("₦4,500");
    expect(formatNaira(0)).toBe("₦0");
  });
  it("shows kobo when present", () => {
    expect(formatNaira(450_050)).toBe("₦4,500.50");
  });
  it("rejects non-integer kobo", () => {
    expect(() => formatNaira(10.5)).toThrow(TypeError);
  });
  it("converts naira to kobo without float drift", () => {
    expect(naira(19.99)).toBe(1999);
    expect(naira(0.1 + 0.2)).toBe(30);
  });
  it("computes compact values", () => {
    expect(formatNairaCompact(1_250_000)).toBe("₦12.5K");
  });
  it("computes discount percentage", () => {
    expect(discountPercent(1_850_000, 2_200_000)).toBe(15);
    expect(discountPercent(1_000, undefined)).toBeNull();
    expect(discountPercent(1_000, 900)).toBeNull();
  });
  it("percentOf rounds to the nearest kobo", () => {
    expect(percentOf(333, 10)).toBe(33);
    expect(percentOf(335, 10)).toBe(34);
  });
  it("sums and parses", () => {
    expect(sumKobo([100, 250])).toBe(350);
    expect(parseNairaInput("₦4,500.5")).toBe(450_050);
    expect(parseNairaInput("abc")).toBeNull();
  });
});
