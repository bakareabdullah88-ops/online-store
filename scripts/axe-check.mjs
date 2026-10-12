// Usage: node scripts/axe-check.mjs <base> <route,route> <buyer|seller|-> [width]  (prints axe WCAG A/AA violations)
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const [base, routes, login, width = "1280"] = process.argv.slice(2);
const b = await chromium.launch(); const w = Number(width);
const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 }); const p = await ctx.newPage();
if (login && login !== "-") { await p.goto(`${base}/login`); await p.getByRole("button", { name: new RegExp(`demo ${login}`, "i") }).first().click(); await p.waitForURL((u) => !u.pathname.startsWith("/login")); }
for (const r of routes.split(",")) {
  await p.goto(base + r, { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  const { violations } = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  for (const v of violations) for (const n of v.nodes.slice(0, 6)) console.log(r, v.id, n.target.join(" "), "|", (n.any[0]?.message ?? n.failureSummary ?? "").slice(0, 200), "|", n.html.slice(0, 140));
}
await b.close();
