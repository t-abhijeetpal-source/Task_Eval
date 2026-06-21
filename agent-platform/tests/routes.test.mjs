// Guards against dead navigation links: every href in the sidebar and command palette must
// resolve to a real App Router page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const appDir = path.join(app, "src/app");

function hrefsIn(file) {
  const text = readFileSync(path.join(app, file), "utf8");
  return [...text.matchAll(/href:\s*"(\/[^"]*)"/g)].map((m) => m[1]);
}

function routeExists(href) {
  if (href === "/") return existsSync(path.join(appDir, "page.tsx"));
  // Only check static segments (skip dynamic `/agents/${...}` which aren't literal hrefs here).
  const seg = href.replace(/^\//, "");
  return existsSync(path.join(appDir, seg, "page.tsx"));
}

test("sidebar nav links all resolve to real routes", () => {
  const hrefs = hrefsIn("src/components/sidebar.tsx");
  assert.ok(hrefs.length >= 4, "expected several nav links");
  for (const h of hrefs) assert.ok(routeExists(h), `dead sidebar link: ${h}`);
});

test("command palette static routes all resolve", () => {
  const hrefs = hrefsIn("src/components/command-palette.tsx").filter((h) => !h.includes("$"));
  for (const h of hrefs) assert.ok(routeExists(h), `dead command-palette route: ${h}`);
});

test("README does not advertise pages that don't exist", () => {
  const readme = readFileSync(path.join(app, "README.md"), "utf8");
  // These were claimed in the old README but were never implemented as routes.
  for (const page of ["Evaluations", "Analytics", "Settings"]) {
    const hasRoute = existsSync(path.join(appDir, page.toLowerCase(), "page.tsx"));
    if (!hasRoute) {
      assert.ok(
        !new RegExp(`\\b${page}\\b`).test(readme),
        `README mentions "${page}" but there is no such route — remove the claim or build the page.`
      );
    }
  }
});
