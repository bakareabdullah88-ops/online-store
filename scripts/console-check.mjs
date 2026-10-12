// Usage: node scripts/console-check.mjs <base> <route,route> [width] [--login=buyer|seller] [--repeat=N]
import { chromium } from "@playwright/test";
const [base, routes, width = "1280", ...flags] = process.argv.slice(2);
const login = flags.find((f) => f.startsWith("--login="))?.split("=")[1];
const repeat = Number(flags.find((f) => f.startsWith("--repeat="))?.split("=")[1] ?? 1);
const b = await chromium.launch();
const w = Number(width);
const ctx = await b.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 768, hasTouch: w < 768 });
const p = await ctx.newPage();
let current = "";
p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/404|WebSocket/.test(m.text()) && console.log(current, m.type(), m.text().slice(0, 600)));
p.on("pageerror", (e) => console.log(current, "pageerror", e.message.slice(0, 600)));
if (login) {
  await p.goto(`${base}/login`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: new RegExp(`demo ${login}`, "i") }).first().click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
}
for (let i = 0; i < repeat; i++) {
  for (const r of routes.split(",")) {
    current = r;
    await p.goto(`${base}${r}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
  }
}
await b.close();
console.log("checked");
