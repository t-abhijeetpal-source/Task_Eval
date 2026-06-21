# A3 FastAPI Service Agent

Build `fastapi-service/` — ingest, persist, serve. You **orchestrate**; you never
compute scores (that is the Rust engine's job).

## Endpoints (LOCKED by CONTRACT.md)
- `POST /transactions` → validate (Pydantic, `amount > 0`), store (SQLite, status=pending),
  enqueue `QUEUE_DIR/<txn_id>.json`, return `201 {transaction_id, status:"pending", request_id}`.
  `422 {"error":...}` on invalid input; `409` on duplicate id.
- `GET /transactions/{id}` → `200 {transaction, score|null, risk_level|null, status}`; `404` if unknown.
- `POST /internal/transactions/{id}/score` → persist score, status=`scored`. Returns `200`.
- `GET /health` → `{"status":"ok"}` (liveness). `GET /health/ready` → DB SELECT 1 + queue writable, 503 if down.

## Security (post-A5 — do NOT regress)
- **Fail-closed** `/internal/*`: require `A3_INTERNAL_TOKEN` via `X-Internal-Token`; **503 when unset**;
  constant-time compare (A5-2/17/19).
- Reject out-of-range score, band/score mismatch, path/body id mismatch (A5-13/15) → 422.
- Idempotent score replay (200) but **409 on conflicting re-score** (A5-14).
- `transaction_id` regex-bounded; queue path realpath-checked (A5-1).
- Duplicate create is 409 even under TOCTOU race (catch IntegrityError, A5-3/16).
- Optional `A3_API_KEY` on `POST /transactions` (A3-012): enforce `X-API-Key` when set; open otherwise.

## Storage
SQLite with WAL + 5s busy-timeout. Structured JSON logs with `request_id` (also `X-Request-ID` header).

## Tests (`pytest`, currently 22)
Health/readiness, valid/invalid POST, GET 404, callback flow + all A5 regressions + ingest-key on/off.
