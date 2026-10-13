import { describe, expect, it } from "vitest";
import { delta, funnel, inRange, presetRange, previousRange, rangeDays } from "./analytics";

describe("ranges", () => {
  const now = new Date(2026, 9, 13, 15, 0).getTime(); // 13 Oct 2026, local
  it("builds presets in local days", () => {
    expect(presetRange("7d", now)).toEqual({ from: "2026-10-07", to: "2026-10-13" });
    expect(presetRange("month", now)).toEqual({ from: "2026-10-01", to: "2026-10-13" });
    expect(presetRange("lastMonth", now)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(rangeDays(presetRange("30d", now))).toHaveLength(30);
  });
  it("compares with the same number of days just before", () => {
    expect(previousRange({ from: "2026-10-07", to: "2026-10-13" })).toEqual({
      from: "2026-09-30",
      to: "2026-10-06",
    });
    expect(previousRange({ from: "2026-03-01", to: "2026-03-01" })).toEqual({
      from: "2026-02-28",
      to: "2026-02-28",
    });
  });
  it("includes both ends", () => {
    const r = { from: "2026-10-07", to: "2026-10-13" };
    expect(inRange(new Date(2026, 9, 7, 0, 1).toISOString(), r)).toBe(true);
    expect(inRange(new Date(2026, 9, 13, 23, 59).toISOString(), r)).toBe(true);
    expect(inRange(new Date(2026, 9, 14, 0, 1).toISOString(), r)).toBe(false);
  });
});

describe("delta", () => {
  it("is null when there's nothing to compare with", () => {
    expect(delta(5, 0).change).toBeNull();
    expect(delta(0, 0).change).toBe(0);
    expect(delta(15, 10).change).toBe(50);
    expect(delta(5, 10).change).toBe(-50);
  });
});

describe("funnel", () => {
  it("computes conversion and drop-off between steps", () => {
    const f = funnel([
      { key: "a", label: "Views", value: 200, prev: 100 },
      { key: "b", label: "Bag", value: 50 },
      { key: "c", label: "Orders", value: 0 },
      { key: "d", label: "Done", value: 0 },
    ]);
    expect(f[0]).toMatchObject({ conversion: null, dropOff: null, prev: 100 });
    expect(f[1]).toMatchObject({ conversion: 25, dropOff: -75, prev: 0 });
    expect(f[2]).toMatchObject({ conversion: 0, dropOff: -100 });
    expect(f[3]).toMatchObject({ conversion: 0 });
  });
});
