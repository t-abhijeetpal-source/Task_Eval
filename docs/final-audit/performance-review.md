# Performance Review — `Task_Evaluation`

> Phase 5. Date: 2026-06-19.

## Score: 5.0 / 10

---

## 1. The one genuine, high-quality result

`Advanced/performance-optimization` is the strongest engineering artifact in the repo. It optimizes
`GET /api/summary` in the expense tracker using a correct, disciplined method (**measure → profile →
identify → minimal change → verify**):

- **Baseline:** ~278 ms p50 at N=50k (`A6_performance_improvement.md`), captured via a real benchmark
  harness (`bench_summary.py`) that seeds a temp SQLite DB and times the endpoint over 15 runs.
- **Profiling evidence (cProfile):** the bottleneck is **ORM object materialization**, not the DB —
  `db.query(Expense).all()` hydrates every row (500k `_instance` constructions, 2M instrumented attribute
  reads); the actual SQL `fetchall` is only ~8% of runtime.
- **Fix:** replace Python-side aggregation with a DB-side `GROUP BY` aggregation (~10-line change),
  behavior preserved (16/16 tests).
- **Result:** ~278 ms → ~20 ms (**−92.7%**), and it removes the O(N) row-transfer ceiling.

This is real, classic, correctly-diagnosed optimization work and deserves full credit on its own.
**Caveat:** the evidence was captured under **Python 3.14.6**, off the repo's pinned 3.12.7 toolchain
(`mise.toml`) — an environment-fidelity inconsistency.

## 2. System-level performance: largely unaddressed

- **SQLite single-writer lock:** `parallel-expense-tracker/app/database.py` sets `check_same_thread=False`
  but **no WAL, no `busy_timeout`**, default rollback journal. FastAPI dispatches sync handlers on a
  threadpool → concurrent POSTs serialize on SQLite's single writer → `database is locked` → unhandled 500.
  There are **zero concurrency/load tests**, and the "parallel" name is unearned.
- **Fraud queue throughput:** one **OS process spawned per transaction** (Rust engine via `spawn`), file-
  based queue with `readdir` ordering, no batching. Fine as a demo; it will not sustain throughput.
- **No engine timeout** in `node-worker` (`worker.js:82-152`) — a hung engine blocks the worker indefinitely;
  a latent availability/throughput failure mode.
- **No caching layer** anywhere (no Redis, no in-process memoization, no HTTP cache headers).

## 3. Frontend / bundle (deployed app)

- Mostly Server Components; only 13 `"use client"` files — good.
- **Concern:** a **680 KB content JSON is statically imported** in `src/lib/data.ts:1`, which is also
  imported by client components (e.g. `command-palette.tsx`) — risk of large agent content landing in the
  client bundle. No code-splitting of that payload.
- `recharts` + `framer-motion` are heavy deps for largely decorative animation.
- No `next/image` usage, but the app uses no raster content images either, so not a real issue.
- No Lighthouse/Web-Vitals measurement captured.

## 4. What's missing for a performance claim at system scale

No load testing (k6/Locust/wrk), no p99 SLOs, no connection pooling story for the real DB
(`DATABASE_URL` points at Postgres but services run SQLite in practice), no horizontal-scale validation, no
profiling beyond the single A6 endpoint.

## 5. Verdict

One excellent, profiled, verified optimization — but it is a **single endpoint in a single service**. The
broader system carries known, untested performance/concurrency failure modes (SQLite lock, per-txn process
spawn, no timeouts, no caching) and no load testing. **5.0/10** — the A6 work pulls the score up from what
would otherwise be a 3–4.
