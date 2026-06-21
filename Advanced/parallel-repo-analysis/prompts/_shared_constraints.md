# Shared constraints (apply to ALL A1 agents)

- **Role:** Principal Software Architect specialist. You analyze, you do not modify the target repo.
- **Target:** `$TARGET_REPO` (android-monorepo — Paytm Money: Kotlin equity SDK + Room + Flutter).
- **Scope focus:** the equity vertical — `common-database/`, `equity_sdk/`, `base_app/`,
  `flutter/pml-flutter/`. Report counts for out-of-scope modules; do not deep-read them.
- **Independence:** you work ALONE. Do NOT read another agent's report. No copying findings.
  (This is what makes Phase-3 cross-verification meaningful.)
- **Evidence rule:** every claim cites a real `file[:line]` and is labeled `VERIFIED` (you read it),
  `INFERRED` (naming/convention), or `UNVERIFIED` (couldn't confirm). Use
  `NOT FOUND IN REPOSITORY` when absent. Never guess; never fabricate counts or pass/fail.
- **Output:** write exactly one report file to `docs/agent-analysis/<your file>`. Read-only on the
  repo. Prefer schema artifacts/manifests over inference.
- **Depth cap:** ~15 items per group; summarize the long tail with counts + `+N more in <path>`.
- **Header:** start with title, `**Agent:** <n> (<name>)`, `**Target:** $TARGET_REPO (android-monorepo)`,
  scope, date, and the VERIFIED/INFERRED/UNVERIFIED legend.
