import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("defaults to the real backend", () => {
    expect(parseEnv({})).toEqual({ NEXT_PUBLIC_DATA_SOURCE: "remote" });
  });

  it("parses every supported value", () => {
    expect(
      parseEnv({
        NEXT_PUBLIC_DATA_SOURCE: "remote",
        NEXT_PUBLIC_SITE_URL: "https://kiosk.example",
        NEXT_PUBLIC_MOCK_LATENCY: "0",
      }),
    ).toEqual({
      NEXT_PUBLIC_DATA_SOURCE: "remote",
      NEXT_PUBLIC_SITE_URL: "https://kiosk.example",
      NEXT_PUBLIC_MOCK_LATENCY: 0,
    });
  });

  it("rejects bad values with a readable message", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_DATA_SOURCE: "firebase" })).toThrow(
      /NEXT_PUBLIC_DATA_SOURCE/,
    );
    expect(() => parseEnv({ NEXT_PUBLIC_SITE_URL: "kiosk.example" })).toThrow(/absolute URL/);
    expect(() => parseEnv({ NEXT_PUBLIC_MOCK_LATENCY: "-5" })).toThrow(/0 to 5000/);
    expect(() => parseEnv({ NEXT_PUBLIC_MOCK_LATENCY: "fast" })).toThrow(/0 to 5000/);
  });
});
