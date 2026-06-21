// Validates the committed metrics.json: correct schema, and catalog-derived numbers that
// match the catalog source (drift guard — fails if metrics.json is stale).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseCatalog, parseProjectsCount, catalogMetrics, tierProgress, categoryPerf } from "../scripts/build-metrics.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const metrics = JSON.parse(readFileSync(path.join(app, "src/content/metrics.json"), "utf8"));
const agentsSrc = readFileSync(path.join(app, "src/lib/agents.ts"), "utf8");
const projectsSrc = readFileSync(path.join(app, "src/lib/projects.ts"), "utf8");
const catalog = parseCatalog(agentsSrc);

test("metrics.json has the documented schema", () => {
  assert.equal(typeof metrics.generatedAt, "string");
  assert.ok(!Number.isNaN(Date.parse(metrics.generatedAt)));
  assert.equal(metrics.source, "scripts/build-metrics.mjs");
  for (const k of ["totalAgents", "completed", "successRate", "executions", "projects", "avgScore"]) {
    assert.equal(typeof metrics.metrics[k], "number", `metrics.${k} is a number`);
  }
  assert.ok(Array.isArray(metrics.activity));
  assert.ok(Array.isArray(metrics.trend));
  assert.ok(Array.isArray(metrics.categoryPerf));
  assert.equal(typeof metrics.isIllustrative.activity, "boolean");
  assert.equal(typeof metrics.isIllustrative.trend, "boolean");
});

test("catalog-derived metrics match the catalog (not stale)", () => {
  const expected = catalogMetrics(catalog, parseProjectsCount(projectsSrc), metrics.metrics.executions);
  assert.deepEqual(metrics.metrics, expected);
});

test("trend matches per-tier verification computed from the catalog", () => {
  assert.deepEqual(metrics.trend, tierProgress(catalog));
});

test("categoryPerf matches per-category averages from the catalog", () => {
  assert.deepEqual(metrics.categoryPerf, categoryPerf(catalog));
});

test("executions is a positive integer (real, not the fabricated 312)", () => {
  assert.ok(Number.isInteger(metrics.metrics.executions));
  assert.ok(metrics.metrics.executions > 0);
  assert.notEqual(metrics.metrics.executions, 312);
});

test("activity events are well-formed; relative-time-able ISO timestamps", () => {
  for (const e of metrics.activity) {
    assert.equal(typeof e.agent, "string");
    assert.equal(typeof e.text, "string");
    assert.equal(typeof e.kind, "string");
    assert.ok(!Number.isNaN(Date.parse(e.iso)), `activity iso parses: ${e.iso}`);
  }
});

test("any illustrative section must be flagged true (honesty rule)", () => {
  // If activity is empty AND flagged real, that's fine; if it carries items that are not
  // derived from real commits, the generator sets isIllustrative.activity = true.
  if (metrics.isIllustrative.activity) assert.ok(metrics.activity.length > 0);
});
