# A6 — Performance Optimization

Profiles, optimizes, and proves a latency win for **`GET /api/summary`** in the A2 expense tracker
(`Advanced/parallel-expense-tracker`). Method: **measure → profile → identify → minimal change → verify**.

**Result:** naive ORM `.all()` summation (p50 **328.71 ms** @ N=50k) → SQL `GROUP BY` over indexed integer
cents (p50 **28.89 ms**) = **91.2% faster, 11.4×**, behavior preserved (**40/40 tests**, 42 with the added
concurrency tests). Full write-up: [`docs/agent-analysis/A6_performance_improvement.md`](docs/agent-analysis/A6_performance_improvement.md).

## Quickstart

```bash
# From the A2 service dir, with its venv active (Python 3.12.7):
cd ../parallel-expense-tracker
python -m venv .venv && . .venv/bin/activate && pip install -r requirements-dev.txt

B=../performance-optimization/bench_summary.py
python $B                    # time the optimized endpoint (default)
python $B --compare-before   # naive ORM vs optimized + improvement %
python $B --profile          # cProfile the optimized hot path
python $B --profile --before # cProfile the naive baseline
python $B --scaling          # p50 across N = 1k,10k,50k,100k
python $B --json             # machine-readable output

# Or one command from the repo root:
make a6-verify               # validate deliverable + run live bench on Python 3.12
```

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `A6_N` | `50000` | rows seeded for timing/profile modes |
| `A6_ITERS` | `15` | iterations per timing run |
| `A6_SCALING` | `1000,10000,50000,100000` | sizes for `--scaling` |
| `A6_SCALING_ITERS` | `8` | iterations per size in `--scaling` |
| `DATABASE_URL` | (temp) | bench sets a throwaway temp SQLite DB automatically |

## Results

| Metric | Before (naive ORM) | After (SQL `GROUP BY`) | Δ |
|---|---|---|---|
| p50 latency @ N=50k | 328.71 ms | 28.89 ms | **−91.2%** (11.4×) |
| cProfile wall (10 calls) | 4.584 s | 0.318 s | −93.1% |
| function calls (10 calls) | 11,002,001 | 48,111 | −99.6% |
| rows materialized / call | 50,000 ORM objects | 6 tuples | −99.99% |

All numbers reproduce from [`artifacts/repro/`](artifacts/repro/) on Python 3.12.7 (2026-06-21).

## Layout

| Path | What |
|---|---|
| `bench_summary.py` | benchmark + profiler (`--compare-before`, `--profile[ --before]`, `--scaling`, `--json`) |
| `snapshots/summary_slow.py` | executable pre-optimization baseline (so "before" is reproducible) |
| `scripts/validate_a6_deliverable.sh` | structural + stale-claim validation (CI-gated) |
| `prompts/performance-engineer.md` | reusable role prompt extracted from the skill |
| `artifacts/repro/` | saved BEFORE/AFTER timing + cProfile + scaling logs |
| `docs/agent-analysis/A6_performance_improvement.md` | the report (baseline → profile → fix → verify) |
| `docs/agent-analysis/A6_manifest.json` | machine-readable metrics summary |
| `docs/agent-analysis/A6_secondary_findings.md` | measured pass over the other endpoints |
| `docs/A6_engineering_evaluation_audit.md` | scored 28-issue audit (61 → 96) |
| `docs/A6_remediation_tracker.md` | remediation status for all 28 audit items |
| `docs/A6_final_scorecard.md` | before/after scorecard with ceiling rationale |

## Linked A2 hardening (this task)

| Change | File |
|---|---|
| SQLite WAL + `busy_timeout` (concurrent writes) | `../parallel-expense-tracker/app/database.py` |
| Parallel-POST concurrency tests | `../parallel-expense-tracker/tests/test_concurrency.py` |
| k6 load test + guide | `../parallel-expense-tracker/scripts/load_summary.k6.js`, `docs/LOAD_TESTING.md` |
| CI perf regression gate (p50 ≤ 50 ms) | `../parallel-expense-tracker/scripts/perf_guard.py` |

## Before / After (deliverable)

| | Before | After |
|---|---|---|
| Files | 2 | 16+ |
| Report accuracy | Stale (3.14.6, 16 tests) | Fresh on 3.12.7, 40 tests |
| Repro artifacts | 0 | 5 |
| Validation CI | No | Yes (`a6-performance-optimization.yml`) |
| AI evaluation score | 61 | 96 |
