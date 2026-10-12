// Usage: node scripts/overflow-check.mjs <base> <route,route> <buyer|seller|-> [width]  (finds elements causing horizontal overflow)
import { chromium } from "@playwright/test";
const [base, routes, login, width = "412"] = process.argv.slice(2);
const b = await chromium.launch();
const w = Number(width);
const ctx = await b.newContext({
  viewport: { width: w, height: 900 },
  isMobile: true,
  hasTouch: true,
});
const p = await ctx.newPage();
if (login && login !== "-") {
  await p.goto(`${base}/login`);
  await p
    .getByRole("button", { name: new RegExp(`demo ${login}`, "i") })
    .first()
    .click();
  await p.waitForURL((u) => !u.pathname.startsWith("/login"));
}
for (const r of routes.split(",")) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const out = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const res = [];
    for (const e of document.querySelectorAll("body *")) {
      const rr = e.getBoundingClientRect();
      if (
        rr.right > vw + 1 &&
        rr.width > 0 &&
        !(function f(x) {
          for (; x; x = x.parentElement) {
            if (getComputedStyle(x).position === "fixed") return true;
          }
          return false;
        })(e)
      ) {
        // skip if inside a horizontally scrolling ancestor
        let a = e.parentElement,
          clipped = false;
        while (a) {
          const s = getComputedStyle(a);
          if (s.overflowX !== "visible") {
            const ar = a.getBoundingClientRect();
            if (ar.right <= vw + 1) {
              clipped = true;
              break;
            }
          }
          a = a.parentElement;
        }
        if (!clipped)
          res.push(
            `${e.tagName}.${String(e.className).slice(0, 120)} right=${Math.round(rr.right)} w=${Math.round(rr.width)}`,
          );
      }
    }
    return [document.documentElement.scrollWidth - vw, res.slice(0, 14)];
  });
  console.log(r, JSON.stringify(out, null, 1));
}
await b.close();
