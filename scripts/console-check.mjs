// Usage: node scripts/console-check.mjs <url> [width]
import { chromium } from "@playwright/test";
const [url, width = "1280"] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: 900 } });
p.on("console", (m) => (m.type() === "error" || m.type() === "warning") && console.log(m.type(), m.text().slice(0, 1500)));
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 1500)));
p.on("response", (r) => r.status() >= 400 && console.log("HTTP", r.status(), r.url()));
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
await b.close();
