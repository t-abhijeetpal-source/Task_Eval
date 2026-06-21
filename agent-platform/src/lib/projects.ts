// Real systems built and verified by the agents (the Projects showcase).
// Each entry corresponds to a task folder under Advanced/ or DevOps-Infra/.

export interface Project {
  name: string;
  tier: string;
  stack: string[];
  metric: string;
  desc: string;
}

export const PROJECTS: Project[] = [
  { name: "Expense Tracker", tier: "A2", stack: ["FastAPI", "SQLite", "JS"], metric: "16 tests · Docker healthy", desc: "Full-stack app built by 6 parallel agents." },
  { name: "Polyglot Fraud System", tier: "A3", stack: ["FastAPI", "Node", "Rust"], metric: "E2E 4/4 PASS", desc: "3-language scoring pipeline, queue + callback." },
  { name: "Compose E2E Stack", tier: "D2", stack: ["Compose", "PostgreSQL", "Python"], metric: "health-gated, exit 0", desc: "API + DB + worker, deterministic lifecycle." },
  { name: "Terraform S3+Lambda", tier: "D1", stack: ["Terraform", "AWS"], metric: "plan: 15 to add", desc: "Pinned IaC with a clean offline plan." },
  { name: "Reproducible Monorepo", tier: "D5", stack: ["mise", "Make"], metric: "85/85 clean-slate", desc: "One-command bootstrap across 3 languages." },
  { name: "CI Pipeline", tier: "D3", stack: ["GitHub Actions"], metric: "5 stages, fail→fix", desc: "Cached, lockfile-deterministic, fail-fast." },
];
