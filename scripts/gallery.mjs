// Captures every screen and state at 2x. Needs the app on :3100 (pnpm build && pnpm start --port 3100).
// node scripts/gallery.mjs <phone|desktop>   → screenshots/gallery/<section>/<name>-<phone|desktop>.png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const kind = process.argv[2] ?? "phone";
const phone = kind === "phone";
const base = "http://localhost:3100";
const root = "screenshots/gallery";
const errs = [];
const failed = [];

const b = await chromium.launch();
async function ctx(opts = {}) {
  const c = await b.newContext({
    viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: "no-preference",
    ...opts,
  });
  const p = await c.newPage();
  p.setDefaultTimeout(12_000);
  p.on("pageerror", (e) => errs.push(e.message));
  p.on(
    "console",
    (m) => m.type() === "error" && !/404|WebSocket/.test(m.text()) && errs.push(m.text()),
  );
  return p;
}

async function shot(p, section, name, { full = false, wait = 1600 } = {}) {
  mkdirSync(`${root}/${section}`, { recursive: true });
  await p.waitForTimeout(wait);
  const path = `${root}/${section}/${name}-${kind}.png`;
  await p.screenshot({ path, fullPage: full, animations: "allow" });
  console.log("saved", path);
}

/** Runs one step; a failure is logged and the tour carries on. */
async function step(label, fn) {
  try {
    await fn();
  } catch (e) {
    failed.push(`${label}: ${String(e.message).split("\n")[0]}`);
    console.log("FAILED", label);
  }
}

async function go(p, path) {
  await p.goto(base + path, { waitUntil: "networkidle" });
}

async function login(p, who, next) {
  await p.goto(`${base}/login?next=${encodeURIComponent(next)}`);
  await p.getByRole("button", { name: new RegExp(`try the demo ${who}`, "i") }).click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 30_000 });
  await p.waitForTimeout(800);
}

const S = {
  browse: "01-browse",
  auth: "02-sign-in-and-onboarding",
  buy: "03-bag-checkout-tracking",
  account: "04-buyer-account",
  overlays: "05-overlays-and-sheets",
  studio: "06-shop-studio",
  openShop: "07-open-a-shop",
  dark: "08-dark-mode",
  system: "09-system-pages",
};

/* --------------------------- Logged out ---------------------------------- */
{
  const p = await ctx();
  await step("landing", async () => {
    await go(p, "/");
    await shot(p, S.browse, "01-landing", { full: true, wait: 2500 });
  });
  await step("explore", async () => {
    await go(p, "/explore");
    await shot(p, S.browse, "02-explore", { full: true, wait: 2500 });
  });
  await step("explore food", async () => {
    await go(p, "/explore?category=food&sort=price-asc");
    await shot(p, S.browse, "03-explore-food-filtered", { wait: 2500 });
  });
  await step("search", async () => {
    await go(p, "/search?q=jollof");
    await shot(p, S.browse, "04-search-results", { full: true, wait: 2500 });
  });
  await step("brand", async () => {
    await go(p, "/brands/adirelab");
    await shot(p, S.browse, "05-brand-page", { full: true, wait: 2500 });
  });
  await step("brand about", async () => {
    await p.getByRole("tab", { name: /About/ }).click();
    await shot(p, S.browse, "06-brand-about-tab", { wait: 1200 });
  });
  await step("brand reviews", async () => {
    await p.getByRole("tab", { name: /Reviews/ }).click();
    await shot(p, S.browse, "07-brand-reviews-tab", { wait: 1200 });
  });
  await step("product", async () => {
    await go(p, "/products/indigo-adire-boxy-tee-adirelab");
    await shot(p, S.browse, "08-product-page", { full: true, wait: 2500 });
  });
  await step("product food", async () => {
    await go(p, "/products/party-jollof-and-chicken-mamaputexpress");
    await shot(p, S.browse, "09-product-page-food", { wait: 2500 });
  });
  await step("bag empty", async () => {
    await go(p, "/bag");
    await shot(p, S.buy, "01-bag-empty", { wait: 1500 });
  });
  for (const [path, name] of [
    ["/login", "01-sign-in"],
    ["/signup", "02-create-account"],
    ["/forgot-password", "03-forgot-password"],
  ]) {
    await step(name, async () => {
      await go(p, path);
      await shot(p, S.auth, name, { wait: 1200 });
    });
  }
  await step("login errors", async () => {
    await go(p, "/login");
    await p.getByRole("button", { name: "Log in", exact: true }).click();
    await shot(p, S.auth, "04-sign-in-validation", { wait: 800 });
  });
  await step("404", async () => {
    await go(p, "/this-page-does-not-exist");
    await shot(p, S.system, "01-not-found", { wait: 1000 });
  });
  await step("offline", async () => {
    await go(p, "/offline");
    await shot(p, S.system, "02-offline", { wait: 1000 });
  });
  await step("design system", async () => {
    await go(p, "/design-system");
    await shot(p, S.system, "03-design-system", { full: true, wait: 2500 });
  });
  await p.context().close();
}

/* ------------------------------- Buyer ----------------------------------- */
{
  const p = await ctx();
  await login(p, "buyer", "/explore");
  await step("explore signed in", async () => {
    await shot(p, S.browse, "10-explore-signed-in", { wait: 2500 });
  });
  if (phone) {
    await step("filters sheet", async () => {
      await p
        .getByRole("button", { name: /Filters/ })
        .filter({ visible: true })
        .first()
        .click();
      await shot(p, S.overlays, "01-explore-filters-sheet", { wait: 1200 });
      await p.keyboard.press("Escape");
    });
  }
  await step("command palette", async () => {
    await go(p, "/explore");
    await p.waitForTimeout(1500);
    await p.keyboard.press("Control+k");
    await p.waitForTimeout(800);
    await p.keyboard.type("ad");
    await shot(p, S.overlays, "02-search-command-palette", { wait: 1500 });
    await p.keyboard.press("Escape");
  });
  await step("variant + add", async () => {
    await go(p, "/products/indigo-adire-boxy-tee-adirelab");
    await p.waitForTimeout(1500);
    const size = p.getByRole("radio", { name: /^M\b/ }).first();
    if (await size.count()) await size.click();
    await shot(p, S.browse, "11-product-variant-selected", { wait: 800 });
    await p
      .getByRole("button", { name: /Add to bag/ })
      .filter({ visible: true })
      .first()
      .click();
    await p.waitForTimeout(1500);
  });
  await step("add jollof", async () => {
    await go(p, "/products/party-jollof-and-chicken-mamaputexpress");
    await p.waitForTimeout(1500);
    await p
      .getByRole("button", { name: /Add to bag/ })
      .filter({ visible: true })
      .first()
      .click();
    await shot(p, S.buy, "02-added-to-bag-toast", { wait: 600 });
  });
  // Phones open the bag as a page (tab bar); the drawer is desktop-only.
  if (!phone) {
    await step("bag drawer", async () => {
      await p
        .getByRole("button", { name: /^Bag, / })
        .filter({ visible: true })
        .first()
        .click();
      await shot(p, S.overlays, "03-bag-drawer", { wait: 1500 });
      await p.keyboard.press("Escape");
    });
  }
  await step("bag page", async () => {
    await go(p, "/bag");
    await shot(p, S.buy, "03-bag", { full: true, wait: 2000 });
  });
  await step("checkout", async () => {
    await go(p, "/checkout");
    await p.getByLabel("Promo code").first().waitFor();
    await p.waitForTimeout(1200);
    await p.getByLabel("Promo code").first().fill("KIOSK10");
    await p.getByRole("button", { name: "Apply" }).first().click();
    await p.waitForTimeout(1500);
    const room = p.getByLabel("Room, block or landmark");
    for (let i = 0; i < (await room.count()); i++) {
      if (!(await room.nth(i).inputValue())) await room.nth(i).fill("Room 12, Block C");
    }
    await shot(p, S.buy, "04-checkout", { full: true, wait: 800 });
  });
  await step("place", async () => {
    await p
      .getByRole("button", { name: /Place (\d+ )?orders?/ })
      .filter({ visible: true })
      .first()
      .click();
    await p.waitForURL(/success/, { timeout: 30_000 });
    await shot(p, S.buy, "05-order-placed-celebration", { wait: 1200 });
    await shot(p, S.buy, "06-order-placed", { wait: 2000 });
  });
  await step("orders list", async () => {
    await go(p, "/orders");
    await shot(p, S.buy, "07-orders-active", { wait: 2000 });
    await p.getByRole("tab", { name: /Past/ }).click();
    await shot(p, S.buy, "08-orders-past", { wait: 1200 });
  });
  await step("tracking", async () => {
    await go(p, "/orders");
    await p.waitForTimeout(1500);
    await p
      .getByRole("link", { name: /Mama Put Express/ })
      .first()
      .click();
    await p.waitForURL(/orders\/o_/);
    await shot(p, S.buy, "09-tracking-just-placed", { wait: 2500 });
    await shot(p, S.buy, "10-tracking-out-for-delivery", { full: true, wait: 30_000 });
    await shot(p, S.buy, "11-tracking-delivered", { full: true, wait: 34_000 });
  });
  await step("review dialog", async () => {
    await p
      .getByRole("button", { name: /review|Rate/i })
      .filter({ visible: true })
      .first()
      .click();
    await shot(p, S.overlays, "04-review-dialog", { wait: 1200 });
    await p.keyboard.press("Escape");
  });
  for (const [path, name, full] of [
    ["/account", "01-account-overview", true],
    ["/wishlist", "02-saved", true],
    ["/account/following", "03-following", false],
    ["/account/places", "04-addresses-and-pickup", false],
    ["/account/wallet", "05-wallet-demo", true],
    ["/account/reviews", "06-my-reviews", false],
    ["/notifications", "07-notifications", false],
    ["/messages", "08-messages", false],
    ["/account/settings", "10-settings", true],
  ]) {
    await step(name, async () => {
      await go(p, path);
      await shot(p, S.account, name, { full, wait: 2200 });
    });
  }
  await step("chat", async () => {
    await go(p, "/messages");
    await p.waitForTimeout(1500);
    await p.locator('a[href*="?thread="]').filter({ visible: true }).first().click();
    await shot(p, S.account, "09-conversation", { wait: 2000 });
  });
  await step("add place", async () => {
    await go(p, "/account/places");
    await p.waitForTimeout(1500);
    await p.getByRole("button", { name: /Add/ }).filter({ visible: true }).first().click();
    await shot(p, S.overlays, "05-add-place-sheet", { wait: 1200 });
    await p.keyboard.press("Escape");
  });
  await step("wallet top up", async () => {
    await go(p, "/account/wallet");
    await p.waitForTimeout(1500);
    await p
      .getByRole("button", { name: /Top up/ })
      .filter({ visible: true })
      .first()
      .click();
    await shot(p, S.overlays, "06-wallet-top-up-demo", { wait: 1200 });
    await p.keyboard.press("Escape");
  });
  await step("account menu", async () => {
    await go(p, "/explore");
    await p.waitForTimeout(1500);
    if (phone)
      await p
        .getByRole("button", { name: /^Account$/ })
        .or(p.getByRole("link", { name: /^Account$/ }))
        .first()
        .click();
    else await p.getByRole("button", { name: "Account menu" }).click();
    await shot(p, S.overlays, "07-account-menu", { wait: 1200 });
    await p.keyboard.press("Escape");
  });
  await p.context().close();
}

/* ------------------------------- Seller ---------------------------------- */
{
  const p = await ctx();
  await login(p, "seller", "/explore");
  await step("curtain", async () => {
    if (phone) {
      await p
        .getByRole("button", { name: /^Account$/ })
        .or(p.getByRole("link", { name: /^Account$/ }))
        .first()
        .click();
      await p.waitForTimeout(900);
    }
    await p.getByRole("radio", { name: /Sell/ }).filter({ visible: true }).first().click();
    await shot(p, S.studio, "01-mode-switch-curtain", { wait: 420 });
    await p.waitForURL(/studio/);
  });
  const pages = [
    ["/studio", "02-overview", true],
    ["/studio/orders", "03-orders-board", false],
    ["/studio/products", "06-products-table", true],
    ["/studio/products/new", "08-new-product", true],
    ["/studio/customers", "10-customers", true],
    ["/studio/reviews", "11-reviews", true],
    ["/studio/promotions", "12-promotions", true],
    ["/studio/analytics", "13-analytics", true],
    ["/studio/brand", "14-brand-settings", true],
    ["/studio/payouts", "15-payouts-demo", true],
    ["/studio/messages", "16-messages", false],
  ];
  for (const [path, name, full] of pages) {
    await step(name, async () => {
      await go(p, path);
      await shot(p, S.studio, name, { full, wait: 2800 });
    });
  }
  await step("order drawer", async () => {
    await go(p, "/studio/orders");
    await p.waitForTimeout(2500);
    await p
      .getByRole("button", { name: /KSK-/ })
      .or(p.getByRole("link", { name: /KSK-/ }))
      .first()
      .click();
    await shot(p, S.studio, "04-order-detail", { wait: 1500 });
    await p.keyboard.press("Escape");
  });
  await step("orders list", async () => {
    await go(p, "/studio/orders");
    await p.waitForTimeout(2000);
    await p.getByRole("radio", { name: /List/ }).first().click();
    await shot(p, S.studio, "05-orders-list", { wait: 1500 });
    await p.getByRole("radio", { name: /Board/ }).first().click();
  });
  await step("products grid", async () => {
    await go(p, "/studio/products");
    await p.waitForTimeout(2000);
    await p.getByRole("radio", { name: /Grid/ }).first().click();
    await shot(p, S.studio, "07-products-grid", { wait: 1500 });
    await p.getByRole("radio", { name: /Table/ }).first().click();
  });
  await step("edit product", async () => {
    await go(p, "/studio/products");
    await p.waitForTimeout(2200);
    const link = p.locator('a[href^="/studio/products/p"]').first();
    await go(p, (await link.getAttribute("href")) ?? "/studio/products");
    await shot(p, S.studio, "09-edit-product", { full: true, wait: 2500 });
  });
  await step("promo sheet", async () => {
    await go(p, "/studio/promotions");
    await p.waitForTimeout(2000);
    await p
      .getByRole("button", { name: /New code/ })
      .filter({ visible: true })
      .first()
      .click();
    await shot(p, S.overlays, "08-new-promo-sheet", { wait: 1200 });
    await p.keyboard.press("Escape");
  });
  if (phone) {
    await step("studio more", async () => {
      await go(p, "/studio");
      await p.waitForTimeout(2000);
      await p.getByRole("button", { name: "More" }).click();
      await shot(p, S.overlays, "09-studio-more-sheet", { wait: 1200 });
      await p.keyboard.press("Escape");
    });
  }
  await p.context().close();
}

/* --------------------- New account → open a shop ------------------------- */
{
  const p = await ctx();
  await step("onboarding + wizard", async () => {
    await go(p, "/signup");
    await p.getByLabel("Your name").fill("Kemi Bello");
    await p.getByLabel("Email").fill(`kemi${Date.now()}@example.com`);
    await p.getByLabel("Password", { exact: true }).fill("campus123");
    await shot(p, S.auth, "05-create-account-filled", { wait: 400 });
    await p.getByRole("button", { name: "Create account" }).click();
    await p.waitForURL(/welcome/);
    await shot(p, S.auth, "06-welcome-campus", { wait: 1500 });
    await p.getByRole("radio", { name: /OAU/ }).click();
    await p.getByRole("button", { name: "Continue" }).click();
    await shot(p, S.auth, "07-welcome-details", { wait: 1000 });
    await p.getByLabel("Phone number").fill("08031234567");
    await p.getByRole("button", { name: "Continue" }).click();
    await shot(p, S.auth, "08-welcome-interests", { wait: 1000 });
    await p.getByRole("button", { name: "Skip for now" }).click();
    await p.waitForURL(/explore/);

    await go(p, "/open-shop");
    await shot(p, S.openShop, "01-name", { wait: 1200 });
    await p.getByLabel("Brand name").fill("Sunday Shea Co");
    await shot(p, S.openShop, "02-name-available", { wait: 1200 });
    await p.getByRole("button", { name: "Continue" }).click();
    await p.getByRole("radio", { name: "Skincare & beauty" }).click();
    await shot(p, S.openShop, "03-category", { wait: 800 });
    await p.getByRole("button", { name: "Continue" }).click();
    await shot(p, S.openShop, "04-look", { wait: 1000 });
    await p.getByRole("button", { name: "Skip for now" }).click();
    await p.getByLabel("Tagline").fill("Whipped shea, hand-made every Sunday");
    await shot(p, S.openShop, "05-story", { wait: 800 });
    await p.getByRole("button", { name: "Continue" }).click();
    await shot(p, S.openShop, "06-pickup-and-delivery", { full: true, wait: 1000 });
    await p.getByRole("button", { name: "Continue" }).click();
    await shot(p, S.openShop, "07-review", { full: true, wait: 1000 });
    await p.getByRole("button", { name: "Open my shop" }).click();
    await p.getByRole("heading", { name: /is open/ }).waitFor({ timeout: 20_000 });
    await shot(p, S.openShop, "08-shop-is-open", { wait: 1500 });
    await p.getByRole("button", { name: "Go to Shop Studio" }).click();
    await p.waitForURL(/studio/);
    await shot(p, S.openShop, "09-new-shop-studio", { full: true, wait: 2800 });
    await go(p, "/studio/orders");
    await shot(p, S.openShop, "10-new-shop-no-orders-yet", { wait: 2500 });
  });
  await p.context().close();
}

/* ------------------------------ Dark mode -------------------------------- */
{
  const p = await ctx({ colorScheme: "dark" });
  for (const [path, name, full] of [
    ["/", "01-landing", true],
    ["/explore", "02-explore", false],
    ["/products/indigo-adire-boxy-tee-adirelab", "03-product", false],
  ]) {
    await step(`dark ${name}`, async () => {
      await go(p, path);
      await shot(p, S.dark, name, { full, wait: 2500 });
    });
  }
  await login(p, "seller", "/orders");
  for (const [path, name, full] of [
    ["/orders", "04-orders", false],
    ["/account", "05-account", false],
    ["/studio", "06-studio-overview", true],
    ["/studio/orders", "07-studio-orders-board", false],
    ["/studio/analytics", "08-studio-analytics", false],
  ]) {
    await step(`dark ${name}`, async () => {
      await go(p, path);
      await shot(p, S.dark, name, { full, wait: 2800 });
    });
  }
  await p.context().close();
}

await b.close();
console.log("\nFAILED STEPS:\n" + (failed.join("\n") || "none"));
console.log("CONSOLE ERRORS:\n" + ([...new Set(errs)].join("\n") || "none"));
