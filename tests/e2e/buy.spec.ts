import { expect, test } from "@playwright/test";
import { demoLogin, expectNoAppErrors, trackErrors } from "./helpers";

test("browse, add to bag, check out and track an order", async ({ page, isMobile }) => {
  const errors = trackErrors(page);
  await demoLogin(page, "buyer", "/explore");

  // Browse: filter to food and open a product
  await page.getByRole("radio", { name: "Food & snacks" }).click();
  await expect(page).toHaveURL(/category=food/);
  await page.getByRole("link", { name: /Party Jollof & Chicken/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: "Party Jollof & Chicken" })).toBeVisible();

  // Add to bag (mobile has a sticky bar, desktop the inline button)
  await page.getByRole("button", { name: /Add to bag/ }).filter({ visible: true }).first().click();
  await expect(page.getByText("Added to bag")).toBeVisible();

  // Checkout
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Almost yours" })).toBeVisible();
  await page.getByLabel("Promo code").fill("FREEDEL");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText("Free delivery")).toBeVisible();
  await page.getByRole("button", { name: /Place order/ }).filter({ visible: true }).first().click();

  // Success + live tracking
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("link", { name: "Track your order" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Placed|Confirmed/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Confirmed" })).toBeVisible({ timeout: 20_000 });
  expect(isMobile !== undefined).toBe(true);
  await expectNoAppErrors(page, errors);
});
