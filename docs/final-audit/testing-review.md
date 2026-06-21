# Testing Review — `Task_Evaluation`

> Phase 4. Tests were **independently re-run** during this audit, not taken on trust.
> Date: 2026-06-19.

## Score: 6.0 / 10

---

## 1. Inventory (counted by test case, vendored dirs excluded)

| Project | Framework | Cases | In `make test`? | Re-run result |
|---|---|---|---|---|
| Basics/rust-logcount-cli | cargo | 7 | yes | **7 passed** |
| Advanced/polyglot-fraud-system/rust-engine | cargo | 6 | yes | **6 passed** |
| Basics/node-transaction-service | jest | 7 | yes | **7 passed** |
| Intermediate/polyglot-currency-pair/node-client | jest | 9 | yes | **9 passed** |
| Advanced/polyglot-fraud-system/node-worker | jest | 12 | yes | **12 passed** |
| Basics/fastapi-transaction-service | pytest | 6 | yes | **6 passed** |
| Intermediate/bug-diagnosis | pytest | 5 | yes | **5 passed** |
| Advanced/parallel-expense-tracker | pytest | 16 | yes | **16 passed** |
| Advanced/polyglot-fraud-system/fastapi-service | pytest | 10 | yes | **10 passed** |
| Intermediate/polyglot-currency-pair/fastapi-service | pytest | 7 | yes | **7 passed** |
| **SUBTOTAL — the advertised "85"** | | **85** | | **85 / 85 PASS** |
| DevOps-Infra/reproducible-dev-env | pytest | 4 | **NO** | not in make |
| DevOps-Infra/kubernetes-manifests | pytest | 5 | **NO** | not in make |
| DevOps-Infra/ci-pipeline | pytest | 5 | **NO** | CI-only |
| DevOps-Infra/observability-bolt-on | pytest | 5 | **NO** | not in make |
| **ACTUAL REPO TOTAL** | | **104** | | |

## 2. What's verified vs. claimed

- ✅ **The "85 passing" headline is TRUE and was reproduced** — all 85 ran green on a re-run (note: even
  on a newer-than-pinned local toolchain). This is a genuine strength; the evidence culture is real.
- ⚠️ **"85" undercounts the repo.** There are **104** real test cases. `make test` iterates only 5
  hardcoded `PY_PROJECTS` (Makefile:17) and silently omits all four DevOps-Infra Python suites (19 cases).
  "85" = "what `make` chooses to run," presented as if it were the whole suite.
- ⚠️ Rust crates have **zero `src/` unit tests** — all Rust tests live in `tests/` integration files; the
  README's "lib + bin + tests" framing overstates internal coverage.

## 3. Test quality — mostly genuine

- **Strong:** `node-worker/tests/worker.test.js` (12) uses dependency injection for `spawn`/`fs`/`http`,
  exercises retry-with-backoff (fail twice → succeed), failure routing (`processed/` vs `failed/`),
  malformed-JSON resilience, and stdin payload assertions. Real behavioral coverage.
- **Strong:** `polyglot-currency-pair/fastapi-service` asserts exact bodies, status codes (200/400/422),
  edge cases (zero/negative/non-numeric/missing), and rounding math. Not smoke tests.
- **Weak:** `kubernetes-manifests/tests/test_app.py` is health/readiness smoke + a trivial `/add`.
- **No `assert True` / no-op tests found.** Mocks isolate units rather than hide integration.
- One real polyglot E2E exists (`make a3-integration`, a bash script) but is **not** in the counted 85.

## 4. Coverage — NONE

Searched every `pyproject.toml` / `pytest.ini` / `package.json` / Makefile / CI: **zero** `--cov`,
`fail_under`, `.coveragerc`, `codecov.yml`, or any coverage gate. Ironically, the `test-discovery` task
deliverable brags about *identifying* a coverage gate, yet the repo enforces none of its own.

**Untested entirely:** the deployed `agent-platform` website (0 tests), all IaC (terraform/k8s manifests
themselves/compose), and most error/timeout/concurrency paths beyond curated cases.

## 5. Regression protection (CI) — the weakest link

- **Root `ci.yml`** is pinned to `working-directory: DevOps-Infra/ci-pipeline` and runs **5 cases** from a
  folder that **isn't even in the 85**.
- A **second workflow** `Advanced/parallel-expense-tracker/.github/workflows/ci.yml` runs that project's
  16 cases + a Docker build.
- Net: of the 85 advertised tests, **CI exercises ~16 (19%)**; combined CI touches 21 of 104. The
  "85/85 green" is only ever validated by a human running `make test`. **There is no automated regression
  protection for the headline number.**

## 6. Verdict

Tests that exist are real, behavioral, and genuinely pass — above typical portfolio quality. But scope is
narrow (services only), there is **no coverage measurement**, **no E2E in the suite**, and **CI guards
under a fifth of the claimed tests**. The badge oversells an automated safety net that does not exist.
Points awarded for verified-passing, behavioral tests; withheld for zero coverage, near-absent CI
enforcement, and the untested deployed app.
