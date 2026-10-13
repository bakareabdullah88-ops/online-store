// Usage: node scripts/make-state.mjs <baseUrl> <outDir>
// Runs the real flow in a browser (two accounts, a shop, products, orders, messages)
// and saves storage states, IndexedDB included, for screenshots and audits:
//   <outDir>/seller.json and <outDir>/buyer.json
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [base = "http://localhost:3100", out = "screenshots/state"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const PASSWORD = "campus123";
const stamp = Date.now() % 100000;
const seller = { name: "Kemi Adebayo", email: `kemi${stamp}@example.com` };
const buyers = [
  { name: "Bisi Okafor", email: `bisi${stamp}@example.com` },
  { name: "Tunde Bello", email: `tunde${stamp}@example.com` },
];
const products = [
  {
    name: "Puff-puff box (12)",
    description: "Twelve warm puff-puffs, sugar dusted. Fried fresh every afternoon.",
    price: "1500",
  },
  {
    name: "Party jollof bowl",
    description: "Smoky jollof with fried plantain and a drumstick.",
    price: "3500",
  },
  {
    name: "Zobo, 50cl",
    description: "Chilled hibiscus drink with ginger and pineapple.",
    price: "800",
  },
  {
    name: "Small chops pack",
    description: "Samosa, spring rolls and puff-puff for two.",
    price: "4000",
  },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.setDefaultTimeout(20000);

async function signUp(u) {
  await page.goto(`${base}/signup`);
  await page.getByLabel("Your name").fill(u.name);
  await page.getByLabel("Email").fill(u.email);
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
async function logIn(u, next = "/home") {
  await page.goto(`${base}/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email").fill(u.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((x) => !x.pathname.startsWith("/login"));
}
async function signOut() {
  await page
    .getByRole("button", { name: "Account menu" })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL((x) => x.pathname === "/");
}
async function next(label) {
  await page
    .getByRole("button", { name: label, exact: true })
    .filter({ visible: true })
    .first()
    .click();
  await page.waitForTimeout(900);
}

// Seller
await signUp(seller);
await page.goto(`${base}/open-shop`);
await page.getByLabel("Brand name").fill("Mama Kemi's Kitchen");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("radio", { name: "Food & snacks" }).click();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: "Skip for now" }).click();
await page.getByLabel("Tagline").fill("Small chops and jollof, made fresh daily");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "How do buyers get their order?" }).waitFor();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: "Open my shop" }).click();
await page.getByRole("heading", { name: /is open/ }).waitFor();
for (const p of products) {
  await page.goto(`${base}/studio/products/new`);
  await page.getByLabel("Name", { exact: true }).fill(p.name);
  await page.getByLabel("Description").fill(p.description);
  await page.getByLabel("Price (₦)", { exact: true }).fill(p.price);
  await page.getByRole("button", { name: "Publish" }).first().click();
  await page.waitForURL(/\/studio\/products$/);
}
await signOut();

// Buyers browse and order
for (const [i, b] of buyers.entries()) {
  await signUp(b);
  for (const p of products.slice(0, 3 + i)) {
    await page.goto(`${base}/search?q=${encodeURIComponent(p.name.split(" ")[0])}`);
    await page
      .getByRole("link", { name: new RegExp(p.name.replace(/[()]/g, ".")) })
      .first()
      .click();
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.waitForTimeout(400);
    if (p !== products[2] || i === 1) {
      await page
        .getByRole("button", { name: /Add to bag/ })
        .filter({ visible: true })
        .first()
        .click();
      await page.getByText("Added to bag").first().waitFor();
    }
  }
  await page.goto(`${base}/checkout`);
  await page
    .getByRole("button", { name: /Place order/ })
    .filter({ visible: true })
    .first()
    .click();
  await page.getByRole("heading", { name: "Order placed" }).waitFor();
  await signOut();
}

// Seller fulfils one order fully and accepts the other
await logIn(seller, "/studio/orders");
for (const l of ["Accept", "Start preparing", "Mark ready", "Mark picked up"]) await next(l);
await next("Accept");
await ctx.storageState({ path: `${out}/seller.json`, indexedDB: true });
await signOut();

// First buyer messages the shop
await logIn(buyers[0], "/orders");
await page
  .getByRole("button", { name: /Actions for order/ })
  .filter({ visible: true })
  .first()
  .click();
await page.getByRole("menuitem", { name: "Message the shop" }).click();
await page.waitForURL(/\/messages\?thread=/);
await page
  .getByLabel("Message", { exact: true })
  .filter({ visible: true })
  .fill("Hi! Can I pick up after my 2pm lecture?");
await page.keyboard.press("Enter");
await page.waitForTimeout(1200);
await ctx.storageState({ path: `${out}/buyer.json`, indexedDB: true });
console.log(`saved ${out}/seller.json and ${out}/buyer.json`);
console.log(`seller ${seller.email} / buyer ${buyers[0].email}, password ${PASSWORD}`);
await browser.close();
