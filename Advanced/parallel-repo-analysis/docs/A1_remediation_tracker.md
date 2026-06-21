# A1 — Remediation Tracker

> Live status of every audit issue from `A1_engineering_evaluation_audit.md`.
> Status: **Done** (implemented + validated) · **Spec Ready** (prompt written, awaits writable
> TARGET_REPO / runtime) · **Open**. Date: 2026-06-21.

## Summary

| Status | Count |
|---|---|
| Done | 22 |
| Spec Ready (target-repo / runtime gated) | 10 |
| Open | 0 |

The 10 "Spec Ready" items are the target-repo remediation prompts (PROMPT-023..032): they fix
the *analyzed* repo (CI gap, layer violations, coverage gates, etc.), which this deliverable does
not have write access to. Each has a self-contained prompt under `prompts/remediation/`.

## Tracker

| AUDIT | Sev | Status | Evidence / Artifact |
|---|---|---|---|
| AUDIT-001 | P0 | Done | `README.md` |
| AUDIT-002 | P1 | Done | `README.md` § Deliverable tree, Acceptance criteria |
| AUDIT-003 | P2 | Done | `README.md` § Results at a glance |
| AUDIT-004 | P0 | Done | `run_a1_analysis.sh` |
| AUDIT-005 | P1 | Done | `run_a1_analysis.sh --validate-only` (exit 0) |
| AUDIT-006 | P1 | Done | `.env.example` |
| AUDIT-007 | P0 | Done | `$TARGET_REPO (android-monorepo)` in all 9 reports; validator check [4] |
| AUDIT-008 | P2 | Done | `.gitignore:36` `.env` |
| AUDIT-009 | P0 | Done | `scripts/validate_a1_reports.sh` (22 checks, exit 0) |
| AUDIT-010 | P1 | Done | `.github/workflows/a1-parallel-repo-analysis.yml` |
| AUDIT-011 | P2 | Done | root `Makefile` `a1-validate` target |
| AUDIT-012 | P0 | Done | `A1_architecture.md:20` 25→24; validator check [5] |
| AUDIT-013 | P1 | Done | `scripts/generate_api_inventory.sh` → `A1_api_inventory.yaml` |
| AUDIT-014 | P2 | Done | `A1_manifest.json` + `capture_evidence.sh` reconcile module counts |
| AUDIT-015 | P2 | Done | tracked here + `A1_dependencies.md` |
| AUDIT-016 | P1 | Done | `artifacts/repro/` capture logs |
| AUDIT-017 | P1 | Done | `docs/agent-analysis/A1_manifest.json` |
| AUDIT-018 | P1 | Done | `docs/agent-analysis/A1_provenance.yaml` |
| AUDIT-019 | P1 | Done | `artifacts/repro/A1_independent_verification.log` |
| AUDIT-020 | P2 | Done | `scripts/generate_api_inventory.sh` |
| AUDIT-021 | P1 | Done | `artifacts/repro/README.md` |
| AUDIT-022 | P1 | Done | `prompts/` (8 agent/coordinator prompts) |
| AUDIT-023 | P1 | Done | `docs/agent-analysis/A1_security.md` |
| AUDIT-024 | P2 | Done | `docs/agent-analysis/A1_performance.md` |
| AUDIT-025 | P2 | Done | `docs/agent-analysis/A1_dependencies.md` |
| AUDIT-026 | P1 | Done | "Agent vs Verified" footer on all 6 lane reports |
| AUDIT-027 | P2 | Done | severity/long-tail appendix in `A1_inventory.md` + `A1_api_map.md` |
| AUDIT-028 | P1 | Done | "Remediation Backlog" table in master report |
| AUDIT-029 | P2 | Done | master report links to lanes 7–8 |
| AUDIT-030 | P2 | Done | master report canonical alias documented |
| AUDIT-031 | P2 | Done | `agent-platform/src/content/agents-content.json` updated |
| AUDIT-032 | P2 | Done | `SKILL.md` optional lanes 7–8 section |
| RT-EXT-023 | P0 | Spec Ready | `prompts/remediation/PROMPT-023.md` — CI: run equity_sdk + Flutter unit tests |
| RT-EXT-024 | P1 | Spec Ready | `prompts/remediation/PROMPT-024.md` — make jacoco gates valid + blocking |
| RT-EXT-025 | P1 | Spec Ready | `prompts/remediation/PROMPT-025.md` — fix layer violations (orders/indices) |
| RT-EXT-026 | P2 | Spec Ready | `prompts/remediation/PROMPT-026.md` — Konsist/lint rule banning presentation→data |
| RT-EXT-027 | P2 | Spec Ready | `prompts/remediation/PROMPT-027.md` — publish 27-table Room data-model doc |
| RT-EXT-028 | P2 | Spec Ready | `prompts/remediation/PROMPT-028.md` — refresh stale coverage + pml-flutter path |
| RT-EXT-029 | P2 | Spec Ready | `prompts/remediation/PROMPT-029.md` — pin/centralize Retrofit base-URL provider doc |
| RT-EXT-030 | P2 | Spec Ready | `prompts/remediation/PROMPT-030.md` — dependency upgrade/audit pass |
| RT-EXT-031 | P1 | Spec Ready | `prompts/remediation/PROMPT-031.md` — security findings remediation |
| RT-EXT-032 | P2 | Spec Ready | `prompts/remediation/PROMPT-032.md` — performance findings remediation |

> The `RT-EXT-*` rows are the external (target-repo) work items; they are out of scope for
> modification here per the program constitution (no write access to the analyzed repo), but
> each ships a ready-to-execute prompt.
