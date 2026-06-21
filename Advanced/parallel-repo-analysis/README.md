# A1 — Parallel Repository Analysis

Principal-architect, **multi-agent** analysis of a large Paytm Money Android monorepo
(`android-monorepo`: a Kotlin equity-trading SDK + a centralized Room database module + a
Flutter add-to-app client). Six independent specialist agents fan out across the codebase,
a coordinator cross-verifies their claims against source, and the findings are consolidated
into a single master report.

**Posture:** every claim cites a real `file:line` or command output and is labeled
**VERIFIED** (read/grepped) · **INFERRED** (naming/convention) · **UNVERIFIED** (not confirmed).
Independence between lanes is what makes the Phase-3 cross-verification meaningful.

## Quickstart

```bash
cd Advanced/parallel-repo-analysis

# 1) Validate every committed deliverable (no target repo needed):
bash scripts/validate_a1_reports.sh            # exits 0 when all checks pass

# 2) Same, via the orchestrator entrypoint:
bash run_a1_analysis.sh --validate-only

# 3) (Optional) capture live grep evidence from the analyzed repo:
cp .env.example .env && $EDITOR .env           # set TARGET_REPO=/path/to/android-monorepo
bash run_a1_analysis.sh                         # capture evidence -> artifacts/repro, then validate

# From the monorepo root, the same gate is wired into make:
make a1-validate
```

## Results at a glance

| Metric | Value | Status |
|---|---|---|
| Files scanned | ~6,629 (4,279 Kotlin equity src + 2,350 Dart) | VERIFIED (`find`) |
| Gradle modules | 36 unique `:module` refs (44 include lines) | VERIFIED |
| Outbound endpoints | 78 Retrofit interfaces (equity_sdk) + 1 (base_app); ~363 methods | VERIFIED (78) |
| Room entities | 27 tables / 2 DBs (24 EquityDatabase v19 + 3 LoggingDataBase v7); **0 FKs** | VERIFIED |
| Tests discovered | 520 `*Test.kt` (equity) + 212 `*_test.dart`; 1,684 repo-wide | VERIFIED (counts) |
| Contradictions resolved | 2 (Retrofit 71→78; module-count reconciled) + 1 risk reworded | Coordinator + independent agent |
| Lanes | 6 core + 2 optional (security, performance) | — |

Top finding: a **CI test-coverage gap** — Bitbucket runs unit tests for `:base_app` only
(`bitbucket-pipelines.yml:713`), so equity_sdk's ~303 and Flutter's ~212 tests never execute
on that pipeline (GitLab scope flagged UNVERIFIED). See the master report's Risks section.

## Deliverable tree

```
parallel-repo-analysis/
├── README.md                          ← this file
├── run_a1_analysis.sh                 ← orchestrator: --validate-only / evidence capture / --help
├── .env.example                       ← TARGET_REPO template
├── scripts/
│   ├── validate_a1_reports.sh         ← structural + content gate (CI entrypoint)
│   ├── capture_evidence.sh            ← grep-count evidence from TARGET_REPO (Phase 3)
│   └── generate_api_inventory.sh      ← Retrofit/route inventory -> A1_api_inventory.yaml
├── prompts/                           ← the agent + coordinator prompts (reproducibility)
│   └── remediation/                   ← PROMPT-023..032: target-repo fix specs
├── artifacts/repro/                   ← captured evidence + run logs (reproduce headline counts)
└── docs/
    ├── A1_engineering_evaluation_audit.md   ← category scores + 32-issue register
    ├── A1_remediation_tracker.md            ← AUDIT-001..032 with Status
    └── agent-analysis/
        ├── A1_plan.md                       (Phase 1 — decomposition)
        ├── A1_inventory.md                  (Agent 1 — modules/artifacts)
        ├── A1_api_map.md                    (Agent 2 — outbound API surface)
        ├── A1_entities.md                   (Agent 3 — Room data model)
        ├── A1_tests.md                      (Agent 4 — test discovery)
        ├── A1_architecture.md               (Agent 5 — architecture/deps)
        ├── A1_flow_trace.md                 (Agent 6 — end-to-end flow)
        ├── A1_security.md                   (Lane 7 — optional)
        ├── A1_performance.md                (Lane 8 — optional)
        ├── A1_dependencies.md               (dependency/version table)
        ├── A1_verification_report.md        (Phase 3 — cross-verification)
        ├── A1_repository_master_report.md   (Phase 4 — consolidated)
        ├── A1_manifest.json                 (machine-readable metrics)
        └── A1_provenance.yaml               (commit/branch/date)
```

## How the analysis is structured

| Phase | What happens | Output |
|---|---|---|
| 1 — Plan | Decompose into 6 independent lanes; define scope, evidence rules | `A1_plan.md` |
| 2 — Fan-out | 6 specialists work **alone** (no cross-reading), each writes one report | 6 lane reports |
| 3 — Cross-verify | Coordinator diffs overlapping claims, resolves contradictions, re-greps headline claims; a blind adversarial agent confirms/refutes | `A1_verification_report.md` |
| 4 — Consolidate | Merge in order (Inventory→Architecture→Entities→API→Flow→Tests), attach metrics, risks, recommendations | `A1_repository_master_report.md` |

The lane decomposition, merge order, and conflict policy are defined in
`skills/tasks-parallel-repo-analysis/SKILL.md`.

## Acceptance criteria

- [x] `scripts/validate_a1_reports.sh` exits 0 (9 files present; master has Metrics + all completion criteria checked; verification has contradictions + spot-checks; no absolute paths; no stale "25 entities"; every lane has a VERIFIED label + Agent header).
- [x] `run_a1_analysis.sh --validate-only` exits 0.
- [x] `make a1-validate` exits 0 from the monorepo root.
- [x] Every headline metric is reproducible from `artifacts/repro/` (or documented as blocked).
- [x] CI (`.github/workflows/a1-parallel-repo-analysis.yml`) runs the gate on path-filtered pushes/PRs.

## Notes & honest limitations

- This is a **client app**: there are no server endpoints — the entire API surface is outbound.
- Test **execution** was not run (Android SDK + Flutter build blocker); counts come from file
  reads/`find`, never fabricated pass/fail.
- `TARGET_REPO` is intentionally not committed. Report headers reference
  `$TARGET_REPO (android-monorepo)` instead of an absolute path. Validation works without it;
  live evidence capture requires it.
