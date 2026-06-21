# A4 Engineering Evaluation Audit — Task_Eval Monorepo

> **Role:** Principal Engineer · Staff Software Architect · Engineering Manager · AI Evaluation Judge  
> **Target:** `Task_Eval` (`/Users/abhijeetpal/Desktop/workspace/Tasks`, branch `main`)  
> **Scope:** Full repository — 24 tasks, `agent-platform`, DevOps demos, `skills/`  
> **Date:** 2026-06-21  
> **Method:** 12-vector modernization scan + independent re-verification (tests run, CI read, grep evidence)  
> **Prior audit baseline:** `docs/final-audit/final-scorecard.md` (2026-06-19 @ `3967009`)

---

## Executive Summary

| Metric | Score | Grade |
|---|---|---|
| **Overall Project Score** | **62 / 100** | C− (Weak — significant improvements required) |
| Engineering Quality | 66 / 100 | Improved DX + partial CI expansion since June 19 |
| Production Readiness | 50 / 100 | Still not deployable as a unified product |
| Deployment Readiness | 48 / 100 | `push:false`; no registry; disconnected infra |
| Security | 55 / 100 | Fail-closed `/internal` fixed; auth/CORS still absent |
| Maintainability | 67 / 100 | Strong docs; duplication and float-money remain |

**Production Status: 🔴 NOT READY** — appropriate for a capability portfolio; fails strict production gate.

**Delta since 2026-06-19 audit (+2 overall):** task-scoped CI workflows added (A2, A6, I1, I3, A1, dockerize); A3 internal callback now fail-closed; A2 SQLite WAL/busy_timeout; A3 integration script repaired; node-worker engine timeout tests added. **Headline gaps remain:** no monorepo-wide CI, zero `agent-platform` gates, no coverage enforcement, no auth baseline.

---

## Category Scorecard

| Category | Score | Weight | Weighted | Δ vs Jun-19 |
|---|---|---|---|---|
| Architecture | 6.0 | 10% | 0.60 | — |
| Code Quality | 6.2 | 15% | 0.93 | +0.3 (A3 auth, A2 WAL) |
| Testing | 6.2 | 15% | 0.93 | +0.2 (104 cases; CI partial) |
| Performance | 5.5 | 10% | 0.55 | +0.5 (A2 WAL; A6 gated) |
| Security | 5.5 | 15% | 0.83 | +0.5 (fail-closed internal) |
| DevOps | 5.0 | 10% | 0.50 | — |
| CI/CD | 5.0 | 10% | 0.50 | +1.0 (7 workflows vs 1) |
| Observability | 5.0 | 5% | 0.25 | — |
| Documentation | 8.0 | 5% | 0.40 | — |
| Developer Experience | 8.5 | 5% | 0.43 | +0.5 (expanded Makefile) |
| Production Readiness | 4.5 | 10% | 0.45 | +0.5 |
| **TOTAL** | | **100%** | **6.17 / 10** | **62/100** |

---

## Repository Reality Check

This is a **polyglot capability portfolio** (~5,900 LOC hand-written across ~121 source files), not a single deployable product. ~8 tasks are markdown-only analysis deliverables (including this `repo-modernization` folder). One Next.js site (`agent-platform`) is deployed to Vercel; infra tasks are isolated demos.

**Verified 2026-06-21:** `make rust` → 13/13 pass; `make node` → 30/30 pass (14 worker + 7 B5 + 9 I4); `make python` → all green; `npm audit` on agent-platform → 2 moderate (PostCSS via Next.js).

---

## Findings Register

Each finding includes: **ID**, dimension, evidence, **why it loses points**, **score impact**, **priority**, **remediation prompt**.

### CRITICAL / P0 (blocks production gate)

---

#### F-001 — No monorepo-wide CI enforcing `make test`

| Field | Value |
|---|---|
| **Dimension** | CI/CD · Testing |
| **Evidence** | Root `.github/workflows/ci.yml:16` scopes to `DevOps-Infra/ci-pipeline` only (5 tests). Task workflows (`a2-*`, `a6-*`, `i1-*`, `i3-*`, `a1-*`, `dockerize-service.yml`) are **path-filtered** — Rust/Node/Basics Python never run on unrelated PRs. No workflow invokes `make test`, `make rust`, or `make node`. |
| **Why it loses points** | README badge "85 passing" is not an automated regression gate. A change to `Basics/node-transaction-service` can merge with zero CI. Evaluators penalize **claim vs enforcement mismatch**. |
| **Score impact** | CI/CD −2.0 · Testing −1.5 · **Total −3.5** |
| **Priority** | P0 |
| **Prompt** | `prompts/remediation/PROMPT-001-monorepo-ci-gate.md` |

---

#### F-002 — Deployed `agent-platform` has zero CI, zero tests, zero observability

| Field | Value |
|---|---|
| **Dimension** | Testing · Production Readiness · Observability |
| **Evidence** | No workflow references `agent-platform/`. `next.config.ts` is empty `{}`. No `*.test.ts(x)` under agent-platform. No `error.tsx`/`loading.tsx`. |
| **Why it loses points** | The **live public URL** is the portfolio's front door — untested deploys are the highest-severity gap for a "shipped product" narrative. |
| **Score impact** | Production Readiness −2.0 · Testing −1.5 · CI/CD −1.0 · **Total −4.5** |
| **Priority** | P0 |
| **Prompt** | `prompts/remediation/PROMPT-002-agent-platform-ci-tests.md` |

---

#### F-003 — Agent-platform fabricates "live" metrics and leaks developer paths

| Field | Value |
|---|---|
| **Dimension** | Architecture · Production Readiness · Security |
| **Evidence** | `agent-platform/src/lib/data.ts:459` — hardcoded `/Users/abhijeetpal/Desktop/workspace/android-monorepo`. Dashboard metrics, activity feed, trend charts are static literals (`data.ts:407+`), presented as operational data on the live site. |
| **Why it loses points** | **Architectural dishonesty** — evaluators treat fabricated production metrics as integrity failure, not cosmetic. Path leak is LOW security but HIGH trust penalty. |
| **Score impact** | Production Readiness −1.5 · Architecture −1.0 · Security −0.5 · **Total −3.0** |
| **Priority** | P0 |
| **Prompt** | `prompts/remediation/PROMPT-003-agent-platform-data-integrity.md` |

---

#### F-004 — No authentication, CORS, or rate limiting on public services

| Field | Value |
|---|---|
| **Dimension** | Security |
| **Evidence** | Grep across service source: only `Intermediate/dockerize-service` implements CORS + rate limit + security headers. `Basics/fastapi-transaction-service`, `Advanced/parallel-expense-tracker`, `Advanced/polyglot-fraud-system`, `Intermediate/bug-diagnosis` — none. Express Node services: no `helmet`. |
| **Why it loses points** | OWASP A01/A07 — any public endpoint is unauthenticated and unthrottled. Standard production gate failure. |
| **Score impact** | Security −2.5 · Production Readiness −1.0 · **Total −3.5** |
| **Priority** | P0 |
| **Prompt** | `prompts/remediation/PROMPT-004-service-security-baseline.md` |

---

### HIGH / P1

---

#### F-005 — Float-for-money and non-finite amount acceptance

| Field | Value |
|---|---|
| **Dimension** | Code Quality · Correctness |
| **Evidence** | `polyglot-fraud-system/fastapi-service/app/schemas.py:11` — `amount: float`. `bug-diagnosis/app/schemas.py:9` — `price: float`. B4 validates 2dp but still stores float. Pydantic float fields accept `inf`/`nan` unless explicitly rejected (B4 partially guards; A3 does not). |
| **Why it loses points** | Financial-domain correctness is a hard evaluator criterion; float money is an automatic downgrade in fintech-adjacent code. |
| **Score impact** | Code Quality −1.5 · Architecture −0.5 · **Total −2.0** |
| **Priority** | P1 |
| **Prompt** | `prompts/remediation/PROMPT-005-integer-money-units.md` |

---

#### F-006 — No test coverage measurement or gate anywhere

| Field | Value |
|---|---|
| **Dimension** | Testing |
| **Evidence** | No `--cov`, `fail_under`, `.coveragerc`, `codecov.yml` in any project or CI. Irony: `Basics/test-discovery` documents coverage gates in an external repo but this repo enforces none. |
| **Why it loses points** | Tests exist but **quality is unmeasured** — evaluators cannot verify depth; badge claims are unquantified. |
| **Score impact** | Testing −1.5 · CI/CD −0.5 · **Total −2.0** |
| **Priority** | P1 |
| **Prompt** | `prompts/remediation/PROMPT-006-coverage-gates.md` |

---

#### F-007 — A3 polyglot E2E not in CI; fraud SQLite lacks WAL

| Field | Value |
|---|---|
| **Dimension** | Testing · Performance · Reliability |
| **Evidence** | `make a3-integration` exists but no workflow runs it. `polyglot-fraud-system/fastapi-service/app/database.py` — no `PRAGMA journal_mode=WAL` (contrast A2 `database.py:36-37` which has WAL + busy_timeout). File queue has no claim/lock — two workers double-process. |
| **Why it loses points** | The flagship polyglot demo lacks automated E2E proof; concurrency failure modes remain in the fraud path. |
| **Score impact** | Testing −1.0 · Performance −1.0 · **Total −2.0** |
| **Priority** | P1 |
| **Prompt** | `prompts/remediation/PROMPT-007-a3-e2e-and-sqlite-hardening.md` |

---

#### F-008 — Dependency vulnerabilities; no automated scanning

| Field | Value |
|---|---|
| **Dimension** | Security · CI/CD |
| **Evidence** | `npm audit --omit=dev` on agent-platform → 2 moderate (PostCSS GHSA-qx2v-qp2m-jg93 via Next.js). No `dependabot.yml`, Renovate, `pip-audit`, `cargo audit`, or Trivy in any workflow. |
| **Why it loses points** | Known CVEs in the **deployed** app with no detection pipeline = supply-chain governance failure. |
| **Score impact** | Security −1.5 · CI/CD −1.0 · **Total −2.5** |
| **Priority** | P1 |
| **Prompt** | `prompts/remediation/PROMPT-008-dependency-scanning.md` |

---

#### F-009 — Infra stacks are disconnected demos with no deploy path

| Field | Value |
|---|---|
| **Dimension** | DevOps · Production Readiness |
| **Evidence** | Terraform uses mock creds + local backend, never applied. K8s images side-loaded to `kind`, no registry. Each DevOps task ships its own FastAPI copy. CI container stage: `push: false` (`.github/workflows/ci.yml:108-111`). |
| **Why it loses points** | "DevOps tier" cannot deploy anything in this repo — evaluators score **end-to-end ship path**, not manifest craft alone. |
| **Score impact** | DevOps −2.0 · Production Readiness −1.5 · **Total −3.5** |
| **Priority** | P1 |
| **Prompt** | `prompts/remediation/PROMPT-009-unified-deploy-path.md` |

---

### MEDIUM / P2

---

#### F-010 — Python dependencies range-pinned; no lockfiles for services

| Field | Value |
|---|---|
| **Dimension** | Dependencies · Reproducibility |
| **Evidence** | Service `requirements.txt` use ranges (`fastapi>=0.110,<1.0`). Only `DevOps-Infra/ci-pipeline/requirements-dev.txt` uses exact pins. No `uv.lock`/`requirements.lock`. |
| **Score impact** | DX −0.5 · DevOps −0.5 · **Total −1.0** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-010-python-lockfiles.md` |

---

#### F-011 — No root linter/formatter or pre-commit hooks

| Field | Value |
|---|---|
| **Dimension** | Code Quality · DX |
| **Evidence** | No root `ruff.toml`/`pyproject.toml`/`eslint.config.*`/`.pre-commit-config.yaml`. Per-task lint is ad hoc (I3 sandbox runs ruff in its workflow only). |
| **Score impact** | Code Quality −1.0 · DX −0.5 · **Total −1.5** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-011-monorepo-lint-precommit.md` |

---

#### F-012 — Dead nested CI workflow (never executes)

| Field | Value |
|---|---|
| **Dimension** | CI/CD · DX |
| **Evidence** | `Advanced/parallel-expense-tracker/.github/workflows/ci.yml` — GitHub only runs repo-root `.github/workflows/`. Superseded by `.github/workflows/a2-parallel-expense-tracker.yml` but dead copy remains → confusion. |
| **Score impact** | CI/CD −0.5 · DX −0.5 · **Total −1.0** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-012-remove-dead-ci.md` |

---

#### F-013 — Code duplication: `dockerize-service` verbatim copy

| Field | Value |
|---|---|
| **Dimension** | Architecture · Maintainability |
| **Evidence** | `Intermediate/dockerize-service/` is a stripped copy of `polyglot-currency-pair/fastapi-service` with observability middleware added — zero shared package. |
| **Score impact** | Architecture −1.0 · Maintainability −0.5 · **Total −1.5** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-013-extract-shared-fastapi-core.md` |

---

#### F-014 — Import-time singletons; weak DI in Python/Node services

| Field | Value |
|---|---|
| **Dimension** | Architecture · Testing |
| **Evidence** | `Basics/fastapi-transaction-service/app/services.py` — module-level store singleton. Node transaction controller instantiates service at module load. Blocks multi-worker isolation and clean unit tests. |
| **Score impact** | Architecture −1.0 · Testing −0.5 · **Total −1.5** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-014-dependency-injection-refactor.md` |

---

#### F-015 — Containers run as root in compose/ci-pipeline stacks

| Field | Value |
|---|---|
| **Dimension** | Security · DevOps |
| **Evidence** | `DevOps-Infra/docker-compose-stack/` and `ci-pipeline` Dockerfiles lack `USER` directive. Contrast: K8s manifests correctly use `runAsNonRoot:10001`. |
| **Score impact** | Security −0.5 · DevOps −0.5 · **Total −1.0** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-015-nonroot-containers.md` |

---

#### F-016 — Weak demo credentials (Grafana admin/admin, compose plaintext)

| Field | Value |
|---|---|
| **Dimension** | Security |
| **Evidence** | `DevOps-Infra/observability-bolt-on/docker-compose.yml` — Grafana `admin/admin`, anonymous Viewer enabled. Compose postgres password plaintext in YAML. |
| **Score impact** | Security −0.5 · **Total −0.5** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-016-secrets-hygiene-demos.md` |

---

#### F-017 — No security headers on agent-platform

| Field | Value |
|---|---|
| **Dimension** | Security |
| **Evidence** | `agent-platform/next.config.ts` — empty config; no CSP, HSTS, X-Frame-Options, Referrer-Policy. |
| **Score impact** | Security −0.5 · **Total −0.5** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-017-agent-platform-security-headers.md` |

---

#### F-018 — `make test` omits 19 DevOps Python tests; headline "85" undercounts

| Field | Value |
|---|---|
| **Dimension** | Testing · DX |
| **Evidence** | Makefile `test` target runs rust+node+python+i3+i1+i4 but not DevOps-Infra suites (104 total cases per prior audit). README badge says 85. |
| **Score impact** | Testing −0.5 · DX −0.5 · **Total −1.0** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-018-expand-make-test.md` |

---

#### F-019 — Missing operational documentation

| Field | Value |
|---|---|
| **Dimension** | Documentation |
| **Evidence** | No root `ARCHITECTURE.md`, `CONTRIBUTING.md`, or DevOps runbooks (only A2 has `RUNBOOK.md`). |
| **Score impact** | Documentation −1.0 · **Total −1.0** |
| **Priority** | P2 |
| **Prompt** | `prompts/remediation/PROMPT-019-operational-docs.md` |

---

#### F-020 — Orphaned root `node_modules/` without root `package.json`

| Field | Value |
|---|---|
| **Dimension** | DX · Maintainability |
| **Evidence** | Root has `node_modules/` (markdown/remark packages) but no root `package.json` — dead weight, confusing clone size. |
| **Score impact** | DX −0.5 · Maintainability −0.5 · **Total −1.0** |
| **Priority** | P3 |
| **Prompt** | `prompts/remediation/PROMPT-020-repo-hygiene.md` |

---

#### F-021 — A2 expense-tracker: business logic in route handlers

| Field | Value |
|---|---|
| **Dimension** | Architecture |
| **Evidence** | `Advanced/parallel-expense-tracker/app/routes.py` — no service/repository layer; logic inlined in handlers. Name "parallel" is unearned (no concurrency). |
| **Score impact** | Architecture −0.5 · **Total −0.5** |
| **Priority** | P3 |
| **Prompt** | `prompts/remediation/PROMPT-021-a2-layered-architecture.md` |

---

#### F-022 — No distributed tracing; request_id not propagated

| Field | Value |
|---|---|
| **Dimension** | Observability |
| **Evidence** | `observability-bolt-on` generates `request_id` locally but no OTel/Jaeger/Tempo; no cross-service propagation in polyglot fraud flow. |
| **Score impact** | Observability −1.0 · **Total −1.0** |
| **Priority** | P3 |
| **Prompt** | `prompts/remediation/PROMPT-022-distributed-tracing.md` |

---

#### F-023 — Floating Docker base image tags (no digest pinning)

| Field | Value |
|---|---|
| **Dimension** | Security · DevOps |
| **Evidence** | Dockerfiles use `python:3.12-slim`, `node:22-slim` — mutable tags, supply-chain drift. |
| **Score impact** | Security −0.5 · DevOps −0.5 · **Total −1.0** |
| **Priority** | P3 |
| **Prompt** | `prompts/remediation/PROMPT-023-digest-pin-base-images.md` |

---

#### F-024 — bug-diagnosis IDOR via sequential integer IDs

| Field | Value |
|---|---|
| **Dimension** | Security |
| **Evidence** | `Intermediate/bug-diagnosis` — sequential order IDs enable enumeration without auth. |
| **Score impact** | Security −0.5 · **Total −0.5** |
| **Priority** | P3 |
| **Prompt** | `prompts/remediation/PROMPT-024-bug-diagnosis-idor.md` |

---

## Strengths (credit where due)

1. **Evidence culture** — 45+ `docs/agent-analysis/*.md` with Agent vs Verified split  
2. **Tests genuinely pass** — re-verified 2026-06-21 (`make rust/node/python` green)  
3. **Excellent onboarding** — `make bootstrap`, `mise.toml`, self-documenting Makefile  
4. **Real performance win** — A6: GET /api/summary 278ms → 20ms (−92.7%) with cProfile proof  
5. **Hardened K8s manifests** — non-root, read-only FS, seccomp, all probe types  
6. **A3 internal callback fail-closed** — `routes.py:44-48` returns 503 when token unset  
7. **Path traversal defense-in-depth** on fraud-system (Pydantic + basename + regression test)  
8. **Task-scoped CI expansion** — 7 root workflows mirroring `make *-verify` targets  
9. **Clean secret hygiene** — no hardcoded secrets; `.env` gitignored  
10. **Polyglot edge design** — FastAPI → file queue → Node → Rust → HTTP callback is well-separated  

---

## Remediation Index

| Prompt | Finding | Priority | Expected Δ |
|---|---|---|---|
| PROMPT-001 | F-001 Monorepo CI | P0 | +3.5 |
| PROMPT-002 | F-002 agent-platform CI/tests | P0 | +4.5 |
| PROMPT-003 | F-003 Data integrity | P0 | +3.0 |
| PROMPT-004 | F-004 Security baseline | P0 | +3.5 |
| PROMPT-005 | F-005 Integer money | P1 | +2.0 |
| PROMPT-006 | F-006 Coverage gates | P1 | +2.0 |
| PROMPT-007 | F-007 A3 E2E + SQLite | P1 | +2.0 |
| PROMPT-008 | F-008 Dependency scanning | P1 | +2.5 |
| PROMPT-009 | F-009 Deploy path | P1 | +3.5 |
| PROMPT-010 | F-010 Python locks | P2 | +1.0 |
| PROMPT-011 | F-011 Lint/pre-commit | P2 | +1.5 |
| PROMPT-012 | F-012 Dead CI | P2 | +1.0 |
| PROMPT-013 | F-013 Shared core | P2 | +1.5 |
| PROMPT-014 | F-014 DI refactor | P2 | +1.5 |
| PROMPT-015 | F-015 Non-root containers | P2 | +1.0 |
| PROMPT-016 | F-016 Demo secrets | P2 | +0.5 |
| PROMPT-017 | F-017 Security headers | P2 | +0.5 |
| PROMPT-018 | F-018 Expand make test | P2 | +1.0 |
| PROMPT-019 | F-019 Operational docs | P2 | +1.0 |
| PROMPT-020 | F-020 Repo hygiene | P3 | +1.0 |
| PROMPT-021 | F-021 A2 layering | P3 | +0.5 |
| PROMPT-022 | F-022 Tracing | P3 | +1.0 |
| PROMPT-023 | F-023 Digest pins | P3 | +1.0 |
| PROMPT-024 | F-024 IDOR fix | P3 | +0.5 |

**Theoretical ceiling if all executed:** ~62 + 35 ≈ 97/100 (diminishing returns overlap; realistic post-remediation target: **78–82/100**).

---

## Recommended Execution Order

```
P0: 001 → 002 → 003 → 004
P1: 008 → 006 → 005 → 007 → 009
P2: 011 → 010 → 012 → 018 → 013 → 014 → 015 → 016 → 017 → 019
P3: 020 → 021 → 022 → 023 → 024
```

---

*Audit complete. Remediation prompts in `Advanced/repo-modernization/prompts/remediation/`.*
