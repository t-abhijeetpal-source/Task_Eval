# A1 — Performance Review (Lane 8, optional)

**Agent:** A8 — Performance Analysis Agent
**Target:** `$TARGET_REPO (android-monorepo)` — equity vertical
**Date:** 2026-06-21
**Method:** Derived from the verified lane reports + master report (read-only). VERIFIED = cited
verified evidence; INFERRED = follows from a verified fact; UNVERIFIED = needs a live profile/build.
Legend: VERIFIED / INFERRED / UNVERIFIED.

## Findings (6)

| # | Severity | Finding | Evidence | Status |
|---|---|---|---|---|
| PERF-1 | MED | **Dual concurrency stacks (RxJava *and* Coroutines).** Both are dependencies and both are used (e.g. flow uses `Completable.mergeArrayDelayError`). Two schedulers/dispatchers in one process adds thread-pool overhead and context-switching, and complicates back-pressure reasoning. | `A1_architecture.md` / master stack (RxJava + Coroutines); `A1_flow_trace.md` (Rx merge) | VERIFIED (both present); cost INFERRED |
| PERF-2 | MED | **Recent-search write does 3 DB ops per insert.** `insertAndCheckMax` → `INSERT OR REPLACE` + `count` + conditional `deleteLast` (10-row cap) on every bookmark. On rapid input this is N×3 writes; a single windowed/`LIMIT`-based trigger or periodic trim would cut DB churn. | `A1_flow_trace.md` (`RecentSearchDao.insertAndCheckMax`, 10-row cap) | INFERRED |
| PERF-3 | MED | **Room cache has almost no secondary indices** (only one composite unique index on `kyc_status_data`). Read-heavy tables (`recently_viewed`, `portfolio_details`, realised detail/summary) queried by `stock_id`/`isin` may do table scans. | `A1_entities.md` (indices; 0 FK cache model) | INFERRED — confirm query plans |
| PERF-4 | LOW | **Large outbound API surface (78 interfaces, ~363 methods, 374 `@Url`).** Path/host assembly in the repository layer per call (string building) is cheap individually but worth caching base-URL/host resolution rather than recomputing per request. | `A1_api_map.md` (counts) | INFERRED |
| PERF-5 | LOW | **Build/scale:** 4,279 Kotlin + 2,350 Dart files across 36 modules. Module graph is reasonably sliced (`:common-database` is a leaf), but incremental build + CI time is a standing cost; ensure configuration-cache + build-cache are on. | `A1_inventory.md`/master (file + module counts) | VERIFIED (counts); build time UNVERIFIED |
| PERF-6 | LOW | **Coverage/jacoco flavor mismatch likely voids reports** (production-vs-development), so there is no reliable performance-regression signal from coverage-linked test runs either. | master Risk #2 | INFERRED |

## Recommendations (mapped to remediation)

1. **PERF-1** → PROMPT-032: pick one primary async stack for new code; document the Rx→Coroutines
   migration boundary so the two don't both grow.
2. **PERF-2/3** → PROMPT-032: batch/trim recent-search writes; add indices to the hot read columns
   (`stock_id`/`isin`) and confirm with `EXPLAIN QUERY PLAN`.
3. **PERF-5** → PROMPT-024/030: keep Gradle configuration-cache + build-cache enabled; track CI wall-time.

> Analysis-only; no target-repo code was modified.
