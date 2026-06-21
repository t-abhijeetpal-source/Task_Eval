# A6 — Remediation Tracker

Tracks every `AUDIT-A6-NNN` item from `A6_engineering_evaluation_audit.md` to closure. Date: 2026-06-21.
**28/28 resolved.** Evidence column points at the file or command that proves the fix.

| ID | Sev | Issue | Status | Evidence |
|---|---|---|---|---|
| AUDIT-A6-001 | High | No A6 README | ✅ Done | `README.md` |
| AUDIT-A6-002 | High | No validation script | ✅ Done | `scripts/validate_a6_deliverable.sh` (exit 0) |
| AUDIT-A6-003 | High | No pre-optimization snapshot | ✅ Done | `snapshots/summary_slow.py` |
| AUDIT-A6-004 | Med | No prompt extraction | ✅ Done | `prompts/performance-engineer.md` |
| AUDIT-A6-005 | Med | No artifacts dir | ✅ Done | `artifacts/repro/` |
| AUDIT-A6-006 | Low | Only 2 files | ✅ Done | 16+ files now (see `README.md` table) |
| AUDIT-A6-007 | Critical | Report said Python 3.14.6 | ✅ Done | report §header now 3.12.7; historical 3.14 isolated under `<!-- HISTORICAL -->` |
| AUDIT-A6-008 | Critical | Report said 16/16 tests | ✅ Done | report §8 "40 passed"; live `pytest -q` = 40 (42 with concurrency) |
| AUDIT-A6-009 | High | Unreproducible before/after | ✅ Done | `artifacts/repro/BEFORE_baseline.txt` + `AFTER_optimized.txt` |
| AUDIT-A6-010 | High | Diff showed `amount` not `amount_cents` | ✅ Done | report §4 diff corrected to `amount_cents` |
| AUDIT-A6-011 | Med | Historical vs current mixed | ✅ Done | report appendix clearly labels superseded 2026-06-17 run |
| AUDIT-A6-012 | Med | Improvement % from stale numbers | ✅ Done | report §5: 91.2% derived from saved artifacts |
| AUDIT-A6-013 | Low | No scaling evidence | ✅ Done | report §7 table + `artifacts/repro/scaling.txt` |
| AUDIT-A6-014 | Critical | No saved bench logs | ✅ Done | `artifacts/repro/{BEFORE,AFTER}*.txt` |
| AUDIT-A6-015 | High | No saved cProfile | ✅ Done | `artifacts/repro/cProfile_{before,after}.txt` |
| AUDIT-A6-016 | High | Cannot regenerate "before" | ✅ Done | `--compare-before` runs `snapshots/summary_slow.py` live |
| AUDIT-A6-017 | Med | No compare mode | ✅ Done | `bench_summary.py --compare-before` |
| AUDIT-A6-018 | Med | No JSON output | ✅ Done | `bench_summary.py --json`; feeds `A6_manifest.json` |
| AUDIT-A6-019 | Low | No repro README | ✅ Done | `artifacts/repro/README.md` |
| AUDIT-A6-020 | Med | Stale docstring paths | ✅ Done | `bench_summary.py` docstring uses real `Advanced/...` paths |
| AUDIT-A6-021 | Med | Temp DB leak | ✅ Done | `atexit`-registered `_cleanup_tmp` in `bench_summary.py` |
| AUDIT-A6-022 | Med | No integer-cent assertion | ✅ Done | `_assert_correct()` checks `round(total*100)==Σcents` |
| AUDIT-A6-023 | Low | No scaling mode | ✅ Done | `bench_summary.py --scaling` |
| AUDIT-A6-024 | High | No A6 CI | ✅ Done | `.github/workflows/a6-performance-optimization.yml` |
| AUDIT-A6-025 | Med | No make target | ✅ Done | root `Makefile` `a6-verify` |
| AUDIT-A6-026 | Med | Perf gate no warn band/JSON | ✅ Done | `perf_guard.py` ceiling 50ms, warn 40ms, `--json` |
| AUDIT-A6-027 | High | No SQLite WAL / concurrency test | ✅ Done | `app/database.py` WAL+busy_timeout; `tests/test_concurrency.py` (2 tests pass) |
| AUDIT-A6-028 | Med | No load test | ✅ Done | `scripts/load_summary.k6.js` + `docs/LOAD_TESTING.md` |

## Verification commands

```bash
# A6 deliverable (structure + stale-claim scan + bench modes)
bash Advanced/performance-optimization/scripts/validate_a6_deliverable.sh   # -> exit 0

# Full A6 verify (validation + live bench on Python 3.12)
make a6-verify                                                              # -> exit 0

# A2 behavior preserved + perf gate
make a2-verify                                                             # -> 42 passed, perf OK
```
