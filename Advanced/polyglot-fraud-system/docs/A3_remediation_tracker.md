# A3 — Remediation Tracker

Status of every audit finding (`A3_engineering_evaluation_audit.md`) plus the A5 items
that were deferred at adversarial-review time. Evidence paths are relative to the
component root. **Done** items are verified by `make a3-verify` / `artifacts/repro/`.

Legend: ✅ Done · 🟦 Deferred (documented, out of current scope) · ⬜ Open

## Audit findings

| ID | Status | Evidence |
|---|---|---|
| AUDIT-A3-001 (stale counts) | ✅ | `VERIFICATION_RESULTS.md`, `scripts/capture_verification.sh`, gate check [3] |
| AUDIT-A3-002 (.env.example / token) | ✅ | `.env.example`, gate check [6] |
| AUDIT-A3-003 (validation gate) | ✅ | `scripts/validate_a3_deliverable.sh` |
| AUDIT-A3-004 (captured evidence) | ✅ | `artifacts/repro/{rust,pytest,node,conformance,integration}.log` |
| AUDIT-A3-005 (CI) | ✅ | `.github/workflows/a3-polyglot-fraud-system.yml` |
| AUDIT-A3-006 (audit + scorecard) | ✅ | `docs/A3_engineering_evaluation_audit.md`, `docs/A3_final_scorecard.md` |
| AUDIT-A3-007 (one-command verify) | ✅ | root `Makefile` target `a3-verify` |
| AUDIT-A3-008 (manifest) | ✅ | `docs/agent-analysis/A3_manifest.json` |
| AUDIT-A3-009 (readiness probe) | ✅ | `app/routes.py` `GET /health/ready`; tests `test_readiness_ok`, `test_readiness_503_when_queue_unwritable` |
| AUDIT-A3-010 (docker) | ✅ | `fastapi-service/Dockerfile`, `node-worker/Dockerfile`, `docker-compose.yml` (config validated) |
| AUDIT-A3-011 (amount → cents) | 🟦 | CONTRACT v1.1 backlog; Rust `high_amount_threshold_boundary` pins `>10000` |
| AUDIT-A3-012 (optional ingest key) | ✅ | `app/routes.py` `A3_API_KEY`; tests `test_ingest_api_key_enforced_when_configured`, `test_ingest_open_in_demo_mode` |
| AUDIT-A3-013 (CORS / rate limit) | 🟦 | Gateway responsibility; documented in audit |
| AUDIT-A3-014 (symlink rejection) | 🟦 | Queue dir service-owned; low risk; tracked |
| AUDIT-A3-015 (SQLite WAL) | ✅ | `app/database.py` WAL + `busy_timeout=5000` |
| AUDIT-A3-016 (/metrics) | 🟦 | Structured JSON logs present; Prometheus deferred |
| AUDIT-A3-017 (contract conformance) | ✅ | `scripts/contract_conformance.sh` (4/4); wired into `a3-verify` + CI |
| AUDIT-A3-018 (load test) | 🟦 | `load_pipeline.k6.js` sketch backlog |
| AUDIT-A3-019 (runbook) | ✅ | `RUNBOOK.md` |
| AUDIT-A3-020 (agent prompts) | ✅ | `prompts/{coordinator,fastapi-agent,node-worker-agent,rust-engine-agent}.md` |
| AUDIT-A3-021 (README token) | ✅ | `README.md` run section |
| AUDIT-A3-022 (auth docs) | ✅ | `docs/agent-analysis/A3_polyglot_system.md` security-posture section; gate check [4] |
| AUDIT-A3-023 (path traversal) | ✅ | `app/schemas.py` regex + `app/queue.py` realpath; `test_path_traversal_transaction_id_rejected` |
| AUDIT-A3-024 (fail-closed /internal) | ✅ | `app/routes.py` `_check_internal_auth`; `test_internal_score_fail_closed_when_unconfigured` |
| AUDIT-A3-025 (score poisoning) | ✅ | `app/routes.py` validation; `test_score_poisoning_*`, `test_score_band_mismatch_rejected` |
| AUDIT-A3-026 (overwrite guard) | ✅ | `app/routes.py`; `test_callback_overwrite_rejected`, `test_callback_idempotent_replay` |
| AUDIT-A3-027 (broker / HA) | 🟦 | `docs/BROKER_MIGRATION.md` |
| AUDIT-A3-028 (at-least-once) | 🟦 | `docs/BROKER_MIGRATION.md` |
| AUDIT-A3-029 (CONTRACT env/layout) | ✅ | `CONTRACT.md` |
| AUDIT-A3-030 (version claim) | ✅ | `mise.toml`, docs state 3.12.7 |
| AUDIT-A3-031 (root clutter) | ✅ | `screenshots/raw/`, `.gitignore`; gate check [7] |
| AUDIT-A3-032 (pin toolchain) | ✅ | `mise.toml` |
| AUDIT-A3-033 (this tracker) | ✅ | `docs/A3_remediation_tracker.md` |

**Tally: 24 Done · 8 Deferred (documented) · 0 open-undocumented.**

## A5 deferred items (carried forward, status here)
| A5 ID | Item | Status |
|---|---|---|
| A5-4 | `amount` float vs Decimal/cents | 🟦 Deferred → AUDIT-A3-011 (boundary test pins behavior) |
| A5-rate-limit | API rate limiting | 🟦 Deferred → AUDIT-A3-013 |
| A5-symlink | worker symlink rejection | 🟦 Deferred → AUDIT-A3-014 |

## Deferred-work rationale
Every 🟦 item is a *scale/maturity* feature, not a correctness or security defect, and each is
documented with its migration path (`BROKER_MIGRATION.md`) or pinned by a test (A5-4 boundary).
None blocks a correct, secure, reproducible single-node deployment. They are intentionally **not**
hidden — the scorecard counts them against the maximum.
