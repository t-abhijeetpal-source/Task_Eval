# I4 — Verification Run Results

> Captured output from actually running the I4 system **under the pinned monorepo toolchain**.
> Every line below is real, executed output.
> Environment: macOS (Darwin 25.5.0) · **Python 3.12.7** · **Node v22.11.0** (pinned by `mise.toml`)
> · pytest 8.4.2 · jest 29.7.0. Money is handled as exact **`Decimal`** end-to-end.

Reproduce all of this with one command from the repo root:

```bash
make i4-verify      # core + service + perf gate + client + live integration; warm ≈ 13s
```

---

## 1. Shared `currency_core` tests — `pytest` (8)

```text
$ python -m pytest -q ../../shared/currency-core/tests
........                                                                 [100%]
8 passed in 0.17s
```
**Result: 8 passed, 0 failed.** (No HTTP layer — pure Decimal service logic.)

---

## 2. Service tests — `pytest` (23)

```text
$ cd fastapi-service && source .venv/bin/activate && python -m pytest -q
.......................                                                  [100%]
23 passed, 1 warning in 0.24s
```
**Result: 23 passed, 0 failed — 0.24s.**
(The 1 warning is a Starlette `TestClient`/httpx deprecation notice; not a failure.)
Covers all 6 rate pairs, same-currency, case-insensitivity, string-amount precision,
non-positive/unsupported/malformed errors, NaN/±Infinity rejection, magnitude & precision
bounds, response shape, `/health`, and the OpenAPI `/convert` contract.

---

## 3. Client tests — `npm test` (17)

```text
$ cd node-client && npm test
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Time:        0.322 s
```
**Result: 17 passed, 0 failed — 0.32s.**
Covers string-safe `parseAmount` (no float coercion), `parseArgs`, `formatResult`, the request
timeout, and `run()` across success / unsupported (400) / connection-refused / timeout / bad-args /
non-positive paths.

---

## 4. Performance — `bench_convert.py` (in-process TestClient, 2000 iters)

```text
$ python bench_convert.py
POST /convert — 2000 iterations (in-process TestClient)
  p50 = 0.939 ms
  p95 = 1.197 ms
  p99 = 1.373 ms
  min = 0.659 ms   max = 11.462 ms
OK: p50 0.939 ms within threshold 10.0 ms
```
**Result: p50 ≈ 0.9 ms — comfortably within the 10 ms gate.**

### Live request latency (real uvicorn + curl)
```text
$ curl -X POST localhost:8000/convert -d '{"amount":"100","from":"USD","to":"INR"}'
POST /convert -> HTTP 200 in 0.001806s   (~1.8 ms)
{"converted_amount":8300,"from":"USD","to":"INR"}
```

---

## 5. Live integration — `integration-tests/run_integration.sh`

Boots the real FastAPI service and drives the real Node CLI over HTTP.

```text
== starting FastAPI on :8744 ==
== all 6 rate pairs (Node CLI -> live FastAPI) ==
  PASS  USD->INR        (100 USD = 8300 INR)
  PASS  USD->EUR        (100 USD = 92 EUR)
  PASS  INR->USD        (100 INR = 1.2 USD)
  PASS  EUR->USD        (100 EUR = 108 USD)
  PASS  INR->EUR        (100 INR = 1.1 EUR)
  PASS  EUR->INR        (100 EUR = 9000 INR)
== exit codes (the locked CLI contract) ==
  PASS  exit 0 (success)
  PASS  exit 1 (unsupported)
  PASS  exit 2 (bad args)
  PASS  exit 3 (unavailable)
== precision over real HTTP (string amount stays exact) ==
  PASS  0.30 USD->USD   (0.30 USD = 0.3 USD)
INTEGRATION: PASS (11 checks)
```
**Result: 11/11 checks pass; all 6 rate pairs and all 4 exit codes verified end-to-end.**

---

## Summary

| Check | Command | Result | Time |
|---|---|---|---|
| Core tests | `pytest ../../shared/currency-core/tests` | 8 passed | 0.17s |
| Service tests | `pytest -q` | 23 passed | 0.24s |
| Client tests | `npm test` | 17 passed | 0.32s |
| Perf gate | `python bench_convert.py` | p50 0.94ms (< 10ms) | ~2.5s |
| Live latency | `curl POST /convert` | HTTP 200 | ~1.8ms |
| Live integration | `run_integration.sh` | 11/11 checks | ~4.5s |
| **One-command verify** | **`make i4-verify`** | **all green** | **~13s warm** |

**Verdict: I4 works end-to-end, correctly and efficiently, under the pinned Python 3.12.7 /
Node 22.11.0 toolchain — verifiable in a single command.**
