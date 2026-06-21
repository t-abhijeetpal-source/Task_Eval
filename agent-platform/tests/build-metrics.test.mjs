// Unit tests for the pure parsing logic in scripts/build-metrics.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCatalog,
  parseProjectsCount,
  parseTestFooters,
  catalogMetrics,
  tierProgress,
  categoryPerf,
  activityKind,
  buildActivity,
} from "../scripts/build-metrics.mjs";

const SAMPLE_CATALOG = `
export const AGENTS = [
  {
    id: "b1", code: "B1", name: "X", tier: "Basics", category: "Architecture",
    difficulty: "Beginner", status: "Verified", score: 96, tags: ["a"],
    prompt: P(\`talk about Score and status: here in prose\`),
  },
  {
    id: "i3", code: "I3", name: "Y", tier: "Intermediate", category: "Automation",
    difficulty: "Intermediate", status: "Passed", score: 90, tags: ["b"],
  },
  {
    id: "a3", code: "A3", name: "Z", tier: "Advanced", category: "Architecture",
    difficulty: "Expert", status: "In Progress", score: 80, tags: ["c"],
  },
];
`;

test("parseCatalog extracts code/tier/category/status/score per agent", () => {
  const c = parseCatalog(SAMPLE_CATALOG);
  assert.equal(c.length, 3);
  assert.deepEqual(c[0], { code: "B1", tier: "Basics", category: "Architecture", status: "Verified", score: 96 });
  assert.equal(c[2].status, "In Progress");
  assert.equal(c[2].score, 80);
});

test("parseCatalog is not confused by the word 'status'/'Score' inside prompt prose", () => {
  const c = parseCatalog(SAMPLE_CATALOG);
  // B1's status must be the field value, not text from the prompt.
  assert.equal(c[0].status, "Verified");
});

test("parseProjectsCount counts data entries, not the interface field", () => {
  const src = `
    export interface Project { name: string; tier: string; }
    export const PROJECTS = [
      { name: "One", tier: "A2" },
      { name: "Two", tier: "A3" },
    ];`;
  assert.equal(parseProjectsCount(src), 2);
});

test("parseTestFooters sums pytest/jest/cargo green footers", () => {
  const log = [
    "running 7 tests",
    "test result: ok. 7 passed; 0 failed; 0 ignored",
    "========================= 6 passed, 1 warning in 0.32s =========================",
    "Tests:       14 passed, 14 total",
  ].join("\n");
  const { total, breakdown } = parseTestFooters(log);
  assert.equal(breakdown.cargo, 7);
  assert.equal(breakdown.pytest, 6);
  assert.equal(breakdown.jest, 14);
  assert.equal(total, 27);
});

test("parseTestFooters skips markdown summary tables and bold summaries (no double count)", () => {
  const doc = [
    "| FastAPI | `pytest -q` | **22 passed** (rc=0) |",
    "**Result: 6 passed, 0 failed.**",
    "22 passed, 1 warning in 0.15s",
  ].join("\n");
  const { total } = parseTestFooters(doc);
  assert.equal(total, 22); // only the real footer, not the table/bold rows
});

test("parseTestFooters excludes failing reproduction runs", () => {
  const doc = [
    "==================== 3 failed, 2 passed in 0.30s ====================",
    "========================= 5 passed in 0.27s =========================",
  ].join("\n");
  const { total } = parseTestFooters(doc);
  assert.equal(total, 5); // the green run only
});

test("parseTestFooters bare pytest summary without === bars", () => {
  assert.equal(parseTestFooters("8 passed in 0.17s").total, 8);
});

test("catalogMetrics computes counts, rate and average", () => {
  const catalog = parseCatalog(SAMPLE_CATALOG);
  const m = catalogMetrics(catalog, 6, 100);
  assert.equal(m.totalAgents, 3);
  assert.equal(m.completed, 2); // Verified + Passed
  assert.equal(m.successRate, 67);
  assert.equal(m.executions, 100);
  assert.equal(m.projects, 6);
  assert.equal(m.avgScore, Math.round((96 + 90 + 80) / 3));
});

test("tierProgress reports total and verified per tier", () => {
  const tp = tierProgress(parseCatalog(SAMPLE_CATALOG));
  const basics = tp.find((t) => t.tier === "Basics");
  assert.deepEqual(basics, { tier: "Basics", total: 1, verified: 1 });
  const advanced = tp.find((t) => t.tier === "Advanced");
  assert.deepEqual(advanced, { tier: "Advanced", total: 1, verified: 0 }); // In Progress not verified
});

test("categoryPerf averages scores per category", () => {
  const cp = categoryPerf(parseCatalog(SAMPLE_CATALOG));
  const arch = cp.find((c) => c.category === "Architecture");
  assert.equal(arch.score, Math.round((96 + 80) / 2));
});

test("activityKind classifies subjects", () => {
  assert.equal(activityKind("Harden A6 performance-optimization to production grade"), "perf");
  assert.equal(activityKind("Harden A5 adversarial PR review + security fixes"), "security");
  assert.equal(activityKind("Add validation gate to A1"), "verify");
  assert.equal(activityKind("Rename folders"), "pass");
});

test("buildActivity maps git lines to events with codes and ISO timestamps", () => {
  const lines = [
    "2026-06-21T17:31:06+05:30\x1fHarden A6 performance-optimization (61->96)",
    "2026-06-17T20:12:33+05:30\x1fRename tasks to descriptive folder names",
  ];
  const events = buildActivity(lines);
  assert.equal(events.length, 2);
  assert.equal(events[0].agent, "A6");
  assert.equal(events[0].kind, "perf");
  assert.equal(events[1].agent, "repo"); // no code in subject
  assert.ok(!Number.isNaN(Date.parse(events[0].iso)));
});
