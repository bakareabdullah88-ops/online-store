import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./flows";

test.use({ colorScheme: "dark" });

test("Kamplug stays light with one font, even on a phone set to dark mode", async ({ page }) => {
  await signUp(page, "Tolu Ade", uniqueEmail("look"));
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);
  await expect(html).toHaveAttribute("data-font", "modern");
  await page.goto("/account/settings");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await expect(page.getByText("Font style")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveCount(0);
});
