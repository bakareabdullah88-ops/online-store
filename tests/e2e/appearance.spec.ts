import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./flows";

test("theme and font style can be changed from the account menu and stick", async ({ page }) => {
  await signUp(page, "Tolu Ade", uniqueEmail("look"));
  const html = page.locator("html");
  await page
    .getByRole("button", { name: "Account menu" })
    .filter({ visible: true })
    .first()
    .click();
  const menu = page.getByRole("dialog");
  await menu.getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  await menu.getByText("Editorial", { exact: true }).click();
  await expect(html).toHaveAttribute("data-font", "editorial");

  // Survives a reload (applied before paint by the boot script).
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(html).toHaveAttribute("data-font", "editorial");
});
