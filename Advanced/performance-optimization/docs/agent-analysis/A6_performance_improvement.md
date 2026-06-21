# A6 — Performance Profiling & Targeted Optimization

> **Target:** `GET /api/summary` in the A2 Expense Tracker (`Advanced/parallel-expense-tracker/app/routes.py`).
> **Method:** measure → profile → identify → minimal change → verify (never optimize on intuition).
> **Result:** **91.2% latency reduction** (328.71 ms → 28.89 ms p50 at N=50k, **11.4× faster**) from a
> single-function change (SQL `GROUP BY` over indexed integer cents), behavior preserved (**40/40 tests**).
> **Environment:** Python **3.12.7**, FastAPI + SQLAlchemy 2, SQLite (temp file), `TestClient`. Date: **2026-06-21**.

All numbers below are reproduced from `artifacts/repro/` on the stated environment. Run `make a6-verify`
(repo root) or the commands in each section to regenerate.

---

## 1. Baseline Results

**Input size:** N = 50,000 expenses across 6 categories. **Iterations:** 15.
**Command:**
```bash
cd Advanced/parallel-expense-tracker && . .venv/bin/activate
python ../performance-optimization/bench_summary.py --compare-before
```
**Output** (`artifacts/repro/BEFORE_baseline.txt`):
```text
env: python=3.12.7  N=50000  iters=15  db=sqlite(temp)
correctness (slow == fast): count=50000  total=12550000.00

BEFORE (naive ORM .all() + Python sum)  p50 = 328.71 ms  (min 320.51, mean 331.46, max 348.54)
AFTER  (SQL GROUP BY over amount_cents)  p50 = 28.89 ms  (min 28.25, mean 28.82, max 29.30)

improvement: 91.2%   speedup: 11.4x   (N=50000)
```
The "BEFORE" path is the pre-optimization code, preserved as an executable snapshot at
`snapshots/summary_slow.py` so the delta is measured on the **same machine and Python version** —
not quoted from a different run. ~329 ms for a 6-number summary, and it grows linearly with row count
(see the scaling table in §7).

The optimized endpoint, measured end-to-end through `TestClient` (`artifacts/repro/AFTER_optimized.txt`):
```text
/api/summary latency over 15 runs (N=50000):
  min = 29.99 ms   p50 = 30.65 ms   p95 = 31.50 ms   max = 32.20 ms   mean = 30.75 ms
```
(The ~2 ms gap vs the 28.89 ms function-level number is HTTP/serialization overhead, not aggregation.)

## 2. Profiling Evidence

**Command:** `python ../performance-optimization/bench_summary.py --profile --before` (cProfile, 10 calls)
**Output — BEFORE, top by `tottime`** (`artifacts/repro/cProfile_before.txt`):
```text
         11002001 function calls (11001981 primitive calls) in 4.584 seconds
   ncalls  tottime  cumtime  filename:lineno(function)
   500000    1.403    1.403   sqlalchemy/orm/state.py:201(__init__)            <-- ORM state per row
   500000    0.503    2.639   sqlalchemy/orm/loading.py:1068(_instance)        <-- ORM row -> object
       10    0.412    0.412   {method 'fetchall' of 'sqlite3.Cursor'}          <-- raw SQL: only 0.41s
   500000    0.252    0.252   sqlalchemy/orm/loading.py:1329(_populate_full)
   500000    0.247    1.740   sqlalchemy/orm/instrumentation.py:501(new_instance)
  2000000    0.223    0.223   sqlalchemy/orm/attributes.py:555(__get__)        <-- 2M instrumented reads
       10    0.184    4.436   snapshots/summary_slow.py:20(summary_slow)       <-- the slow path
  1000000    0.126    0.238   app/models.py:34(amount)                          <-- 1M .amount property calls
```
**Command:** `python ../performance-optimization/bench_summary.py --profile` (optimized endpoint)
**Output — AFTER** (`artifacts/repro/cProfile_after.txt`):
```text
         48111 function calls (47124 primitive calls) in 0.318 seconds
   ncalls  tottime  cumtime  filename:lineno(function)
       10    0.243    0.243   {method 'fetchall' of 'sqlite3.Cursor'}
       10    0.051    0.051   {method 'execute' of 'sqlite3.Cursor'}
   (no orm/loading, orm/state, or attributes.__get__ in the hot path)
```

## 3. Bottleneck Analysis

* **Single highest-impact bottleneck:** ORM **object materialization**, not the database.
  The naive `summary` did `db.query(Expense).all()`, hydrating **every** row into a fully-instrumented
  `Expense` ORM object before Python summed them. For 50k rows × 10 calls that is 500,000 `_instance`
  / `state.__init__` constructions, **2,000,000** instrumented `attributes.__get__` reads, and
  **1,000,000** `.amount` property invocations (`.amount` + `.category` per row, twice).
* **Why it's expensive:** building SQLAlchemy ORM objects (identity map, state, instrumentation) costs
  ~100× more than reading scalar values. The actual SQL (`fetchall`) is only **0.41 s of 4.58 s (~9%)**;
  ~90% is Python-side hydration + attribute access. It also transfers all N rows over the cursor and
  scales **O(N)**.
* **Why it matters:** a dashboard "summary" call blocks ~330 ms and degrades linearly as the table fills
  — a latent latency/throughput incident.
* **Expected gain:** pushing the aggregation into SQL (`GROUP BY`) returns **one row per category** (6)
  instead of 50,000 objects, eliminating hydration entirely → confirmed order-of-magnitude win.

## 4. Code Change

Minimal, single-function change — no architecture, schema, or dependency change.
**File:** `Advanced/parallel-expense-tracker/app/routes.py`
```diff
+from sqlalchemy import func
 ...
 @router.get("/summary", response_model=Summary)
 def summary(db: Session = Depends(get_db)):
-    expenses = db.query(Expense).all()
-    total = sum(e.amount for e in expenses)
-    by_category: dict = {}
-    for e in expenses:
-        by_category[e.category] = by_category.get(e.category, 0) + e.amount
-    return Summary(total=total, count=len(expenses), by_category=by_category)
+    rows = (
+        db.query(
+            Expense.category,
+            func.sum(Expense.amount_cents),
+            func.count(Expense.id),
+        )
+        .group_by(Expense.category)
+        .all()
+    )
+    by_category = {cat: cents / 100 for cat, cents, _ in rows}
+    total_cents = sum(cents for _, cents, _ in rows)
+    count = sum(cat_count for _, _, cat_count in rows)
+    return Summary(total=total_cents / 100, count=count, by_category=by_category)
```
Querying columns (not the entity) returns lightweight tuples, so no ORM objects are built; the DB does
the sum/count/group. Aggregation is over the **INTEGER `amount_cents`** column (indexed) — exact, no float
drift — and converted to a 2-decimal number once at the boundary.

## 5. Before / After Metrics

| Metric | Before | After | Δ |
|---|---|---|---|
| p50 latency (function-level, N=50k) | 328.71 ms | 28.89 ms | **−91.2%** (11.4× faster) |
| p50 latency (endpoint, TestClient) | — | 30.65 ms | — |
| cProfile wall (10 calls) | 4.584 s | 0.318 s | **−93.1%** |
| Function calls (10 calls) | 11,002,001 | 48,111 | **−99.6%** (229× fewer) |
| Rows materialized per call | 50,000 ORM objects | 6 tuples | −99.99% |

Improvement % = (328.71 − 28.89) / 328.71 = **91.2%**.

## 6. Risk Assessment

**Low.** One function + one import; the API contract (`Summary{total,count,by_category}`) is unchanged.
* **Numeric equivalence:** the benchmark asserts the slow and fast paths return **identical** numbers
  (`count=50000, total=12550000.00`) every run, and asserts integer-cent exactness
  (`round(total*100) == Σ amount_cents`) — no float drift.
* **Empty table:** `GROUP BY` returns no rows → `by_category={}`, `total=0.0`, `count=0` — covered by an
  existing empty-summary test (green).
* **Money type:** aggregation is over INTEGER cents, so this change *improved* numeric integrity vs the
  former float column (the float-money concern raised in A5 is fully resolved here).

## 7. Scaling Evidence (O(N) divergence)

**Command:** `python ../performance-optimization/bench_summary.py --scaling` (`artifacts/repro/scaling.txt`)

| N | before p50 (ms) | after p50 (ms) | speedup |
|---|---|---|---|
| 1,000 | 3.73 | 0.50 | 7.5× |
| 10,000 | 52.03 | 4.24 | 12.3× |
| 50,000 | 331.96 | 28.91 | 11.5× |
| 100,000 | 676.94 | 60.20 | 11.2× |

The naive path grows roughly linearly (3.73 → 677 ms, ~180× over 100× more rows); the optimized path
also grows (the DB still scans the rows to aggregate) but stays an order of magnitude lower at every
size. The win is structural, not a constant factor.

## 8. Behavior Verification

```text
$ python -m pytest -q          # full A2 suite
40 passed, 1 warning in 0.54s
```
Plus the benchmark's built-in correctness assertions (slow == fast, exact integer cents) pass on every
run. A CI **perf gate** (`scripts/perf_guard.py`, p50 ≤ 50 ms ceiling) fails the build if the
optimization ever regresses.

---

## Agent vs Verified

* **Hypothesis (pre-measurement):** "the summary is slow because it loads all rows." — direction right,
  but intuition is not evidence.
* **Verified bottleneck (cProfile):** ORM **object materialization** (`orm/state.__init__` 1.403 s tottime,
  2,000,000 `attributes.__get__`), not the SQL (`fetchall` only 0.41 s / ~9%).
* **Suggested optimization:** replace `query(Expense).all()` + Python loop with a SQL `GROUP BY`.
* **Verified optimization:** measured **91.2%** p50 reduction (328.71 → 28.89 ms), 229× fewer function
  calls; **40/40 tests pass**, output numerically identical.

## Completion Criteria
- [x] Baseline measured (p50 328.71 ms, N=50k, Python 3.12.7)
- [x] Profiling completed (cProfile — ORM hydration hotspot, before & after)
- [x] Bottleneck identified (object materialization, not SQL)
- [x] Small change implemented (1 function + 1 import, SQL `GROUP BY` over integer cents)
- [x] Improvement measured (−91.2% p50, −93.1% profile wall, 11.4×)
- [x] Tests passed (40/40)
- [x] Scaling characterized (1k–100k)
- [x] Reproduction artifacts saved (`artifacts/repro/`)

---
<!-- HISTORICAL -->
## Appendix — Historical run (superseded)

> Preserved for provenance only. **Not** the current environment. The first A6 pass was captured on
> **2026-06-17, Python 3.14.6**, when the codebase still used a float `amount` column and a 16-test suite:
> baseline p50 **278.64 ms** → optimized **20.26 ms** (−92.7%), 16/16 tests. The numbers differ from the
> active report above because the Python version, the money column type (float → integer cents), and the
> test count (16 → 40) have all since changed. Current canonical numbers are in §1–§8, sourced from
> `artifacts/repro/` on Python 3.12.7.
