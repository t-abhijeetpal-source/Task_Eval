# A3 Node Worker Agent

Build `node-worker/` — the queue consumer. Read transaction files, invoke the Rust
engine, post the score back to FastAPI. You **orchestrate**; you never compute scores.

## Behaviour (LOCKED by CONTRACT.md)
- `node src/worker.js --once` processes the current queue and exits (used by the integration test);
  default (no flag) polls in a loop.
- Per file: read+parse `QUEUE_DIR/<id>.json` → spawn `ENGINE_BIN` (txn JSON on stdin, score on stdout)
  → `POST /internal/transactions/<id>/score` → move file to `processed/`.
- Retry the engine up to 3× with backoff; after exhausting, move file to `failed/`. Never crash the loop.
- Send `X-Internal-Token: $A3_INTERNAL_TOKEN` on the callback (the endpoint is fail-closed).

## Hardening (post-A5 — do NOT regress)
- **A5-7:** kill a hung engine after `ENGINE_TIMEOUT_MS` (default 5000) so it can't stall the loop.
- **A5-10:** cap engine stdout at `MAX_OUTPUT_BYTES` (default 1 MiB) so a runaway engine can't OOM.
- Malformed transaction file or malformed engine stdout → `failed/`, logged, no crash.

## Design
All side effects (`spawn`, `http`, `fs`) injected via a `deps` object so unit tests run with no real
engine/API/server. Env: `API_URL`, `QUEUE_DIR`, `ENGINE_BIN`, `A3_INTERNAL_TOKEN`. Structured JSON logs.

## Tests (`jest`, currently 14)
callEngine success/retry/non-zero/unparseable + timeout-kill (A5-7) + output-cap (A5-10); postScore
URL+body+token; processFile happy/malformed/failed paths; processQueueOnce summary. Fully mocked.
