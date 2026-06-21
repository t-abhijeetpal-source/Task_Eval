# A1 — Reproduction artifacts

Evidence that backs the headline counts in the master report, plus run logs. The goal: a reviewer
can reproduce every metric without the author present.

## Files

| File | What it is | How it's produced |
|---|---|---|
| `A1_evidence_counts.txt` | The grep/find commands behind each headline count, with expected values | `scripts/capture_evidence.sh` (live when `TARGET_REPO` set; else the committed expected values, INFERRED) |
| `A1_independent_verification.log` | Phase-3b adversarial spot-checks: claim → command → verdict | reproduces `A1_verification_report.md` § Phase 3b |
| `run_a1_analysis.log` | Last orchestrator run log | `run_a1_analysis.sh` |
| `run_a1_analysis.log` (validate) | Validator output | `scripts/validate_a1_reports.sh` |

## Reproduce

```bash
# 1) Validate the committed deliverables (no target repo needed):
bash ../../scripts/validate_a1_reports.sh

# 2) Capture live counts from an android-monorepo checkout:
#    set TARGET_REPO in ../../.env, then:
bash ../../scripts/capture_evidence.sh        # -> A1_evidence_counts.txt
bash ../../scripts/generate_api_inventory.sh  # -> ../../docs/agent-analysis/A1_api_inventory.yaml
```

## Blocker (current environment)

`TARGET_REPO` (the android-monorepo) is **not checked out here**, so live grep counts cannot be
captured in this environment. The expected commands + values are committed below and labeled
`INFERRED`; they become `VERIFIED` once run against a live checkout. Test **execution** is
additionally blocked by the Android SDK + Flutter build requirement (honored — no fabricated
pass/fail).
