// Test-first guard for I3 (minimal-safe-change) ingestion.
// Asserts the ingested agent content for I3 is the full agent spec, not a stub.
// Dependency-free (the repo's agent-platform has no JS test runner configured);
// run with: `node scripts/test-i3-content.mjs`. Exit 0 = pass, 1 = fail.
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.resolve(__dirname, "../src/content/agents-content.json");

const failures = [];
function check(name, cond) {
  if (cond) console.log(`  ✓ ${name}`);
  else { console.error(`  ✗ ${name}`); failures.push(name); }
}

const data = JSON.parse(await fs.readFile(JSON_PATH, "utf8"));
const i3 = data.I3;

console.log("I3 ingestion assertions:");
check("I3 entry present", !!i3);
check("definitionFile is I3_agent.md", i3 && i3.definitionFile === "I3_agent.md");
check("ingested definition length > 5000 chars", i3 && (i3.definition || "").length > 5000);
check('definition contains "Phase 0"', i3 && (i3.definition || "").includes("Phase 0"));
check('definition references the sandbox', i3 && (i3.definition || "").includes("sandbox/"));

if (failures.length) {
  console.error(`\n❌ ${failures.length} assertion(s) failed. Run \`node scripts/ingest.mjs\` to refresh.`);
  process.exit(1);
}
console.log("\n✅ I3 content ingested correctly.");
