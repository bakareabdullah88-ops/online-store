import { expect, test } from "@playwright/test";
import { demoLogin, expectNoAppErrors, trackErrors } from "./helpers";

test("sign up, onboard, open a shop and publish a product", async ({ page }) => {
  test.slow();
  const errors = trackErrors(page);
  const email = `seller${Date.now()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("Your name").fill("Bisi Adewale");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("campus123");
  await page.getByRole("button", { name: "Create account" }).click();

  // Onboarding
  await page.waitForURL(/\/welcome/);
  await page.getByRole("radio", { name: /UNILAG/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Phone number").fill("08031234567");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL(/\/explore/);

  // Open a shop
  await page.goto("/open-shop");
  await page.getByLabel("Brand name").fill("Bisi Thrift Lab");
  await expect(page.getByText("kiosk/bisithriftlab is yours")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "Thrift" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByLabel("Tagline").fill("Vintage denim, washed and steamed");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Open my shop" }).click();
  await expect(page.getByRole("heading", { name: "Bisi Thrift Lab is open" })).toBeVisible();

  // First product, via the mode curtain into Studio
  await page.getByRole("button", { name: "Add your first product" }).click();
  await page.waitForURL(/\/studio\/products\/new/);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "selling");
  await page.getByLabel("Name", { exact: true }).fill("Washed Denim Jacket");
  await page.getByLabel("Description").fill("Mid-wash trucker jacket, gently worn, cleaned and steamed.");
  await page.getByLabel("Price (₦)", { exact: true }).fill("12500");
  await page.getByRole("button", { name: "Publish" }).first().click();
  await page.waitForURL(/\/studio\/products$/);
  await expect(page.getByRole("link", { name: /Washed Denim Jacket/ }).first()).toBeVisible();

  // It's on the marketplace
  await page.goto("/search?q=washed%20denim");
  await expect(page.getByRole("link", { name: /Washed Denim Jacket/ }).first()).toBeVisible();
  await expectNoAppErrors(page, errors);
});

test("demo seller accepts an order and switches back to buying", async ({ page, isMobile }) => {
  const errors = trackErrors(page);
  await demoLogin(page, "seller", "/studio/orders");
  await expect(page.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
  const accept = page.getByRole("button", { name: "Accept" }).first();
  await accept.click();
  await expect(page.getByText(/· Confirmed/)).toBeVisible();

  // Mode switch with the curtain (header on desktop, account sheet on phones)
  if (isMobile) await page.getByRole("button", { name: "More" }).click();
  await page.getByRole("radio", { name: /Buying/ }).filter({ visible: true }).first().click();
  await page.waitForURL((u) => !u.pathname.startsWith("/studio"));
  await expect(page.locator("html")).toHaveAttribute("data-mode", "buying");
  await expectNoAppErrors(page, errors);
});
