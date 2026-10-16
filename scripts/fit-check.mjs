// Usage: node scripts/fit-check.mjs <baseUrl> [widths]
// Visits every app page at several widths with the saved states from
// scripts/make-state.mjs and reports anything wider than the screen.
import { chromium } from "@playwright/test";

const [base = "http://localhost:3100", widthsArg = "360,390,768,1024,1280,1366,1440"] =
  process.argv.slice(2);
const widths = widthsArg.split(",").map(Number);
const buyerRoutes = [
  "/home",
  "/explore",
  "/search?q=puff",
  "/orders",
  "/bag",
  "/messages",
  "/notifications",
  "/wishlist",
  "/account/following",
  "/account/places",
  "/account/reviews",
  "/account/settings",
];
const sellerRoutes = [
  "/studio",
  "/studio/analytics",
  "/studio/orders",
  "/studio/products",
  "/studio/products/new",
  "/studio/customers",
  "/studio/messages",
  "/studio/promotions",
  "/studio/reviews",
  "/studio/finance",
  "/studio/brand",
];
const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];

const browser = await chromium.launch();
let problems = 0;
async function check(state, routes, extra) {
  for (const w of widths) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: w < 768 ? 800 : 860 },
      isMobile: w < 768,
      hasTouch: w < 768,
      ...(state ? { storageState: state } : {}),
    });
    const page = await ctx.newPage();
    const all = [...routes];
    if (extra) all.push(...(await extra(page)));
    for (const r of all) {
      await page.goto(base + r, { waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      const res = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const over = document.documentElement.scrollWidth - vw;
        const offenders = [];
        const scrollers = (el) => {
          for (let p = el.parentElement; p; p = p.parentElement) {
            const s = getComputedStyle(p);
            if (
              /(auto|scroll|hidden|clip)/.test(s.overflowX) &&
              p !== document.body &&
              p !== document.documentElement
            )
              return true;
          }
          return false;
        };
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (!r.width || r.right <= vw + 1 || scrollers(el)) continue;
          if (getComputedStyle(el).position === "fixed") continue;
          offenders.push(
            `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 4).join(".")} right=${Math.round(r.right)}`,
          );
          if (offenders.length > 3) break;
        }
        return { over, offenders };
      });
      if (res.over > 0 || res.offenders.length) {
        problems++;
        console.log(`✘ ${w}px ${r}: page ${res.over}px wider`);
        for (const o of res.offenders) console.log(`    ${o}`);
      }
    }
    await ctx.close();
  }
}
await check(null, publicRoutes);
await check("screenshots/state/buyer.json", buyerRoutes, async (page) => {
  await page.goto(base + "/explore", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const product = await page.locator('a[href^="/products/"]').first().getAttribute("href");
  await page.goto(base + "/orders", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const order = await page.evaluate(() => {
    const a = [...document.querySelectorAll("tbody tr")][0];
    return a ? null : null;
  });
  const extra = [];
  if (product) {
    extra.push(product);
    await page.goto(base + product, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const brand = await page.locator('a[href^="/brands/"]').first().getAttribute("href");
    if (brand) extra.push(brand);
  }
  void order;
  return extra;
});
await check("screenshots/state/seller.json", sellerRoutes);
console.log(
  problems ? `\n${problems} page/width combinations overflow` : "Everything fits at every width.",
);
await browser.close();
