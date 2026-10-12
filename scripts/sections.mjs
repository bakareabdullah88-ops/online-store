import { chromium } from "@playwright/test";
const [url, out, width, dark] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({
  viewport: { width: Number(width), height: 900 },
  colorScheme: dark ? "dark" : "light",
  deviceScaleFactor: 1,
});
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/top.png` });
for (const id of await p.$$eval("section[id]", (els) => els.map((e) => e.id))) {
  await p.locator(`#${id}`).screenshot({ path: `${out}/${id}.png` });
}
await b.close();
