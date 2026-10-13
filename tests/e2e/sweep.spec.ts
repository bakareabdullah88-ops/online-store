import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectNoAppErrors, trackErrors } from "./helpers";
import { addProduct, openShop, signUp, uniqueEmail } from "./flows";

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

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect.soft(overflow, `${path} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(0);

  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join("\n  ")}`,
  );
  expect.soft(summary, `${path} has accessibility violations`).toEqual([]);
}

test("public pages", async ({ page }) => {
  const errors = trackErrors(page);
  for (const path of [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/offline",
    "/this-page-does-not-exist",
  ]) {
    await audit(page, path);
  }
  await expectNoAppErrors(page, errors);
});

test("buyer pages, new account", async ({ page }) => {
  const errors = trackErrors(page);
  await signUp(page, "Ada Obi", uniqueEmail("sweep"));
  for (const path of [
    "/home",
    "/explore",
    "/search?q=bag",
    "/orders",
    "/bag",
    "/account/places",
    "/account/following",
    "/account/reviews",
    "/account/settings",
    "/wishlist",
    "/notifications",
    "/messages",
  ]) {
    await audit(page, path);
  }
  await expectNoAppErrors(page, errors);
});

test("seller pages, with one product", async ({ page }) => {
  test.slow();
  const errors = trackErrors(page);
  await signUp(page, "Tolu Ade", uniqueEmail("sweepseller"));
  await openShop(page, `Tolu Prints ${Date.now() % 10000}`, "Campus posters and prints");
  await addProduct(page, {
    name: "A3 campus print",
    description: "Matte A3 print of the main gate.",
    price: "2500",
  });
  for (const path of [
    "/studio",
    "/studio/analytics",
    "/studio/products",
    "/studio/products/new",
    "/studio/orders",
    "/studio/customers",
    "/studio/reviews",
    "/studio/promotions",
    "/studio/finance",
    "/studio/messages",
    "/studio/brand",
  ]) {
    await audit(page, path);
  }
  await expectNoAppErrors(page, errors);
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });
  test("key pages in dark mode", async ({ page }) => {
    const errors = trackErrors(page);
    for (const path of ["/", "/login"]) await audit(page, path);
    await signUp(page, "Dami Ola", uniqueEmail("dark"));
    for (const path of ["/home", "/orders", "/messages", "/account/settings"])
      await audit(page, path);
    await expectNoAppErrors(page, errors);
  });
});
