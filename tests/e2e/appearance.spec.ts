import { expect, test } from "@playwright/test";

test("anyone can switch theme and font style, and it sticks", async ({ page, isMobile }) => {
  await page.goto("/");
  const html = page.locator("html");

  if (isMobile) {
    // Signed out on a phone: the Account tab opens a sheet with Appearance controls.
    await page.getByRole("button", { name: /^Account$/ }).click();
  } else {
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
  }
  const scope = isMobile ? page.getByRole("dialog") : page.getByRole("contentinfo");

  await scope.getByRole("radio", { name: "Dark" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  await scope.getByText("Editorial", { exact: true }).click();
  await expect(html).toHaveAttribute("data-font", "editorial");

  // Survives a reload (applied before paint by the boot script).
  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await expect(html).toHaveAttribute("data-font", "editorial");
});
