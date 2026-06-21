// Generate src/content/metrics.json from REAL repo data — no hand-entered telemetry.
//
//   • catalog metrics  → parsed from src/lib/agents.ts (the source of truth)
//   • executions       → sum of passing test cases parsed from **/VERIFICATION_RESULTS.md
//                        footers (pytest "=== N passed", jest "Tests: N passed",
//                        cargo "test result: ok. N passed")
//   • activity         → real commits (subject + ISO author date) touching task folders
//   • trend            → verification progress per tier, computed from the catalog
//   • categoryPerf     → average score per category, computed from the catalog
//
// Run: `node scripts/build-metrics.mjs`  (also `npm run build:metrics`).
// Guard: when the sibling task folders / git history aren't present (e.g. a deploy
// that only uploaded agent-platform), it KEEPS the prior committed values for the
// repo-scanned fields instead of overwriting them with zeros.
import { promises as fs } from "fs";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(APP_ROOT, ".."); // Tasks/
const AGENTS_SRC = path.resolve(APP_ROOT, "src/lib/agents.ts");
const PROJECTS_SRC = path.resolve(APP_ROOT, "src/lib/projects.ts");
const OUT = path.resolve(APP_ROOT, "src/content/metrics.json");

const TASK_DIRS = ["Basics", "Intermediate", "Advanced", "DevOps-Infra"];
const TIERS = ["Basics", "Intermediate", "Advanced", "Infrastructure"];

// ---- pure, testable parsers ---------------------------------------------------

/** Parse the agent catalog source into {code, tier, category, status, score}. */
export function parseCatalog(src) {
  // Split on each `code: "` — everything up to the next agent's `code:` holds this
  // agent's fields (they appear in a fixed order: code → tier → category → status → score).
  const chunks = src.split(/code:\s*"/).slice(1);
  const agents = [];
  for (const chunk of chunks) {
    const code = chunk.match(/^([^"]+)"/)?.[1];
    const tier = chunk.match(/tier:\s*"([^"]+)"/)?.[1];
    const category = chunk.match(/category:\s*"([^"]+)"/)?.[1];
    const status = chunk.match(/status:\s*"([^"]+)"/)?.[1];
    const score = Number(chunk.match(/score:\s*(\d+)/)?.[1]);
    if (code && tier && category && status && Number.isFinite(score)) {
      agents.push({ code, tier, category, status, score });
    }
  }
  return agents;
}

/** Count entries in the PROJECTS array source. */
export function parseProjectsCount(src) {
  return (src.match(/name:\s*"/g) || []).length;
}

/** Sum passing test cases from a single VERIFICATION_RESULTS.md, reading the actual
 *  runner footers in the captured logs. Markdown summary tables (lines starting with
 *  `|`) and bold summaries (containing `**`) are skipped so per-suite counts aren't
 *  double counted against the raw output they summarize. */
export function parseTestFooters(text) {
  const breakdown = { pytest: 0, jest: 0, cargo: 0 };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("|") || line.includes("**")) continue; // skip md tables/summaries

    // cargo: "test result: ok. 7 passed; 0 failed; ..." (sum every crate, 0s included)
    const cargo = line.match(/^test result:\s*ok\.\s*(\d+) passed/);
    if (cargo) { breakdown.cargo += Number(cargo[1]); continue; }

    // jest: "Tests:       14 passed, 14 total"
    if (/^Tests:/.test(line)) {
      const m = line.match(/(\d+) passed/);
      if (m) breakdown.jest += Number(m[1]);
      continue;
    }

    // pytest summary line: "N passed" alongside a duration or warning count, with or
    // without the surrounding "=====" bar: "6 passed, 1 warning in 0.32s".
    const py = line.match(/(\d+) passed/);
    if (py && /(\bin\s+[\d.]+\s*s\b|warning)/.test(line)) breakdown.pytest += Number(py[1]);
  }
  const total = breakdown.pytest + breakdown.jest + breakdown.cargo;
  return { total, breakdown };
}

/** Catalog metrics: counts, success rate and average score. */
export function catalogMetrics(catalog, projects, executions) {
  const total = catalog.length;
  const verified = catalog.filter((a) => a.status === "Verified" || a.status === "Passed").length;
  const avg = total ? Math.round(catalog.reduce((s, a) => s + a.score, 0) / total) : 0;
  return {
    totalAgents: total,
    completed: verified,
    successRate: total ? Math.round((verified / total) * 100) : 0,
    executions,
    projects,
    avgScore: avg,
  };
}

/** Verification progress per tier (real, from the catalog). */
export function tierProgress(catalog) {
  return TIERS.map((tier) => {
    const inTier = catalog.filter((a) => a.tier === tier);
    return {
      tier,
      total: inTier.length,
      verified: inTier.filter((a) => a.status === "Verified" || a.status === "Passed").length,
    };
  });
}

/** Average score per category (real, from the catalog). */
export function categoryPerf(catalog) {
  const cats = [...new Set(catalog.map((a) => a.category))];
  return cats.map((category) => {
    const inCat = catalog.filter((a) => a.category === category);
    return {
      category,
      score: Math.round(inCat.reduce((s, a) => s + a.score, 0) / Math.max(1, inCat.length)),
    };
  });
}

const CODE_RE = /\b([BIAD]\d)\b/;
/** Classify a commit subject into an activity kind. */
export function activityKind(subject) {
  const s = subject.toLowerCase();
  if (/(perf|optimiz|latency|benchmark)/.test(s)) return "perf";
  if (/(security|adversarial|traversal|vuln|review|auth bypass)/.test(s)) return "security";
  if (/(verify|verified|validation|validate|gate)/.test(s)) return "verify";
  return "pass";
}

/** Build activity events from `git log` lines of the form `<iso>\x1f<subject>`. */
export function buildActivity(gitLines, limit = 6) {
  const events = [];
  for (const line of gitLines) {
    const [iso, subject] = line.split("\x1f");
    if (!iso || !subject) continue;
    const code = subject.match(CODE_RE)?.[1] ?? "repo";
    events.push({ agent: code, text: subject.trim(), iso: iso.trim(), kind: activityKind(subject) });
    if (events.length >= limit) break;
  }
  return events;
}

// ---- repo scanning (impure) ---------------------------------------------------

async function walkVerification(dir, acc) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (!["node_modules", ".next", ".venv", "target", "build", ".git"].includes(e.name)) {
        await walkVerification(path.join(dir, e.name), acc);
      }
    } else if (e.name === "VERIFICATION_RESULTS.md") {
      acc.push(path.join(dir, e.name));
    }
  }
}

async function scanExecutions() {
  const files = [];
  for (const d of TASK_DIRS) await walkVerification(path.join(REPO_ROOT, d), files);
  let total = 0;
  const perFile = [];
  for (const f of files) {
    const text = await fs.readFile(f, "utf8");
    const { total: t, breakdown } = parseTestFooters(text);
    if (t > 0) perFile.push({ file: path.relative(REPO_ROOT, f), ...breakdown, total: t });
    total += t;
  }
  return { total, perFile };
}

function gitActivity() {
  try {
    const out = execFileSync(
      "git",
      ["log", "--no-merges", "--date-order", "-n", "40", "--pretty=%aI\x1f%s", "--", ...TASK_DIRS],
      { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
    return buildActivity(out.split("\n").filter(Boolean));
  } catch {
    return null; // git unavailable (e.g. shallow deploy checkout)
  }
}

async function readPrior() {
  try { return JSON.parse(await fs.readFile(OUT, "utf8")); } catch { return null; }
}

async function main() {
  const [agentsSrc, projectsSrc, prior] = await Promise.all([
    fs.readFile(AGENTS_SRC, "utf8"),
    fs.readFile(PROJECTS_SRC, "utf8"),
    readPrior(),
  ]);

  const catalog = parseCatalog(agentsSrc);
  if (catalog.length === 0) throw new Error("build-metrics: parsed 0 agents from agents.ts — check the catalog format.");
  const projects = parseProjectsCount(projectsSrc);

  const { total: scannedExecutions, perFile } = await scanExecutions();
  const gitEvents = gitActivity();

  // Guard: keep prior repo-scanned values when this checkout can't see the sources.
  const executions = scannedExecutions > 0 ? scannedExecutions : (prior?.metrics?.executions ?? 0);
  const activity = gitEvents && gitEvents.length ? gitEvents : (prior?.activity ?? []);
  const activityIsReal = !!(gitEvents && gitEvents.length);

  const out = {
    generatedAt: new Date().toISOString(),
    source: "scripts/build-metrics.mjs",
    metrics: catalogMetrics(catalog, projects, executions),
    activity,
    trend: tierProgress(catalog),
    categoryPerf: categoryPerf(catalog),
    isIllustrative: { activity: !activityIsReal && activity.length > 0, trend: false },
  };

  await fs.writeFile(OUT, JSON.stringify(out, null, 2) + "\n");

  console.log(`build-metrics: wrote ${path.relative(APP_ROOT, OUT)}`);
  console.log(`  agents=${out.metrics.totalAgents} completed=${out.metrics.completed} ` +
    `successRate=${out.metrics.successRate}% avgScore=${out.metrics.avgScore} projects=${out.metrics.projects}`);
  console.log(`  executions=${executions} ${scannedExecutions > 0 ? "(scanned)" : "(kept prior — no VERIFICATION files found)"}`);
  if (perFile.length) for (const p of perFile) console.log(`    ${p.total.toString().padStart(3)}  ${p.file}`);
  console.log(`  activity=${activity.length} ${activityIsReal ? "(real commits)" : "(kept prior / none)"}`);
}

// Only run when invoked directly (not when imported by tests).
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
