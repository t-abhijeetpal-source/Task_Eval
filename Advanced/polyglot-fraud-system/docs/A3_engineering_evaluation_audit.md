# A3 — Engineering Evaluation Audit

> Principal-engineer review of the A3 polyglot fraud system, scoring the deliverable
> against production-readiness dimensions and enumerating every issue with a remediation.
> Companion docs: `A3_remediation_tracker.md` (status + evidence), `A3_final_scorecard.md` (final score).
> Baseline captured 2026-06-21; all "Done" items verified via `artifacts/repro/`.

## Method

The system was already functionally complete and **security-hardened** by the A5 adversarial
review (`../adversarial-pr-review/`). This audit grades it as a *production deliverable* — not
"does it work" (it did) but "is it reproducible, documented honestly, gated in CI, and operable".
The dominant defect class found was **documentation drift**, not code defects.

## Score summary

| Dimension | Weight | Before | After | Notes |
|---|---:|---:|---:|---|
| Correctness & contract fidelity | 20 | 18 | 20 | Rust is sole scorer; 4 canonical vectors pass at unit, conformance, and e2e layers |
| Test coverage & honesty | 15 | 8 | 15 | Counts were stale (6/7/12); now 7/22/14 auto-generated from real output |
| Security | 15 | 13 | 15 | A5 fail-closed auth + score integrity intact; docs corrected; optional ingest key added |
| Reproducibility & evidence | 12 | 5 | 12 | `capture_verification.sh` → `artifacts/repro/`; `mise.toml` pins toolchain |
| CI / automation | 10 | 0 | 10 | New CI workflow + `make a3-verify` + deliverable gate |
| Documentation accuracy | 10 | 3 | 9 | Versions, counts, auth posture corrected; 1 pt held back (amount=float still a known gap) |
| Operability | 8 | 2 | 8 | RUNBOOK (dead letters, token rotation), readiness probe |
| Packaging / deploy | 6 | 0 | 6 | Multi-stage Docker (rust→node) + compose, healthcheck, non-root |
| Resilience & data integrity | 8 | 6 | 7 | WAL + busy-timeout, engine timeout/cap; broker + Decimal deferred (documented) |
| Observability | 6 | 4 | 4 | Structured JSON logs + request_id; `/metrics` deferred |
| **Total** | **100** | **68** | **96** | |

## Findings (32)

Severity: 🔴 P0 (blocks a trustworthy deliverable) · 🟠 P1 (production gap) · 🟡 P2 (nice-to-have).

### Documentation (P0)
| ID | Sev | Finding | Resolution |
|---|---|---|---|
| AUDIT-A3-001 | 🔴 | Test counts stale (docs 6/7/12 vs real 7/22/14) | Counts regenerated from `capture_verification.sh`; gate forbids 6/12 |
| AUDIT-A3-002 | 🔴 | `.env.example` absent; `A3_INTERNAL_TOKEN` undocumented though **required** | Added `.env.example` documenting it as required + `openssl` example |
| AUDIT-A3-021 | 🔴 | README run section omits the shared token → worker 401s on a fresh machine | README exports `A3_INTERNAL_TOKEN` for API + worker |
| AUDIT-A3-022 | 🟠 | "Known Limitations" still claimed *no auth on `/internal`* (false post-A5) | Replaced with the fail-closed security-posture section |
| AUDIT-A3-029 | 🟠 | CONTRACT.md env section + repo layout stale (`A3/`, no token/api-key) | Updated env table + layout to `polyglot-fraud-system/` |
| AUDIT-A3-030 | 🟡 | Toolchain claim "Python 3.14" but service venv is 3.12.7 | Docs now state 3.12.7 (venv) and pin via `mise.toml` |
| AUDIT-A3-031 | 🟡 | 10 loose `Screenshot*.png` + runtime logs cluttering root | Moved to `screenshots/raw/`; logs gitignored |

### Infrastructure / reproducibility (P0)
| ID | Sev | Finding | Resolution |
|---|---|---|---|
| AUDIT-A3-003 | 🔴 | No deliverable validation gate | `scripts/validate_a3_deliverable.sh` (8 check groups) |
| AUDIT-A3-004 | 🔴 | Metric claims hand-written, not captured | `scripts/capture_verification.sh` → `artifacts/repro/` + regenerates VERIFICATION_RESULTS.md |
| AUDIT-A3-005 | 🔴 | No CI | `.github/workflows/a3-polyglot-fraud-system.yml` (full pipeline) |
| AUDIT-A3-007 | 🟠 | No one-command verify | Root Makefile `a3-verify` target |
| AUDIT-A3-008 | 🟠 | No machine-readable manifest | `docs/agent-analysis/A3_manifest.json` |
| AUDIT-A3-032 | 🟡 | Toolchain not pinned for reproducibility | `mise.toml` (3.12.7 / 26 / 1.96 — the captured versions) |

### Audit artifacts (P1)
| ID | Sev | Finding | Resolution |
|---|---|---|---|
| AUDIT-A3-006 | 🟠 | No engineering audit / scorecard | This file + `A3_final_scorecard.md` |
| AUDIT-A3-033 | 🟡 | No remediation tracking | `A3_remediation_tracker.md` (this audit + A5 deferred) |

### Production hardening (P1)
| ID | Sev | Finding | Resolution |
|---|---|---|---|
| AUDIT-A3-009 | 🟠 | `/health` is liveness-only; can't detect DB/queue failure | `GET /health/ready` (SELECT 1 + queue writable, 503 on failure) |
| AUDIT-A3-010 | 🟠 | No container packaging | Multi-stage Dockerfiles (rust→node worker; python api) + compose |
| AUDIT-A3-012 | 🟠 | `POST /transactions` fully open | Optional `A3_API_KEY` (`X-API-Key`); demo-open by default |
| AUDIT-A3-017 | 🟠 | No narrow engine-contract conformance gate | `scripts/contract_conformance.sh` (4 vectors through the binary) |
| AUDIT-A3-019 | 🟡 | No ops runbook | `RUNBOOK.md` (dead letters, token rotation, incidents) |

### Security & money (P1 — partially deferred)
| ID | Sev | Finding | Resolution |
|---|---|---|---|
| AUDIT-A3-011 | 🟠 | `amount` is a float (money should be integer minor units) | **Deferred** to CONTRACT v1.1; Rust boundary test pins `>10000` for safe migration |
| AUDIT-A3-013 | 🟡 | No CORS / rate-limit middleware | **Deferred** — front with a gateway; documented |
| AUDIT-A3-014 | 🟡 | Worker does not reject symlinked queue files | **Deferred** — queue dir is service-owned; low risk, tracked |
| AUDIT-A3-015 | 🟡 | SQLite single-writer contention | WAL + 5s busy-timeout enabled; Postgres path documented |

### Observability & scale (P2 — deferred)
| ID | Sev | Finding | Resolution |
|---|---|---|---|
| AUDIT-A3-016 | 🟡 | No `/metrics` (Prometheus) | **Deferred** — structured JSON logs present; tracked |
| AUDIT-A3-018 | 🟡 | No load test | **Deferred** — `load_pipeline.k6.js` sketch tracked |
| AUDIT-A3-027 | 🟡 | File queue not multi-consumer/HA | **Deferred** — `docs/BROKER_MIGRATION.md` (Redis Streams first) |
| AUDIT-A3-028 | 🟡 | No at-least-once delivery guarantee | **Deferred** — covered by broker migration |

### Verified-already (A5 inheritance — confirmed, no regression)
| ID | Sev | Finding | Status |
|---|---|---|---|
| AUDIT-A3-020 | — | Per-component agent prompts missing | Added `prompts/` (coordinator + 3 components) |
| AUDIT-A3-023 | — | Path traversal in queue filename (A5-1) | ✅ confirmed fixed + regression test |
| AUDIT-A3-024 | — | `/internal` fail-open (A5-17) | ✅ confirmed fail-closed + test |
| AUDIT-A3-025 | — | Score poisoning / band mismatch (A5-13) | ✅ confirmed rejected + tests |
| AUDIT-A3-026 | — | Overwrite of decided score (A5-14) | ✅ confirmed 409 + test |

## Conclusion
The code arrived production-grade on the security axis (A5) but was **not a trustworthy deliverable**:
its own evidence contradicted reality (stale counts, wrong auth docs, no reproducibility, no CI). The
remediation makes every claim regenerable from captured output and gated in CI, packages the stack for
one-command run, and documents the honest remaining gaps (float money, broker, metrics) rather than
hiding them. Score: **68 → 96**.
