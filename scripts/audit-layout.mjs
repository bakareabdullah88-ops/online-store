// Usage: node scripts/audit-layout.mjs <baseUrl> <stateDir> [--out=audit/layout-report.json]
// Loads every main page at phone, tablet and desktop widths (light and dark, buyer and
// seller) and reports layout problems a person would notice:
//   - the page scrolls sideways
//   - an element sticks out past the right edge of the screen
//   - two buttons/links/inputs overlap each other
//   - a tap target on a phone is smaller than 32px
// Make the states first with scripts/make-state.mjs.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const [base = "http://localhost:3100", stateDir = "screenshots/state", ...flags] =
  process.argv.slice(2);
const out = flags.find((f) => f.startsWith("--out="))?.split("=")[1] ?? "audit/layout-report.json";

const publicRoutes = ["/", "/login", "/signup", "/forgot-password"];
const buyerRoutes = [
  "/home",
  "/explore",
  "/search?q=jollof",
  "/bag",
  "/checkout",
  "/orders",
  "/messages",
  "/notifications",
  "/wishlist",
  "/account/following",
  "/account/settings",
  "/account/places",
  "/account/reviews",
];
const sellerRoutes = [
  "/studio",
  "/studio/analytics",
  "/studio/orders",
  "/studio/products",
  "/studio/products/new",
  "/studio/messages",
  "/studio/customers",
  "/studio/promotions",
  "/studio/reviews",
  "/studio/finance",
  "/studio/brand",
];
const sizes = [
  { w: 360, h: 640 },
  { w: 390, h: 844 },
  { w: 430, h: 932 },
  { w: 768, h: 1024 },
  { w: 1280, h: 800 },
  { w: 1440, h: 900 },
];

/** Runs in the page: returns a list of problems. */
function inspect(isPhone) {
  const problems = [];
  const vw = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    problems.push({
      kind: "page-scrolls-sideways",
      detail: `${document.documentElement.scrollWidth}px wide in a ${vw}px window`,
    });
  }
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) < 0.05) return false;
    // Skip things inside closed or offscreen containers and screen-reader-only text.
    if (el.closest("[aria-hidden='true'],.sr-only,[inert]")) return false;
    return true;
  };
  const describe = (el) => {
    const label =
      el.getAttribute("aria-label") ||
      el.textContent?.trim().replace(/\s+/g, " ").slice(0, 40) ||
      el.getAttribute("placeholder") ||
      el.tagName.toLowerCase();
    return `${el.tagName.toLowerCase()} "${label}"`;
  };
  // Sticking out past the right edge (ignoring horizontally scrolling rows).
  const scrollsX = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (
        (s.overflowX === "auto" || s.overflowX === "scroll" || s.overflowX === "hidden") &&
        p.scrollWidth > p.clientWidth + 1
      )
        return true;
      if (s.overflowX === "hidden" || s.overflowX === "clip") return true;
    }
    return false;
  };
  const all = [...document.querySelectorAll("body *")].filter(
    (el) => el.children.length === 0 || el.matches("a,button,input,select,textarea,img,svg"),
  );
  for (const el of all) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 2 && !scrollsX(el)) {
      problems.push({
        kind: "sticks-out-right",
        detail: `${describe(el)} ends at ${Math.round(r.right)}px`,
      });
    }
  }
  // Overlapping controls.
  const controls = [
    ...document.querySelectorAll(
      "a[href],button,input:not([type=hidden]),select,textarea,[role=button]",
    ),
  ].filter(visible);
  for (let i = 0; i < controls.length; i++) {
    const a = controls[i];
    const ra = a.getBoundingClientRect();
    if (isPhone && ra.top < window.innerHeight * 3) {
      const minSide = Math.min(ra.width, ra.height);
      const inText = a.matches("a") && getComputedStyle(a).display === "inline";
      // Fine: tap-area or another invisible ::after hit box, or a wrapping <label> or
      // matching <label for> that is itself big enough to tap.
      const after = getComputedStyle(a, "::after");
      const label =
        a.closest("label") ?? (a.id ? document.querySelector(`label[for="${a.id}"]`) : null);
      const lr = label?.getBoundingClientRect();
      const padded =
        a.classList.contains("tap-area") ||
        (after.content !== "none" && after.position === "absolute") ||
        (lr ? Math.min(lr.width, lr.height) >= 32 : false);
      if (
        minSide < 32 &&
        !inText &&
        !padded &&
        !a.matches("input[type=checkbox],input[type=radio]")
      ) {
        problems.push({
          kind: "small-tap-target",
          detail: `${describe(a)} is ${Math.round(ra.width)}×${Math.round(ra.height)}`,
        });
      }
    }
    for (let j = i + 1; j < controls.length; j++) {
      const b = controls[j];
      if (a.contains(b) || b.contains(a)) continue;
      // Buttons drawn inside an input (show password, clear) share its wrapper on purpose.
      const input = a.matches("input") ? a : b.matches("input") ? b : null;
      if (input && input.parentElement?.contains(input === a ? b : a)) continue;
      const rb = b.getBoundingClientRect();
      const x = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
      const y = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
      const overlap = x * y;
      const smaller = Math.min(ra.width * ra.height, rb.width * rb.height);
      if (overlap > 4 && overlap / smaller > 0.15) {
        // Fixed/sticky bars over scrolled content are expected; only flag same-layer overlaps.
        const fixed = (el) => {
          for (let p = el; p; p = p.parentElement) {
            const pos = getComputedStyle(p).position;
            if (pos === "fixed" || pos === "sticky") return p;
          }
          return null;
        };
        if (fixed(a) !== fixed(b)) continue;
        problems.push({
          kind: "controls-overlap",
          detail: `${describe(a)} and ${describe(b)} overlap ${Math.round((overlap / smaller) * 100)}%`,
        });
      }
    }
  }
  return problems;
}

const browser = await chromium.launch();
const report = [];
const runs = [
  { who: "public", routes: publicRoutes, state: undefined },
  { who: "buyer", routes: buyerRoutes, state: `${stateDir}/buyer.json` },
  { who: "seller", routes: sellerRoutes, state: `${stateDir}/seller.json` },
];
for (const dark of [false, true]) {
  for (const run of runs) {
    for (const size of sizes) {
      const isPhone = size.w < 768;
      const context = await browser.newContext({
        viewport: { width: size.w, height: size.h },
        deviceScaleFactor: 1,
        colorScheme: dark ? "dark" : "light",
        reducedMotion: "reduce",
        isMobile: isPhone,
        hasTouch: isPhone,
        ...(run.state ? { storageState: run.state } : {}),
      });
      const page = await context.newPage();
      for (const route of run.routes) {
        try {
          await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(600);
          const problems = await page.evaluate(inspect, isPhone);
          // De-duplicate identical findings.
          const seen = new Set();
          for (const p of problems) {
            const key = `${p.kind}|${p.detail}`;
            if (seen.has(key)) continue;
            seen.add(key);
            report.push({ route, who: run.who, width: size.w, height: size.h, dark, ...p });
          }
        } catch (e) {
          report.push({
            route,
            who: run.who,
            width: size.w,
            dark,
            kind: "error",
            detail: String(e).slice(0, 200),
          });
        }
      }
      await context.close();
    }
  }
}
await browser.close();
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(report, null, 2));
const byKind = report.reduce((m, r) => ((m[r.kind] = (m[r.kind] ?? 0) + 1), m), {});
console.log(`${report.length} findings`, byKind);
