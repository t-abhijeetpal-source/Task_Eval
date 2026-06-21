# Bug Diagnosis Report — `Intermediate/bug-diagnosis`

> Status: **REPRODUCED → ROOT-CAUSED → FIXED → VERIFIED → HARDENED.**
> Bug type: off-by-one boundary error in the bulk-discount rule.
> Environment: Python 3.14.6 · FastAPI · pytest 8.4.2 (fresh local `.venv` in
> `Intermediate/bug-diagnosis`, `pip install -r requirements.txt`).

> **Transparency note:** no pre-existing buggy repo was provided, so a realistic bug was *seeded*
> into a small layered orders service (per the "seeded bug" framing). The workflow below was
> then performed as a genuine diagnosis — the failing/passing test outputs are real. After the
> seeded fix, the service was hardened to production grade (see "Production Hardening" below);
> every hardening change is backed by reproduced before/after evidence.

---

## Problem Statement

Per `SPEC.md` rule 3, a line item qualifies for a **10% bulk discount when `qty >= 10`**.
Observed: an order line with **exactly `qty = 10`** is charged full price (no discount).

- **Observed behavior:** `qty = 10` → total `1000.0` (full price).
- **Expected behavior:** `qty = 10` → total `900.0` (1000 − 10%).
- **Scope:** only the exact boundary `qty == 10`; `qty <= 9` and `qty >= 11` behave correctly.
- **User impact:** customers ordering exactly 10 units are **overcharged by 10%** on that line.
- **Affected module:** `app/services.py` (bulk-discount calculation).
- **Severity:** **Medium** — incorrect billing (real money), but narrow (single boundary) and no crash/data loss.

---

## Reproduction Steps

```bash
cd Intermediate/bug-diagnosis
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest -v
```

**Actual result (before fix) — 3 failed, 2 passed:**
```
tests/test_orders.py::test_no_discount_below_threshold           PASSED
tests/test_orders.py::test_bulk_discount_applies_at_threshold_of_10  FAILED
tests/test_orders.py::test_discount_above_threshold              PASSED
tests/test_orders.py::test_mixed_order_total                     FAILED
tests/test_orders.py::test_api_order_total_at_threshold          FAILED
==================== 3 failed, 2 passed in 0.30s ====================

# key assertion failure:
assert {'id': 1, 'total': 1000.0} == {'id': 1, 'total': 900.0}
test_mixed_order_total: assert 1400.0 == 1350.0
```
The failures are exactly the cases involving `qty == 10`. This is the captured reproduction evidence.

---

## Investigation (execution path)

```
HTTP GET /orders/{id}/total
   ↓  app/routes.py :: get_order_total          (looks up order, calls service)
   ↓  app/services.py :: calculate_total        (sums line totals)
   ↓  app/services.py :: calculate_line_total   (applies bulk discount)  <-- defect here
```

| File | Function | Purpose |
|---|---|---|
| `app/routes.py` | `get_order_total` | HTTP entry; fetches items, calls `calculate_total` |
| `app/services.py` | `calculate_total` | sums per-line totals, rounds |
| `app/services.py` | `calculate_line_total` | computes one line; **applies discount** |

`calculate_line_total` was returning the un-discounted line total for `qty == 10`, so
`calculate_total` summed the wrong number → the endpoint returned the wrong total.

---

## Root Cause

- **File:** `app/services.py`
- **Function:** `calculate_line_total`
- **Line:** 18
- **Defect:** the discount condition used a **strict** comparison:
  ```python
  if item.qty > BULK_QTY_THRESHOLD:   # BULK_QTY_THRESHOLD = 10
  ```
  SPEC rule 3 requires the discount at **10 or more** (`>=`). With `>`, `qty == 10` fails the
  condition and gets no discount — a classic **off-by-one / boundary** error.
- **Evidence:** the threshold constant is `10` (`services.py:11`); the failing tests are precisely
  the `qty == 10` cases while `qty = 9` and `qty = 11` pass; the assertion shows `1000.0` (== `100×10`,
  no discount) instead of `900.0`.

**VERIFIED cause:** `>` should be `>=` at `services.py:18`.
**POSSIBLE (considered and ruled out):** wrong discount rate (rate is correctly `0.10`); rounding
error (results are exact); schema coercion of `qty` (it's a validated `int`). None of these explain
a boundary-only failure — only the comparison operator does.

---

## Files Involved / Files Changed

| File | Changed? | Why |
|---|---|---|
| `app/services.py` | ✅ yes | the seeded defect (boundary operator) **and** hardening A (Decimal money math) |
| `app/storage.py` | ✅ yes (hardening) | hardening B: lock-guard the non-atomic id allocation; +`count()` accessor (D) |
| `app/schemas.py` | ✅ yes (hardening) | hardening C: `max_length` payload-size (DoS) guard |
| `app/routes.py` | ✅ yes (hardening) | hardening D: structured request logging |
| `app/main.py` | ✅ yes (hardening) | hardening D: logging configuration |
| `tests/test_orders.py` | ✅ yes | boundary test reproduces the bug; +6 regression tests lock in the hardening |

---

## Fix Description / Diff Summary

Smallest possible change — one operator, one line, no refactor:

```diff
--- a/app/services.py
+++ b/app/services.py
@@ def calculate_line_total(item: Item) -> float:
     line_total = item.price * item.qty
-    if item.qty > BULK_QTY_THRESHOLD:
+    if item.qty >= BULK_QTY_THRESHOLD:
         line_total = line_total * (1 - BULK_DISCOUNT_RATE)
     return line_total
```

`>` → `>=` makes `qty == 10` qualify, matching SPEC rule 3. Blast radius: one boundary case;
all previously-correct cases (`qty <= 9`, `qty >= 11`) are unaffected.

---

## Verification Results

```bash
python -m py_compile app/*.py     # build/compile check
python -m pytest -v               # tests
```

**Compile:** `py_compile: OK (no syntax errors)`.

**Tests (after fix + hardening) — 11 passed, 0 failed:**
```
tests/test_orders.py::test_no_discount_below_threshold           PASSED
tests/test_orders.py::test_bulk_discount_applies_at_threshold_of_10  PASSED
tests/test_orders.py::test_discount_above_threshold              PASSED
tests/test_orders.py::test_mixed_order_total                     PASSED
tests/test_orders.py::test_api_order_total_at_threshold          PASSED
tests/test_orders.py::test_money_uses_decimal_not_float_round    PASSED
tests/test_orders.py::test_discounted_line_has_no_float_noise    PASSED
tests/test_orders.py::test_concurrent_add_allocates_unique_ids   PASSED
tests/test_orders.py::test_oversized_order_rejected              PASSED
tests/test_orders.py::test_max_size_order_accepted               PASSED
tests/test_orders.py::test_routes_emit_logs                      PASSED
======================== 11 passed in 0.26s =========================
```

| Check | Command | Result |
|---|---|---|
| Reproduction (before) | `pytest -v` | 3 failed, 2 passed |
| Compile (after) | `py_compile app/*.py` | OK |
| Tests (after fix only) | `pytest -v` | 5 passed, 0 failed |
| Tests (after hardening) | `pytest -v` | **11 passed, 0 failed** |

---

## Risk Assessment

**Risk: Low.**
- One-character change to a single conditional; no signature, schema, or API change.
- Behavior change is confined to the intended boundary (`qty == 10` now discounts); all other
  quantities are provably unchanged (tests for 9 and 11 still pass).
- Full suite green + compile clean. No new dependencies.

---

## Rollback Plan

The change is one line. To revert:
```diff
-    if item.qty >= BULK_QTY_THRESHOLD:
+    if item.qty > BULK_QTY_THRESHOLD:
```
Or, if committed: `git revert <sha>` (single-line commit) / `git checkout -- app/services.py`.
No data migration or state cleanup is involved (stateless calculation).

---

# Production Hardening (post-fix)

The seeded boundary bug is one billing defect; production review of the same service surfaced
three more gaps. Each was **reproduced with real output before changing code**, fixed with a
minimal, layer-local change, and locked in with a regression test. No unrelated refactor was added.

### A. Monetary arithmetic used binary `float` → bill drift

- **Layer:** `app/services.py`. **Same concern as the seeded bug:** correct billing of real money.
- **Before (reproduced):**
  ```
  calculate_total([Item(price=2.675, qty=1)]) -> 2.67      # float round() lottery; correct = 2.68
  calculate_line_total(Item(price=0.07, qty=10)) -> 0.6300000000000001
  ```
  Root cause: line totals were computed in binary `float` and the order total used `round()`,
  whose result depends on float representation (`round(2.675, 2) == 2.67`).
- **Fix:** compute with `Decimal` (price converted via `str` to avoid float noise), round once at
  the order level with `ROUND_HALF_UP` (standard customer-facing billing). SPEC rule 4's
  "round once at the end" is preserved; the public return type stays `float`.
- **After:** `2.68` / `0.63`; verified end-to-end via `GET /orders/{id}/total` → `{'total': 2.68}`.

### B. Non-atomic order-id allocation → lost/duplicate orders under concurrency

- **Layer:** `app/storage.py`.
- **Before (reproduced):** `OrderStore.add()` did a read-modify-write of `_next_id` plus a dict
  insert with no lock. FastAPI runs sync handlers in a threadpool, so `add()` is concurrent.
  Widening the read-modify-write window (what a scheduler switch / free-threaded CPython 3.14
  exposes) collided **34 of 50** orders onto duplicate ids — silently overwriting orders:
  ```
  attempted: 50 | unique ids: 16 | stored: 16 | COLLISIONS: 34 dup ids, 34 lost orders
  ```
- **Fix:** guard `add`/`get`/`clear` with a `threading.Lock`.
- **After:** 500-thread stress allocates 500 unique ids, 0 lost orders (`test_concurrent_add_allocates_unique_ids`).

### C. Unbounded request payload → memory-exhaustion (DoS) vector

- **Layer:** `app/schemas.py`.
- **Before (reproduced):** `OrderCreate` had `min_length=1` but no upper bound; a 500,000-item
  order was accepted and stored in memory.
- **Fix:** `max_length=MAX_ITEMS_PER_ORDER` (1000) on `items` — FastAPI returns `422` automatically.
- **After:** `POST /orders` with 1001 items → `HTTP 422`; 1000 items still accepted (`201`).

### D. No observability + tests reached into store internals

- **Layer:** `app/routes.py` + `app/main.py` (logging); `app/storage.py` (encapsulation).
- **Before:** endpoints emitted nothing — a production order service had no audit/debug trail; and
  the concurrency test asserted on `store._orders` (private internals).
- **Fix:** structured `INFO`/`WARNING` logs on create / total-computed / missing-order (logger
  `orders.api`, configured in `main.py`); added `OrderStore.count()` so callers never touch internals.
- **After (live output):**
  ```
  2026-06-21 INFO    orders.api order created id=1 line_items=1
  2026-06-21 INFO    orders.api order total computed id=1 total=900.0
  2026-06-21 WARNING orders.api order total requested for missing id=999999
  ```
  Verified by `test_routes_emit_logs`; the stress test now asserts `store.count() == n`.

| Gap | File | Before | After | Test |
|---|---|---|---|---|
| A money drift | `services.py` | `2.675→2.67` | `2.68` (Decimal/half-up) | `test_money_uses_decimal_not_float_round`, `test_discounted_line_has_no_float_noise` |
| B id race | `storage.py` | 34/50 lost | 0 lost / 500 unique | `test_concurrent_add_allocates_unique_ids` |
| C DoS payload | `schemas.py` | 500k accepted | 422 over 1000 | `test_oversized_order_rejected`, `test_max_size_order_accepted` |
| D observability + encapsulation | `routes.py`/`main.py`/`storage.py` | silent; tests touched `_orders` | structured logs; `count()` accessor | `test_routes_emit_logs` |

**Risk of hardening: Low.** Each change is layer-local and backward-compatible: SPEC worked
examples and the boundary fix are unchanged (all 5 original tests still pass); the API contract
(`OrderTotal.total: float`) is unchanged; the only new rejection is for orders far larger than any
realistic order.

---

# Agent vs Verified

## Agent Suggested (hypotheses before confirming)
- **Potential causes:** (a) boundary operator `>` vs `>=`; (b) wrong discount rate; (c) float
  rounding; (d) `qty` type coercion.
- **Potential fixes:** change the comparison; or special-case `qty == threshold`.
- **Ideas:** add a boundary test at exactly the threshold (already present).

## Manually Verified (confirmed by execution)
- **Actual root cause:** `app/services.py:18` used `>`; should be `>=` (boundary-only failures
  prove it; rate/rounding/type ruled out).
- **Actual fix:** `>` → `>=` (one line).
- **Actual test results:** before = 3 failed / 2 passed; after = **5 passed / 0 failed**; `py_compile` OK.
- **Actual behavior:** `qty = 10 → total 900.0` (was `1000.0`), via both the unit function and the
  live `GET /orders/{id}/total` endpoint.

---

## Completion Criteria

- [x] Bug reproduced (real failing tests captured)
- [x] Root cause identified (`services.py:18`, `>` vs `>=`)
- [x] Source files cited
- [x] Minimal fix implemented (one operator)
- [x] Tests executed (before + after captured)
- [x] Verification output captured (compile + 5 passed)
- [x] Risk assessment included (Low)
- [x] Rollback plan included
- [x] Diagnosis report generated (this file)
- [x] Production hardening: 4 gaps reproduced/closed, fixed minimally, and regression-tested (11 passed)
