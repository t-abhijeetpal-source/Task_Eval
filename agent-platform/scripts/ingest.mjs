// Ingest the REAL task markdown (agent definitions + output reports) from the sibling
// task folders into a committed JSON the website reads. Run: `node scripts/ingest.mjs`.
// Guards: if the task folders aren't present (e.g. on Vercel where only agent-platform
// is uploaded), it KEEPS the existing JSON instead of overwriting with empty data.
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../.."); // Tasks/
const OUT = path.resolve(__dirname, "../src/content/agents-content.json");

const TIERS = [
  ["Basics", "Basics"],
  ["Intermediate Task", "Intermediate"],
  ["Advanced Task", "Advanced"],
  ["Devops & Infra", "Infrastructure"],
];

const SKIP_DIR = new Set(["node_modules", ".next", ".venv", "target", "build", ".git", "screenshots"]);

async function walkMd(dir, acc) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.isDirectory()) { if (!SKIP_DIR.has(e.name) && !e.name.startsWith(".")) await walkMd(path.join(dir, e.name), acc); }
    else if (e.name.toLowerCase().endsWith(".md")) acc.push(path.join(dir, e.name));
  }
}

function titleFrom(md, code) {
  const m = md.match(/^#\s+(.+)$/m);
  if (!m) return null;
  let t = m[1].trim();
  t = t.replace(new RegExp(`^${code}\\s*[—–:-]\\s*`, "i"), "").replace(new RegExp(`^${code}\\s+`, "i"), "");
  t = t.replace(/\s*[—–-]\s*Demo Output\s*$/i, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  return t || null;
}

function rank(rel) {
  const f = rel.toLowerCase();
  if (!f.includes("/")) return f.includes("verification") ? 2 : 0; // top-level output first
  if (f.includes("docs/agent-analysis")) return 1;
  if (f.includes("readme")) return 4;
  if (f.includes("requirements")) return 5;
  return 3;
}

const content = {};
for (const [folder, tier] of TIERS) {
  const tdir = path.join(ROOT, folder);
  let subs;
  try { subs = await fs.readdir(tdir, { withFileTypes: true }); } catch { continue; }
  for (const s of subs) {
    if (!s.isDirectory()) continue;
    const code = s.name;
    if (!/^[A-Z]\d+$/.test(code)) continue;
    const adir = path.join(tdir, s.name);

    let definition = null, definitionFile = null;
    try {
      definition = await fs.readFile(path.join(adir, `${code}_agent.md`), "utf8");
      definitionFile = `${code}_agent.md`;
    } catch {}

    const files = [];
    await walkMd(adir, files);
    const documents = [];
    for (const f of files) {
      const rel = path.relative(adir, f).split(path.sep).join("/");
      if (rel === definitionFile) continue;
      const c = await fs.readFile(f, "utf8");
      documents.push({ file: rel, label: path.basename(f), content: c, lines: c.split("\n").length, bytes: Buffer.byteLength(c) });
    }
    documents.sort((a, b) => rank(a.file) - rank(b.file) || a.file.localeCompare(b.file));

    const title = (definition && titleFrom(definition, code)) || (documents[0] && titleFrom(documents[0].content, code)) || code;
    content[code] = { code, tier, title, definitionFile, definition, documents };
  }
}

const count = Object.keys(content).length;
if (count === 0) {
  console.warn("ingest: no task folders found — keeping existing JSON (Vercel/standalone build).");
} else {
  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, JSON.stringify(content));
  const size = (await fs.stat(OUT)).size;
  console.log(`ingest: ${count} agents -> ${OUT} (${(size / 1024).toFixed(0)} KB)`);
}
