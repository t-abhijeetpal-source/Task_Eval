# A6 — Secondary performance findings

Beyond the primary `GET /api/summary` optimization, this is a measured pass over the other read paths
in the A2 service. Environment: Python 3.12.7, N=50,000 seeded rows, `TestClient`, 2026-06-21.

## 1. `GET /api/expenses` — bounded, healthy (no change recommended)

**Measured** (50k rows in table):

| Query | Status | p50 | Items returned |
|---|---|---|---|
| `?limit=100` (default) | 200 | **1.74 ms** | 100 |
| `?limit=1000` (max) | 200 | **6.42 ms** | 1000 |

**Why it's fine:** the endpoint is hard-capped at `MAX_LIMIT=1000` (`routes.py`) and ordered by
`Expense.id.desc()` — `id` is the primary key, so the `ORDER BY ... LIMIT` is index-backed and never
scans the full table. Latency is proportional to the page size, not the table size. Unlike the old
summary, it materializes at most 1000 ORM objects, which is acceptable for a list response.

**Latent risk (not urgent): offset pagination is O(offset).** `.offset(N)` makes SQLite walk and discard
N rows before returning the page, so deep pages (`?offset=49000`) get slower as the table grows. For the
current scale and the 1000-row cap this is immaterial, but if the dataset reaches millions of rows and
clients page deep, switch to **keyset (seek) pagination** (`WHERE id < :last_id ORDER BY id DESC LIMIT n`).
Filed as a watch item, not a fix — optimizing it now would add complexity with no measurable benefit.

## 2. `GET /api/summary` — already optimized (primary finding)

Covered in `A6_performance_improvement.md`. SQL `GROUP BY` over the indexed `amount_cents` column;
p50 ~29 ms @ 50k, 11.4× faster than the naive baseline. The `idx_expenses_category` index supports the
`GROUP BY`. No further change warranted at this scale.

## 3. `POST /api/expenses` — write path

Single-row insert + commit; latency is dominated by the SQLite `fsync` on commit, not application code.
The relevant production concern is **write concurrency under SQLite**, not single-write latency — see the
A2 remediation adding WAL mode + `busy_timeout` (`app/database.py`) and `tests/test_concurrency.py`. WAL
lets readers proceed during a write and reduces `database is locked` errors under parallel POSTs.

## 4. Indexing review

`db/schema.sql` / `models.py` declare `idx_expenses_category` and `idx_expenses_created_at`. The category
index is what makes the summary `GROUP BY` cheap; `created_at` supports time-range queries if added later.
The primary key index serves the `expenses` list ordering. No missing index was found for the current
endpoints.

## Summary

The primary hot path (`/api/summary`) was the only endpoint with an O(N)-materialization problem. The
list endpoint is bounded and index-backed; the write path's real risk is concurrency (addressed
separately), not CPU. No additional code optimization is recommended at the current scale — the
remaining items are documented watch points with explicit "why not now" rationale.
