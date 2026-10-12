import { expect, type Page } from "@playwright/test";

/** Fresh browser storage for each test (IndexedDB is per context already). */
export async function demoLogin(page: Page, kind: "buyer" | "seller", next?: string) {
  await page.goto(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByRole("button", { name: new RegExp(`try the demo ${kind}`, "i") }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 });
}

export async function expectNoAppErrors(page: Page, errors: string[]) {
  expect(errors, errors.join("\n")).toEqual([]);
}

/** Collect console errors and page errors (ignores prefetch 404s and dev HMR noise). */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/Failed to load resource.*404|WebSocket/.test(t)) return;
    errors.push(`console: ${t}`);
  });
  return errors;
}
