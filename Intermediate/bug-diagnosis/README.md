# Orders Service (Bug Diagnosis Exercise — `Intermediate/bug-diagnosis`)

A small layered FastAPI orders service used to demonstrate the full bug-diagnosis workflow:
**reproduce → root-cause → minimal fix → verify** — and then **hardened to production grade**.

The business rules are in `SPEC.md`. The diagnosis report is in
`docs/agent-analysis/I6_bug_diagnosis.md`.

> A realistic off-by-one boundary bug (bulk discount at `qty == 10`) was *seeded* into
> `app/services.py`, reproduced via a failing test, root-caused, fixed (one operator), and
> verified. The repo here contains the **fixed** code; the report shows the before/after evidence.
>
> On top of the seeded fix, three production-quality gaps were found, evidenced, and closed:
> monetary float drift (now `Decimal`), a non-atomic id allocation race in storage (now lock-guarded),
> and an unbounded request payload (now a `max_length` DoS guard). See "Production hardening" below.

## Structure

```text
Intermediate/bug-diagnosis/
├── app/
│   ├── main.py        # FastAPI app + /health + logging config
│   ├── routes.py      # POST /orders, GET /orders/{id}/total (+ structured logs)
│   ├── schemas.py     # Item / Order schemas + payload-size guard
│   ├── services.py    # bulk-discount + total logic, Decimal money math (seeded defect was here)
│   └── storage.py     # in-memory order store, lock-guarded id allocation + count()
├── tests/test_orders.py
├── SPEC.md            # business rules (defines expected behavior)
├── requirements.txt
├── VERIFICATION_RESULTS.md
└── docs/agent-analysis/I6_bug_diagnosis.md
```

## Install & Run

```bash
cd Intermediate/bug-diagnosis
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://127.0.0.1:8000/docs
```

## Test

```bash
pytest -v
```

Expected: **11 passed** (5 SPEC/boundary tests + 6 hardening regression tests). To see the
original bug reproduced, revert the operator in `app/services.py` (`>=` → `>`) and re-run —
the `qty == 10` boundary tests fail.

## The seeded bug, in one line

```diff
# app/services.py, calculate_line_total
-    if item.qty > BULK_QTY_THRESHOLD:    # excludes qty == 10  (bug)
+    if item.qty >= BULK_QTY_THRESHOLD:   # includes qty == 10  (per SPEC rule 3)
```

## Production hardening (beyond the seeded fix)

| Gap | Layer | Before (evidence) | After |
|---|---|---|---|
| Monetary float drift | `app/services.py` | `calculate_total([price=2.675, qty=1])` → `2.67` (float `round()` lottery); `0.07×10` → `0.6300000000000001` | `Decimal` + `ROUND_HALF_UP` → `2.68` / `0.63` |
| Non-atomic id allocation | `app/storage.py` | concurrent `add()` lost 34/50 orders to id collisions once GIL protection removed | `threading.Lock` → unique ids under 500-thread stress |
| Unbounded payload (DoS) | `app/schemas.py` | 500,000-item order accepted | `max_length=1000` → oversized order rejected with HTTP 422 |
| No observability | `app/routes.py` + `app/main.py` | silent endpoints (no logs) | structured `INFO`/`WARNING` logs on create / total / 404 |
| Test reached into store internals | `app/storage.py` | tests asserted on `store._orders` | `count()` accessor → encapsulated |
