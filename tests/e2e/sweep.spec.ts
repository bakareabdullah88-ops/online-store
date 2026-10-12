import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { demoLogin, expectNoAppErrors, trackErrors } from "./helpers";

/**
 * Page sweep: every key screen must load without console errors, without
 * horizontal overflow, and without WCAG A/AA violations (axe).
 */

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // Wait for skeletons (simulated latency) to resolve so axe sees real content.
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
  await page.waitForTimeout(400);
}

async function audit(page: Page, path: string) {
  await page.goto(path);
  await settle(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect.soft(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);

  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join("\n  ")}`);
  expect.soft(summary, `${path} has accessibility violations`).toEqual([]);
}

test("public pages", async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of ["/", "/explore", "/search?q=jollof", "/brands/adirelab", "/bag", "/login", "/signup", "/design-system", "/offline", "/this-page-does-not-exist"]) {
    await audit(page, path);
  }
  await page.goto("/brands/adirelab");
  const product = await page.locator('a[href^="/products/"]').first().getAttribute("href");
  expect(product).toBeTruthy();
  await audit(page, product ?? "/");
  await expectNoAppErrors(page, errors);
});

test("buyer pages", async ({ page }) => {
  const errors = trackErrors(page);
  await demoLogin(page, "buyer");
  for (const path of ["/orders", "/account", "/account/places", "/account/wallet", "/account/settings", "/wishlist", "/notifications", "/messages"]) {
    await audit(page, path);
  }
  await expectNoAppErrors(page, errors);
});

test("seller pages", async ({ page }) => {
  const errors = trackErrors(page);
  await demoLogin(page, "seller", "/studio");
  for (const path of ["/studio", "/studio/products", "/studio/products/new", "/studio/orders", "/studio/customers", "/studio/reviews", "/studio/promotions", "/studio/analytics", "/studio/brand", "/studio/payouts"]) {
    await audit(page, path);
  }
  await expectNoAppErrors(page, errors);
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  test("key pages in dark mode", async ({ page }) => {
    const errors = trackErrors(page);
    for (const path of ["/", "/explore", "/brands/adirelab", "/login"]) await audit(page, path);
    await demoLogin(page, "seller", "/studio");
    for (const path of ["/orders", "/account", "/studio", "/studio/orders", "/studio/analytics"]) await audit(page, path);
    await expectNoAppErrors(page, errors);
  });
});
