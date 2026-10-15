import { expect, type Page } from "@playwright/test";

export const PASSWORD = "campus123";

/** Unique per run so tests can share a server without clashing. */
export const uniqueEmail = (who: string) =>
  `${who}${Date.now()}${Math.floor(Math.random() * 1e4)}@example.com`;

/** Sign up and finish onboarding at UNILAG. Lands on /home. */
export async function signUp(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/welcome/);
  await page.getByRole("radio", { name: /UNILAG/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Phone number").fill("08031234567");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.waitForURL(/\/home/);
}

export async function logIn(page: Page, email: string, next = "/home") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function signOut(page: Page) {
  await page
    .getByRole("button", { name: "Account menu" })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((u) => u.pathname === "/");
}

/** Open a shop with the wizard's defaults (pickup on campus). */
export async function openShop(page: Page, name: string, tagline: string) {
  await page.goto("/open-shop");
  await page.getByLabel("Brand name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "Food & snacks" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByLabel("Tagline").fill(tagline);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "How do buyers get their order?" }).waitFor();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Open my shop" }).click();
  await expect(page.getByRole("heading", { name: `${name} is open` })).toBeVisible();
}

export async function addProduct(
  page: Page,
  p: { name: string; description: string; price: string },
) {
  await page.goto("/studio/products/new");
  await page.getByLabel("Name", { exact: true }).fill(p.name);
  await page.getByLabel("Description").fill(p.description);
  await page.getByLabel("Price (₦)", { exact: true }).fill(p.price);
  await page
    .getByRole("button", { name: "Publish", exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.waitForURL(/\/studio\/products$/);
}

/** Find a product by search, add it to the bag and place a pay-at-pickup order. */
export async function buy(page: Page, productName: string) {
  await page.goto(`/search?q=${encodeURIComponent(productName)}`);
  await page
    .getByRole("link", { name: new RegExp(productName) })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1, name: productName })).toBeVisible();
  await page
    .getByRole("button", { name: /Add to bag/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByText("Added to bag")).toBeVisible();
  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Almost yours" })).toBeVisible();
  await page
    .getByRole("button", { name: /Place order/ })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
    timeout: 20_000,
  });
}

/** Click the next-step button on the first order until it's done. */
export async function fulfilFirstOrder(page: Page) {
  await page.goto("/studio/orders");
  for (const label of ["Accept", "Start preparing", "Mark ready", "Mark picked up"]) {
    await page
      .getByRole("button", { name: label, exact: true })
      .filter({ visible: true })
      .first()
      .click();
  }
  // Saved, not just optimistic: the server marks pay-at-pickup orders paid on completion.
  await expect(
    page
      .getByText(/· Paid/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
}
