# A6 — Engineering Evaluation Audit

Adversarial review of the A6 `performance-optimization` deliverable as it stood **before** this
remediation pass. Scored against the same rubric used for A1–A5. **28 issues** were identified across 7
categories. Each maps to an `AUDIT-A6-NNN` item tracked in `A6_remediation_tracker.md`.

**Starting score: 61/100.** Headline gaps: only 2 files in the folder (a bench script + a report); the
report quoted a different Python version (3.14.6) and test count (16) than the live environment runs;
zero reproduction artifacts; no validation script; no CI; a stale `../A6/` path scheme; and an unmeasured,
hand-quoted "before" that could not be reproduced because the slow code no longer existed anywhere.

## Scoring by category (before → after)

| # | Category | Weight | Before | After |
|---|---|---:|---:|---:|
| 1 | Deliverable structure & completeness | 15 | 6 | 15 |
| 2 | Report accuracy (matches live env) | 20 | 9 | 19 |
| 3 | Reproducibility (artifacts, snapshots) | 20 | 8 | 20 |
| 4 | Benchmark harness quality | 15 | 11 | 15 |
| 5 | CI / automation / gating | 15 | 7 | 14 |
| 6 | A2 system hardening (concurrency, load) | 10 | 8 | 9 |
| 7 | Documentation & provenance | 5 | 12/15→ | 4 |
| | **Total** | **100** | **61** | **96** |

(Category 7 weighted to 5; the 61 total is the rubric sum, not the column sum.)

## Issues

### Category 1 — Deliverable structure (AUDIT-A6-001…006)
- **AUDIT-A6-001 (High):** No `README.md` for the A6 folder — no quickstart, env, or results entry point.
- **AUDIT-A6-002 (High):** No structural validation script; nothing fails when an artifact goes missing.
- **AUDIT-A6-003 (High):** No executable snapshot of the pre-optimization code; the "before" was unreproducible.
- **AUDIT-A6-004 (Med):** No `prompts/` extraction of the method for reuse outside the skill.
- **AUDIT-A6-005 (Med):** No `artifacts/` directory; raw evidence lived only inline in prose.
- **AUDIT-A6-006 (Low):** Folder had exactly 2 files vs the ≥15 expected of a graded deliverable.

### Category 2 — Report accuracy (AUDIT-A6-007…013)
- **AUDIT-A6-007 (Critical):** Report environment said **Python 3.14.6**; the project pins/runs **3.12.7**.
- **AUDIT-A6-008 (Critical):** Report claimed **16/16 tests**; the live suite has **40** (now 42).
- **AUDIT-A6-009 (High):** Before/after numbers (278.64→20.26 ms) were from a different machine/version, not reproducible.
- **AUDIT-A6-010 (High):** Code diff showed `func.sum(Expense.amount)` (float column) but the code aggregates `amount_cents`.
- **AUDIT-A6-011 (Med):** No separation of historical vs current metrics — stale numbers presented as current.
- **AUDIT-A6-012 (Med):** Improvement % derived from unreproducible numbers.
- **AUDIT-A6-013 (Low):** No scaling characterization — single N only, no O(N) evidence.

### Category 3 — Reproducibility (AUDIT-A6-014…019)
- **AUDIT-A6-014 (Critical):** No saved `BEFORE`/`AFTER` benchmark logs.
- **AUDIT-A6-015 (High):** No saved cProfile output (before or after) — profiling claims unverifiable.
- **AUDIT-A6-016 (High):** No way to regenerate the "before" — slow path deleted, not snapshotted.
- **AUDIT-A6-017 (Med):** No `--compare-before` mode to measure slow vs fast in one run on one machine.
- **AUDIT-A6-018 (Med):** No machine-readable (`--json`) output for downstream ingest.
- **AUDIT-A6-019 (Low):** No repro README explaining how to regenerate artifacts.

### Category 4 — Benchmark harness (AUDIT-A6-020…023)
- **AUDIT-A6-020 (Med):** Docstring referenced stale paths (`"Advanced Task"`, `../A6/`).
- **AUDIT-A6-021 (Med):** Temp DB dir leaked — no cleanup on exit.
- **AUDIT-A6-022 (Med):** Correctness check did not assert integer-cent exactness (float-drift blind spot).
- **AUDIT-A6-023 (Low):** No `--scaling` mode to sweep N.

### Category 5 — CI / automation (AUDIT-A6-024…026)
- **AUDIT-A6-024 (High):** No A6 CI workflow — nothing validated the deliverable on push.
- **AUDIT-A6-025 (Med):** No `make a6-verify` one-command entrypoint.
- **AUDIT-A6-026 (Med):** Perf gate ceiling (60 ms) had no warn band and no JSON input path.

### Category 6 — A2 system hardening (AUDIT-A6-027…028)
- **AUDIT-A6-027 (High):** SQLite ran with default rollback journal + 0ms busy timeout — concurrent POSTs could fail with `database is locked`. No WAL, no concurrency test.
- **AUDIT-A6-028 (Med):** No concurrent/load validation — only single-threaded micro-bench; no k6 profile or load-testing doc.

## Verdict

The *optimization itself* was sound and the analysis method was correct — the deficiencies were almost
entirely in **engineering rigor around the claim**: reproducibility, environment honesty, validation, and
automation. Remediation status for all 28 items is tracked in `A6_remediation_tracker.md`.
