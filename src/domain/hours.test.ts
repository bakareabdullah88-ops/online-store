import { describe, expect, it } from "vitest";
import { describeDays, formatClock, openState } from "./hours";

const hours = { days: [1, 2, 3, 4, 5], opens: "09:00", closes: "20:00" };

describe("hours", () => {
  it("formats clock times", () => {
    expect(formatClock("09:00")).toBe("9am");
    expect(formatClock("22:30")).toBe("10:30pm");
    expect(formatClock("00:00")).toBe("12am");
  });
  it("is open within hours on open days", () => {
    expect(openState(hours, false, new Date(2025, 5, 2, 12, 0))).toEqual({
      open: true,
      label: "Open · closes 8pm",
    }); // Monday
  });
  it("points to the next opening", () => {
    expect(openState(hours, false, new Date(2025, 5, 2, 21, 0)).label).toBe(
      "Closed · opens tomorrow 9am",
    );
    expect(openState(hours, false, new Date(2025, 5, 6, 21, 0)).label).toBe(
      "Closed · opens Mon 9am",
    ); // Friday night
    expect(openState(hours, false, new Date(2025, 5, 2, 7, 0)).label).toBe(
      "Closed · opens today 9am",
    );
  });
  it("respects vacation mode", () => {
    expect(openState(hours, true, new Date(2025, 5, 2, 12, 0))).toEqual({
      open: false,
      label: "On a break",
    });
  });
  it("describes day sets", () => {
    expect(describeDays([0, 1, 2, 3, 4, 5, 6])).toBe("Every day");
    expect(describeDays([1, 2, 3, 4, 5, 6])).toBe("Mon–Sat");
  });
});
