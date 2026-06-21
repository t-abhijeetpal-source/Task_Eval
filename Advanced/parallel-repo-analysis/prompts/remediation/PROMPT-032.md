# PROMPT-032 — Remediate performance findings (MED)

**Repo:** `$TARGET_REPO`. **Source:** `A1_performance.md` (PERF-1..PERF-6).

## Goal
Reduce avoidable runtime/DB overhead and establish a perf-regression signal, without a risky rewrite.

## Steps (by finding)
1. **PERF-2 (recent-search 3 writes/insert):** profile `RecentSearchDao.insertAndCheckMax`. Replace
   the per-insert `INSERT + count + deleteLast` with a single bounded operation (e.g. a trigger or a
   `DELETE ... WHERE id NOT IN (SELECT id ... ORDER BY ts DESC LIMIT 10)` run periodically). Keep the
   10-row cap behavior; add a test asserting the cap and the reduced op count.
2. **PERF-3 (missing indices):** add Room `@Index` on hot read columns (`stock_id`/`isin`) for
   `recently_viewed`, realised detail/summary, portfolio tables; confirm with `EXPLAIN QUERY PLAN`
   that scans become index lookups. Ship as a Room migration (bump schema version, export schema).
3. **PERF-1 (dual async stacks):** do **not** bulk-migrate. Pick Coroutines as the primary for new
   code, document the Rx boundary, and convert one hot path as a proof.
4. **PERF-4 (base-URL recompute):** cache resolved base URL/host (coordinate with PROMPT-029).
5. **PERF-5 (build/scale):** ensure Gradle configuration-cache + build-cache are enabled; record CI
   wall-time before/after.

## Acceptance
- Each change has a benchmark or test showing the improvement (op count, query plan, or timing) — no
  fabricated numbers.
- Room migration is tested (schema export + migration test); existing tests still pass in CI.
- `A1_performance.md` statuses updated with measured evidence.
