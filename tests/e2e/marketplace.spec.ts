import { expect, test } from "@playwright/test";
import { expectNoAppErrors, trackErrors } from "./helpers";
import {
  addProduct,
  buy,
  fulfilFirstOrder,
  logIn,
  openShop,
  signOut,
  signUp,
  uniqueEmail,
} from "./flows";

test("landing sends visitors to sign up and gates the app", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Buy from your campus/ })).toBeVisible();
  await page.goto("/home");
  await page.waitForURL(/\/login\?next=%2Fhome/);
  await page.goto("/studio/orders");
  await page.waitForURL(/\/login/);
  await expectNoAppErrors(page, errors);
});

test("two real accounts: open a shop, buy, fulfil, message", async ({ page }) => {
  test.slow();
  const errors = trackErrors(page);
  const seller = uniqueEmail("seller");
  const buyer = uniqueEmail("buyer");
  const product = `Puff-puff box ${Date.now() % 10000}`;

  // Seller signs up, opens a shop and lists a product.
  await signUp(page, "Kemi Bakes", seller);
  const shop = `Kemi Bakes ${Date.now() % 10000}`;
  await openShop(page, shop, "Small chops, made fresh daily");
  await addProduct(page, {
    name: product,
    description: "Twelve warm puff-puffs, sugar dusted.",
    price: "1500",
  });
  await expect(page.getByText(product).filter({ visible: true }).first()).toBeVisible();
  await signOut(page);

  // A second account buys it, paying at pickup.
  await signUp(page, "Bisi Ade", buyer);
  await buy(page, product);
  await page.goto("/orders");
  await expect(
    page
      .getByText(/New|Placed/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await signOut(page);

  // Seller sees the order and moves it to completed.
  await logIn(page, seller, "/studio");
  await expect(page.getByRole("heading", { level: 1, name: shop })).toBeVisible();
  await fulfilFirstOrder(page);
  await page.goto("/studio");
  // The sale now shows up under top products, next to the revenue figure.
  await expect(page.getByText("Revenue", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: product })).toBeVisible();
  await signOut(page);

  // Buyer sees it picked up and paid, and messages the shop.
  await logIn(page, buyer, "/orders");
  await expect(
    page
      .getByText(/Picked up/)
      .filter({ visible: true })
      .first(),
  ).toBeVisible();
  await expect(page.getByText(/Paid/).filter({ visible: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: /Actions for order/ })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("menuitem", { name: "Message the shop" }).click();
  await page.waitForURL(/\/messages\?thread=/);
  await page.getByRole("button", { name: "Show quick replies" }).click();
  await page.getByRole("button", { name: "Say thanks" }).click();
  await page.getByRole("button", { name: "Send this reply" }).click();
  await expect(
    page.getByRole("log", { name: "Messages" }).getByText(/thank/i).first(),
  ).toBeVisible();
  await expectNoAppErrors(page, errors);
});
