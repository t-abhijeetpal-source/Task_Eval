# A5 Adversarial Review — Example Findings (A3 reference)

These are **patterns** from a real adversarial review. Use as examples of reproduction quality, not as findings for every repo.

## A5-1 — Path traversal via transaction_id (Critical, Blocking)

**Evidence:** `queue.py` builds path from unsanitized client input.
**Reproduced:**
```text
POST /transactions {"transaction_id":"../PWNED", ...} -> 201
File created OUTSIDE queue directory
```
**Fix:** Pydantic `pattern=^[A-Za-z0-9_-]{1,64}$` + basename + path containment check.

## A5-2 — Unauthenticated internal endpoint (High, Blocking)

**Evidence:** `POST /internal/transactions/{id}/score` has no auth.
**Reproduced:** Force high-risk txn to score=0, risk=low via public POST.
**Fix:** `X-Internal-Token` header validated against env secret.

## A5-3 — Duplicate ID → HTTP 500 (High, Blocking)

**Evidence:** Uncaught `IntegrityError` on re-POST same ID.
**Reproduced:** first POST 201, second POST 500.
**Fix:** Return 409 or idempotent 200; catch IntegrityError.

## A5-4 — Float for money (High, Non-blocking for demo)

**Evidence:** `amount: float` end-to-end.
**Fix:** Integer minor units or Decimal/NUMERIC.

## A5-5 — Non-atomic commit-then-enqueue (Medium)

**Evidence:** DB committed before queue file written.
**Fix:** Outbox pattern or transactional enqueue.
