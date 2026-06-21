// Guards the shipped bundle against machine-specific path leaks (hard rule #2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");

function walk(dir, exts, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".vercel") continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, acc);
    else if (exts.some((e) => name.endsWith(e))) acc.push(full);
  }
  return acc;
}

test("authored source (ts/tsx/mjs/css/config) contains no absolute home paths", () => {
  const files = [
    ...walk(path.join(app, "src"), [".ts", ".tsx", ".css"]),
    ...walk(path.join(app, "scripts"), [".mjs"]),
    path.join(app, "next.config.ts"),
  ].filter((f) => !f.endsWith(".json"));
  const offenders = [];
  for (const f of files) {
    const text = readFileSync(f, "utf8");
    // Real home paths only — `/Users/<name>/…` or `/home/<name>/…`. (Our own code never
    // writes these; prose like "/Users/..." doesn't have a real name segment + slash.)
    if (/\/(?:Users|home)\/[a-z][\w.-]*\//.test(text)) offenders.push(path.relative(app, f));
  }
  assert.deepEqual(offenders, [], `absolute home paths found in: ${offenders.join(", ")}`);
});

test("ingested content JSON has no leaked macOS home paths", () => {
  const text = readFileSync(path.join(app, "src/content/agents-content.json"), "utf8");
  // `/Users/<lowercase-name>/` is a real macOS home path. Documentation prose such as
  // "/Users/..." or grep '"/Users/"' has no real name segment, so it won't match.
  const matches = text.match(/\/Users\/[a-z][\w.-]*\//g) ?? [];
  assert.deepEqual([...new Set(matches)], [], `leaked home paths: ${[...new Set(matches)].join(", ")}`);
});

test("metrics.json has no leaked home paths", () => {
  const text = readFileSync(path.join(app, "src/content/metrics.json"), "utf8");
  assert.equal(/\/Users\/[a-z][\w.-]*\//.test(text), false);
});
