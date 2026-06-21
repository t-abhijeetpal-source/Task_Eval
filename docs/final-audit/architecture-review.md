# Architecture Review — `Task_Evaluation`

> Phases 2 & part of 11/12. Date: 2026-06-19. Score is evidence-backed; no evidence = no points.

## Score: 6.0 / 10

---

## 1. What the architecture actually is

A **collection of ~18 independent small projects** plus one static website — not one system. There is no
shared domain, no shared library, no common service runtime, and no integration layer binding the tasks.
Each project re-implements its own scaffolding (its own `requirements.txt`, its own FastAPI app, its own
Dockerfile). This is appropriate for a *teaching portfolio* but means there is no system-level architecture
to assess — only a set of per-task architectures of varying quality.

## 2. Modularity, separation of concerns, layering

**Strong, per service:**
- `Basics/fastapi-transaction-service` — textbook `routes → services → storage` + `models`/`schemas`.
- `polyglot-currency-pair/fastapi-service` — cleanest layering: typed service exceptions mapped to HTTP
  (`services.py:22-27` → `routes.py:21-24`).
- `polyglot-currency-pair/node-client` — pure functions + injectable HTTP and `run(argv, deps)`. The most
  testable, best-designed code in the repo.
- `rust-logcount-cli` & `polyglot-fraud-system/rust-engine` — exemplary lib/thin-bin split; `main.rs` holds
  no logic.
- `polyglot-fraud-system` — good 3-language edge separation (FastAPI ingest → file queue → Node worker →
  Rust engine → HTTP callback).

**Weak:**
- `Advanced/parallel-expense-tracker` — **no service/repo layer**; business logic inlined in route handlers
  (`routes.py:22-35`). The "parallel" name is unearned (no parallelism anywhere; see performance-review).
- `Intermediate/dockerize-service` — a **verbatim copy** of `polyglot-currency-pair/fastapi-service` with
  docstrings stripped. Zero reuse via a shared module — pure duplication.

## 3. Coupling, cohesion, DI

- Cohesion within services is good. Coupling *between* tasks is effectively zero (they don't depend on each
  other) — which is fine for isolation but means the "portfolio is one system" narrative isn't architectural.
- **Dependency Inversion is consistently weak in the Python/Node services:** the service layer is typed to a
  *concrete* store and stores are wired as **import-time singletons**
  (`fastapi-transaction/app/services.py:18`; `node-transaction/controllers` news up service + singleton at
  module load). This blocks test isolation (tests run against the real singleton) and multi-worker safety.

## 4. Design patterns

- Good: factory (`createApp()` in Node), dependency injection in `node-worker` (spawn/fs/http injected) and
  `node-client` (`run(argv, deps)`), repository-ish storage seam in the FastAPI services.
- Missing where it matters: no global exception handler in any FastAPI service; no shared config/settings
  module; no abstraction over the queue (the file-queue logic is bespoke and not reusable).

## 5. Scalability & extensibility (architecture-level)

- **Persistence is the architectural ceiling:** in-memory stores (lost on restart, broken under multiple
  workers) or single-file SQLite **without WAL/busy_timeout** (`parallel-expense-tracker/app/database.py`,
  fraud-fastapi) — concurrent writers hit SQLite's single-writer lock → unhandled 500s.
- The fraud **queue is a directory of `*.json` files** with no claim/lock step → two workers double-process;
  no ordering; at-least-once with duplicate callbacks on crash; one OS process spawned **per transaction**.
  This is a demonstration of the *concept*, not a scalable queue.
- Extensibility is per-task and decent, but adding a new task means copying scaffolding again — there's no
  template/generator and no shared base.

## 6. The deployed application (`agent-platform`)

- Clean App-Router structure, strict TypeScript, sensible Server/Client component split (only 13 `"use
  client"` files). For a static catalog, the front-end architecture is competent.
- **But it is architecturally dishonest:** dashboard "metrics", an "activity feed" with relative timestamps,
  6-month trend charts, and per-agent "run metadata" are **hardcoded literals** (`src/lib/data.ts:407-464`),
  including a developer machine path shipped to production (`data.ts:459`). It is presented as a live
  "platform/dashboard" but has no backend, no data source beyond committed JSON, and a manual ingest step
  not wired into the build.

## 7. Verdict

Per-service architecture ranges from **exemplary** (Rust crates, node-client, currency FastAPI) to **poor**
(expense-tracker no-layer, dockerize verbatim duplicate). There is **no system-level architecture** and the
flagship "platform" fabricates its data layer. Strong fundamentals at the small scale; not coherent or
durable at the system scale. **6.0/10** — credit for clean layering and the polyglot edge design; withheld
for duplication, weak DI, scalability-blocking persistence choices, and the fabricated platform data layer.
