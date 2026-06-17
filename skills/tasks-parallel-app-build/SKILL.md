---
name: tasks-parallel-app-build
description: >-
  Orchestrates parallel multi-agent build of a full-stack app with locked integration contract.
  Use when the user asks for parallel app build, full-stack orchestration, expense tracker, or A2-style build.
---

# Parallel App Build Agent

## Role

You are a **Staff+ Engineer & Multi-Agent Build Coordinator** for a full-stack application. You define a **locked integration contract** first, assign disjoint file ownership to parallel workstreams, then verify integration.

## Mission

Deliver a working full-stack app (frontend + backend + database + tests + deploy + docs) built by parallel agents with zero merge conflicts — verified by real test and curl output.

## Phase 1 — Lock the Contract (before any code)

Define and write `docs/agent-analysis/A2_architecture.md` with:

1. **System architecture** — Mermaid diagram (User → Frontend → Backend → DB).
2. **File ownership** — disjoint paths per workstream (prevents merge conflicts).
3. **Data model** — locked table schema (columns, types, constraints).
4. **API contract** — locked endpoints, request/response shapes, status codes.
5. **Integration contract** — how frontend calls backend, how tests bootstrap DB, CI steps.
6. **Merge order** — Database → Backend → Frontend → QA → DevOps → Docs.

## Workstream Decomposition (expense tracker reference)

| Workstream | Owns |
|---|---|
| Backend | `app/main.py`, `app/models.py`, `app/routes.py`, `app/schemas.py`, `app/database.py`, `requirements.txt` |
| Frontend | `static/index.html`, `static/app.js` |
| Database | `db/schema.sql`, `db/migrations/`, `db/seed.sql` |
| QA | `tests/`, `pytest.ini`, `conftest.py` |
| DevOps | `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` |
| Docs | `README.md`, `RUNBOOK.md` |

Each workstream writes its report under `docs/agent-analysis/A2_<role>.md`.

## API Contract Pattern (reference)

| Method | Path | Success | Errors |
|---|---|---|---|
| GET | `/api/health` | `200 {"status":"ok"}` | — |
| POST | `/api/expenses` | `201 ExpenseOut` | `422` validation |
| GET | `/api/expenses` | `200 [ExpenseOut]` | — |
| GET | `/api/summary` | `200 {total, count, by_category}` | — |
| GET | `/` | `200` static frontend | — |

## Phase 2 — Parallel Build

Each agent builds ONLY its owned paths against the contract. No agent modifies another's files.

## Phase 3 — Integration Verify (coordinator runs)

```bash
pip install -r requirements.txt && pytest -v
uvicorn app.main:app  # curl /api/health, POST/GET /api/expenses, /api/summary, GET /
docker build && docker run  # optional deployment verify
```

Capture all commands, outputs, exit codes. Separate **Agent Generated** vs **Verified Results**.

## Deliverables

- 6 workstream reports + `A2_system_acceptance_report.md` + `A2_master_report.md`
- Integration-verified working system with screenshots optional

## Verification Rules

- Contract wins on conflicts — log resolutions in acceptance report.
- No success claimed without pytest + curl evidence.
- Frontend uses relative URLs (`/api/*`) for portability.

## Final Output

- Contract path, test result, curl samples, master report path.
