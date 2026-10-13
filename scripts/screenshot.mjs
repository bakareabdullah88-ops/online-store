// Usage: node scripts/screenshot.mjs <baseUrl> <outDir> <route>[,<route>…] [--dark] [--full] [--widths=390,1280] [--state=screenshots/state/seller.json]
// Make a state first with scripts/make-state.mjs.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [base, out, routesArg, ...flags] = process.argv.slice(2);
const dark = flags.includes("--dark");
const full = flags.includes("--full");
const widths = (flags.find((f) => f.startsWith("--widths="))?.split("=")[1] ?? "390,1280")
  .split(",")
  .map(Number);
const state = flags.find((f) => f.startsWith("--state="))?.split("=")[1];
const waitMs = Number(flags.find((f) => f.startsWith("--wait="))?.split("=")[1] ?? 1800);
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];
for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 900 },
    deviceScaleFactor: width < 768 ? 2 : 1,
    colorScheme: dark ? "dark" : "light",
    reducedMotion: "no-preference",
    isMobile: width < 768,
    hasTouch: width < 768,
    ...(state ? { storageState: state } : {}),
  });
  const page = await context.newPage();
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      errors.push(`[${width}] ${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[${width}] pageerror: ${e.message}`));
  for (const route of routesArg.split(",")) {
    await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(waitMs);
    const name = `${route.replace(/\W+/g, "_") || "home"}-${width}${dark ? "-dark" : ""}.png`;
    await page.screenshot({ path: `${out}/${name}`, fullPage: full });
    console.log("saved", name);
  }
  await context.close();
}
await browser.close();
if (errors.length) {
  console.log("CONSOLE ISSUES:\n" + [...new Set(errors)].join("\n"));
} else {
  console.log("No console errors or warnings.");
}
